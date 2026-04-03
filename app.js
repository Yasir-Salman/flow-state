// ── State ──
let cycleLength = 28;

// ── Cycle Logic ──
function getCycleData() {
  const userData = JSON.parse(localStorage.getItem('flowstate-user'));
  if (!userData) return null;

  const lastPeriod = new Date(userData.lastPeriodStart);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastPeriod.setHours(0, 0, 0, 0);

  const daysSince = Math.floor((today - lastPeriod) / (1000 * 60 * 60 * 24));
  const cycleDay = (daysSince % userData.cycleLength) + 1;
  const phase = getPhase(cycleDay, userData.cycleLength);

  return {
    name: userData.name,
    cycleDay,
    cycleLength: userData.cycleLength,
    phase,
    prediction: getPrediction(phase),
    message: getDailyMessage(phase),
    streak: getStreak(),
    fertileWindow: getFertileWindow(cycleDay, userData.cycleLength),
    pmsWarning: cycleDay >= userData.cycleLength - 4 && cycleDay <= userData.cycleLength,
  };
}

function getPhase(cycleDay, cycleLength) {
  if (cycleDay <= 5) return 'menstruation';
  if (cycleDay <= 13) return 'follicular';
  if (cycleDay <= 16) return 'ovulation';
  return 'luteal';
}

function getPrediction(phase) {
  const predictions = {
    menstruation: 'tired and low energy — be gentle with yourself today',
    follicular: 'motivated and clear-headed — great day to get things done',
    ovulation: 'social, confident, and energetic — you\'re glowing',
    luteal: 'reflective and a little sensitive — that\'s completely normal',
  };
  return predictions[phase];
}

function getDailyMessage(phase) {
  const messages = {
    menstruation: [
      'Rest is productive too.',
      'Your body is doing something powerful.',
      'Heat, comfort, and kindness today.',
    ],
    follicular: [
      'Fresh energy is building — use it.',
      'Good time to start something new.',
      'Your mind is sharp today.',
    ],
    ovulation: [
      'This is your peak — own it.',
      'Connection comes naturally right now.',
      'You\'re magnetic today.',
    ],
    luteal: [
      'Slow down. You don\'t have to do everything.',
      'Your feelings are valid, all of them.',
      'Cozy mode is completely allowed.',
    ],
  };
  const pool = messages[phase];
  return pool[new Date().getDate() % pool.length];
}

function getFertileWindow(cycleDay, cycleLength) {
  const ovulationDay = cycleLength - 14;
  return cycleDay >= ovulationDay - 5 && cycleDay <= ovulationDay + 1;
}

function isPMSZone(cycleDay, cycleLength) {
  return cycleDay >= cycleLength - 4 && cycleDay <= cycleLength;
}
// ── Streak Logic ──
function getStreak() {
  const logs = JSON.parse(localStorage.getItem('flowstate-logs') || '{}');
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (logs[key]) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ── Phase Color ──
function getPhaseColor(phase) {
  const colors = {
    menstruation: '#f87171',
    follicular: '#a78bfa',
    ovulation: '#e8a0bf',
    luteal: '#818cf8',
  };
  return colors[phase];
}

// ── Render Home Screen ──
function renderHome() {
  const data = getCycleData();
  if (!data) return;

  // Greeting
  const hour = new Date().getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';

  document.getElementById('home-greeting').textContent = `${greeting}, ${data.name} ✦`;

  // Cycle ring
  document.getElementById('cycle-day').textContent = data.cycleDay;
  document.getElementById('cycle-phase').textContent = data.phase;

  // Phase color
  const color = getPhaseColor(data.phase);
  document.querySelector('.cycle-ring').style.borderColor = color;
  document.getElementById('cycle-day').style.color = color;

  // Prediction
  document.getElementById('daily-prediction').textContent = data.prediction;

  // Daily message
  document.getElementById('daily-message').textContent = data.message;

  // Streak
  document.getElementById('streak-count').textContent = data.streak;

  // Badges
  document.getElementById('fertile-badge').style.display = data.fertileWindow ? 'flex' : 'none';
  document.getElementById('pms-badge').style.display = data.pmsWarning ? 'flex' : 'none';
}

// ── Screen Navigation ──
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(screenId).classList.remove('hidden');

  if (screenId === 'home-screen') renderHome();
  if (screenId === 'insights-screen') {
    setTimeout(() => renderInsights(), 50);
  }
}

// ── Setup: Cycle Length Stepper ──
document.getElementById('cycle-minus').addEventListener('click', () => {
  if (cycleLength > 21) {
    cycleLength--;
    document.getElementById('cycle-length-display').textContent = cycleLength;
  }
});

document.getElementById('cycle-plus').addEventListener('click', () => {
  if (cycleLength < 40) {
    cycleLength++;
    document.getElementById('cycle-length-display').textContent = cycleLength;
  }
});

// ── Setup: Submit ──
document.getElementById('setup-submit').addEventListener('click', () => {
  const name = document.getElementById('setup-name').value.trim();
  const date = document.getElementById('setup-date').value;

  if (!name || !date) {
    alert('Please fill in both fields to continue.');
    return;
  }

  const userData = {
    name,
    lastPeriodStart: date,
    cycleLength,
    setupDate: new Date().toISOString(),
  };

  localStorage.setItem('flowstate-user', JSON.stringify(userData));
  showScreen('home-screen');
});

// ── On Load ──
window.addEventListener('load', () => {
  const userData = localStorage.getItem('flowstate-user');
  if (userData) {
    showScreen('home-screen');
    setupNotifications();
  } else {
    showScreen('setup-screen');
  }
});

// ── Log Screen ── 

// Single-select chips (flow, mood, sleep)
// Multi-select chips (symptoms)
// Each chip group works independently

document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const group = chip.dataset.group;
    const isMulti = chip.classList.contains('multi');

    if (isMulti) {
      // Toggle this chip on/off independently
      chip.classList.toggle('selected');
    } else {
      // Deselect all chips in this group first, then select this one
      document.querySelectorAll(`.chip[data-group="${group}"]`)
        .forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
    }
  });
});

// ── Save Log ──
document.getElementById('save-log-btn').addEventListener('click', () => {
  const today = new Date().toISOString().split('T')[0];

  // Collect single-select values
  const flow = document.querySelector('.chip.selected[data-group="flow"]')?.dataset.value || null;
  const mood = document.querySelector('.chip.selected[data-group="mood"]')?.dataset.value || null;
  const sleep = document.querySelector('.chip.selected[data-group="sleep"]')?.dataset.value || null;

  // Collect multi-select symptoms
  const symptoms = [...document.querySelectorAll('.chip.selected[data-group="symptoms"]')]
    .map(c => c.dataset.value);

  const entry = { flow, mood, sleep, symptoms, loggedAt: new Date().toISOString() };

  // Load existing logs, add today's entry, save back
  const logs = JSON.parse(localStorage.getItem('flowstate-logs') || '{}');
  logs[today] = entry;
  localStorage.setItem('flowstate-logs', JSON.stringify(logs));

  // Show confirmation
  const msg = document.getElementById('log-saved-msg');
  msg.classList.remove('hidden');
  setTimeout(() => msg.classList.add('hidden'), 3000);
});

// ── Load today's log if it exists ──
function loadTodayLog() {
  const today = new Date().toISOString().split('T')[0];
  const logs = JSON.parse(localStorage.getItem('flowstate-logs') || '{}');
  const entry = logs[today];
  if (!entry) return;

  // Re-select chips based on saved data
  if (entry.flow) {
    document.querySelector(`.chip[data-group="flow"][data-value="${entry.flow}"]`)
      ?.classList.add('selected');
  }
  if (entry.mood) {
    document.querySelector(`.chip[data-group="mood"][data-value="${entry.mood}"]`)
      ?.classList.add('selected');
  }
  if (entry.sleep) {
    document.querySelector(`.chip[data-group="sleep"][data-value="${entry.sleep}"]`)
      ?.classList.add('selected');
  }
  entry.symptoms?.forEach(s => {
    document.querySelector(`.chip[data-group="symptoms"][data-value="${s}"]`)
      ?.classList.add('selected');
  });
}

loadTodayLog();


// ── Insights Screen ──

const phaseDescriptions = {
  menstruation: 'Your body is shedding the uterine lining. Energy is low, and that is completely normal. This is a time for rest, warmth, and being gentle with yourself.',
  follicular: 'Estrogen is rising and your energy is coming back. Your mind is sharper and motivation builds naturally during this phase.',
  ovulation: 'You are at your peak. Estrogen and testosterone are high — you feel more social, confident, and energetic than any other time in your cycle.',
  luteal: 'Progesterone is high and your body is preparing for either pregnancy or your next period. Energy dips, emotions run deeper, and rest becomes important again.',
};

const phaseTips = {
  menstruation: [
    '🛏️ Rest when you need to — your body is working hard',
    '🌡️ A heating pad on your stomach helps with cramps',
    '🍵 Ginger or chamomile tea can ease nausea and pain',
    '🚶 Light walking is better than intense exercise right now',
    '🍫 Dark chocolate actually helps with cramps (magnesium)',
  ],
  follicular: [
    '📚 Great time to study or take on challenging tasks',
    '🥗 Focus on iron-rich foods to replenish after your period',
    '🏃 Your body can handle more intense exercise now',
    '💡 Start new projects — your brain is at its most creative',
  ],
  ovulation: [
    '⚡ Use this energy peak for your hardest tasks',
    '🤝 Social plans feel easier and more fun right now',
    '💪 Strength training gives the best results this week',
    '🌸 You may feel more confident — lean into it',
  ],
  luteal: [
    '😴 Prioritize sleep — your body needs more rest now',
    '🧘 Light yoga or stretching over intense workouts',
    '🍌 Eat magnesium-rich foods to ease PMS (bananas, nuts)',
    '📖 Journaling helps process the deeper emotions of this phase',
    '☕ Cut back on caffeine — it worsens anxiety and bloating',
  ],
};

function renderInsights() {
  const data = getCycleData();
  if (!data) return;

  const userData = JSON.parse(localStorage.getItem('flowstate-user'));

  // Phase name and description
  document.getElementById('insight-phase-name').textContent = data.phase;
  document.getElementById('insight-phase-desc').textContent = phaseDescriptions[data.phase];

  // Phase color
  const color = getPhaseColor(data.phase);
  document.getElementById('insight-phase-name').style.color = color;

  // Cycle progress bar
  const progress = (data.cycleDay / data.cycleLength) * 100;
  document.getElementById('cycle-progress-fill').style.width = `${progress}%`;
  document.getElementById('cycle-progress-day').textContent = `Day ${data.cycleDay}`;
  document.getElementById('cycle-progress-end').textContent = `Day ${data.cycleLength}`;

  // Next period calculation
  const daysUntilNext = data.cycleLength - data.cycleDay + 1;
  const nextPeriodDate = new Date();
  nextPeriodDate.setDate(nextPeriodDate.getDate() + daysUntilNext);
  const formattedDate = nextPeriodDate.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric'
  });

  if (daysUntilNext <= 1) {
    document.getElementById('next-period-days').textContent = 'Today or tomorrow';
  } else {
    document.getElementById('next-period-days').textContent = `In ${daysUntilNext} days`;
  }
  document.getElementById('next-period-date').textContent = `Expected around ${formattedDate}`;

  // Fertile window
  const ovulationDay = data.cycleLength - 14;
  const fertileStart = ovulationDay - 5;
  const fertileEnd = ovulationDay + 1;

  if (data.fertileWindow) {
    document.getElementById('fertile-status').textContent = 'You are in it now';
    document.getElementById('fertile-status').style.color = '#86efac';
  } else if (data.cycleDay < fertileStart) {
    const daysUntilFertile = fertileStart - data.cycleDay;
    document.getElementById('fertile-status').textContent = `In ${daysUntilFertile} days`;
    document.getElementById('fertile-status').style.color = '#a78bfa';
  } else {
    document.getElementById('fertile-status').textContent = 'Passed for this cycle';
    document.getElementById('fertile-status').style.color = '#555';
  }

  const fertileStartDate = new Date();
  fertileStartDate.setDate(fertileStartDate.getDate() + (fertileStart - data.cycleDay));
  const fertileEndDate = new Date();
  fertileEndDate.setDate(fertileEndDate.getDate() + (fertileEnd - data.cycleDay));
  document.getElementById('fertile-dates').textContent =
    `Around ${fertileStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${fertileEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  // PMS warning
  const pmsCard = document.getElementById('pms-card');
  const actuallyPMS = data.cycleDay >= data.cycleLength - 4 && data.cycleDay <= data.cycleLength;
  
  if (actuallyPMS) {
    pmsCard.classList.remove('hidden');
  } else {
    pmsCard.classList.add('hidden');
  }

  // Tips
  const tipsList = document.getElementById('tips-list');
  tipsList.innerHTML = '';
  phaseTips[data.phase].forEach(tip => {
    const li = document.createElement('li');
    li.textContent = tip;
    tipsList.appendChild(li);
  });
}

// ── Settings Screen ──

let settingsCycleLength = 28;

function loadSettings() {
  const userData = JSON.parse(localStorage.getItem('flowstate-user'));
  if (!userData) return;

  document.getElementById('settings-name').value = userData.name;
  document.getElementById('settings-date').value = userData.lastPeriodStart;
  settingsCycleLength = userData.cycleLength;
  document.getElementById('settings-cycle-display').textContent = settingsCycleLength;
}

// Settings cycle stepper
document.getElementById('settings-cycle-minus').addEventListener('click', () => {
  if (settingsCycleLength > 21) {
    settingsCycleLength--;
    document.getElementById('settings-cycle-display').textContent = settingsCycleLength;
  }
});

document.getElementById('settings-cycle-plus').addEventListener('click', () => {
  if (settingsCycleLength < 40) {
    settingsCycleLength++;
    document.getElementById('settings-cycle-display').textContent = settingsCycleLength;
  }
});

// Save settings
document.getElementById('settings-save-btn').addEventListener('click', () => {
  const name = document.getElementById('settings-name').value.trim();
  const date = document.getElementById('settings-date').value;

  if (!name || !date) {
    alert('Please fill in all fields.');
    return;
  }

  const userData = JSON.parse(localStorage.getItem('flowstate-user'));
  userData.name = name;
  userData.lastPeriodStart = date;
  userData.cycleLength = settingsCycleLength;
  localStorage.setItem('flowstate-user', JSON.stringify(userData));

  const msg = document.getElementById('settings-saved-msg');
  msg.classList.remove('hidden');
  setTimeout(() => msg.classList.add('hidden'), 3000);
});

// Reset everything
document.getElementById('reset-btn').addEventListener('click', () => {
  const confirm = window.confirm('Are you sure? This will delete everything and cannot be undone.');
  if (confirm) {
    localStorage.clear();
    location.reload();
  }
});

// Update showScreen to load settings when navigating there
const originalShowScreen = showScreen;
showScreen = function(screenId) {
  originalShowScreen(screenId);
  if (screenId === 'settings-screen') loadSettings();
};

// ── Notifications ──

const morningQuotes = {
  menstruation: [
    'Rest is productive too. Your body is doing something powerful today.',
    'Be gentle with yourself. You deserve warmth and kindness right now.',
    'Slow mornings are allowed. Take your time today.',
  ],
  follicular: [
    'Fresh energy is building. Today is a good day to start something.',
    'Your mind is sharp and ready. Make the most of it.',
    'New beginnings feel natural right now. Trust that.',
  ],
  ovulation: [
    'This is your peak. Walk into today like you own it.',
    'You are magnetic right now. Let people feel that.',
    'Your energy is at its highest. Use it on things that matter.',
  ],
  luteal: [
    'Slow down. You do not have to do everything today.',
    'Your feelings are valid, all of them. Be kind to yourself.',
    'Cozy mode is completely allowed today.',
  ],
};

function getNotifSettings() {
  return JSON.parse(localStorage.getItem('flowstate-notif') || '{"logTime":"22:00"}');
}

function saveNotifSettings(settings) {
  localStorage.setItem('flowstate-notif', JSON.stringify(settings));
}

function getMsUntil(hours, minutes) {
  // Returns milliseconds until the next occurrence of a given time
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target - now;
}

function getRandomMsToday() {
  // Returns ms until a random time between 10am and 6pm today
  const now = new Date();
  const start = new Date();
  start.setHours(10, 0, 0, 0);
  const end = new Date();
  end.setHours(18, 0, 0, 0);

  // If we're already past 6pm, schedule for tomorrow between 10am-6pm
  if (now >= end) {
    start.setDate(start.getDate() + 1);
    end.setDate(end.getDate() + 1);
  }

  const randomMs = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return randomMs - now.getTime();
}

async function setupNotifications() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
  if (Notification.permission !== 'granted') return;
  scheduleNotifications();
}

function scheduleNotifications() {
  const data = getCycleData();
  if (!data) return;

  // Clear all previous timers
  if (window._notificationTimers) {
    window._notificationTimers.forEach(t => clearTimeout(t));
  }
  window._notificationTimers = [];

  if (Notification.permission !== 'granted') return;

  const settings = getNotifSettings();

  // ── 1. Morning quote at 7:00 AM ──
  const quotePool = morningQuotes[data.phase];
  const quote = quotePool[new Date().getDate() % quotePool.length];

  const quoteTimer = setTimeout(() => {
    new Notification('Good morning 🌸', {
      body: quote,
      icon: '/icon-192.png',
    });
  }, getMsUntil(7, 0));
  window._notificationTimers.push(quoteTimer);

  // ── 2. Log reminder at user's chosen time ──
  const [logHour, logMin] = settings.logTime.split(':').map(Number);
  const logTimer = setTimeout(() => {
    new Notification('Flow State 📝', {
      body: 'Hey, don\'t forget to log your day!',
      icon: '/icon-192.png',
    });
  }, getMsUntil(logHour, logMin));
  window._notificationTimers.push(logTimer);

  // ── 3. PMS reminder at 7:00 PM ──
  // Runs from 3 days before expected period until 3 days after
  const daysUntilPeriod = data.cycleLength - data.cycleDay;

  // Check if she already logged her period starting (flow logged as anything except none)
  const today = new Date().toISOString().split('T')[0];
  const logs = JSON.parse(localStorage.getItem('flowstate-logs') || '{}');
  const todayLog = logs[today];
  const alreadyLoggedPeriod = todayLog?.flow && todayLog.flow !== 'none';

  // PMS range: 3 days before OR fallback 3 days after — but NOT if she already logged her period
  const inPMSRange = !alreadyLoggedPeriod && (daysUntilPeriod <= 3 || data.cycleDay <= 3);

  if (inPMSRange) {
    const pmsTimer = setTimeout(() => {
      new Notification('Flow State 🌙', {
        body: 'Your period is near. Take it easy this evening — rest, warmth, and kindness.',
        icon: '/icon-192.png',
      });
    }, getMsUntil(19, 0));
    window._notificationTimers.push(pmsTimer);
  }

  // ── 4. Fertile window — random time, all 5 days ──
  if (data.fertileWindow) {
    const fertileTimer = setTimeout(() => {
      new Notification('Flow State 🌺', {
        body: 'You are in your fertile window today.',
        icon: '/icon-192.png',
      });
    }, getRandomMsToday());
    window._notificationTimers.push(fertileTimer);
  }
}

// ── Notification Toggle in Settings ──
function updateNotifToggle() {
  const btn = document.getElementById('notif-toggle');
  const status = document.getElementById('notif-status');
  if (!btn) return;

  if (!('Notification' in window)) {
    btn.textContent = 'Not supported';
    btn.disabled = true;
    return;
  }

  if (Notification.permission === 'granted') {
    btn.textContent = 'Enabled ✓';
    btn.classList.add('enabled');
    status.textContent = 'Notifications are active.';
  } else if (Notification.permission === 'denied') {
    btn.textContent = 'Blocked';
    btn.classList.add('enabled');
    status.textContent = 'Notifications are blocked. Enable them in your browser settings.';
  } else {
    btn.textContent = 'Enable';
    btn.classList.remove('enabled');
    status.textContent = 'Tap to allow reminders.';
  }
}

// Load saved log time into the time input
function loadNotifSettings() {
  const settings = getNotifSettings();
  const timeInput = document.getElementById('notif-log-time');
  if (timeInput) timeInput.value = settings.logTime;
}

document.getElementById('notif-toggle').addEventListener('click', async () => {
  if (Notification.permission === 'granted') return;
  await Notification.requestPermission();
  updateNotifToggle();
  if (Notification.permission === 'granted') scheduleNotifications();
});

document.getElementById('notif-save-btn').addEventListener('click', () => {
  const logTime = document.getElementById('notif-log-time').value;
  if (!logTime) return;

  saveNotifSettings({ logTime });
  scheduleNotifications();

  const msg = document.getElementById('notif-saved-msg');
  msg.classList.remove('hidden');
  setTimeout(() => msg.classList.add('hidden'), 3000);
});

// Update showScreen to refresh notif UI when navigating to settings
const _showScreen2 = showScreen;
showScreen = function(screenId) {
  _showScreen2(screenId);
  if (screenId === 'settings-screen') {
    updateNotifToggle();
    loadNotifSettings();
  }
};

// ── Service Worker Registration ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('Service worker registered'))
      .catch(err => console.log('Service worker failed:', err));
  });
}