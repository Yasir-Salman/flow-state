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

// ── Period Reset ──
document.getElementById('period-reset-btn').addEventListener('click', () => {
  const confirmed = window.confirm('Mark today as the start of your period?');
  if (!confirmed) return;

  const userData = JSON.parse(localStorage.getItem('flowstate-user'));
  const today = new Date().toISOString().split('T')[0];
  userData.lastPeriodStart = today;
  localStorage.setItem('flowstate-user', JSON.stringify(userData));

  // Also log today's flow as medium if nothing logged yet
  const logs = JSON.parse(localStorage.getItem('flowstate-logs') || '{}');
  if (!logs[today]) {
    logs[today] = { flow: 'medium', mood: null, sleep: null, symptoms: [], loggedAt: new Date().toISOString() };
    localStorage.setItem('flowstate-logs', JSON.stringify(logs));
  }

  renderHome();
  scheduleNotifications();
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

// ── Live TS card update ──
function tryRenderTS() {
  const bedtime = document.getElementById('sleep-bedtime').value;
  const waketime = document.getElementById('sleep-waketime').value;
  const sleep = document.querySelector('.chip.selected[data-group="sleep"]')?.dataset.value;
  if ((bedtime && waketime) || sleep) renderTSCard(sleep, bedtime, waketime);
}

document.getElementById('sleep-bedtime').addEventListener('change', tryRenderTS);
document.getElementById('sleep-waketime').addEventListener('change', tryRenderTS);

// Also trigger when sleep chip is selected
document.querySelectorAll('.chip[data-group="sleep"]').forEach(chip => {
  chip.addEventListener('click', () => setTimeout(tryRenderTS, 50));
});


// ── Taylor Swift Sleep Association ──
const tsSleepMap = [
  {
    minHours: 8,
    qualities: ['great'],
    song: 'Lover',
    album: 'Lover',
    albumColor: '#ffb7c5',
    albumEmoji: '🌈',
    spotify: 'https://open.spotify.com/track/1dGr1c8CrMLDpV6mPbImSI',
  },
  {
    minHours: 7,
    qualities: ['great', 'good'],
    song: 'Cruel Summer',
    album: '1989',
    albumColor: '#a8d8ea',
    albumEmoji: '🏙️',
    spotify: 'https://open.spotify.com/track/1BxfuPKGuaTgP7aM0Bbdwr',
  },
  {
    minHours: 6,
    qualities: ['good', 'okay'],
    song: 'Seven',
    album: 'Folklore',
    albumColor: '#c9c9c9',
    albumEmoji: '🌲',
    spotify: 'https://open.spotify.com/track/1o0CGHCmRNMNVXsGHfEFEu',
  },
  {
    minHours: 5,
    qualities: ['okay', 'wokeup'],
    song: 'this is me trying',
    album: 'Folklore',
    albumColor: '#c9c9c9',
    albumEmoji: '🌫️',
    spotify: 'https://open.spotify.com/track/4vMFEMDMDPGMxpGwSEKHsw',
  },
  {
    minHours: 4,
    qualities: ['wokeup', 'wantedboyfriend'],
    song: 'Would\'ve, Could\'ve, Should\'ve',
    album: 'Midnights',
    albumColor: '#1a1a2e',
    albumEmoji: '🌙',
    spotify: 'https://open.spotify.com/track/4vMFEMDMDPGMxpGwSEKHsw',
  },
  {
    minHours: 0,
    qualities: ['poor', 'wantedboyfriend', 'wokeup'],
    song: 'How Did It End?',
    album: 'The Tortured Poets Department',
    albumColor: '#d4c5a9',
    albumEmoji: '🖊️',
    spotify: 'https://open.spotify.com/track/3cQ2DCOcFMiGFe2mcVJFHX',
  },
];

function getSleepHours(bedtime, waketime) {
  if (!bedtime || !waketime) return null;
  const [bH, bM] = bedtime.split(':').map(Number);
  const [wH, wM] = waketime.split(':').map(Number);
  let bedMinutes = bH * 60 + bM;
  let wakeMinutes = wH * 60 + wM;
  if (wakeMinutes <= bedMinutes) wakeMinutes += 24 * 60;
  return (wakeMinutes - bedMinutes) / 60;
}

function getTSSong(sleepQuality, sleepHours) {
  // Filter by quality match first, then by hours
  const quality = sleepQuality || 'okay';
  const hours = sleepHours || 0;

  const matches = tsSleepMap.filter(entry =>
    entry.qualities.includes(quality) && hours >= entry.minHours
  );

  if (matches.length === 0) {
    // Fallback — just match by quality
    return tsSleepMap.find(entry => entry.qualities.includes(quality))
      || tsSleepMap[tsSleepMap.length - 1];
  }

  // Return the best match — highest minHours that still qualifies
  return matches.reduce((best, entry) =>
    entry.minHours > best.minHours ? entry : best
  );
}

function renderTSCard(sleepQuality, bedtime, waketime) {
  const hours = getSleepHours(bedtime, waketime);
  const song = getTSSong(sleepQuality, hours);
  if (!song) return;

  document.getElementById('ts-song').textContent = song.song;
  document.getElementById('ts-album').textContent = `${song.album}${hours ? ` · ${hours.toFixed(1)} hrs sleep` : ''}`;
  document.getElementById('ts-link').href = song.spotify;

  // Use color block instead of image
  const artEl = document.getElementById('ts-album-art');
  artEl.style.background = song.albumColor;
  artEl.style.display = 'flex';
  artEl.style.alignItems = 'center';
  artEl.style.justifyContent = 'center';
  artEl.style.fontSize = '28px';
  artEl.textContent = song.albumEmoji;
  artEl.removeAttribute('src');

  document.getElementById('ts-card').classList.remove('hidden');
}


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

  const bedtime = document.getElementById('sleep-bedtime').value || null;
  const waketime = document.getElementById('sleep-waketime').value || null;

  const entry = { flow, mood, sleep, symptoms, bedtime, waketime, loggedAt: new Date().toISOString() };

  // Show TS card if sleep quality or times are logged
  if (sleep || (bedtime && waketime)) {
    renderTSCard(sleep, bedtime, waketime);
  }

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

  if (entry.bedtime) document.getElementById('sleep-bedtime').value = entry.bedtime;
  if (entry.waketime) document.getElementById('sleep-waketime').value = entry.waketime;
  if (entry.sleep || (entry.bedtime && entry.waketime)) {
    renderTSCard(entry.sleep, entry.bedtime, entry.waketime);
  }
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

const lameJokes = [
  "Why did the scarecrow win an award? Because he was outstanding in his field.",
  "I told my doctor I broke my arm in two places. He told me to stop going to those places.",
  "Why don't scientists trust atoms? Because they make up everything.",
  "I'm reading a book about anti-gravity. It's impossible to put down.",
  "Did you hear about the claustrophobic astronaut? He just needed a little space.",
  "Why did the bicycle fall over? Because it was two-tired.",
  "I would tell you a joke about construction but I'm still working on it.",
  "Why can't you give Elsa a balloon? Because she'll let it go.",
  "What do you call cheese that isn't yours? Nacho cheese.",
  "Why did the math book look so sad? Because it had too many problems.",
  "I asked my dog what two minus two is. He said nothing.",
  "Why don't eggs tell jokes? They'd crack each other up.",
  "What do you call a fake noodle? An impasta.",
  "Why did the golfer bring extra pants? In case he got a hole in one.",
  "I told my wife she was drawing her eyebrows too high. She looked surprised.",
  "What do you call a sleeping dinosaur? A dino-snore.",
  "Why is Peter Pan always flying? Because he Neverlands.",
  "I used to hate facial hair but then it grew on me.",
  "What do you call a bear with no teeth? A gummy bear.",
  "Why did the invisible man turn down the job? He couldn't see himself doing it.",
];

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

  // ── 5. Lame joke — 2-3 times a week at random time ──
  // Use day of week to decide: fire on Monday, Wednesday, Friday + random 4th day
  const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const jokeDays = [1, 3, 5]; // Mon, Wed, Fri
  // Add a random extra day that changes each week
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const bonusDay = weekNumber % 7;
  if (!jokeDays.includes(bonusDay)) jokeDays.push(bonusDay);

  if (jokeDays.includes(dayOfWeek)) {
    // Pick a joke based on the day so it's consistent all day but different each day
    const jokeIndex = (new Date().getDate() + new Date().getMonth()) % lameJokes.length;
    const joke = lameJokes[jokeIndex];

    const jokeTimer = setTimeout(() => {
      new Notification('Yasir has a joke for you 🙄', {
        body: joke,
        icon: '/icon-192.png',
      });
    }, getRandomMsToday());

    window._notificationTimers.push(jokeTimer);
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

// ── Calendar ──

const EXAM_DATES = [
  { date: '2026-05-06', label: 'Math Stats', time: '1:00 PM', duration: '2h 15m' },
  { date: '2026-05-11', label: 'Physics', time: '8:00 AM', duration: '3h' },
  { date: '2026-05-19', label: 'Economics', time: '8:00 AM', duration: '3h' },
  { date: '2026-05-20', label: 'Physics Exp', time: '8:00 AM', duration: '2h 15m' },
  { date: '2026-05-21', label: 'Further Maths Mech', time: '1:00 PM', duration: '2h 30m' },
  { date: '2026-05-25', label: 'Further Maths Pure', time: '1:00 PM', duration: '3h 00m' },
  { date: '2026-06-05', label: 'Economics MCQs', time: '8:00 AM', duration: '2h 15m' },
  { date: '2026-06-08', label: 'Math Pure', time: '1:00 PM', duration: '2h 50m' },
];

const EVENT_COLORS = {
  study: '#a78bfa',
  sleep: '#60a5fa',
  personal: '#e8a0bf',
  physics: '#f59e0b',
  maths: '#34d399',
  furthermaths: '#10b981',
  economics: '#f97316',
  eat: '#fb7185',
  other: '#94a3b8',
};

const STUDY_CATS = ['study', 'physics', 'maths', 'furthermaths', 'economics'];

// Grid config: 5am to midnight = 19 hours
const GRID_START_HOUR = 5;
const GRID_END_HOUR = 24;
const HOUR_HEIGHT = 56; // px per hour

let calCurrentMonth = new Date().getMonth();
let calCurrentYear = new Date().getFullYear();
let calSelectedDate = new Date().toISOString().split('T')[0];
let calSelectedCat = 'study';
let sheetSelectedCat = 'study';

function getCalEvents() {
  return JSON.parse(localStorage.getItem('flowstate-cal-events') || '{}');
}

function saveCalEvents(events) {
  localStorage.setItem('flowstate-cal-events', JSON.stringify(events));
}

function getPhaseForDate(dateStr) {
  const userData = JSON.parse(localStorage.getItem('flowstate-user'));
  if (!userData) return null;
  const lastPeriod = new Date(userData.lastPeriodStart);
  const target = new Date(dateStr);
  lastPeriod.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const daysSince = Math.floor((target - lastPeriod) / (1000 * 60 * 60 * 24));
  const cycleDay = (daysSince % userData.cycleLength) + 1;
  return getPhase(cycleDay, userData.cycleLength);
}

function getStudyHoursForDay(dateStr) {
  const events = getCalEvents();
  const dayEvents = events[dateStr] || [];
  let totalMinutes = 0;
  dayEvents.forEach(ev => {
    if (STUDY_CATS.includes(ev.cat) && ev.startTime && ev.endTime) {
      const [sh, sm] = ev.startTime.split(':').map(Number);
      const [eh, em] = ev.endTime.split(':').map(Number);
      const start = sh * 60 + sm;
      const end = eh * 60 + em;
      if (end > start) totalMinutes += end - start;
    }
  });
  return totalMinutes / 60;
}

function isOverloaded(dateStr, events, phase) {
  const studyHours = getStudyHoursForDay(dateStr);
  const examStart = new Date('2026-05-06');
  const targetDate = new Date(dateStr);
  const isExamPeriod = targetDate >= examStart;
  const isHeavyPhase = phase === 'luteal' || phase === 'menstruation';

  if (isExamPeriod) {
    return isHeavyPhase ? studyHours >= 7 : studyHours >= 9;
  }
  return isHeavyPhase ? studyHours >= 4 : studyHours >= 6;
}

// ── Month Calendar ──
function renderCalendar() {
  const events = getCalEvents();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const firstDay = new Date(calCurrentYear, calCurrentMonth, 1).getDay();
  const daysInMonth = new Date(calCurrentYear, calCurrentMonth + 1, 0).getDate();

  const monthNames = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];
  document.getElementById('cal-month-label').textContent =
    `${monthNames[calCurrentMonth]} ${calCurrentYear}`;

  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.classList.add('cal-day', 'empty');
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calCurrentYear}-${String(calCurrentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const phase = getPhaseForDate(dateStr);
    const dayEvents = events[dateStr] || [];
    const overloaded = isOverloaded(dateStr, events, phase);
    const exam = EXAM_DATES.find(e => e.date === dateStr);

    const cell = document.createElement('div');
    cell.classList.add('cal-day');
    if (dateStr === todayStr) cell.classList.add('today');
    if (dateStr === calSelectedDate) cell.classList.add('selected');
    if (overloaded) cell.classList.add('overloaded');
    if (exam) cell.classList.add('exam-day');

    const num = document.createElement('p');
    num.classList.add('cal-day-num');
    num.textContent = d;
    cell.appendChild(num);

    if (phase) {
      const dot = document.createElement('div');
      dot.classList.add('cal-phase-dot');
      dot.style.background = getPhaseColor(phase);
      cell.appendChild(dot);
    }

    if (exam) {
      const badge = document.createElement('div');
      badge.classList.add('cal-exam-badge');
      badge.textContent = 'EXAM';
      cell.appendChild(badge);
    }

    if (dayEvents.length > 0) {
      const dotsRow = document.createElement('div');
      dotsRow.classList.add('cal-event-dots');
      dayEvents.slice(0, 6).forEach(ev => {
        const dot = document.createElement('div');
        dot.classList.add('cal-event-dot');
        dot.style.background = EVENT_COLORS[ev.cat] || '#888';
        dotsRow.appendChild(dot);
      });
      cell.appendChild(dotsRow);
    }

    cell.addEventListener('click', () => {
      calSelectedDate = dateStr;
      renderCalendar();
      openDayView(dateStr);
    });

    grid.appendChild(cell);
  }
}

// ── Day View ──
function openDayView(dateStr) {
  const dayView = document.getElementById('day-view');
  dayView.classList.remove('hidden');

  const exam = EXAM_DATES.find(e => e.date === dateStr);
  const date = new Date(dateStr + 'T00:00:00');
  const formatted = date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  document.getElementById('day-view-date').textContent = formatted;
  document.getElementById('day-view-exam').textContent =
    exam ? `📝 ${exam.label} · ${exam.time} (${exam.duration})` : '';

  renderTimeGrid(dateStr);
  checkOverloadWarning(dateStr);
}

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function renderTimeGrid(dateStr) {
  const grid = document.getElementById('time-grid');
  grid.innerHTML = '';

  const events = getCalEvents();
  const dayEvents = (events[dateStr] || []).filter(e => e.startTime && e.endTime);

  // Total grid height
  const totalHours = GRID_END_HOUR - GRID_START_HOUR;
  grid.style.height = `${totalHours * HOUR_HEIGHT}px`;
  grid.style.position = 'relative';

  // Draw hour rows
  for (let h = GRID_START_HOUR; h < GRID_END_HOUR; h++) {
    const row = document.createElement('div');
    row.classList.add('time-row');
    row.style.position = 'absolute';
    row.style.top = `${(h - GRID_START_HOUR) * HOUR_HEIGHT}px`;
    row.style.left = '0';
    row.style.right = '0';
    row.style.height = `${HOUR_HEIGHT}px`;

    const label = document.createElement('div');
    label.classList.add('time-label');
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    const ampm = h < 12 ? 'AM' : 'PM';
    label.textContent = `${displayHour} ${ampm}`;

    const slotArea = document.createElement('div');
    slotArea.classList.add('time-slot-area');

    row.appendChild(label);
    row.appendChild(slotArea);

    // Tap to open add sheet
    row.addEventListener('click', () => {
      const startH = String(h).padStart(2, '0');
      const endH = String(Math.min(h + 1, 23)).padStart(2, '0');
      document.getElementById('sheet-start-time').value = `${startH}:00`;
      document.getElementById('sheet-end-time').value = `${endH}:00`;
      document.getElementById('sheet-event-name').value = '';
      document.getElementById('add-event-sheet').classList.remove('hidden');
      document.getElementById('add-event-sheet').scrollIntoView({ behavior: 'smooth' });
    });

    grid.appendChild(row);
  }

  // Draw event blocks on top
  dayEvents.forEach((ev, index) => {
    const startMins = timeToMinutes(ev.startTime);
    const endMins = timeToMinutes(ev.endTime);
    const gridStartMins = GRID_START_HOUR * 60;

    const topPx = ((startMins - gridStartMins) / 60) * HOUR_HEIGHT;
    const heightPx = Math.max(((endMins - startMins) / 60) * HOUR_HEIGHT, 24);

    const block = document.createElement('div');
    block.classList.add('event-block');
    block.style.top = `${topPx}px`;
    block.style.height = `${heightPx}px`;
    block.style.background = EVENT_COLORS[ev.cat] || '#888';
    block.style.left = '56px';
    block.style.right = '8px';
    block.style.position = 'absolute';

    const title = document.createElement('div');
    title.classList.add('event-block-title');
    title.textContent = ev.text;

    const time = document.createElement('div');
    time.classList.add('event-block-time');
    time.textContent = `${ev.startTime} – ${ev.endTime}`;

    const del = document.createElement('button');
    del.classList.add('event-block-delete');
    del.textContent = '✕';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      const allEvents = getCalEvents();
      allEvents[dateStr].splice(index, 1);
      if (allEvents[dateStr].length === 0) delete allEvents[dateStr];
      saveCalEvents(allEvents);
      renderTimeGrid(dateStr);
      renderCalendar();
      checkOverloadWarning(dateStr);
    });

    const durationMins = timeToMinutes(ev.endTime) - timeToMinutes(ev.startTime);

    block.appendChild(title);

    if (durationMins > 30) {
      block.appendChild(time);
    }

    block.appendChild(del);
    grid.appendChild(block);
  });
}

// ── Overload Warning ──
function checkOverloadWarning(dateStr) {
  const events = getCalEvents();
  const phase = getPhaseForDate(dateStr);
  const studyHours = getStudyHoursForDay(dateStr);
  const overloaded = isOverloaded(dateStr, events, phase);
  const isHeavyPhase = phase === 'luteal' || phase === 'menstruation';
  const examStart = new Date('2026-05-06');
  const targetDate = new Date(dateStr);
  const daysUntilExam = Math.ceil((examStart - new Date()) / (1000 * 60 * 60 * 24));
  const isExamPeriod = targetDate >= examStart;

  const warningEl = document.getElementById('overload-warning');
  const warningText = document.getElementById('overload-warning-text');
  const aiCard = document.getElementById('day-ai-card');
  const aiText = document.getElementById('day-ai-text');

  if (overloaded) {
    warningEl.classList.remove('hidden');
    if (isHeavyPhase && !isExamPeriod) {
      warningText.textContent = `⚠️ ${studyHours.toFixed(1)} hours of study logged — that's a lot for ${phase} phase. Your body needs more recovery time right now.`;
    } else if (isHeavyPhase && isExamPeriod) {
      warningText.textContent = `⚠️ ${studyHours.toFixed(1)} hours logged during ${phase} phase and exam season. Consider shorter sessions with longer breaks to protect your focus.`;
    } else {
      warningText.textContent = `⚠️ ${studyHours.toFixed(1)} hours of study logged today. Make sure you're eating and taking proper breaks.`;
    }

    // Show dynamic AI advice
    aiCard.classList.remove('hidden');
    const advice = getDynamicAdvice(phase, studyHours, daysUntilExam, isExamPeriod);
    aiText.textContent = advice;
  } else {
    warningEl.classList.add('hidden');
    // Show encouraging advice even when not overloaded
    if (studyHours > 0) {
      aiCard.classList.remove('hidden');
      aiText.textContent = getDynamicAdvice(phase, studyHours, daysUntilExam, isExamPeriod);
    } else {
      aiCard.classList.add('hidden');
    }
  }
}

function getDynamicAdvice(phase, studyHours, daysUntilExam, isExamPeriod) {
  const urgency = daysUntilExam <= 3 ? 'critical exam crunch' :
    daysUntilExam <= 14 ? 'exam season' : 'pre-exam period';

  if (phase === 'menstruation' || phase === 'luteal') {
    if (studyHours >= 6) {
      return `You've logged ${studyHours.toFixed(1)} hours during ${phase} phase — your brain is working overtime while your body is already under stress. Try the 25-5 method: 25 minutes focused, 5 minutes complete rest. Quality over quantity right now.`;
    }
    if (studyHours >= 3) {
      return `${studyHours.toFixed(1)} hours in — good progress. During ${phase} phase, your cortisol is already elevated. Keep sessions under 90 minutes and hydrate between subjects.`;
    }
    return `Starting your day during ${phase} phase — be intentional. Tackle your hardest subject first while your focus is freshest, then ease into lighter revision.`;
  }

  if (phase === 'follicular' || phase === 'ovulation') {
    if (studyHours >= 8) {
      return `${studyHours.toFixed(1)} hours is impressive. Even in your peak phase, cognitive fatigue is real — a 20 minute walk or nap now will restore more focus than pushing through.`;
    }
    if (studyHours >= 4) {
      return `Strong session — ${studyHours.toFixed(1)} hours logged. You're in ${phase} phase so your retention is high right now. Great time to tackle new material, not just revision.`;
    }
    return `Your energy is building in ${phase} phase. Front-load your most demanding subjects while your focus is at its sharpest.`;
  }

  return `${studyHours.toFixed(1)} hours logged. Keep going — you're doing well.`;
}

// ── Sheet Category Selection ──
document.querySelectorAll('#sheet-category-row .event-cat-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#sheet-category-row .event-cat-btn')
      .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    sheetSelectedCat = btn.dataset.cat;
  });
});

// ── Add Event from Sheet ──
document.getElementById('sheet-confirm-btn').addEventListener('click', () => {
  const name = document.getElementById('sheet-event-name').value.trim();
  const startTime = document.getElementById('sheet-start-time').value;
  const endTime = document.getElementById('sheet-end-time').value;

  if (!name || !startTime || !endTime) {
    alert('Please fill in the event name and times.');
    return;
  }

  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
    alert('End time must be after start time.');
    return;
  }

  const events = getCalEvents();
  if (!events[calSelectedDate]) events[calSelectedDate] = [];
  events[calSelectedDate].push({
    text: name,
    cat: sheetSelectedCat,
    startTime,
    endTime,
  });

  // Sort events by start time
  events[calSelectedDate].sort((a, b) =>
    timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  saveCalEvents(events);
  document.getElementById('add-event-sheet').classList.add('hidden');
  renderTimeGrid(calSelectedDate);
  renderCalendar();
  checkOverloadWarning(calSelectedDate);
});

// ── Cancel Sheet ──
document.getElementById('sheet-cancel-btn').addEventListener('click', () => {
  document.getElementById('add-event-sheet').classList.add('hidden');
});

// ── Day Navigation ──
document.getElementById('day-prev').addEventListener('click', () => {
  const d = new Date(calSelectedDate + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  calSelectedDate = d.toISOString().split('T')[0];
  calCurrentMonth = d.getMonth();
  calCurrentYear = d.getFullYear();
  renderCalendar();
  openDayView(calSelectedDate);
});

document.getElementById('day-next').addEventListener('click', () => {
  const d = new Date(calSelectedDate + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  calSelectedDate = d.toISOString().split('T')[0];
  calCurrentMonth = d.getMonth();
  calCurrentYear = d.getFullYear();
  renderCalendar();
  openDayView(calSelectedDate);
});

// ── Month Navigation ──
document.getElementById('cal-prev').addEventListener('click', () => {
  calCurrentMonth--;
  if (calCurrentMonth < 0) { calCurrentMonth = 11; calCurrentYear--; }
  renderCalendar();
});

document.getElementById('cal-next').addEventListener('click', () => {
  calCurrentMonth++;
  if (calCurrentMonth > 11) { calCurrentMonth = 0; calCurrentYear++; }
  renderCalendar();
});

// ── Update showScreen ──
const _showScreen3 = showScreen;
showScreen = function(screenId) {
  _showScreen3(screenId);
  if (screenId === 'calendar-screen') {
    renderCalendar();
    openDayView(calSelectedDate);
    fetchAIAdvice();
  }
};

// ── AI Advice (top card) ──
async function fetchAIAdvice() {
  const data = getCycleData();
  if (!data) return;

  const today = new Date().toISOString().split('T')[0];
  const events = getCalEvents();
  const todayEvents = events[today] || [];
  const exam = EXAM_DATES.find(e => e.date === today);
  const daysUntilFirstExam = Math.ceil(
    (new Date('2026-05-06') - new Date()) / (1000 * 60 * 60 * 24)
  );

  const prompt = `Today's info for Aelya:
- Cycle day: ${data.cycleDay} of ${data.cycleLength}
- Phase: ${data.phase}
- Days until first exam (Math Stats, May 6 2026): ${daysUntilFirstExam}
- Today's exam: ${exam ? `${exam.label} at ${exam.time} (${exam.duration})` : 'None'}
- Today's planned events: ${todayEvents.length > 0 ? todayEvents.map(e => `${e.text} (${e.cat}) ${e.startTime ? e.startTime + '–' + e.endTime : ''}`).join(', ') : 'None yet'}

Write 2-3 sentences of warm, specific, practical advice for Aelya today. Consider her cycle phase, exam pressure, and what she has planned. If she has an exam today, acknowledge it. Speak directly to her.`;

  const adviceEl = document.getElementById('ai-advice-text');
  adviceEl.textContent = 'Getting your advice...';

  try {
    const response = await fetch('/api/advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    const result = await response.json();

    if (result.advice) {
      adviceEl.textContent = result.advice;
    } else {
      adviceEl.textContent = getOfflineAdvice(data.phase, daysUntilFirstExam);
    }
  } catch {
    adviceEl.textContent = getOfflineAdvice(data.phase, daysUntilFirstExam);
  }
}

function getOfflineAdvice(phase, daysUntilExam) {
  const urgency = daysUntilExam <= 7 ? 'Exams are almost here — ' :
    daysUntilExam <= 30 ? 'With exams approaching, ' : '';
  const phaseAdvice = {
    menstruation: `${urgency}your energy is lower right now so prioritise your most important subject first while you still have focus. Short sessions with proper breaks will serve you better than pushing through fatigue.`,
    follicular: `${urgency}your mind is sharp and energy is building — this is a great time to tackle the harder topics. Use this phase to get ahead while you feel your best.`,
    ovulation: `${urgency}you are at your peak mentally and socially. Use this energy for your most demanding revision and practice papers.`,
    luteal: `${urgency}your energy will dip as the days go on, so front-load your study sessions in the morning. Be kind to yourself in the evenings.`,
  };
  return phaseAdvice[phase];
}