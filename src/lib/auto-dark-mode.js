// src/lib/auto-dark-mode.js

/**
 * 暗黑模式自动切换配置
 */
const CONFIG = {
  // 自动切换模式：'system' | 'schedule' | 'smart'
  mode: 'smart',
  // 日间开始时间（小时）
  lightHour: 7,
  // 夜间开始时间（小时）
  darkHour: 18,
  // 是否尊重系统偏好
  respectSystem: true
};

/**
 * 当前状态
 */
let state = {
  isDark: false,
  timer: null
};

/**
 * 获取地理位置（用于计算日出日落）
 */
async function getGeolocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      resolve({ latitude: 28.68, longitude: 115.86 }); // 默认南昌
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      position => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }),
      () => resolve({ latitude: 28.68, longitude: 115.86 }), // 失败时用南昌
      { enableHighAccuracy: false, timeout: 5000 }
    );
  });
}

/**
 * 计算日出日落时间（简化版）
 */
function calculateSunTimes(latitude, longitude, date = new Date()) {
  // 简化的日出日落计算
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  
  // 简化计算：假设赤纬
  const declination = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
  const latRad = (latitude * Math.PI) / 180;
  const decRad = (declination * Math.PI) / 180;
  
  // 计算时角
  const cosHourAngle = (Math.cos(90.833 * Math.PI / 180)) / 
                       (Math.cos(latRad) * Math.cos(decRad)) - 
                       Math.tan(latRad) * Math.tan(decRad);
  
  if (cosHourAngle > 1 || cosHourAngle < -1) {
    // 极昼或极夜
    return { sunrise: 6, sunset: 18 };
  }
  
  const hourAngle = (Math.acos(cosHourAngle) * 180) / Math.PI;
  const sunrise = 12 - hourAngle / 15;
  const sunset = 12 + hourAngle / 15;
  
  return { sunrise, sunset };
}

/**
 * 判断是否应该使用暗黑模式
 */
async function shouldUseDarkMode() {
  const hour = new Date().getHours();
  
  // 模式 1: 系统偏好
  if (CONFIG.mode === 'system' || CONFIG.respectSystem) {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
  }
  
  // 模式 2: 固定时间
  if (CONFIG.mode === 'schedule') {
    return hour >= CONFIG.darkHour || hour < CONFIG.lightHour;
  }
  
  // 模式 3: 智能模式（基于日出日落）
  if (CONFIG.mode === 'smart') {
    const location = await getGeolocation();
    const { sunrise, sunset } = calculateSunTimes(
      location.latitude,
      location.longitude,
      new Date()
    );
    
    return hour >= Math.floor(sunset) || hour < Math.floor(sunrise);
  }
  
  // 默认：固定时间
  return hour >= CONFIG.darkHour || hour < CONFIG.lightHour;
}

/**
 * 应用暗黑模式
 */
function applyDarkMode(isDark) {
  const wasDark = document.body.classList.contains('dark-mode');
  
  if (isDark === wasDark) return;
  
  document.body.classList.toggle('dark-mode', isDark);
  
  // 更新 Toggle 按钮
  const toggle = document.getElementById('dark-mode-toggle');
  if (toggle) {
    toggle.textContent = isDark ? '☀' : '☾';
  }
  
  // 保存到 localStorage
  localStorage.setItem('darkMode', isDark.toString());
  
  // 触发事件
  window.dispatchEvent(new CustomEvent('darkModeChange', { detail: { isDark } }));
  
  console.log(`[AutoDarkMode] Switched to ${isDark ? 'dark' : 'light'} mode`);
}

/**
 * 检查并更新暗黑模式
 */
async function checkAndUpdate() {
  const shouldBeDark = await shouldUseDarkMode();
  applyDarkMode(shouldBeDark);
}

/**
 * 设置定时器
 */
function scheduleNextCheck() {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setHours(now.getHours() + 1);
  nextHour.setMinutes(0);
  nextHour.setSeconds(0);
  
  const delay = nextHour - now;
  
  state.timer = setTimeout(async () => {
    await checkAndUpdate();
    scheduleNextCheck();
  }, delay);
}

/**
 * 监听系统偏好变化
 */
function watchSystemPreference() {
  if (!window.matchMedia) return;
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  if (!mediaQuery.addEventListener) return;
  
  mediaQuery.addEventListener('change', async (e) => {
    if (CONFIG.respectSystem && CONFIG.mode === 'system') {
      applyDarkMode(e.matches);
    }
  });
}

/**
 * 初始化自动暗黑模式
 */
export async function initAutoDarkMode(options = {}) {
  // 合并配置
  Object.assign(CONFIG, options);
  
  // 如果有用户手动设置，优先使用用户的
  const userPreference = localStorage.getItem('darkMode');
  if (userPreference !== null) {
    applyDarkMode(userPreference === 'true');
    // 不启动自动切换，尊重用户手动设置
    console.log('[AutoDarkMode] Using manual preference');
    return;
  }
  
  // 初始检查
  await checkAndUpdate();
  
  // 设置每小时检查
  scheduleNextCheck();
  
  // 监听系统偏好
  watchSystemPreference();
  
  // 监听页面可见性变化（重新检查）
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      checkAndUpdate();
    }
  });
  
  console.log('[AutoDarkMode] Initialized with mode:', CONFIG.mode);
}

/**
 * 手动切换（用户点击 Toggle 时）
 * 调用此函数会禁用自动切换
 */
export function toggleDarkModeManually() {
  const isDark = !document.body.classList.contains('dark-mode');
  
  // 覆盖自动设置
  localStorage.setItem('darkMode', isDark.toString());
  applyDarkMode(isDark);
  
  // 清除定时器
  if (state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }
  
  console.log('[AutoDarkMode] Manual toggle, auto-switch disabled');
}

/**
 * 获取当前模式
 */
export function getDarkModeStatus() {
  return {
    isDark: document.body.classList.contains('dark-mode'),
    mode: CONFIG.mode,
    autoEnabled: state.timer !== null
  };
}
