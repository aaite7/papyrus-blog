import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/lib/posts.js', () => ({
  postsService: {
    getAllPosts: vi.fn(),
  },
}));

import { getArchivedPosts } from '../src/lib/archive.js';
import { postsService } from '../src/lib/posts.js';

describe('archive', () => {
  describe('getArchivedPosts', () => {
    it('按年月分组文章', async () => {
      postsService.getAllPosts.mockResolvedValue([
        { id: 1, title: 'Post 1', created_at: '2026-06-01' },
        { id: 2, title: 'Post 2', created_at: '2026-06-15' },
        { id: 3, title: 'Post 3', created_at: '2026-05-20' },
      ]);

      const groups = await getArchivedPosts();

      expect(groups).toHaveLength(2);
      expect(groups[0].label).toBe('2026年6月');
      expect(groups[1].label).toBe('2026年5月');
    });

    it('正确处理单个文章', async () => {
      postsService.getAllPosts.mockResolvedValue([
        { id: 1, title: 'Only', created_at: '2026-01-01' },
      ]);

      const groups = await getArchivedPosts();

      expect(groups).toHaveLength(1);
      expect(groups[0].posts).toHaveLength(1);
      expect(groups[0].label).toBe('2026年1月');
    });

    it('正确补零月份', async () => {
      postsService.getAllPosts.mockResolvedValue([
        { id: 1, title: 'Jan', created_at: '2026-01-01' },
        { id: 2, title: 'Oct', created_at: '2026-10-01' },
      ]);

      const groups = await getArchivedPosts();

      const labels = groups.map(g => g.label);
      expect(labels).toContain('2026年1月');
      expect(labels).toContain('2026年10月');
    });

    it('同月文章归并到一个分组', async () => {
      postsService.getAllPosts.mockResolvedValue([
        { id: 1, title: 'Post 1', created_at: '2026-06-01' },
        { id: 2, title: 'Post 2', created_at: '2026-06-30' },
        { id: 3, title: 'Post 3', created_at: '2026-06-15' },
      ]);

      const groups = await getArchivedPosts();

      expect(groups).toHaveLength(1);
      expect(groups[0].posts).toHaveLength(3);
    });

    it('空结果返回空数组', async () => {
      postsService.getAllPosts.mockResolvedValue([]);

      const groups = await getArchivedPosts();

      expect(groups).toEqual([]);
    });

    it('API 失败返回空数组', async () => {
      postsService.getAllPosts.mockRejectedValue(new Error('Network error'));

      const groups = await getArchivedPosts();

      expect(groups).toEqual([]);
    });

    it('按时间降序排列', async () => {
      postsService.getAllPosts.mockResolvedValue([
        { id: 1, title: 'Old', created_at: '2025-01-01' },
        { id: 2, title: 'New', created_at: '2026-06-01' },
      ]);

      const groups = await getArchivedPosts();

      expect(groups[0].label).toBe('2026年6月');
      expect(groups[1].label).toBe('2025年1月');
    });

    it('跨年分组', async () => {
      postsService.getAllPosts.mockResolvedValue([
        { id: 1, title: '2026 June', created_at: '2026-06-01' },
        { id: 2, title: '2025 Dec', created_at: '2025-12-01' },
        { id: 3, title: '2025 Jan', created_at: '2025-01-01' },
      ]);

      const groups = await getArchivedPosts();

      expect(groups).toHaveLength(3);
    });
  });
});
