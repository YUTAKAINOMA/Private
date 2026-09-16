/*
 * speech.js — Web Speech API (SpeechSynthesis) wrapper for EnglishForest.
 *
 * Reads a block of text one sentence at a time so that:
 *   - the caller can highlight whichever sentence is being spoken,
 *   - Chrome's ~15 second cutoff for a single utterance never triggers,
 *   - the reading speed can be changed without losing your place.
 *
 * Plain script (no ES module) on purpose: index.html then works when opened
 * directly from the file system, with no local server and no build step.
 */
(function (global) {
  'use strict';

  var EF = global.EF = global.EF || {};

  var synth = global.speechSynthesis;
  var supported = !!synth && typeof global.SpeechSynthesisUtterance === 'function';

  var RATE_MIN = 0.5;
  var RATE_MAX = 2.0;

  function clampRate(r) {
    r = parseFloat(r);
    if (isNaN(r)) return 1;
    return Math.min(RATE_MAX, Math.max(RATE_MIN, r));
  }

  function normLang(lang) {
    return String(lang || '').replace('_', '-').toLowerCase();
  }

  /* ---------------------------------------------------------------- voices */

  var voicesPromise = null;

  /**
   * getVoices() is empty on the first call in Chrome and only fills in once
   * `voiceschanged` fires; some Safari builds never fire it at all, hence the
   * timeout fallback.
   */
  function loadVoices() {
    if (!supported) return Promise.resolve([]);
    if (voicesPromise) return voicesPromise;

    voicesPromise = new Promise(function (resolve) {
      var first = synth.getVoices();
      if (first && first.length) { resolve(first); return; }

      var settled = false;
      function done() {
        if (settled) return;
        settled = true;
        synth.removeEventListener('voiceschanged', done);
        resolve(synth.getVoices() || []);
      }
      synth.addEventListener('voiceschanged', done);
      setTimeout(done, 2000);
    });

    return voicesPromise;
  }

  /**
   * Pick the best voice for a language tag: an exact match ("ja-JP") beats a
   * same-language match ("ja"), and an offline voice beats a network one
   * because it starts instantly and keeps working without a connection.
   */
  function pickVoice(voices, lang) {
    var want = normLang(lang);
    var base = want.split('-')[0];
    var exact = [];
    var loose = [];

    (voices || []).forEach(function (v) {
      var vl = normLang(v.lang);
      if (vl === want) exact.push(v);
      else if (vl.split('-')[0] === base) loose.push(v);
    });

    var pool = exact.length ? exact : loose;
    if (!pool.length) return null;

    for (var i = 0; i < pool.length; i++) {
      if (pool[i].localService) return pool[i];
    }
    return pool[0];
  }

  /* ------------------------------------------------------- sentence splitting */

  /**
   * Split text into sentences, keeping track of which paragraph each one came
   * from so the caller can rebuild the original layout.
   * Returns [{ text, para }].
   */
  function splitSentences(text, lang) {
    var isJa = normLang(lang).indexOf('ja') === 0;
    var out = [];

    var paragraphs = String(text || '')
      .split(/\n+/)
      .map(function (s) { return s.trim(); })
      .filter(Boolean);

    paragraphs.forEach(function (p, pi) {
      var parts = isJa
        ? p.match(/[^。！？!?]+[。！？!?]*/g)
        : p.match(/[^.!?]+[.!?]*["'”’)\]]*/g);

      (parts || [p]).forEach(function (s) {
        s = s.trim();
        if (s) out.push({ text: s, para: pi });
      });
    });

    return out;
  }

  /* ---------------------------------------------------------------- Reader */

  // window.speechSynthesis is a single shared queue, so only one Reader may
  // speak at a time. Starting one stops whichever was running.
  var active = null;

  /**
   * @param {object} opts
   * @param {string} opts.text        text to read
   * @param {string} opts.lang        BCP-47 tag, e.g. "ja-JP" / "en-US"
   * @param {number} [opts.rate]      0.5 - 2.0
   * @param {function} [opts.onSentence]  called with the sentence index, or -1
   * @param {function} [opts.onState]     called with "idle" | "playing" | "paused"
   */
  function Reader(opts) {
    opts = opts || {};
    this.lang = opts.lang || 'en-US';
    this.sentences = splitSentences(opts.text, this.lang);
    this.rate = clampRate(opts.rate);
    this.onSentence = opts.onSentence || function () {};
    this.onState = opts.onState || function () {};

    this.state = 'idle';
    this._index = 0;
    this._token = 0;      // invalidates callbacks from utterances we cancelled
    this._voice = null;
    this._keepAlive = null;
  }

  Reader.prototype._setState = function (s) {
    if (this.state === s) return;
    this.state = s;
    this.onState(s);
  };

  Reader.prototype.play = function (fromIndex) {
    if (!supported) return;

    if (typeof fromIndex === 'number') {
      this.stop();
      this._index = Math.max(0, Math.min(fromIndex, this.sentences.length - 1));
    } else if (this.state === 'paused') {
      this.resume();
      return;
    } else if (this.state === 'playing') {
      return;
    }

    if (active && active !== this) active.stop();
    active = this;

    synth.cancel();
    var token = ++this._token;
    var self = this;

    this._setState('playing');
    this._startKeepAlive();

    // iOS only allows speak() inside a user gesture, so take the synchronous
    // path whenever the voice list is already populated.
    var ready = synth.getVoices();
    if (ready && ready.length) {
      this._voice = pickVoice(ready, this.lang);
      this._speakFrom(this._index, token);
    } else {
      loadVoices().then(function (voices) {
        if (self._token !== token) return;
        self._voice = pickVoice(voices, self.lang);
        self._speakFrom(self._index, token);
      });
    }
  };

  Reader.prototype._speakFrom = function (i, token) {
    var self = this;
    if (this._token !== token) return;

    if (i >= this.sentences.length) { this._finish(); return; }
    this._index = i;

    var u = new global.SpeechSynthesisUtterance(this.sentences[i].text);
    u.lang = this.lang;
    if (this._voice) u.voice = this._voice;
    u.rate = clampRate(this.rate);
    u.pitch = 1;
    u.volume = 1;

    u.onstart = function () {
      if (self._token !== token) return;
      self.onSentence(i);
    };

    u.onend = function () {
      if (self._token !== token) return;
      self._speakFrom(i + 1, token);
    };

    u.onerror = function (e) {
      if (self._token !== token) return;
      var err = e && e.error;
      // cancel() reports as interrupted/canceled — that is our own doing.
      if (err === 'interrupted' || err === 'canceled') return;
      // Skip a sentence the engine choked on instead of killing the reading.
      self._speakFrom(i + 1, token);
    };

    synth.speak(u);
  };

  Reader.prototype.pause = function () {
    if (this.state !== 'playing') return;
    synth.pause();
    this._stopKeepAlive();
    this._setState('paused');
  };

  Reader.prototype.resume = function () {
    if (this.state !== 'paused') return;
    if (active && active !== this) active.stop();
    active = this;
    synth.resume();
    this._startKeepAlive();
    this._setState('playing');
  };

  Reader.prototype.toggle = function () {
    if (this.state === 'playing') this.pause();
    else this.play();
  };

  Reader.prototype.stop = function () {
    this._token++;
    this._stopKeepAlive();
    this._index = 0;
    if (active === this) active = null;
    if (supported) synth.cancel();
    this.onSentence(-1);
    this._setState('idle');
  };

  Reader.prototype._finish = function () {
    this._stopKeepAlive();
    this._index = 0;
    if (active === this) active = null;
    this.onSentence(-1);
    this._setState('idle');
  };

  /**
   * Speed changes cannot be applied to an utterance already in flight, so the
   * current sentence is restarted at the new rate.
   */
  Reader.prototype.setRate = function (r) {
    this.rate = clampRate(r);
    if (this.state !== 'playing') return;

    var i = this._index;
    var token = ++this._token;
    var self = this;
    synth.cancel();
    setTimeout(function () { self._speakFrom(i, token); }, 0);
  };

  // Chrome stops speaking after roughly 15 seconds of continuous output. Our
  // sentences are short enough to stay under that, and this nudge covers the
  // long ones.
  Reader.prototype._startKeepAlive = function () {
    var self = this;
    this._stopKeepAlive();
    this._keepAlive = setInterval(function () {
      if (self.state !== 'playing') return;
      if (synth.speaking && !synth.paused) synth.resume();
    }, 8000);
  };

  Reader.prototype._stopKeepAlive = function () {
    if (this._keepAlive) {
      clearInterval(this._keepAlive);
      this._keepAlive = null;
    }
  };

  /* ---------------------------------------------------------------- public */

  function stopAll() {
    if (active) active.stop();
    else if (supported) synth.cancel();
  }

  // Without this, speech carries on after the page is closed or navigated away.
  if (supported) {
    global.addEventListener('pagehide', stopAll);
    global.addEventListener('beforeunload', stopAll);
  }

  EF.speech = {
    supported: supported,
    RATE_MIN: RATE_MIN,
    RATE_MAX: RATE_MAX,
    Reader: Reader,
    loadVoices: loadVoices,
    pickVoice: pickVoice,
    splitSentences: splitSentences,
    clampRate: clampRate,
    stopAll: stopAll
  };
})(window);
