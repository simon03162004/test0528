// DOM Elements
const taskCount = document.getElementById('taskCount');
const taskCountVal = document.getElementById('taskCountVal');
const hourlyRate = document.getElementById('hourlyRate');
const hourlyRateVal = document.getElementById('hourlyRateVal');
const humanHours = document.getElementById('humanHours');
const humanCost = document.getElementById('humanCost');
const agentHours = document.getElementById('agentHours');
const agentCost = document.getElementById('agentCost');
const savedTime = document.getElementById('savedTime');
const savedCost = document.getElementById('savedCost');

// Calculator Logic (Two-way binding)
function updateCalculator() {
  const tasks = parseInt(taskCount.value);
  const rate = parseInt(hourlyRate.value);
  
  taskCountVal.textContent = tasks;
  hourlyRateVal.textContent = rate;

  // Assuming 1 human task = 3 hours, Agent = 0.04 hours
  const hHours = tasks * 3;
  const hCost = hHours * rate;
  
  const aHours = Math.ceil(tasks * 0.04);
  const aCost = aHours * 2; // Agent API cost approx $2/hr compute

  humanHours.textContent = hHours;
  humanCost.textContent = hCost;
  agentHours.textContent = aHours;
  agentCost.textContent = aCost;
  
  savedTime.textContent = hHours - aHours;
  savedCost.textContent = hCost - aCost;
}

taskCount.addEventListener('input', updateCalculator);
hourlyRate.addEventListener('input', updateCalculator);
updateCalculator();

// 3D Tilt Effect
const tiltCards = document.querySelectorAll('.tilt-card');
tiltCards.forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -5; // max 5 deg
    const rotateY = ((x - centerX) / centerX) * 5;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });
  
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
  });
});

// --- Mahjong Logic Engine ---
const ALL_TILES = [
  '1m','2m','3m','4m','5m','6m','7m','8m','9m',
  '1p','2p','3p','4p','5p','6p','7p','8p','9p',
  '1s','2s','3s','4s','5s','6s','7s','8s','9s',
  'E','S','W','N','Z','F','B'
];

function normalizeTile(raw) {
  const t = raw.trim();
  const suited = t.match(/^([1-9])([mMpPsS])$/);
  if (suited) return `${suited[1]}${suited[2].toLowerCase()}`;
  const honor = t.toUpperCase();
  if (["E", "S", "W", "N", "Z", "F", "B"].includes(honor)) return honor;
  return null;
}

function parseTiles(input) {
  return input.trim().split(/\s+/).filter(Boolean).map(normalizeTile).filter(t => t !== null);
}

function checkWin17(tiles) {
  if (tiles.length !== 17) return { isWinning: false };
  const counts = {};
  tiles.forEach(t => counts[t] = (counts[t] || 0) + 1);

  // Special Case: 嚦咕嚦咕 (Li Gu Li Gu) - 8 Pairs + 1 Single
  let pairs = 0;
  Object.values(counts).forEach(c => { pairs += Math.floor(c / 2); });
  if (pairs === 8) {
    return { isWinning: true, type: 'liguligu' };
  }

  const tileTypes = Object.keys(counts);
  for (let i = 0; i < tileTypes.length; i++) {
    const pair = tileTypes[i];
    if (counts[pair] >= 2) {
      const remaining = { ...counts };
      remaining[pair] -= 2;
      const decomposition = { pair, melds: [] };
      if (getDecomposition(remaining, 5, decomposition.melds)) {
        return { isWinning: true, type: 'standard', decomposition };
      }
    }
  }
  return { isWinning: false };
}

function getDecomposition(counts, needed, melds) {
  if (needed === 0) return true;
  const tile = ALL_TILES.find(t => counts[t] > 0);
  if (!tile) return needed === 0;

  // Try Triplet
  if (counts[tile] >= 3) {
    counts[tile] -= 3;
    melds.push({ type: 'triplet', tiles: [tile, tile, tile] });
    if (getDecomposition(counts, needed - 1, melds)) return true;
    melds.pop();
    counts[tile] += 3;
  }

  // Try Sequence
  const num = parseInt(tile[0]);
  const suite = tile[1];
  if (suite && ['m', 'p', 's'].includes(suite) && num <= 7) {
    const t2 = (num + 1) + suite;
    const t3 = (num + 2) + suite;
    if (counts[t2] > 0 && counts[t3] > 0) {
      counts[tile]--; counts[t2]--; counts[t3]--;
      melds.push({ type: 'sequence', tiles: [tile, t2, t3] });
      if (getDecomposition(counts, needed - 1, melds)) return true;
      melds.pop();
      counts[tile]++; counts[t2]++; counts[t3]++;
    }
  }
  return false;
}

function checkTenpai16(hand16) {
  const waits = [];
  ALL_TILES.forEach(tile => {
    if (checkWin17([...hand16, tile]).isWinning) {
      waits.push(tile);
    }
  });
  return waits;
}

function calculateTai(tiles, winResult, context = { baseWinTai: true }) {
  let totalTai = 0;
  const patterns = [];
  const counts = {};
  tiles.forEach(t => counts[t] = (counts[t] || 0) + 1);
  const decomposition = winResult.decomposition;
  const hasHonors = tiles.some(t => t.length === 1);

  if (winResult.type === 'liguligu') {
    patterns.push({ name: "嚦咕嚦咕", tai: 4, reason: "由 8 對牌組成之特殊牌型。" });
    return { totalTai: 4, patterns };
  }

  // 基本胡 (1 Tai)
  if (context.baseWinTai) {
    totalTai += 1;
    patterns.push({ name: "基本胡", tai: 1, reason: "符合 5 面子 + 1 眼睛結構。" });
  }

  // 1. 碰碰胡 (4 Tai)
  const isAllPungs = decomposition.melds.every(m => m.type === 'triplet');
  if (isAllPungs) {
    totalTai += 4;
    patterns.push({ name: "碰碰胡", tai: 4, reason: "所有面子皆為刻子。" });
  }

  // 2. 平胡 (2 Tai) - 5組順子且無字牌
  const isAllSequences = decomposition.melds.every(m => m.type === 'sequence');
  if (isAllSequences && !hasHonors) {
    totalTai += 2;
    patterns.push({ name: "平胡", tai: 2, reason: "由 5 組順子組成，無字無花。" });
  }

  // 3. 清一色 (8 Tai) / 混一色 (4 Tai)
  const suites = new Set(tiles.filter(t => t.length === 2).map(t => t[1]));
  if (suites.size === 1) {
    if (!hasHonors) {
      totalTai += 8;
      patterns.push({ name: "清一色", tai: 8, reason: "整副牌僅由一種花色組成。" });
    } else {
      totalTai += 4;
      patterns.push({ name: "混一色", tai: 4, reason: "由一種花色與字牌組成。" });
    }
  }

  // 4. 三元系列: 大三元 (8 Tai), 小三元 (4 Tai), 雙喜字 (2 Tai)
  const dragonCounts = [counts['Z'] || 0, counts['F'] || 0, counts['B'] || 0];
  const dragonTriplets = dragonCounts.filter(c => c >= 3).length;
  const dragonPairs = dragonCounts.filter(c => c === 2).length;

  if (dragonTriplets === 3) {
    totalTai += 8;
    patterns.push({ name: "大三元", tai: 8, reason: "中、發、白皆為刻子。" });
  } else if (dragonTriplets === 2 && dragonPairs === 1) {
    totalTai += 4;
    patterns.push({ name: "小三元", tai: 4, reason: "中發白兩組刻子一組眼睛。" });
  } else if (dragonTriplets === 2) {
    totalTai += 2;
    patterns.push({ name: "雙喜字", tai: 2, reason: "擁有中、發、白其中兩組刻子。" });
  }

  // 5. 四喜系列: 大四喜 (16 Tai), 小四喜 (8 Tai)
  const windCounts = [counts['E'] || 0, counts['S'] || 0, counts['W'] || 0, counts['N'] || 0];
  const windTriplets = windCounts.filter(c => c >= 3).length;
  const windPairs = windCounts.filter(c => c === 2).length;

  if (windTriplets === 4) {
    totalTai += 16;
    patterns.push({ name: "大四喜", tai: 16, reason: "東、南、西、北皆為刻子。" });
  } else if (windTriplets === 3 && windPairs === 1) {
    totalTai += 8;
    patterns.push({ name: "小四喜", tai: 8, reason: "東、南、西、北三組刻子一組眼睛。" });
  }

  return { totalTai, patterns };
}

function recommendBestDiscard(tiles17) {
  let bestDiscard = null;
  let maxWaits = -1;
  let bestWaits = [];

  const uniqueTiles = [...new Set(tiles17)];
  uniqueTiles.forEach(tile => {
    const tempHand = [...tiles17];
    const index = tempHand.indexOf(tile);
    tempHand.splice(index, 1);
    const waits = checkTenpai16(tempHand);
    if (waits.length > maxWaits) {
      maxWaits = waits.length;
      bestDiscard = tile;
      bestWaits = waits;
    }
  });
  return { discard: bestDiscard, waits: bestWaits };
}

function analyzeMahjong(input) {
  const tiles = parseTiles(input);
  if (tiles.length === 17) {
    const winResult = checkWin17(tiles);
    if (winResult.isWinning) {
      const taiResult = calculateTai(tiles, winResult);
      return {
        mode: "胡牌與台數分析 (17張)",
        status: "胡牌",
        is_winning_hand: true,
        current_tai: taiResult.totalTai,
        matched_patterns: taiResult.patterns,
        logic: "此手牌已形成合法胡牌結構 (含特殊牌型判定)。"
      };
    }
    const discardResult = recommendBestDiscard(tiles);
    return {
      mode: "拆牌與聽牌分析 (17張)",
      status: "未胡牌",
      is_winning_hand: false,
      recommendation: discardResult,
      logic: "目前 17 張不能胡，分析打哪張後聽牌張數最多。"
    };
  } else if (tiles.length === 16) {
    const waits = checkTenpai16(tiles);
    return {
      mode: "聽牌分析 (16張)",
      status: waits.length > 0 ? "聽牌" : "未聽牌",
      waiting_tiles: waits,
      logic: "檢查補入哪一張牌後可達成 5 面子 + 1 眼睛結構。"
    };
  }
  return { error: "張數不正確", message: `請輸入 16 或 17 張手牌 (目前: ${tiles.length} 張)。` };
}

const tileDisplayMap = {
  '1m': '1萬', '2m': '2萬', '3m': '3萬', '4m': '4萬', '5m': '5萬', '6m': '6萬', '7m': '7萬', '8m': '8萬', '9m': '9萬',
  '1p': '1筒', '2p': '2筒', '3p': '3筒', '4p': '4筒', '5p': '5筒', '6p': '6筒', '7p': '7筒', '8p': '8筒', '9p': '9筒',
  '1s': '1索', '2s': '2索', '3s': '3索', '4s': '4索', '5s': '5索', '6s': '6索', '7s': '7索', '8s': '8索', '9s': '9索',
  'E': '東', 'S': '南', 'W': '西', 'N': '北', 'Z': '中', 'F': '發', 'B': '白'
};

// --- Simulator State Machine ---
const workflows = {
  accountant: ['Parse Receipt', 'Categorize', 'Audit Tax', 'Generate Report'],
  lawyer: ['Read Case', 'Find Precedents', 'Draft Contract', 'Review Clauses'],
  researcher: ['Define Topic', 'Scrape Arxiv', 'Filter Papers', 'Summarize', 'Extract Data', 'Synthesize', 'Format Ref', 'Write Abstract'],
  engineer: ['Discuss Spec', 'Write Code (Engineer)', 'Test (Heavy User)', 'Code Review (Inspector)'],
  umpire_analysis: [
    "Load CPBL Pitch-by-Pitch Data (2023-2024)",
    "Define Ball-Strike Misjudgment Rules (K-Zone Mapping)",
    "Calculate Misjudgment Rate by Count, Pitch Type, and Umpire",
    "Run Chi-Square Tests for Statistical Significance",
    "Build Logistic Regression / Random Forest Prediction Models",
    "Inspect Sample Size, Variable Leakage, and Interpretation Risk",
    "Generate Final Baseball Analytics Report & Visualization"
  ],
  tw_mahjong: [
    "Tile Agent: 正在掃描手牌張數與組成...",
    "Rule Agent: 檢索台灣麻將核心規則憲法...",
    "Logic Agent: 啟動分支運算 (聽牌搜尋 vs 捨牌台數分析)...",
    "Strategy Agent: 正在計算最佳捨牌勝率與台數潛力...",
    "Explain Agent: 彙整最終策略報告與台數清單..."
  ]
};

let currentRole = 'accountant';
const profBtns = document.querySelectorAll('.prof-btn');
const startSimBtn = document.getElementById('startSimBtn');
const consoleBody = document.getElementById('consoleBody');
const resultModal = document.getElementById('resultModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const resultJson = document.getElementById('resultJson');
const nodes = document.querySelectorAll('.node');
const mahjongInputArea = document.getElementById('mahjongInputArea');
const mahjongHandInput = document.getElementById('mahjongHandInput');

profBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    profBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentRole = btn.dataset.role;
    consoleBody.innerHTML = `<div class="log-line system">Switched to ${currentRole} workflow.</div>`;
    
    // Show/Hide Mahjong Input Area
    if (currentRole === 'tw_mahjong') {
      mahjongInputArea.classList.remove('hidden');
    } else {
      mahjongInputArea.classList.add('hidden');
    }
  });
});

let simInterval = null;

function appendLog(text, type = 'system') {
  const line = document.createElement('div');
  line.className = `log-line ${type}`;
  line.textContent = `> ${text}`;
  consoleBody.appendChild(line);
  consoleBody.scrollTop = consoleBody.scrollHeight;
}

function updateNodes(step, totalSteps) {
  nodes.forEach(n => n.classList.remove('active'));
  if (step === 0) nodes[0].classList.add('active');
  else if (step === totalSteps - 1) nodes[2].classList.add('active');
  else nodes[1].classList.add('active');
}

startSimBtn.addEventListener('click', () => {
  if (simInterval) clearInterval(simInterval);
  consoleBody.innerHTML = '';
  startSimBtn.disabled = true;
  startSimBtn.textContent = '模擬運行中...';
  
  const steps = workflows[currentRole];
  let currentStep = 0;
  
  appendLog(`Initializing Multi-Agent Orchestra for: ${currentRole}`, 'system');

  simInterval = setInterval(() => {
    if (currentStep < steps.length) {
      updateNodes(currentStep, steps.length);
      const action = steps[currentStep];
      appendLog(`Agent: ${action}`, 'thought');
      currentStep++;
    } else {
      clearInterval(simInterval);
      simInterval = null;
      nodes.forEach(n => n.classList.remove('active'));
      appendLog('✅ Workflow completed successfully.', 'system');
      startSimBtn.disabled = false;
      startSimBtn.textContent = '重新開始模擬';
      
      // Show Result Modal after 1.5s
      setTimeout(() => {
        let dummyResult;
        if (currentRole === 'umpire_analysis') {
          dummyResult = {
            research_topic: "探討中華職棒 (CPBL) 裁判好壞球判決錯誤之影響因素",
            data_source: "2023–2024 中華職棒逐球資料 (Pitch-by-Pitch)",
            key_variables: ["Balls", "Strikes", "Outs", "TaggedPitchType", "Umpire", "APP_KZoneY/Z", "Zone"],
            statistical_methods: ["誤判率百分比分析", "卡方檢定 (Chi-Square)", "羅吉斯迴歸 (Logistic Regression)", "隨機森林 (Random Forest)"],
            conclusions: "裁判誤判因素分析摘要、重要變項排序、統計檢定結果、視覺化圖表建議"
          };
        } else if (currentRole === 'tw_mahjong') {
          dummyResult = analyzeMahjong(mahjongHandInput.value);
        } else {
          dummyResult = {
            role: currentRole,
            status: 'success',
            steps_executed: steps.length,
            output: `Generated artifact for ${currentRole}`,
            timestamp: new Date().toISOString()
          };
        }
        resultJson.textContent = JSON.stringify(dummyResult, null, 2);
        resultModal.classList.remove('hidden');
      }, 1500);
    }
  }, 1000);
});

closeModalBtn.addEventListener('click', () => {
  resultModal.classList.add('hidden');
});

// Copy Prompt Logic
const copyBtn = document.getElementById('copyPromptBtn');
copyBtn.addEventListener('click', () => {
  const code = document.getElementById('promptCode').innerText;
  navigator.clipboard.writeText(code).then(() => {
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '✅ 已複製';
    setTimeout(() => {
      copyBtn.innerHTML = originalText;
    }, 2000);
  });
});