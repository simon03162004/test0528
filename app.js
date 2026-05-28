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
  'E','S','W','N','Z','F','B' // East, South, West, North, Red, Green, White
];

function canWin(tiles) {
  if (tiles.length !== 17) return false;
  const counts = {};
  tiles.forEach(t => counts[t] = (counts[t] || 0) + 1);

  const tileTypes = Object.keys(counts);
  for (let i = 0; i < tileTypes.length; i++) {
    const pair = tileTypes[i];
    if (counts[pair] >= 2) {
      const remaining = { ...counts };
      remaining[pair] -= 2;
      if (canMeld(remaining, 5)) return true;
    }
  }
  return false;
}

function canMeld(counts, needed) {
  if (needed === 0) return true;
  
  const tile = ALL_TILES.find(t => counts[t] > 0);
  if (!tile) return needed === 0;

  // Try Triplet (Pong)
  if (counts[tile] >= 3) {
    counts[tile] -= 3;
    if (canMeld(counts, needed - 1)) return true;
    counts[tile] += 3;
  }

  // Try Sequence (Chow) - only for m, p, s
  const num = parseInt(tile[0]);
  const suite = tile[1];
  if (suite && ['m', 'p', 's'].includes(suite) && num <= 7) {
    const t2 = (num + 1) + suite;
    const t3 = (num + 2) + suite;
    if (counts[t2] > 0 && counts[t3] > 0) {
      counts[tile]--; counts[t2]--; counts[t3]--;
      if (canMeld(counts, needed - 1)) return true;
      counts[tile]++; counts[t2]++; counts[t3]++;
    }
  }

  return false;
}

function checkTenpai(hand16) {
  const waits = [];
  ALL_TILES.forEach(tile => {
    if (canWin([...hand16, tile])) {
      waits.push(tile);
    }
  });
  return waits;
}

const tileDisplayMap = {
  '1m': '1萬', '2m': '2萬', '3m': '3萬', '4m': '4萬', '5m': '5萬', '6m': '6萬', '7m': '7萬', '8m': '8萬', '9m': '9萬',
  '1p': '1筒', '2p': '2筒', '3p': '3筒', '4p': '4筒', '5p': '5萬', '6p': '6筒', '7p': '7筒', '8p': '8筒', '9p': '9筒',
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
    "Tile Agent: 正在讀取玩家 16 張手牌...",
    "Rule Agent: 檢查台灣麻將 (16張制) 胡牌規則...",
    "Logic Agent: 遍歷 34 種牌型進行模擬補牌...",
    "Win Agent: 正在計算所有可能的聽牌組合...",
    "Tenpai Agent: 發現聽牌組合，正在驗證面子結構...",
    "Explain Agent: 彙整聽牌結果與結構說明..."
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

profBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    profBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentRole = btn.dataset.role;
    consoleBody.innerHTML = `<div class="log-line system">Switched to ${currentRole} workflow.</div>`;
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
          // Example: 16 tiles waiting for 3m, 6m (double ended wait)
          const testHand = ['1m','2m','4m','5m','7m','8m','9m','9m','1p','2p','3p','1s','2s','3s','E','E'];
          const waits = checkTenpai(testHand);
          dummyResult = {
            game: "Taiwanese Mahjong (台灣麻將)",
            status: waits.length > 0 ? "已聽牌 (Tenpai)" : "未聽牌",
            current_hand: testHand.map(t => tileDisplayMap[t]).join(' '),
            winning_tiles: waits.map(t => tileDisplayMap[t]),
            logic: "經由 Agent 模擬補入 34 種牌型後，發現補入上述牌張可組成 5 面子 + 1 眼睛結構。",
            recommendation: "建議保留當前結構，優先打出無效孤張。"
          };
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