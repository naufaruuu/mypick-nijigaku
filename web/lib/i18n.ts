export type Lang = 'en' | 'ja';

export interface Dict {
  download: string;
  generating: string;
  share: string;
  sharing: string;
  openShare: string;
  copyLink: string;
  copied: string;
  clearAll: string;
  clearConfirm: string;
  clearConfirmBody: string;
  cancel: string;
  community: string;
  allSongs: string;
  makeYourOwn: string;
  namePlaceholder: string;
  nameHelp: string;
  namePrivacy: string;
  picked: (a: number, b: number) => string;
  back: string;
  communityTitle: string;
  communityAccent: string;
  pickBoards: string;
  picksLabel: string;
  updated: string;
  // community category sections
  catNiji: string;
  catUnits: string;
  catSolo: string;
  catOthers: string;
  subNiji: string;
  subUnits: string;
  subSolo: string;
  subOthers: string;
  // expander: nouns + formatters
  nounSongs: string;
  nounUnitSongs: string;
  nounCharSongs: string;
  showAll: (n: number, noun: string) => string;
  showLess: string;
  // most-diverse sections (members + sub-units)
  diverseTitle: string;
  diverseSub: string;
  diverseUnitTitle: string;
  diverseUnitSub: string;
  diverseUnitLegend: string;
  nounMembers: string;
  spreadLabel: string;
  topPick: (song: string, share: number) => string;
  diverseLegend: string;
  picksCount: (n: number) => string;
  // community analytics cards (per-category switcher)
  analytics: {
    hint: string;
    menuHeader: string;
    topSongs: string;
    pickRace: string;
    risingFalling: string;
    byUnit: string;
    unitLeaders: string;
    memberLeaders: string;
    mostDiverse: string;
    descTopGroup: string;
    descTopUnits: string;
    descTopSolo: string;
    descTopOthers: string;
    descRace: string;
    descMovers: string;
    descByUnit: string;
    descUnitLeaders: string;
    descMemberLeaders: string;
    descDiverse: string;
    subTopGroup: string;
    subTopUnits: string;
    subTopSolo: string;
    subTopOthers: string;
    subByUnit: string;
    subUnitLeaders: string;
    subMemberLeaders: string;
    subDiverseUnits: string;
    subDiverseMembers: string;
    subRace: string;
    subMovers: string;
    rising: string;
    falling: string;
    moversWindow: string;
    raceEmpty: string;
    moversEmpty: string;
    boardsWord: string;
    play: string;
    pause: string;
    unitMeta: (songs: number, topPct: number) => string;
    nowShare: (n: number) => string;
  };
  allTitle: string;
  allAccent: string;
  communityNote: string;
  // bucket labels
  groupLabel: string;
  othersLabel: string;
  othersSuffix: string;
  // export image
  unitsSection: string;
  membersSection: string;
  unofficial: string;
  selectedBy: (name: string) => string;
  // global footer
  footerCreditPre: string;
  footerAnd: string;
  footerNote1: string;
  footerNote2: string;
  githubBtn: string;
  mbtiBtn: string;
}

export const dict: Record<Lang, Dict> = {
  en: {
    download: '↓ Download images',
    generating: 'Generating…',
    share: 'Share',
    sharing: 'Sharing…',
    openShare: 'Share link',
    copyLink: 'Copy link',
    copied: 'Copied!',
    clearAll: 'Clear all',
    clearConfirm: 'Clear all picks?',
    clearConfirmBody: 'This removes every song you’ve selected. This can’t be undone.',
    cancel: 'Cancel',
    community: 'Picks',
    allSongs: 'All songs',
    makeYourOwn: 'Make your own',
    namePlaceholder: 'Your name (optional)',
    nameHelp: 'Optional — shown as "Selected by ___" on your image.',
    namePrivacy: 'Your name is never sent to our server.',
    picked: (a, b) => `${a} of ${b} picked`,
    back: '← Back to Pick Board',
    communityTitle: 'Community',
    communityAccent: 'Picks',
    pickBoards: 'Pick Boards',
    picksLabel: 'Picks',
    updated: 'Updated',
    catNiji: 'Nijigasaki',
    catUnits: 'Units',
    catSolo: 'Solo',
    catOthers: 'Others',
    subNiji: 'Top group songs',
    subUnits: 'Top sub-unit songs',
    subSolo: 'Top character songs',
    subOthers: 'Shuffle, collab & misc',
    nounSongs: 'songs',
    nounUnitSongs: 'unit songs',
    nounCharSongs: 'character songs',
    showAll: (n, noun) => `Show all ${n} ${noun}`,
    showLess: 'Show less',
    diverseTitle: 'Most Diverse Members',
    diverseSub: 'No runaway favorite — fans spread their pick across many songs',
    diverseUnitTitle: 'Most Diverse Sub-units',
    diverseUnitSub: 'Which unit’s picks spread across the most songs',
    diverseUnitLegend:
      'Spread = how evenly fans’ picks split across a unit’s songs (100% = perfectly even, lower = one song dominates).',
    nounMembers: 'members',
    spreadLabel: 'spread',
    topPick: (song, share) => `Top pick: ${song} · ${share}%`,
    diverseLegend:
      'Spread = how evenly fans’ picks split across a member’s songs (100% = perfectly even, lower = one song dominates).',
    picksCount: (n) => `${n.toLocaleString()} ${n === 1 ? 'pick' : 'picks'}`,
    analytics: {
      hint: 'Tap the squircle on a card to switch its analytics',
      menuHeader: 'Show in this card',
      topSongs: 'Top Songs',
      pickRace: 'Pick Race',
      risingFalling: 'Rising & Falling',
      byUnit: 'By Unit',
      unitLeaders: 'Unit Leaders',
      memberLeaders: 'Member Leaders',
      mostDiverse: 'Most Diverse',
      descTopGroup: 'Most-picked group songs',
      descTopUnits: 'All unit songs, mixed together',
      descTopSolo: 'Most-picked solo songs',
      descTopOthers: 'Most-picked misc songs',
      descRace: 'Watch the top songs change, pick by pick',
      descMovers: 'Biggest recent swings',
      descByUnit: '1 vote per unit — sorted per unit',
      descUnitLeaders: 'Whose race is most decisive',
      descMemberLeaders: 'Each member’s biggest song',
      descDiverse: 'Picks spread evenest across songs',
      subTopGroup: 'Top group songs',
      subTopUnits: 'Top sub-unit songs',
      subTopSolo: 'Top character songs',
      subTopOthers: 'Shuffle, collab & misc',
      subByUnit: 'Each unit ranked on its own',
      subUnitLeaders: 'Winning song of each unit',
      subMemberLeaders: 'Top song of each member',
      subDiverseUnits: 'Sub-units by even spread',
      subDiverseMembers: 'Members by even spread',
      subRace: 'Play the ranking from the first pick to now',
      subMovers: 'Movers over the last 3,000 picks',
      rising: 'Rising',
      falling: 'Falling',
      moversWindow: 'last 3,000 picks',
      raceEmpty: 'Not enough picks yet to play a race.',
      moversEmpty: 'Not enough picks yet to show movers.',
      boardsWord: 'picks',
      play: 'Play',
      pause: 'Pause',
      unitMeta: (songs, topPct) => `${songs} ${songs === 1 ? 'song' : 'songs'} · top ${topPct}%`,
      nowShare: (n) => `now ${n}%`,
    },
    allTitle: 'All',
    allAccent: 'Songs',
    communityNote:
      'For fun and sharing only. Please enjoy these numbers as community preferences, not as rankings of songs or fans.',
    groupLabel: 'Nijigasaki High School Idol Club',
    othersLabel: 'Others',
    othersSuffix: '— shuffle / misc',
    unitsSection: 'UNITS',
    membersSection: 'MEMBERS',
    unofficial: 'UNOFFICIAL FAN SELECTION',
    selectedBy: (name) => `Selected by ${name}`,
    footerCreditPre: 'Unofficial Fan Selection Board · Developed by NaufalAlfa · Inspired by ',
    footerAnd: ' and ',
    footerNote1:
      'This is a non-commercial fan project. Song titles, logos, and images belong to their respective rights holders.',
    footerNote2:
      'This site collects anonymous song selection statistics for overall community trends only.',
    githubBtn: 'GitHub Source',
    mbtiBtn: 'Try LL MBTI',
  },
  ja: {
    download: '↓ 画像をダウンロード',
    generating: '生成中…',
    share: '共有',
    sharing: '共有中…',
    openShare: '共有リンク',
    copyLink: 'リンクをコピー',
    copied: 'コピーしました',
    clearAll: 'すべてクリア',
    clearConfirm: 'すべての選択をクリアしますか？',
    clearConfirmBody: '選択したすべての楽曲が削除されます。この操作は取り消せません。',
    cancel: 'キャンセル',
    community: 'みんなの選曲',
    allSongs: '楽曲一覧',
    makeYourOwn: '自分のを作る',
    namePlaceholder: 'お名前（任意）',
    nameHelp: '任意 — 画像に「Selected by ___」として表示されます。',
    namePrivacy: 'お名前はサーバーには送信されません。',
    picked: (a, b) => `${b}曲中 ${a}曲を選択`,
    back: '← ピックボードに戻る',
    communityTitle: 'みんなの',
    communityAccent: '選曲',
    pickBoards: 'ピックボード',
    picksLabel: '選曲数',
    updated: '更新',
    catNiji: '虹ヶ咲',
    catUnits: 'ユニット',
    catSolo: 'ソロ',
    catOthers: 'その他',
    subNiji: 'グループ楽曲トップ',
    subUnits: 'サブユニット楽曲トップ',
    subSolo: 'キャラクター楽曲トップ',
    subOthers: 'シャッフル・コラボなど',
    nounSongs: '曲',
    nounUnitSongs: 'ユニット曲',
    nounCharSongs: 'キャラソング',
    showAll: (n, noun) => `すべての${n}${noun}を表示`,
    showLess: '表示を減らす',
    diverseTitle: '選曲が多彩なメンバー',
    diverseSub: '人気が一曲に偏らず、ファンの選曲が多くの曲に分かれているメンバー',
    diverseUnitTitle: '選曲が多彩なユニット',
    diverseUnitSub: '選曲が最も多くの曲に分かれているユニット',
    diverseUnitLegend:
      '均等度 = ファンの選曲が各ユニットの曲にどれだけ均等に分かれているか（100% = 完全に均等、低いほど一曲に集中）。',
    nounMembers: 'メンバー',
    spreadLabel: '均等度',
    topPick: (song, share) => `人気曲: ${song} · ${share}%`,
    diverseLegend:
      '均等度 = ファンの選曲が各メンバーの曲にどれだけ均等に分かれているか（100% = 完全に均等、低いほど一曲に集中）。',
    picksCount: (n) => `${n.toLocaleString()}回選曲`,
    analytics: {
      hint: 'カードの四角ボタンで表示を切り替え',
      menuHeader: 'このカードに表示',
      topSongs: '人気曲',
      pickRace: '推移レース',
      risingFalling: '上昇・下降',
      byUnit: 'ユニット別',
      unitLeaders: 'ユニット代表曲',
      memberLeaders: 'メンバー代表曲',
      mostDiverse: '多彩さ',
      descTopGroup: 'グループ楽曲の人気順',
      descTopUnits: 'ユニット楽曲をまとめて',
      descTopSolo: 'ソロ楽曲の人気順',
      descTopOthers: 'その他楽曲の人気順',
      descRace: '票が増えるごとに上位曲が入れ替わる様子',
      descMovers: '最近の変動が大きい曲',
      descByUnit: '1ユニット1票・ユニット内順位',
      descUnitLeaders: '内部競争が最も明確なのは',
      descMemberLeaders: '各メンバーの一番人気曲',
      descDiverse: '選曲が最も均等に分かれている',
      subTopGroup: 'グループ楽曲トップ',
      subTopUnits: 'サブユニット楽曲トップ',
      subTopSolo: 'キャラクター楽曲トップ',
      subTopOthers: 'シャッフル・コラボなど',
      subByUnit: 'ユニットごとの順位',
      subUnitLeaders: '各ユニットの代表曲',
      subMemberLeaders: '各メンバーの代表曲',
      subDiverseUnits: '均等度が高いユニット',
      subDiverseMembers: '均等度が高いメンバー',
      subRace: '最初の票から現在までを再生',
      subMovers: '直近3,000票の変動',
      rising: '上昇',
      falling: '下降',
      moversWindow: '直近3,000票',
      raceEmpty: 'レースを再生するには票がまだ足りません。',
      moversEmpty: '変動を表示するには票がまだ足りません。',
      boardsWord: '票',
      play: '再生',
      pause: '一時停止',
      unitMeta: (songs, topPct) => `${songs}曲 · トップ${topPct}%`,
      nowShare: (n) => `現在 ${n}%`,
    },
    allTitle: '楽曲',
    allAccent: '一覧',
    communityNote:
      '遊びと共有のためのものです。これらの数値は楽曲やファンの順位ではなく、コミュニティの傾向としてお楽しみください。',
    groupLabel: '虹ヶ咲学園スクールアイドル同好会',
    othersLabel: 'その他',
    othersSuffix: '— シャッフル・その他',
    unitsSection: 'ユニット',
    membersSection: 'メンバー',
    unofficial: '非公式ファン選曲',
    selectedBy: (name) => `${name} さんの選曲`,
    footerCreditPre: '非公式ファン選曲ボード · 開発: NaufalAlfa · インスパイア元: ',
    footerAnd: '・',
    footerNote1:
      'これは非営利のファンプロジェクトです。楽曲名・ロゴ・画像の権利は各権利者に帰属します。',
    footerNote2: '本サイトは全体的な傾向の把握のみを目的に、匿名の選曲統計を収集します。',
    githubBtn: 'GitHub ソース',
    mbtiBtn: 'LL MBTI を試す',
  },
};
