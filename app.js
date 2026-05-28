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

// Simulator State Machine
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
      appendLog(`Agent analyzing: ${action}...`, 'thought');
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
  }, 1200);
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