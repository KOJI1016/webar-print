// ============================================================
// まちづくりゲーム - App Logic
// ============================================================

(function () {
  'use strict';

  // --- State ---
  const state = {
    nickname: '',
    group: null,
    currentRound: 0,
    selfChoices: [],      // [{facilityId, roleId, type}]
    peerFeedback: [],     // [{facilityId, roleId, type}]  (all rounds combined)
    currentPeerCount: 0,  // peer count for current round
    totalPeerCount: 0     // total across all rounds
  };

  // --- DOM refs ---
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // --- Screen management ---
  function showScreen(id) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    const target = $('#' + id);
    target.classList.add('active');
    target.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  // --- Welcome Screen ---
  function initWelcome() {
    const nicknameInput = $('#nickname');
    const startBtn = $('#btn-start');
    const groupBtns = $$('.group-btn');

    function checkReady() {
      startBtn.disabled = !(state.nickname.trim() && state.group);
    }

    nicknameInput.addEventListener('input', (e) => {
      state.nickname = e.target.value;
      checkReady();
    });

    groupBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        groupBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.group = parseInt(btn.dataset.group);
        checkReady();
      });
    });

    startBtn.addEventListener('click', () => {
      if (state.nickname.trim() && state.group) {
        showScreen('screen-howto');
      }
    });
  }

  // --- How to Play ---
  function initHowTo() {
    $('#btn-howto-start').addEventListener('click', () => {
      startRound(0);
    });
  }

  // --- Round Screen ---
  function startRound(roundIndex) {
    state.currentRound = roundIndex;
    const facility = FACILITIES[roundIndex];

    // Update progress
    const progress = ((roundIndex) / FACILITIES.length) * 100;
    $('#progress-fill').style.width = progress + '%';
    $('#round-indicator').textContent = `Round ${roundIndex + 1} / ${FACILITIES.length}`;

    // Facility info
    $('#facility-emoji').textContent = facility.emoji;
    $('#facility-name').textContent = facility.name;
    $('#facility-announcement').textContent = facility.announcement;

    // Render roles
    const roleList = $('#role-list');
    roleList.innerHTML = '';
    facility.roles.forEach(role => {
      const card = createRoleCard(role, () => onSelfSelect(role));
      roleList.appendChild(card);
    });

    showScreen('screen-round');
  }

  function createRoleCard(role, onClick) {
    const card = document.createElement('div');
    card.className = 'role-card';
    card.innerHTML = `
      <div class="role-emoji">${role.emoji}</div>
      <div class="role-info">
        <div class="role-label">${role.label}</div>
        <div class="role-desc">${role.desc}</div>
      </div>
      <div class="role-check">✓</div>
    `;
    card.addEventListener('click', () => {
      // Visual feedback
      card.closest('.role-list').querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      // Delay to show selection before transition
      setTimeout(() => onClick(), 350);
    });
    return card;
  }

  function onSelfSelect(role) {
    state.selfChoices.push({
      facilityId: FACILITIES[state.currentRound].id,
      roleId: role.id,
      roleLabel: role.label,
      roleEmoji: role.emoji,
      type: role.type
    });
    showPeerScreen();
  }

  // --- Peer Feedback Screen ---
  function showPeerScreen() {
    const facility = FACILITIES[state.currentRound];
    const lastChoice = state.selfChoices[state.selfChoices.length - 1];
    state.currentPeerCount = 0;

    // Show my choice
    $('#peer-my-role').innerHTML = `${lastChoice.roleEmoji} ${lastChoice.roleLabel}`;

    // Render role buttons for peer input
    const peerRoleList = $('#peer-role-list');
    peerRoleList.innerHTML = '';
    facility.roles.forEach(role => {
      const card = createPeerRoleCard(role);
      peerRoleList.appendChild(card);
    });

    // Reset counter
    updatePeerCounter();

    // Hide buttons initially
    $('#btn-peer-another').style.display = 'none';
    $('#btn-peer-next').style.display = 'none';

    showScreen('screen-peer');
  }

  function createPeerRoleCard(role) {
    const card = document.createElement('div');
    card.className = 'role-card';
    card.innerHTML = `
      <div class="role-emoji">${role.emoji}</div>
      <div class="role-info">
        <div class="role-label">${role.label}</div>
        <div class="role-desc">${role.desc}</div>
      </div>
      <div class="role-check">✓</div>
    `;
    card.addEventListener('click', () => {
      // Record peer feedback
      state.peerFeedback.push({
        facilityId: FACILITIES[state.currentRound].id,
        roleId: role.id,
        type: role.type
      });
      state.currentPeerCount++;
      state.totalPeerCount++;

      // Visual feedback
      card.classList.add('selected');
      setTimeout(() => {
        card.classList.remove('selected');
      }, 300);

      updatePeerCounter();
      showPeerButtons();
    });
    return card;
  }

  function updatePeerCounter() {
    const counter = $('#peer-counter');
    const maxDots = 8;
    let html = '';
    for (let i = 0; i < maxDots; i++) {
      html += `<div class="peer-dot ${i < state.currentPeerCount ? 'filled' : ''}"></div>`;
    }
    if (state.currentPeerCount > 0) {
      html += `<div class="peer-counter-text">${state.currentPeerCount}人に聞いた！</div>`;
    }
    counter.innerHTML = html;
  }

  function showPeerButtons() {
    $('#btn-peer-another').style.display = 'block';
    $('#btn-peer-next').style.display = 'block';

    // Update next button text based on round
    const isLast = state.currentRound >= FACILITIES.length - 1;
    $('#btn-peer-next').textContent = isLast ? '結果を見る →' : '次のラウンドへ →';
  }

  function initPeerScreen() {
    $('#btn-peer-another').addEventListener('click', () => {
      // Reset selection state for another person
      $$('#peer-role-list .role-card').forEach(c => c.classList.remove('selected'));
      // Scroll to instruction
      $('.peer-instruction').scrollIntoView({ behavior: 'smooth' });
    });

    $('#btn-peer-next').addEventListener('click', () => {
      const nextRound = state.currentRound + 1;
      if (nextRound < FACILITIES.length) {
        startRound(nextRound);
      } else {
        showResults();
      }
    });
  }

  // --- Results Screen ---
  function showResults() {
    // Calculate RIASEC scores
    const selfScores = calcScores(state.selfChoices);
    const peerScores = calcScores(state.peerFeedback);

    // Self type
    const selfTop = getTopTypes(selfScores);
    renderSelfResults(selfScores, selfTop);

    // Peer results
    renderPeerResults(peerScores);

    // Gap analysis
    renderGap(selfTop, peerScores);

    // Career suggestions (self)
    renderCareers(selfTop, '#career-list');

    showScreen('screen-results');
  }

  function calcScores(choices) {
    const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    choices.forEach(c => {
      scores[c.type] = (scores[c.type] || 0) + 1;
    });
    return scores;
  }

  function getTopTypes(scores) {
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const top1 = sorted[0];
    const top2 = sorted[1];
    // If all zero, return first two
    if (top1[1] === 0) return ['R', 'I'];
    // If second is zero, just return first
    if (top2[1] === 0) return [top1[0]];
    return [top1[0], top2[0]];
  }

  function renderSelfResults(scores, topTypes) {
    drawRadarChart('chart-self', scores);

    const card = $('#self-type-card');
    const primary = topTypes[0];
    const secondary = topTypes[1];
    const t = RIASEC_TYPES[primary];

    let html = `
      <div class="type-badge" style="background: ${t.color}">${t.emoji} ${t.label}</div>
      <p class="type-keyword">${t.keyword}</p>
    `;
    if (secondary) {
      const t2 = RIASEC_TYPES[secondary];
      html += `
        <div style="margin-top:8px; font-size:14px; color:var(--text-light)">
          × <span style="color:${t2.color}; font-weight:700">${t2.emoji} ${t2.label}</span>
        </div>
      `;
    }
    card.innerHTML = html;
  }

  function renderPeerResults(peerScores) {
    const section = $('#peer-results-section');
    const content = $('#peer-results-content');
    const badge = $('#peer-total-badge');

    badge.textContent = `${state.totalPeerCount}人`;

    if (state.totalPeerCount < 3) {
      // Locked
      content.innerHTML = `
        <div class="peer-locked">
          <div class="peer-locked-icon">🔒</div>
          <p class="peer-locked-text">
            <strong>あと${3 - state.totalPeerCount}人</strong>に聞くと<br>
            「周りから見たあなた」が<br>表示されるよ！
          </p>
        </div>
      `;
      $('#peer-career-section').style.display = 'none';
    } else {
      // Unlocked
      const peerTop = getTopTypes(peerScores);
      const pType = RIASEC_TYPES[peerTop[0]];

      let peerTypeHtml = `
        <div class="type-badge" style="background: ${pType.color}">${pType.emoji} ${pType.label}</div>
        <p class="type-keyword">${pType.keyword}</p>
      `;
      if (peerTop[1]) {
        const p2 = RIASEC_TYPES[peerTop[1]];
        peerTypeHtml += `
          <div style="margin-top:8px; font-size:14px; color:var(--text-light)">
            × <span style="color:${p2.color}; font-weight:700">${p2.emoji} ${p2.label}</span>
          </div>
        `;
      }

      content.innerHTML = `
        <div class="results-chart-wrapper">
          <canvas id="chart-peer" width="280" height="280"></canvas>
        </div>
        <div class="results-type-card">${peerTypeHtml}</div>
      `;
      drawRadarChart('chart-peer', peerScores);

      // Peer career suggestions
      renderCareers(peerTop, '#peer-career-list');
      $('#peer-career-section').style.display = 'block';

      // Bonus for 6+
      if (state.totalPeerCount >= 6) {
        renderPeerBonus(peerScores);
      }
    }
  }

  function renderGap(selfTop, peerScores) {
    const gapSection = $('#gap-section');
    const gapMessage = $('#gap-message');

    if (state.totalPeerCount < 3) {
      gapSection.style.display = 'none';
      return;
    }

    const peerTop = getTopTypes(peerScores);
    if (selfTop[0] === peerTop[0]) {
      // Same primary - no gap
      gapSection.style.display = 'block';
      gapMessage.innerHTML = `
        自分の感覚と周りの見え方が<strong>一致</strong>してる！<br>
        自分のことをよくわかっているし、<br>
        それが周りにも伝わっているということ。
      `;
    } else {
      gapSection.style.display = 'block';
      const selfLabel = GAP_MESSAGES[selfTop[0]];
      const peerLabel = GAP_MESSAGES[peerTop[0]];
      gapMessage.innerHTML = `
        自分では<strong>「${selfLabel}」</strong>に惹かれるけど、<br>
        周りからは<strong>「${peerLabel}」</strong>が見えているみたい。<br><br>
        どちらも本当のあなた。<br>
        両方を活かせる道があるかも！
      `;
    }
  }

  function renderCareers(topTypes, targetSelector) {
    const list = $(targetSelector);
    let key;
    if (topTypes.length >= 2) {
      // Try both orderings
      key = topTypes[0] + '-' + topTypes[1];
      if (!CAREER_SUGGESTIONS[key]) {
        key = topTypes[1] + '-' + topTypes[0];
      }
    }

    const careers = key && CAREER_SUGGESTIONS[key]
      ? CAREER_SUGGESTIONS[key]
      : getDefaultCareers(topTypes[0]);

    list.innerHTML = careers.map(c => `<span class="career-tag">${c}</span>`).join('');
  }

  function getDefaultCareers(type) {
    const defaults = {
      R: ['エンジニア', '整備士', '大工', '調理師', 'スポーツトレーナー'],
      I: ['研究者', 'プログラマー', 'データ分析', '薬剤師', '教師'],
      A: ['デザイナー', 'イラストレーター', '映像クリエイター', '音楽家', 'ライター'],
      S: ['看護師', 'カウンセラー', '保育士', '介護福祉士', '教師'],
      E: ['営業', '企画職', '起業家', 'イベントプランナー', '広報'],
      C: ['事務職', '経理', 'システム管理', '品質管理', '司書']
    };
    return defaults[type] || defaults['R'];
  }

  function renderPeerBonus(peerScores) {
    // Already shown peer career section; add a bonus note
    const peerCareerSection = $('#peer-career-section');
    const existingBonus = peerCareerSection.querySelector('.bonus-note');
    if (!existingBonus) {
      const bonus = document.createElement('div');
      bonus.className = 'bonus-note';
      bonus.style.cssText = 'margin-top:12px; padding:14px; background:linear-gradient(135deg,#FFF8E7,#FFF3E0); border-radius:12px; font-size:14px; line-height:1.7; text-align:center;';
      bonus.innerHTML = `
        🏆 <strong>${state.totalPeerCount}人</strong>に聞いた！<br>
        たくさんの人と話せたね。
      `;
      peerCareerSection.appendChild(bonus);
    }
  }

  // --- Radar Chart ---
  function drawRadarChart(canvasId, scores) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 280;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const maxRadius = 100;
    const types = ['R', 'I', 'A', 'S', 'E', 'C'];
    const maxVal = Math.max(...Object.values(scores), 1);

    // Background circles
    ctx.strokeStyle = '#E8E5FF';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      const r = (maxRadius / 4) * i;
      for (let j = 0; j <= types.length; j++) {
        const angle = (Math.PI * 2 / types.length) * j - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Axis lines
    types.forEach((_, i) => {
      const angle = (Math.PI * 2 / types.length) * i - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + maxRadius * Math.cos(angle), cy + maxRadius * Math.sin(angle));
      ctx.strokeStyle = '#E8E5FF';
      ctx.stroke();
    });

    // Data polygon
    ctx.beginPath();
    types.forEach((type, i) => {
      const val = scores[type] || 0;
      const ratio = maxVal > 0 ? val / maxVal : 0;
      const r = Math.max(ratio * maxRadius, 8); // Minimum visible
      const angle = (Math.PI * 2 / types.length) * i - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(108, 92, 231, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#6C5CE7';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Data points and labels
    types.forEach((type, i) => {
      const val = scores[type] || 0;
      const ratio = maxVal > 0 ? val / maxVal : 0;
      const r = Math.max(ratio * maxRadius, 8);
      const angle = (Math.PI * 2 / types.length) * i - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);

      // Point
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = RIASEC_TYPES[type].color;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      const labelR = maxRadius + 24;
      const lx = cx + labelR * Math.cos(angle);
      const ly = cy + labelR * Math.sin(angle);
      ctx.fillStyle = '#636E72';
      ctx.font = '500 12px "Zen Maru Gothic", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(RIASEC_TYPES[type].emoji + type, lx, ly);
    });
  }

  // --- Detail Screen ---
  function initDetailScreen() {
    $('#btn-detail').addEventListener('click', () => {
      const selfScores = calcScores(state.selfChoices);
      const topTypes = getTopTypes(selfScores);
      const container = $('#detail-container');
      container.innerHTML = '';

      topTypes.forEach(type => {
        const t = RIASEC_TYPES[type];
        const block = document.createElement('div');
        block.className = 'detail-type-block';
        block.innerHTML = `
          <div class="detail-type-header">
            <div class="detail-type-emoji">${t.emoji}</div>
            <div>
              <div class="detail-type-name" style="color:${t.color}">${t.label}</div>
              <div class="detail-type-keyword">${t.keyword}</div>
            </div>
          </div>
          <ul class="detail-description-list">
            ${t.description.map(d => `<li>${d}</li>`).join('')}
          </ul>
          <div class="detail-celebrities">
            <strong>こんな有名人も</strong>
            ${t.celebrities}
          </div>
        `;
        container.appendChild(block);
      });

      // Also show peer top types if available
      if (state.totalPeerCount >= 3) {
        const peerScores = calcScores(state.peerFeedback);
        const peerTop = getTopTypes(peerScores);
        const newTypes = peerTop.filter(t => !topTypes.includes(t));
        if (newTypes.length > 0) {
          const divider = document.createElement('div');
          divider.style.cssText = 'text-align:center; font-size:14px; color:var(--text-light); font-weight:700; padding:8px 0;';
          divider.textContent = '👥 周りから見えたタイプ';
          container.appendChild(divider);

          newTypes.forEach(type => {
            const t = RIASEC_TYPES[type];
            const block = document.createElement('div');
            block.className = 'detail-type-block';
            block.innerHTML = `
              <div class="detail-type-header">
                <div class="detail-type-emoji">${t.emoji}</div>
                <div>
                  <div class="detail-type-name" style="color:${t.color}">${t.label}</div>
                  <div class="detail-type-keyword">${t.keyword}</div>
                </div>
              </div>
              <ul class="detail-description-list">
                ${t.description.map(d => `<li>${d}</li>`).join('')}
              </ul>
              <div class="detail-celebrities">
                <strong>こんな有名人も</strong>
                ${t.celebrities}
              </div>
            `;
            container.appendChild(block);
          });
        }
      }

      showScreen('screen-detail');
    });

    $('#btn-back-results').addEventListener('click', () => {
      showScreen('screen-results');
    });
  }

  // --- Restart ---
  function initRestart() {
    $('#btn-restart').addEventListener('click', () => {
      state.selfChoices = [];
      state.peerFeedback = [];
      state.currentPeerCount = 0;
      state.totalPeerCount = 0;
      state.currentRound = 0;
      showScreen('screen-welcome');
    });
  }

  // --- Init ---
  function init() {
    initWelcome();
    initHowTo();
    initPeerScreen();
    initDetailScreen();
    initRestart();
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
