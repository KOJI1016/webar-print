// ========== 状態管理 ==========
const STORAGE_KEY = "personality-quest-v1";

const initialState = {
  stage: "title",
  playerName: "",
  selfAnswers: {},
  peers: [],
  currentPeerIndex: 0,
  guess: null,
  result: null,
  reflection: {},
};

let state = loadState();

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...initialState, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn("保存データの読み込みに失敗しました", e);
  }
  return { ...initialState };
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("保存に失敗しました", e);
  }
}

function resetState() {
  if (!confirm("最初からやり直しますか？\n（今までの入力は消えます）")) return;
  state = { ...initialState };
  saveState();
  showStage("title");
}

// ========== ステージ切り替え ==========
function showStage(stageName) {
  state.stage = stageName;
  saveState();
  const app = document.getElementById("app");
  app.scrollTop = 0;
  window.scrollTo({ top: 0, behavior: "instant" });
  render();
}

function render() {
  const app = document.getElementById("app");
  app.innerHTML = "";

  switch (state.stage) {
    case "title": renderTitle(app); break;
    case "prologue": renderPrologue(app); break;
    case "name": renderNameInput(app); break;
    case "self": renderSelfQuestions(app); break;
    case "peer-setup": renderPeerSetup(app); break;
    case "peer-list": renderPeerList(app); break;
    case "peer-questions": renderPeerQuestions(app); break;
    case "scores": renderScores(app); break;
    case "guess": renderGuess(app); break;
    case "reveal": renderReveal(app); break;
    case "reflection": renderReflection(app); break;
    case "final": renderFinal(app); break;
    default: showStage("title");
  }

  // 共通フッター
  const footer = document.createElement("div");
  footer.className = "footer";
  footer.innerHTML = `<a href="#" id="resetLink">最初からやり直す</a>`;
  app.appendChild(footer);
  document.getElementById("resetLink").onclick = (e) => {
    e.preventDefault();
    resetState();
  };
}

// ========== ステージ0: タイトル ==========
function renderTitle(app) {
  const div = document.createElement("div");
  div.className = "stage active title-screen";
  div.innerHTML = `
    <div class="title-eyebrow">PERSONALITY DETECTIVE</div>
    <h1 class="title-main">性格探偵<br>クエスト</h1>
    <p class="title-sub">クラスメイトの証言から<br>本当の自分を発見しよう</p>
    <div class="title-art">🔍</div>
    <button class="btn" id="startBtn">ミッション開始</button>
    ${state.playerName ? `<p class="small mt-2">前回の続きから: ${escapeHtml(state.playerName)}</p>` : ""}
  `;
  app.appendChild(div);
  document.getElementById("startBtn").onclick = () => showStage("prologue");
}

// ========== ステージ1: プロローグ ==========
function renderPrologue(app) {
  const div = document.createElement("div");
  div.className = "stage active";

  const typeCards = PERSONALITY_TYPES.map(t => `
    <div class="type-card" style="border-color:${hexToRgba(t.color, 0.4)}">
      <span class="type-emoji">${t.emoji}</span>
      <p class="type-name">${t.name}</p>
      <p class="type-tag">${t.catchphrase}</p>
    </div>
  `).join("");

  div.innerHTML = `
    <div class="stage-header">
      <span class="stage-label">PROLOGUE</span>
      <h2 class="stage-title">事件の概要</h2>
    </div>
    <div class="card">
      <p>君はある日、自分が「どんな性格なのか」分からなくなってしまった。</p>
      <p>でも安心してほしい。クラスにはたくさんの目撃者（クラスメイト）がいる。</p>
      <p>彼らから<strong>証言</strong>を集め、自分の正体を突き止めよう。</p>
    </div>
    <div class="stage-header mt-4">
      <h3 class="stage-title" style="font-size:18px;">6つの容疑タイプ</h3>
      <p class="stage-desc">あなたはどれに当てはまる？</p>
    </div>
    <div class="type-grid">${typeCards}</div>
    <button class="btn mt-2" id="nextBtn">捜査を開始する</button>
  `;
  app.appendChild(div);
  document.getElementById("nextBtn").onclick = () => showStage("name");
}

// ========== ステージ2: 名前入力 ==========
function renderNameInput(app) {
  const div = document.createElement("div");
  div.className = "stage active";
  div.innerHTML = `
    <div class="stage-header">
      <span class="stage-label">STEP 1</span>
      <h2 class="stage-title">探偵の登録</h2>
      <p class="stage-desc">あなたの名前を教えてください</p>
    </div>
    <div class="input-group">
      <label class="input-label">名前（ニックネームでOK）</label>
      <input type="text" class="input-field" id="nameInput" placeholder="例: たろう" value="${escapeHtml(state.playerName)}" maxlength="20">
    </div>
    <div class="btn-row">
      <button class="btn btn-secondary" id="backBtn">戻る</button>
      <button class="btn" id="nextBtn">次へ</button>
    </div>
  `;
  app.appendChild(div);

  const input = document.getElementById("nameInput");
  input.focus();
  document.getElementById("backBtn").onclick = () => showStage("prologue");
  document.getElementById("nextBtn").onclick = () => {
    const name = input.value.trim();
    if (!name) {
      input.focus();
      return;
    }
    state.playerName = name;
    showStage("self");
  };
}

// ========== ステージ3: 自己分析 ==========
function renderSelfQuestions(app) {
  const div = document.createElement("div");
  div.className = "stage active";
  div.innerHTML = `
    <div class="stage-header">
      <span class="stage-label">STEP 2</span>
      <h2 class="stage-title">自己分析</h2>
      <p class="stage-desc">まずは自分自身について、正直に答えてみよう</p>
    </div>
    <div id="selfQuestions"></div>
    <div class="btn-row">
      <button class="btn btn-secondary" id="backBtn">戻る</button>
      <button class="btn" id="nextBtn" disabled>クラスメイト捜索へ</button>
    </div>
  `;
  app.appendChild(div);

  const container = document.getElementById("selfQuestions");
  SELF_QUESTIONS.forEach((q, i) => {
    container.appendChild(buildQuestionCard(q, i, "self", state.selfAnswers));
  });

  updateSelfNextButton();
  document.getElementById("backBtn").onclick = () => showStage("name");
  document.getElementById("nextBtn").onclick = () => showStage("peer-setup");
}

function buildQuestionCard(question, index, prefix, answersMap) {
  const card = document.createElement("div");
  card.className = "question-card";
  card.style.animation = `slideUp 0.4s ease-out ${index * 0.05}s backwards`;
  const qid = `${prefix}-${index}`;
  const current = answersMap[index];

  const ratings = RATING_LABELS.map(r => `
    <button class="rating-btn ${current === r.value ? "selected" : ""}"
            data-q="${index}" data-v="${r.value}">
      <span class="rating-emoji">${r.emoji}</span>
      <span class="rating-label">${r.label}</span>
    </button>
  `).join("");

  card.innerHTML = `
    <p class="question-text">Q${index + 1}. ${escapeHtml(question.text)}</p>
    <div class="rating-row">${ratings}</div>
  `;

  card.querySelectorAll(".rating-btn").forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.q);
      const val = parseInt(btn.dataset.v);
      answersMap[idx] = val;
      saveState();
      card.querySelectorAll(".rating-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      if (prefix === "self") updateSelfNextButton();
      if (prefix === "peer") updatePeerNextButton();
    };
  });

  return card;
}

function updateSelfNextButton() {
  const allAnswered = SELF_QUESTIONS.every((_, i) => state.selfAnswers[i] !== undefined);
  const btn = document.getElementById("nextBtn");
  if (btn) btn.disabled = !allAnswered;
}

// ========== ステージ4a: 証言者リスト準備 ==========
function renderPeerSetup(app) {
  const div = document.createElement("div");
  div.className = "stage active";
  div.innerHTML = `
    <div class="stage-header">
      <span class="stage-label">STEP 3</span>
      <h2 class="stage-title">証言者を集める</h2>
      <p class="stage-desc">話を聞きたいクラスメイト${PEER_COUNT}人の名前を入力してね</p>
    </div>
    <div class="mission-box">
      <div class="mission-label">📋 MISSION</div>
      <p class="mission-text">仲のいい人だけでなく、いつもと違うグループの人にも聞いてみよう</p>
    </div>
    <div id="peerInputs"></div>
    <div class="btn-row">
      <button class="btn btn-secondary" id="backBtn">戻る</button>
      <button class="btn" id="nextBtn">証言収集スタート</button>
    </div>
  `;
  app.appendChild(div);

  const container = document.getElementById("peerInputs");
  if (state.peers.length === 0) {
    state.peers = Array.from({ length: PEER_COUNT }, () => ({ name: "", answers: {} }));
  }
  state.peers.forEach((peer, i) => {
    const group = document.createElement("div");
    group.className = "input-group";
    group.innerHTML = `
      <label class="input-label">証言者${i + 1}</label>
      <input type="text" class="input-field" data-i="${i}" placeholder="名前を入力" value="${escapeHtml(peer.name)}" maxlength="20">
    `;
    container.appendChild(group);
  });

  container.querySelectorAll("input").forEach(input => {
    input.oninput = () => {
      const i = parseInt(input.dataset.i);
      state.peers[i].name = input.value.trim();
      saveState();
      updatePeerSetupNextButton();
    };
  });
  updatePeerSetupNextButton();

  document.getElementById("backBtn").onclick = () => showStage("self");
  document.getElementById("nextBtn").onclick = () => {
    if (state.peers.every(p => p.name)) showStage("peer-list");
  };
}

function updatePeerSetupNextButton() {
  const btn = document.getElementById("nextBtn");
  if (!btn) return;
  btn.disabled = !state.peers.every(p => p.name);
}

// ========== ステージ4b: 証言者リスト ==========
function renderPeerList(app) {
  const div = document.createElement("div");
  div.className = "stage active";

  const doneCount = state.peers.filter(p => isPeerDone(p)).length;
  const progressPercent = (doneCount / state.peers.length) * 100;

  const peerItems = state.peers.map((p, i) => {
    const done = isPeerDone(p);
    return `
      <div class="peer-item ${done ? "done" : ""}" data-i="${i}">
        <div class="peer-avatar">${escapeHtml(p.name.charAt(0))}</div>
        <div class="peer-name">${escapeHtml(p.name)}</div>
        <div class="peer-status ${done ? "done" : ""}">${done ? "✓ 証言済み" : "未"}</div>
      </div>
    `;
  }).join("");

  div.innerHTML = `
    <div class="stage-header">
      <span class="stage-label">STEP 4</span>
      <h2 class="stage-title">証言を集めよう</h2>
      <p class="stage-desc">タップして証言を入力</p>
    </div>
    <div class="progress">
      <div class="progress-track">
        <div class="progress-fill" style="width:${progressPercent}%"></div>
      </div>
      <div class="progress-text">${doneCount} / ${state.peers.length} 人 完了</div>
    </div>
    <div class="mission-box">
      <div class="mission-label">📋 聞き方の例</div>
      <p class="mission-text">「ねえ、ちょっと聞きたいんだけど、私って〇〇なタイプだと思う？」</p>
    </div>
    <div class="peer-list">${peerItems}</div>
    <div class="btn-row">
      <button class="btn btn-secondary" id="backBtn">戻る</button>
      <button class="btn" id="nextBtn" ${doneCount === state.peers.length ? "" : "disabled"}>推理に進む</button>
    </div>
  `;
  app.appendChild(div);

  div.querySelectorAll(".peer-item").forEach(item => {
    item.onclick = () => {
      state.currentPeerIndex = parseInt(item.dataset.i);
      saveState();
      showStage("peer-questions");
    };
  });

  document.getElementById("backBtn").onclick = () => showStage("peer-setup");
  document.getElementById("nextBtn").onclick = () => {
    if (doneCount === state.peers.length) showStage("scores");
  };
}

function isPeerDone(peer) {
  return PEER_QUESTIONS.every((_, i) => peer.answers[i] !== undefined);
}

// ========== ステージ4c: 証言質問 ==========
function renderPeerQuestions(app) {
  const div = document.createElement("div");
  div.className = "stage active";
  const peer = state.peers[state.currentPeerIndex];

  div.innerHTML = `
    <div class="stage-header">
      <span class="stage-label">証言者 ${state.currentPeerIndex + 1} / ${state.peers.length}</span>
      <h2 class="stage-title">${escapeHtml(peer.name)} さんの証言</h2>
      <p class="stage-desc">${escapeHtml(peer.name)}さんに聞いて、回答を入力しよう</p>
    </div>
    <div class="mission-box">
      <div class="mission-label">📢 聞いてみよう</div>
      <p class="mission-text">「私って、どんなタイプだと思う？」</p>
    </div>
    <div id="peerQuestions"></div>
    <div class="btn-row">
      <button class="btn btn-secondary" id="backBtn">リストへ戻る</button>
      <button class="btn" id="nextBtn" disabled>証言を保存</button>
    </div>
  `;
  app.appendChild(div);

  const container = document.getElementById("peerQuestions");
  PEER_QUESTIONS.forEach((q, i) => {
    const wrapped = { text: `あなたから見て、${state.playerName}さんは「${q.text}」だと思う？` };
    container.appendChild(buildQuestionCard(wrapped, i, "peer", peer.answers));
  });

  updatePeerNextButton();
  document.getElementById("backBtn").onclick = () => showStage("peer-list");
  document.getElementById("nextBtn").onclick = () => {
    if (isPeerDone(peer)) showStage("peer-list");
  };
}

function updatePeerNextButton() {
  const peer = state.peers[state.currentPeerIndex];
  const btn = document.getElementById("nextBtn");
  if (btn && peer) btn.disabled = !isPeerDone(peer);
}

// ========== スコア計算 ==========
function calculateScores() {
  const scores = {};
  PERSONALITY_TYPES.forEach(t => scores[t.id] = 0);

  // 自己分析
  SELF_QUESTIONS.forEach((q, i) => {
    const v = state.selfAnswers[i] || 0;
    scores[q.typeId] += v;
  });
  // クラスメイト証言
  state.peers.forEach(peer => {
    PEER_QUESTIONS.forEach((q, i) => {
      const v = peer.answers[i] || 0;
      scores[q.typeId] += v;
    });
  });

  return scores;
}

function getMaxScoreType() {
  const scores = calculateScores();
  let maxType = PERSONALITY_TYPES[0];
  let maxScore = -Infinity;
  PERSONALITY_TYPES.forEach(t => {
    if (scores[t.id] > maxScore) {
      maxScore = scores[t.id];
      maxType = t;
    }
  });
  return maxType;
}

// ========== ステージ5: スコア表示 ==========
function renderScores(app) {
  const div = document.createElement("div");
  div.className = "stage active";
  const scores = calculateScores();
  const maxScore = Math.max(...Object.values(scores));

  const scoreItems = PERSONALITY_TYPES.map((t, i) => {
    const v = scores[t.id];
    const pct = maxScore > 0 ? (v / maxScore) * 100 : 0;
    return `
      <div class="score-item" style="animation-delay:${i * 0.1}s">
        <div class="score-header">
          <span class="score-emoji">${t.emoji}</span>
          <span class="score-name">${t.name}</span>
          <span class="score-value">${v} pt</span>
        </div>
        <div class="score-bar">
          <div class="score-fill" style="width:${pct}%;background:${t.color}"></div>
        </div>
      </div>
    `;
  }).join("");

  div.innerHTML = `
    <div class="stage-header">
      <span class="stage-label">STEP 5</span>
      <h2 class="stage-title">証言の集計</h2>
      <p class="stage-desc">自分＋クラスメイトの回答を可視化したよ</p>
    </div>
    <div class="score-list">${scoreItems}</div>
    <div class="btn-row">
      <button class="btn btn-secondary" id="backBtn">戻る</button>
      <button class="btn" id="nextBtn">推理する</button>
    </div>
  `;
  app.appendChild(div);

  document.getElementById("backBtn").onclick = () => showStage("peer-list");
  document.getElementById("nextBtn").onclick = () => showStage("guess");
}

// ========== ステージ6: タイプ予想 ==========
function renderGuess(app) {
  const div = document.createElement("div");
  div.className = "stage active";

  const cards = PERSONALITY_TYPES.map(t => `
    <div class="guess-card ${state.guess === t.id ? "selected" : ""}" data-id="${t.id}" style="${state.guess === t.id ? `border-color:${t.color}` : ""}">
      <span class="guess-emoji">${t.emoji}</span>
      <div class="guess-name">${t.name}</div>
    </div>
  `).join("");

  div.innerHTML = `
    <div class="stage-header">
      <span class="stage-label">STEP 6</span>
      <h2 class="stage-title">推理タイム</h2>
      <p class="stage-desc">証言から、自分はどのタイプだと思う？</p>
    </div>
    <div class="guess-grid">${cards}</div>
    <div class="btn-row">
      <button class="btn btn-secondary" id="backBtn">戻る</button>
      <button class="btn" id="nextBtn" ${state.guess ? "" : "disabled"}>判定する</button>
    </div>
  `;
  app.appendChild(div);

  div.querySelectorAll(".guess-card").forEach(card => {
    card.onclick = () => {
      state.guess = card.dataset.id;
      saveState();
      div.querySelectorAll(".guess-card").forEach(c => {
        c.classList.remove("selected");
        c.style.borderColor = "";
      });
      card.classList.add("selected");
      const t = PERSONALITY_TYPES.find(x => x.id === card.dataset.id);
      card.style.borderColor = t.color;
      document.getElementById("nextBtn").disabled = false;
    };
  });

  document.getElementById("backBtn").onclick = () => showStage("scores");
  document.getElementById("nextBtn").onclick = () => {
    state.result = getMaxScoreType().id;
    saveState();
    showStage("reveal");
  };
}

// ========== ステージ7: 判定演出 ==========
function renderReveal(app) {
  const div = document.createElement("div");
  div.className = "stage active reveal-screen";
  div.innerHTML = `<div class="reveal-buildup" id="buildup">📡 データ解析中...</div>`;
  app.appendChild(div);

  const buildupTexts = [
    "📡 データ解析中...",
    "🔍 証言を照合中...",
    "✨ 真実が見えてきた...",
  ];
  let step = 0;
  const interval = setInterval(() => {
    step++;
    if (step >= buildupTexts.length) {
      clearInterval(interval);
      setTimeout(showResult, 600);
    } else {
      const buildup = document.getElementById("buildup");
      if (buildup) buildup.innerHTML = buildupTexts[step];
    }
  }, 900);

  function showResult() {
    const type = PERSONALITY_TYPES.find(t => t.id === state.result);
    const isMatch = state.guess === state.result;
    const guessType = PERSONALITY_TYPES.find(t => t.id === state.guess);

    const strengthTags = type.strengths.map(s =>
      `<div class="strength-tag">${escapeHtml(s)}</div>`
    ).join("");

    const matchHtml = isMatch
      ? `<div class="guess-match match">🎯 自分の予想と一致！自己理解度バッチリだね</div>`
      : `<div class="guess-match differ">💡 予想は <strong>${guessType.emoji} ${guessType.name}</strong> だったね。新しい一面の発見！</div>`;

    div.innerHTML = `
      <div class="reveal-result">
        <div class="reveal-buildup">あなたは...</div>
        <div class="reveal-emoji" style="color:${type.color}">${type.emoji}</div>
        <h1 class="reveal-typename" style="color:${type.color}">${type.name}</h1>
        <p class="reveal-catchphrase">${escapeHtml(type.catchphrase)}</p>
        <div class="reveal-strengths">${strengthTags}</div>
        <div class="reveal-description">
          <p style="margin:0;">${escapeHtml(type.description)}</p>
        </div>
        ${matchHtml}
        <div class="btn-row">
          <button class="btn" id="nextBtn">自分の言葉でまとめる</button>
        </div>
      </div>
    `;
    document.getElementById("nextBtn").onclick = () => showStage("reflection");
  }
}

// ========== ステージ8: 性格カード記述 ==========
function renderReflection(app) {
  const div = document.createElement("div");
  div.className = "stage active";
  const type = PERSONALITY_TYPES.find(t => t.id === state.result);

  const fields = REFLECTION_FIELDS.map(f => `
    <div class="input-group">
      <label class="input-label">${escapeHtml(f.label)}</label>
      <textarea class="input-field" data-id="${f.id}" placeholder="${escapeHtml(f.placeholder)}" rows="3">${escapeHtml(state.reflection[f.id] || "")}</textarea>
    </div>
  `).join("");

  div.innerHTML = `
    <div class="stage-header">
      <span class="stage-label">FINAL STEP</span>
      <h2 class="stage-title">性格カードを書こう</h2>
      <p class="stage-desc">${type.emoji} ${type.name}の判定とみんなの証言を参考に、自分の言葉で書いてみよう</p>
    </div>
    ${fields}
    <div class="btn-row">
      <button class="btn btn-secondary" id="backBtn">戻る</button>
      <button class="btn" id="nextBtn">カードを完成させる</button>
    </div>
  `;
  app.appendChild(div);

  div.querySelectorAll("textarea").forEach(t => {
    t.oninput = () => {
      state.reflection[t.dataset.id] = t.value;
      saveState();
    };
  });

  document.getElementById("backBtn").onclick = () => showStage("reveal");
  document.getElementById("nextBtn").onclick = () => showStage("final");
}

// ========== ステージ9: 完成カード ==========
function renderFinal(app) {
  const div = document.createElement("div");
  div.className = "stage active";
  const type = PERSONALITY_TYPES.find(t => t.id === state.result);

  const sections = REFLECTION_FIELDS.map(f => {
    const text = state.reflection[f.id] || "（未記入）";
    return `
      <div class="final-section">
        <div class="final-section-label">${escapeHtml(f.label)}</div>
        <div class="final-section-text">${escapeHtml(text)}</div>
      </div>
    `;
  }).join("");

  div.innerHTML = `
    <div class="stage-header">
      <span class="stage-label">🎉 COMPLETE</span>
      <h2 class="stage-title">あなたの性格カード</h2>
      <p class="stage-desc">クエスト完了！自分だけのカードができたよ</p>
    </div>
    <div class="final-card" id="finalCard">
      <div class="final-card-header">
        <div style="font-size:60px">${type.emoji}</div>
        <div class="final-card-name">${escapeHtml(state.playerName)}</div>
        <div class="final-card-type">${type.name} タイプ</div>
        <div class="small mt-2">${escapeHtml(type.catchphrase)}</div>
      </div>
      ${sections}
    </div>
    <div class="share-row">
      <button class="btn btn-secondary" id="copyBtn">📋 テキストコピー</button>
      <button class="btn" id="restartBtn">もう一度</button>
    </div>
  `;
  app.appendChild(div);

  document.getElementById("copyBtn").onclick = copyResult;
  document.getElementById("restartBtn").onclick = resetState;
}

function copyResult() {
  const type = PERSONALITY_TYPES.find(t => t.id === state.result);
  const sectionsText = REFLECTION_FIELDS.map(f =>
    `【${f.label}】\n${state.reflection[f.id] || "（未記入）"}`
  ).join("\n\n");
  const text = `${type.emoji} ${state.playerName} の性格カード
タイプ: ${type.name} - ${type.catchphrase}

${sectionsText}

#性格探偵クエスト`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      alert("クリップボードにコピーしたよ");
    }).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); alert("コピーしたよ"); }
  catch (e) { alert("コピーに失敗しました"); }
  document.body.removeChild(ta);
}

// ========== ユーティリティ ==========
function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ========== 起動 ==========
document.addEventListener("DOMContentLoaded", render);
