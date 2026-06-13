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
