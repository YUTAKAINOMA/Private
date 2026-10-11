/*
 * data/stories.js — story content for EnglishForest.
 *
 * `body` is the English story, `summaryJa` the Japanese summary. Both are read
 * aloud, so keep sentences ending in proper punctuation (. ! ? / 。！？) —
 * that is what the reader splits on for highlighting.
 * Blank lines separate paragraphs.
 */
(function (global) {
  'use strict';

  var EF = global.EF = global.EF || {};

  EF.stories = [
    {
      id: 'lantern-in-the-fog',
      title: 'The Lantern in the Fog',
      titleJa: '霧のなかの灯り',
      level: 'A2',
      minutes: 3,
      tags: ['やさしい', '不思議な話'],
      body:
        'Mika worked at the small post office at the edge of the forest. Every evening, she walked home along the same narrow path. She knew every stone and every root.\n' +
        'One night, the fog came early. It was thick and white, and it swallowed the trees. Mika could not see her own hands.\n' +
        'Then she saw a light. It was small and orange, and it moved slowly between the trees. She followed it. The light stopped when she stopped. It waited for her.\n' +
        'After twenty minutes, the fog opened. Mika stood in front of her own gate. The light was gone.\n' +
        'The next morning, she asked her neighbour about it. The old woman smiled. "The forest does not want to lose anyone," she said. "It only wants you to look."',
      summaryJa:
        '森のはずれの郵便局で働くミカは、毎晩おなじ細い道を通って家に帰っていた。ある夜、いつもより早く濃い霧が立ちこめ、自分の手さえ見えなくなってしまう。\n' +
        'そのとき、木々のあいだに小さなオレンジ色の光が現れた。ミカが立ち止まると光も止まり、まるで彼女を待っているようだった。光について歩くこと二十分、霧が晴れると、目の前には自分の家の門があった。光はもう消えていた。\n' +
        '翌朝そのことを近所の老婦人に話すと、彼女は微笑んでこう答えた。森は誰も失いたくない、ただ、こちらから見ようとすることを望んでいるだけなのだ、と。',
      vocab: [
        { word: 'fog', ja: '霧' },
        { word: 'swallow', ja: '飲み込む、覆い隠す' },
        { word: 'root', ja: '木の根' },
        { word: 'gate', ja: '門' },
        { word: 'neighbour', ja: '隣人（米: neighbor）' }
      ]
    },
    {
      id: 'the-bench-that-remembered',
      title: 'The Bench That Remembered',
      titleJa: '覚えていたベンチ',
      level: 'B1',
      minutes: 4,
      tags: ['日常', '再出発'],
      body:
        'There was a wooden bench beside the river, and on its back someone had carved a single word: STAY.\n' +
        'Ren passed it every morning on his way to the station. For three years he never sat down. He was always late, always moving, always thinking about the next thing.\n' +
        'Then the company closed. Suddenly Ren had nothing to be late for.\n' +
        'On the first free morning, he sat on the bench. The river was louder than he expected. A heron stood in the shallow water without moving for a long time, and then it caught a fish.\n' +
        'Ren came back the next day, and the day after. He began to notice things: the colour of the water after rain, the man who fed the ducks at seven, the way the light moved across the bridge.\n' +
        'Six months later he found a new job. He still takes the same path, but now he leaves the house ten minutes early.',
      summaryJa:
        '川のそばに木のベンチがあり、その背もたれには「STAY（とどまれ）」という一語が彫られていた。\n' +
        'レンは三年間、毎朝そのベンチの前を通って駅へ向かっていたが、一度も座ったことはなかった。いつも遅刻ぎりぎりで、つねに次の予定のことばかり考えていたからだ。\n' +
        'ところが勤め先が倒産し、彼は急ぎたてる理由を失ってしまう。何もない最初の朝、彼ははじめてそのベンチに腰を下ろした。川の音は思っていたよりずっと大きく、浅瀬では一羽のサギが長いあいだ微動だにせず立ち、やがて魚をとらえた。\n' +
        '翌日も、その翌日も彼はベンチに通った。雨あがりの水の色、七時に鴨に餌をやる男性、橋の上を移動していく光。彼は少しずつ、そうしたものに気づくようになっていく。\n' +
        '半年後、レンは新しい仕事を見つけた。通る道は以前と同じだが、いまは十分早く家を出るようになっている。',
      vocab: [
        { word: 'carve', ja: '彫る' },
        { word: 'heron', ja: 'サギ（鳥）' },
        { word: 'shallow', ja: '浅い' },
        { word: 'notice', ja: '気づく' },
        { word: 'path', ja: '小道、通り道' }
      ]
    },
    {
      id: 'signal',
      title: 'Signal',
      titleJa: 'シグナル',
      level: 'B2',
      minutes: 4,
      tags: ['すこし長め', '手紙'],
      body:
        'The radio station on the island broadcast for two hours every night, and almost nobody listened.\n' +
        'Hana had inherited it from her grandfather along with the house, the debts, and a cardboard box of tapes. The engineer told her the transmitter would fail within a year. She decided to keep it running until it did.\n' +
        'She read the weather. She read the ferry timetable. When there was nothing else, she read books aloud into the microphone, one chapter at a time, and she never mentioned her own name.\n' +
        'In March, a letter arrived with no return address. "I drive a truck on the mainland," it said. "Your signal reaches the coast road for about eleven minutes. I have been listening to the same novel for four months and I need to know how it ends."\n' +
        'Hana read faster after that. Not much faster, but enough.\n' +
        'The transmitter lasted three more years.',
      summaryJa:
        '島にあるラジオ局は毎晩二時間だけ放送していたが、聴いている人はほとんどいなかった。\n' +
        'ハナはその局を、家と借金、そして段ボール一箱のテープとともに祖父から受け継いだ。技師からは送信機は一年ももたないと告げられたが、彼女は壊れるその日まで放送を続けようと決める。\n' +
        '天気を読み、フェリーの時刻表を読み、ほかに読むものがなくなると、本を一章ずつ声に出して読んだ。自分の名前は一度も名乗らなかった。\n' +
        '三月、差出人の住所のない手紙が届く。本土でトラックを運転している者だが、あなたの電波は海岸道路に十一分ほど届く。同じ小説を四か月聴き続けていて、結末がどうしても知りたい、と書かれていた。\n' +
        'その日からハナは少しだけ読むのが速くなった。ほんの少しだが、たしかに。\n' +
        '送信機は、それからさらに三年もちこたえた。',
      vocab: [
        { word: 'broadcast', ja: '放送する' },
        { word: 'inherit', ja: '受け継ぐ' },
        { word: 'debt', ja: '借金' },
        { word: 'transmitter', ja: '送信機' },
        { word: 'mainland', ja: '本土' }
      ]
    }
  ];
})(window);
