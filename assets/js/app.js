/*
 * app.js — EnglishForest: story list, story view, and the wiring that keeps a
 * player's spoken sentence in sync with the highlighted sentence on screen.
 */
(function (global) {
  'use strict';

  var EF = global.EF = global.EF || {};
  var stories = EF.stories || [];

  var viewList = document.getElementById('view-list');
  var viewStory = document.getElementById('view-story');

  // Every player currently on screen, so a view change can silence them all.
  var livePlayers = [];

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function teardownPlayers() {
    livePlayers.forEach(function (p) { p.stop(); });
    livePlayers = [];
    EF.speech.stopAll();
  }

  /* ------------------------------------------------------------- story list */

  function renderList() {
    clear(viewList);

    var intro = el('div', 'intro');
    intro.appendChild(el('h2', 'intro__title', '短い物語で、英語に慣れる。'));
    intro.appendChild(el('p', 'intro__lead',
      '英語の本文と日本語の要約、どちらも音声で聴けます。読み上げ中の文はハイライトされるので、耳と目の両方で追えます。'));
    viewList.appendChild(intro);

    var grid = el('ul', 'story-grid');

    stories.forEach(function (story) {
      var item = el('li', 'story-card');

      var link = el('a', 'story-card__link');
      link.href = '#/story/' + story.id;

      var head = el('div', 'story-card__head');
      head.appendChild(el('span', 'badge badge--level', story.level));
      head.appendChild(el('span', 'badge', '約' + story.minutes + '分'));
      link.appendChild(head);

      link.appendChild(el('h3', 'story-card__title', story.title));
      link.appendChild(el('p', 'story-card__title-ja', story.titleJa));

      var tags = el('p', 'story-card__tags');
      tags.textContent = story.tags.map(function (t) { return '#' + t; }).join('  ');
      link.appendChild(tags);

      item.appendChild(link);
      grid.appendChild(item);
    });

    viewList.appendChild(grid);
  }

  /* --------------------------------------------------- readable text block */

  /**
   * Render text as clickable per-sentence spans grouped back into paragraphs,
   * and return a highlight(index) function. Clicking a sentence starts the
   * reading from there.
   */
  function renderReadable(container, sentences, lang, getReader) {
    clear(container);

    // English needs a space between sentences; Japanese does not, and adding
    // one leaves a visible gap after every 。
    var separate = lang.indexOf('ja') !== 0;

    var spans = [];
    var currentPara = null;
    var currentParaIndex = -1;

    sentences.forEach(function (s, i) {
      if (s.para !== currentParaIndex) {
        currentParaIndex = s.para;
        currentPara = el('p', 'readable__para');
        container.appendChild(currentPara);
      }

      var span = el('span', 'sentence', s.text);
      span.setAttribute('data-index', String(i));
      span.setAttribute('role', 'button');
      span.setAttribute('tabindex', '0');
      span.title = 'この文から読み上げ';

      function playHere() {
        var reader = getReader();
        if (reader) reader.play(i);
      }

      span.addEventListener('click', playHere);
      span.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          playHere();
        }
      });

      currentPara.appendChild(span);
      if (separate) currentPara.appendChild(document.createTextNode(' '));
      spans.push(span);
    });

    var lastIndex = -1;

    return function highlight(index) {
      if (lastIndex === index) return;

      if (spans[lastIndex]) spans[lastIndex].classList.remove('is-speaking');
      lastIndex = index;

      var span = spans[index];
      if (!span) return;

      span.classList.add('is-speaking');

      var box = span.getBoundingClientRect();
      if (box.top < 80 || box.bottom > global.innerHeight - 80) {
        span.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    };
  }

  /**
   * One readable section: heading, player controls, and the text itself.
   * The controls sit directly above the text they read.
   */
  function buildSection(opts) {
    var section = el('section', 'readable readable--' + opts.variant);

    var head = el('div', 'readable__head');
    head.appendChild(el('h3', 'readable__title', opts.title));
    if (opts.note) head.appendChild(el('p', 'readable__note', opts.note));
    section.appendChild(head);

    var body = el('div', 'readable__body');

    var highlight = function () {};
    var player = EF.createPlayer({
      text: opts.text,
      lang: opts.lang,
      rateKey: opts.rateKey,
      onSentence: function (index) { highlight(index); }
    });

    section.appendChild(player.el);
    section.appendChild(body);

    var sentences = player.sentences.length
      ? player.sentences
      : EF.speech.splitSentences(opts.text, opts.lang);

    highlight = renderReadable(body, sentences, opts.lang, function () { return player.reader; });

    livePlayers.push(player);
    return section;
  }

  /* ------------------------------------------------------------- story view */

  function renderStory(story) {
    clear(viewStory);

    var back = el('a', 'back-link', '← 物語一覧へ');
    back.href = '#/';
    viewStory.appendChild(back);

    var header = el('header', 'story-header');
    var meta = el('div', 'story-header__meta');
    meta.appendChild(el('span', 'badge badge--level', story.level));
    meta.appendChild(el('span', 'badge', '約' + story.minutes + '分'));
    header.appendChild(meta);
    header.appendChild(el('h2', 'story-header__title', story.title));
    header.appendChild(el('p', 'story-header__title-ja', story.titleJa));
    viewStory.appendChild(header);

    // The Japanese summary comes first: grasp the story, then read the English.
    viewStory.appendChild(buildSection({
      variant: 'summary',
      title: '日本語の要約',
      note: '文をクリックすると、そこから読み上げます。',
      text: story.summaryJa,
      lang: 'ja-JP',
      rateKey: 'ef.rate.ja'
    }));

    viewStory.appendChild(buildSection({
      variant: 'story',
      title: '英語の本文',
      note: 'Click a sentence to start reading from there.',
      text: story.body,
      lang: 'en-US',
      rateKey: 'ef.rate.en'
    }));

    if (story.vocab && story.vocab.length) {
      var vocab = el('section', 'vocab');
      vocab.appendChild(el('h3', 'vocab__title', '単語メモ'));

      var list = el('dl', 'vocab__list');
      story.vocab.forEach(function (v) {
        list.appendChild(el('dt', 'vocab__word', v.word));
        list.appendChild(el('dd', 'vocab__ja', v.ja));
      });

      vocab.appendChild(list);
      viewStory.appendChild(vocab);
    }
  }

  /* --------------------------------------------------------------- routing */

  function findStory(id) {
    for (var i = 0; i < stories.length; i++) {
      if (stories[i].id === id) return stories[i];
    }
    return null;
  }

  function route() {
    teardownPlayers();

    var match = /^#\/story\/(.+)$/.exec(global.location.hash);
    var story = match ? findStory(decodeURIComponent(match[1])) : null;

    if (story) {
      viewList.hidden = true;
      viewStory.hidden = false;
      renderStory(story);
      document.title = story.title + ' | EnglishForest';
    } else {
      viewStory.hidden = true;
      viewList.hidden = false;
      renderList();
      document.title = 'EnglishForest';
    }

    global.scrollTo(0, 0);
  }

  global.addEventListener('hashchange', route);
  route();
})(window);
