/*
 * player.js — the play / pause / stop + speed control bar that sits next to a
 * block of readable text. One instance per readable block, so the Japanese
 * summary and the English story each get their own controls and their own
 * remembered speed.
 */
(function (global) {
  'use strict';

  var EF = global.EF = global.EF || {};
  var speech = EF.speech;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function loadRate(key) {
    try {
      var v = global.localStorage.getItem(key);
      return v == null ? 1 : speech.clampRate(v);
    } catch (e) {
      return 1; // private mode / storage disabled
    }
  }

  function saveRate(key, rate) {
    try {
      global.localStorage.setItem(key, String(rate));
    } catch (e) { /* not worth bothering the reader about */ }
  }

  /**
   * @param {object} opts
   * @param {string} opts.text          text to read aloud
   * @param {string} opts.lang          "ja-JP" / "en-US"
   * @param {string} opts.rateKey       localStorage key for the speed setting
   * @param {function} [opts.onSentence] called with the sentence index, or -1
   * @returns {{ el: HTMLElement, reader: object|null, sentences: Array, stop: function }}
   */
  EF.createPlayer = function (opts) {
    var root = el('div', 'player');

    if (!speech.supported) {
      root.classList.add('player--unavailable');
      root.appendChild(el('p', 'player__notice',
        'お使いのブラウザは音声読み上げ（Web Speech API）に対応していません。Chrome・Edge・Safari の最新版でお試しください。'));
      return { el: root, reader: null, sentences: [], stop: function () {} };
    }

    var rate = loadRate(opts.rateKey);

    var reader = new speech.Reader({
      text: opts.text,
      lang: opts.lang,
      rate: rate,
      onSentence: opts.onSentence,
      onState: render
    });

    /* ------------------------------------------------------------ controls */

    // Icons are drawn in CSS rather than typed as ▶ / ⏸ / ■ characters: the
    // media glyphs are missing from some system fonts and fall back to tofu.
    var playBtn = el('button', 'player__btn player__btn--primary');
    playBtn.type = 'button';
    var playIcon = el('span', 'ico ico--play');
    var playLabel = el('span', 'player__btn-label');
    playBtn.appendChild(playIcon);
    playBtn.appendChild(playLabel);

    var stopBtn = el('button', 'player__btn');
    stopBtn.type = 'button';
    stopBtn.appendChild(el('span', 'ico ico--stop'));
    stopBtn.appendChild(el('span', 'player__btn-label', '停止'));
    stopBtn.disabled = true;

    var rateWrap = el('div', 'player__rate');
    var rateId = 'rate-' + Math.random().toString(36).slice(2, 8);

    var rateLabel = el('label', 'player__rate-label', '読み上げ速度');
    rateLabel.setAttribute('for', rateId);

    var rateInput = el('input', 'player__rate-input');
    rateInput.type = 'range';
    rateInput.id = rateId;
    rateInput.min = String(speech.RATE_MIN);
    rateInput.max = String(speech.RATE_MAX);
    rateInput.step = '0.1';
    rateInput.value = String(rate);

    var rateOut = el('output', 'player__rate-value', rate.toFixed(1) + '×');

    rateWrap.appendChild(rateLabel);
    rateWrap.appendChild(rateInput);
    rateWrap.appendChild(rateOut);

    var status = el('span', 'player__status');
    status.setAttribute('aria-live', 'polite');

    root.appendChild(playBtn);
    root.appendChild(stopBtn);
    root.appendChild(rateWrap);
    root.appendChild(status);

    /* ------------------------------------------------------------- wiring */

    playBtn.addEventListener('click', function () { reader.toggle(); });
    stopBtn.addEventListener('click', function () { reader.stop(); });

    rateInput.addEventListener('input', function () {
      var r = speech.clampRate(rateInput.value);
      rateOut.textContent = r.toFixed(1) + '×';
      reader.setRate(r);
      saveRate(opts.rateKey, r);
    });

    function render(state) {
      root.setAttribute('data-state', state);

      if (state === 'playing') {
        playIcon.className = 'ico ico--pause';
        playLabel.textContent = '一時停止';
        playBtn.setAttribute('aria-label', '一時停止');
        status.textContent = '読み上げ中';
      } else if (state === 'paused') {
        playIcon.className = 'ico ico--play';
        playLabel.textContent = '再開';
        playBtn.setAttribute('aria-label', '再開');
        status.textContent = '一時停止中';
      } else {
        playIcon.className = 'ico ico--play';
        playLabel.textContent = '再生';
        playBtn.setAttribute('aria-label', '再生');
        status.textContent = '';
      }

      stopBtn.disabled = (state === 'idle');
    }

    render('idle');

    // The control bar is useless without a matching voice, so say so up front
    // rather than letting the reader press play and hear nothing.
    speech.loadVoices().then(function (voices) {
      if (speech.pickVoice(voices, opts.lang)) return;

      root.classList.add('player--novoice');
      var warn = el('p', 'player__notice',
        opts.lang.indexOf('ja') === 0
          ? 'この端末には日本語の音声が見つかりませんでした。OS の音声設定に日本語（日本）を追加すると読み上げられます。'
          : 'この端末には英語の音声が見つかりませんでした。OS の音声設定に英語を追加すると読み上げられます。');
      root.appendChild(warn);
    });

    return {
      el: root,
      reader: reader,
      sentences: reader.sentences,
      stop: function () { reader.stop(); }
    };
  };
})(window);
