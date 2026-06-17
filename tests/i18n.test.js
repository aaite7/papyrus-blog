import { describe, it, expect, beforeEach, vi } from 'vitest';
import { t, setLanguage, getLanguage } from '../src/lib/i18n.js';

describe('i18n', () => {
  beforeEach(() => {
    localStorage.clear();
    setLanguage('zh-CN');
    document.documentElement.lang = '';
    vi.restoreAllMocks();
  });

  describe('t', () => {
    it('返回中文翻译', () => {
      expect(t('nav.home')).toBe('首页');
    });

    it('返回英文翻译', () => {
      setLanguage('en-US');
      expect(t('nav.home')).toBe('Home');
    });

    it('不存在的 key 返回 key 本身', () => {
      expect(t('not.exist')).toBe('not.exist');
    });

    it('替换参数', () => {
      setLanguage('zh-CN');
      expect(t('search.results_count', { count: '5' })).toBe('找到 5 篇相关文章');
    });

    it('英文参数替换', () => {
      setLanguage('en-US');
      expect(t('search.results_count', { count: '5' })).toBe('Found 5 articles');
    });

    it('多个参数替换', () => {
      setLanguage('zh-CN');
      expect(t('date.days_ago', { days: '3' })).toBe('3 天前');
    });
  });

  describe('setLanguage', () => {
    it('设置有效语言', () => {
      setLanguage('en-US');
      expect(getLanguage()).toBe('en-US');
      expect(localStorage.getItem('language')).toBe('en-US');
    });

    it('无效语言不切换', () => {
      setLanguage('zh-CN');
      expect(getLanguage()).toBe('zh-CN');
      setLanguage('ja-JP');
      expect(getLanguage()).toBe('zh-CN');
    });

    it('更新 html lang 属性', () => {
      setLanguage('en-US');
      expect(document.documentElement.lang).toBe('en-US');
    });
  });

  describe('getLanguage', () => {
    it('默认返回中文', () => {
      expect(getLanguage()).toBe('zh-CN');
    });

    it('从 localStorage 读取', () => {
      localStorage.setItem('language', 'en-US');
      vi.resetModules();
      return import('../src/lib/i18n.js').then((mod) => {
        expect(mod.getLanguage()).toBe('en-US');
      });
    });
  });
});
