import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  safeJsonParse,
  debounce,
  formatDate,
  truncate,
  highlightText,
  generateId,
  readingTime,
  escapeHtml,
  isMobile,
} from '../src/lib/utils.js';

describe('utils', () => {
  describe('safeJsonParse', () => {
    it('正常解析 JSON 字符串', () => {
      expect(safeJsonParse('{"a":1}')).toEqual({ a: 1 });
    });

    it('解析数组 JSON', () => {
      expect(safeJsonParse('[1,2,3]')).toEqual([1, 2, 3]);
    });

    it('非法 JSON 返回默认值', () => {
      expect(safeJsonParse('not json')).toBeNull();
    });

    it('非法 JSON 返回指定默认值', () => {
      expect(safeJsonParse('not json', [])).toEqual([]);
    });

    it('空字符串返回默认值', () => {
      expect(safeJsonParse('', 'fallback')).toBe('fallback');
    });

    it('null 被视为合法 JSON 值 null', () => {
      expect(safeJsonParse(null, 'default')).toBeNull();
    });

    it('嵌套 JSON', () => {
      expect(safeJsonParse('{"a":{"b":2}}')).toEqual({ a: { b: 2 } });
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('延迟指定时间后执行', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);
      debounced();
      expect(fn).not.toHaveBeenCalled();
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('多次调用只执行最后一次', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);
      debounced();
      debounced();
      debounced();
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('传递参数', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);
      debounced('hello', 42);
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledWith('hello', 42);
    });

    it('在延迟内再次调用重置计时器', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 200);
      debounced();
      vi.advanceTimersByTime(100);
      debounced();
      vi.advanceTimersByTime(100);
      expect(fn).not.toHaveBeenCalled();
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('formatDate', () => {
    it('格式化日期为中文', () => {
      const date = new Date('2026-06-17');
      const result = formatDate(date);
      expect(result).toContain('2026');
      expect(result).toContain('6');
      expect(result).toContain('17');
    });

    it('接受字符串日期', () => {
      const result = formatDate('2026-01-01');
      expect(result).toContain('2026');
    });

    it('英文 locale', () => {
      const result = formatDate('2026-06-17', 'en-US');
      expect(result).toContain('2026');
      expect(result).toContain('June');
    });
  });

  describe('truncate', () => {
    it('文本长度不超过上限时返回原文', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('超长文本截断并加省略号', () => {
      expect(truncate('hello world', 5)).toBe('hello...');
    });

    it('空文本', () => {
      expect(truncate('', 10)).toBe('');
    });

    it('null 文本', () => {
      expect(truncate(null, 10)).toBeNull();
    });

    it('默认 maxLength 100', () => {
      const long = 'a'.repeat(150);
      expect(truncate(long)).toBe('a'.repeat(100) + '...');
    });
  });

  describe('highlightText', () => {
    it('高亮关键词', () => {
      expect(highlightText('hello world', 'world')).toBe('hello <mark>world</mark>');
    });

    it('忽略大小写', () => {
      expect(highlightText('Hello World', 'hello')).toBe('<mark>Hello</mark> World');
    });

    it('无匹配时返回原文', () => {
      expect(highlightText('hello', 'xyz')).toBe('hello');
    });

    it('空 query 返回原文', () => {
      expect(highlightText('hello', '')).toBe('hello');
    });

    it('空文本', () => {
      expect(highlightText('', 'hello')).toBe('');
    });

    it('多个匹配', () => {
      expect(highlightText('hello hello', 'hello')).toBe('<mark>hello</mark> <mark>hello</mark>');
    });

    it('转义正则特殊字符', () => {
      expect(highlightText('hello (world)', '(world)')).toBe('hello <mark>(world)</mark>');
    });
  });

  describe('generateId', () => {
    it('生成非空字符串', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('每次生成不同 ID', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) ids.add(generateId());
      expect(ids.size).toBe(100);
    });
  });

  describe('readingTime', () => {
    it('计算阅读时间', () => {
      const content = 'word '.repeat(400);
      expect(readingTime(content)).toBe(2);
    });

    it('短文阅读时间 1 分钟', () => {
      expect(readingTime('hello world')).toBe(1);
    });

    it('空内容', () => {
      expect(readingTime('')).toBe(0);
    });

    it('null 内容', () => {
      expect(readingTime(null)).toBe(0);
    });
  });

  describe('escapeHtml', () => {
    it('转义 HTML 标签', () => {
      const result = escapeHtml('<script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;');
    });

    it('保留普通文本', () => {
      expect(escapeHtml('hello world')).toBe('hello world');
    });

    it('空字符串', () => {
      expect(escapeHtml('')).toBe('');
    });
  });

  describe('isMobile', () => {
    it('返回 boolean', () => {
      expect(typeof isMobile()).toBe('boolean');
    });
  });
});
