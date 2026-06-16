// src/lib/virtual-scroll.js

/**
 * 虚拟滚动配置
 */
const CONFIG = {
  itemHeight: 400, // 每个卡片估算高度 (px)
  bufferSize: 3, // 上下缓冲区数量
  minVisible: 6 // 最小显示数量
};

/**
 * 虚拟滚动状态
 */
let state = {
  items: [],
  visibleStart: 0,
  visibleEnd: 0,
  totalHeight: 0,
  containerHeight: 0,
  scrollTop: 0
};

/**
 * 初始化虚拟滚动
 */
export function initVirtualScroll(containerSelector, items, renderItem) {
  const container = document.querySelector(containerSelector);
  if (!container) return null;

  // 将容器保存到 state
  state.container = container;
  state.items = items;
  state.totalHeight = items.length * CONFIG.itemHeight;
  state.containerHeight = container.offsetHeight;

  // 创建滚动容器
  const wrapper = document.createElement('div');
  wrapper.className = 'virtual-scroll-wrapper';
  wrapper.style.cssText = `
    position: relative;
    height: ${state.totalHeight}px;
  `;

  // 创建可见区域容器
  const viewport = document.createElement('div');
  viewport.className = 'virtual-scroll-viewport';
  viewport.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    overflow: hidden;
    will-change: transform;
  `;

  // 创建内容容器
  const content = document.createElement('div');
  content.className = 'virtual-scroll-content';
  content.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
  `;

  viewport.appendChild(content);
  wrapper.appendChild(viewport);
  container.innerHTML = '';
  container.appendChild(wrapper);
  
  // 保存 wrapper 和 content 到 state 供外部函数使用
  state.wrapper = wrapper;
  state.content = content;

  // 监听滚动
  let ticking = false;
  container.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateVirtualScroll(content, items, renderItem);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // 初始渲染
  updateVirtualScroll(content, items, renderItem);

  return { container, wrapper, content };
}

/**
 * 更新虚拟滚动
 */
function updateVirtualScroll(contentEl, items, renderItem) {
  const scrollTop = state.container.scrollTop || 0;
  state.scrollTop = scrollTop;

  // 计算可见范围
  const startIndex = Math.max(0, Math.floor(scrollTop / CONFIG.itemHeight) - CONFIG.bufferSize);
  const visibleCount = Math.ceil(state.containerHeight / CONFIG.itemHeight) + CONFIG.bufferSize * 2;
  const endIndex = Math.min(items.length - 1, startIndex + visibleCount);

  // 检查是否需要更新
  if (startIndex === state.visibleStart && endIndex === state.visibleEnd) {
    return;
  }

  state.visibleStart = startIndex;
  state.visibleEnd = endIndex;

  // 更新内容
  const fragment = document.createDocumentFragment();
  contentEl.innerHTML = '';
  contentEl.style.transform = `translateY(${startIndex * CONFIG.itemHeight}px)`;

  for (let i = startIndex; i <= endIndex; i++) {
    const item = items[i];
    const element = document.createElement('div');
    element.className = 'virtual-scroll-item';
    element.style.height = `${CONFIG.itemHeight}px`;
    element.innerHTML = renderItem(item, i);
    fragment.appendChild(element);
  }

  contentEl.appendChild(fragment);
}

/**
 * 滚动到指定位置
 */
export function scrollToIndex(index) {
  if (!state.container) return;
  const position = index * CONFIG.itemHeight;
  state.container.scrollTo({
    top: position,
    behavior: 'smooth'
  });
}

/**
 * 滚动到顶部
 */
export function scrollToTop() {
  if (!state.container) return;
  state.container.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

/**
 * 滚动到底部
 */
export function scrollToBottom() {
  if (!state.container) return;
  state.container.scrollTo({
    top: state.totalHeight,
    behavior: 'smooth'
  });
}

/**
 * 刷新虚拟滚动（数据变化时调用）
 */
export function refreshVirtualScroll(items, renderItem) {
  if (!state.container) return;
  state.items = items;
  state.totalHeight = items.length * CONFIG.itemHeight;
  state.wrapper.style.height = `${state.totalHeight}px`;
  updateVirtualScroll(state.content, items, renderItem);
}

/**
 * 销毁虚拟滚动
 */
export function destroyVirtualScroll() {
  if (state.container) {
    state.container.innerHTML = '';
  }
  state = {
    items: [],
    visibleStart: 0,
    visibleEnd: 0,
    totalHeight: 0,
    containerHeight: 0,
    scrollTop: 0
  };
}
