// 性格タイプの定義
// 教師が編集しやすいよう、タイプと質問はここに集約しています
const PERSONALITY_TYPES = [
  {
    id: "explorer",
    name: "探求者",
    emoji: "🔍",
    color: "#4FC3F7",
    catchphrase: "未知への好奇心が原動力",
    description: "知らないこと・新しいことに目を輝かせる人。質問する力と、新しい世界に踏み出す勇気を持っています。",
    strengths: ["好奇心", "学習意欲", "柔軟さ"],
  },
  {
    id: "empath",
    name: "共鳴者",
    emoji: "💝",
    color: "#F48FB1",
    catchphrase: "人の心に寄り添える",
    description: "周りの人の感情の変化に気づき、自然と寄り添える人。クラスの雰囲気を温かくする存在です。",
    strengths: ["共感力", "やさしさ", "聞く力"],
  },
  {
    id: "guardian",
    name: "守護者",
    emoji: "🛡️",
    color: "#81C784",
    catchphrase: "信頼と責任を背負う",
    description: "約束を守り、責任感を持ってやり遂げる人。みんなが安心して頼れる縁の下の力持ちです。",
    strengths: ["責任感", "誠実さ", "持続力"],
  },
  {
    id: "challenger",
    name: "挑戦者",
    emoji: "⚡",
    color: "#FFB74D",
    catchphrase: "目標に向かって突き進む",
    description: "目標を決めたら一直線。困難があっても諦めず、行動で道を切り拓いていく人です。",
    strengths: ["行動力", "情熱", "粘り強さ"],
  },
  {
    id: "creator",
    name: "創造者",
    emoji: "🎨",
    color: "#BA68C8",
    catchphrase: "アイデアと表現で世界を彩る",
    description: "他の人が思いつかないアイデアを生み出し、自分なりの表現で形にできる人。発想の宝庫です。",
    strengths: ["発想力", "表現力", "独創性"],
  },
  {
    id: "mediator",
    name: "調停者",
    emoji: "⚖️",
    color: "#7986CB",
    catchphrase: "冷静にバランスを取る",
    description: "感情的にならず、物事を多面的に見られる人。意見が分かれた場面で、みんなをまとめる賢さを持っています。",
    strengths: ["冷静さ", "公平さ", "判断力"],
  },
];

// 自己分析用の質問（自分について答える）
const SELF_QUESTIONS = [
  { typeId: "explorer", text: "新しいことや知らない世界に、ワクワクすることが多い" },
  { typeId: "empath", text: "友だちの表情や声の変化から、気持ちをよく読み取れる" },
  { typeId: "guardian", text: "一度引き受けたことや約束は、最後までやり遂げる" },
  { typeId: "challenger", text: "目標があると、それに向かってどんどん行動できる" },
  { typeId: "creator", text: "自分なりのアイデアや表現を考えるのが好きだ" },
  { typeId: "mediator", text: "意見が分かれた時、冷静に全体を見てまとめようとする" },
];

// クラスメイトに聞く質問（あなたから見て、私は…）
const PEER_QUESTIONS = [
  { typeId: "explorer", text: "新しいことに挑戦するタイプ" },
  { typeId: "empath", text: "人の気持ちに敏感で、寄り添えるタイプ" },
  { typeId: "guardian", text: "頼れて、責任感が強いタイプ" },
  { typeId: "challenger", text: "目標に向かって突き進む行動派タイプ" },
  { typeId: "creator", text: "独自のアイデアや表現が豊かなタイプ" },
  { typeId: "mediator", text: "冷静にバランスを取る、まとめ役タイプ" },
];

// 5段階評価のラベル
const RATING_LABELS = [
  { value: 1, label: "ぜんぜん", emoji: "🙅" },
  { value: 2, label: "あまり", emoji: "😐" },
  { value: 3, label: "ふつう", emoji: "🤔" },
  { value: 4, label: "わりと", emoji: "🙂" },
  { value: 5, label: "とても", emoji: "🌟" },
];

// 集める証言の人数（推奨）
const PEER_COUNT = 5;

// 性格カードの記述項目
const REFLECTION_FIELDS = [
  {
    id: "strengths",
    label: "私の強み・得意なこと",
    placeholder: "集まったヒントから見えてきた、自分の強みを書いてみよう",
  },
  {
    id: "values",
    label: "大切にしたいこと",
    placeholder: "これからも大事にしていきたい価値観や信念は？",
  },
  {
    id: "challenge",
    label: "これから挑戦したいこと",
    placeholder: "新しい自分を発見した今、挑戦してみたいことは？",
  },
];
