import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TaxonomyGroup } from '@/lib/categories';

describe('Phase 49: MultiCategorySelector Component & Taxonomy Logic Tests', () => {
  // Logic extracted directly from src/components/ui/MultiCategorySelector.tsx
  function toggleCategory(
    selectedCategories: string[],
    catSlug: string,
    minRequired: number = 1
  ): string[] {
    if (selectedCategories.includes(catSlug)) {
      if (selectedCategories.length <= minRequired) {
        return selectedCategories; // Cannot deselect below minRequired
      }
      return selectedCategories.filter((c) => c !== catSlug);
    }
    return [...selectedCategories, catSlug];
  }

  function selectAllInGroup(
    selectedCategories: string[],
    groupCategories: Array<{ slug: string }>
  ): string[] {
    const toAdd = groupCategories
      .map((c) => c.slug)
      .filter((slug) => !selectedCategories.includes(slug));
    return toAdd.length > 0 ? [...selectedCategories, ...toAdd] : selectedCategories;
  }

  function clearInGroup(
    selectedCategories: string[],
    groupCategories: Array<{ slug: string }>,
    minRequired: number = 1
  ): string[] {
    const slugsInGroup = new Set(groupCategories.map((c) => c.slug));
    const remaining = selectedCategories.filter((slug) => !slugsInGroup.has(slug));

    if (remaining.length >= minRequired) {
      return remaining;
    }
    if (remaining.length === 0 && groupCategories.length > 0) {
      // Keep at least the first one if minRequired applies
      return [groupCategories[0].slug];
    }
    return remaining;
  }

  function resolveActiveMainSlug(groups: TaxonomyGroup[], currentSlug: string): string {
    if (groups.length === 0) return 'sports';
    if (!groups.some((g) => g.slug === currentSlug)) {
      return groups[0].slug;
    }
    return currentSlug;
  }

  const mockTaxonomy: TaxonomyGroup[] = [
    {
      id: 'grp-sports',
      name: 'Sports & Athletics',
      slug: 'sports',
      categories: [
        { id: 'cat-badminton', name: 'Badminton', slug: 'badminton', icon: '🏸' },
        { id: 'cat-football', name: 'Football', slug: 'football', icon: '⚽' },
        { id: 'cat-tennis', name: 'Tennis', slug: 'tennis', icon: '🎾' },
      ],
    },
    {
      id: 'grp-cognitive',
      name: 'Cognitive & Mind Sports',
      slug: 'cognitive-mind',
      categories: [
        { id: 'cat-chess', name: 'Chess', slug: 'chess', icon: '♟️' },
        { id: 'cat-robotics', name: 'Robotics & Coding', slug: 'robotics', icon: '🤖' },
      ],
    },
  ];

  describe('Category Selection & Minimum Requirement Guard', () => {
    it('should allow selecting an additional category', () => {
      const initial = ['badminton'];
      const updated = toggleCategory(initial, 'tennis', 1);
      assert.deepStrictEqual(updated, ['badminton', 'tennis']);
    });

    it('should deselect a category when above minimum requirement', () => {
      const initial = ['badminton', 'tennis'];
      const updated = toggleCategory(initial, 'tennis', 1);
      assert.deepStrictEqual(updated, ['badminton']);
    });

    it('should reject deselecting a category when at minRequired threshold', () => {
      const initial = ['badminton'];
      const attemptDeselect = toggleCategory(initial, 'badminton', 1);
      // Guard retains at least 1 category
      assert.deepStrictEqual(attemptDeselect, ['badminton']);
    });

    it('should respect custom minRequired threshold (e.g. 2)', () => {
      const initial = ['badminton', 'football'];
      const attempt = toggleCategory(initial, 'badminton', 2);
      assert.deepStrictEqual(attempt, ['badminton', 'football']);
    });
  });

  describe('Group Bulk Selection & Clearing', () => {
    it('should select all unselected categories in the active taxonomy group', () => {
      const initial = ['badminton'];
      const updated = selectAllInGroup(initial, mockTaxonomy[0].categories);
      assert.deepStrictEqual(updated, ['badminton', 'football', 'tennis']);
    });

    it('should no-op when all categories in group are already selected', () => {
      const initial = ['badminton', 'football', 'tennis'];
      const updated = selectAllInGroup(initial, mockTaxonomy[0].categories);
      assert.deepStrictEqual(updated, initial);
    });

    it('should clear categories in group while leaving other groups intact', () => {
      const initial = ['badminton', 'football', 'chess'];
      const updated = clearInGroup(initial, mockTaxonomy[0].categories, 1);
      assert.deepStrictEqual(updated, ['chess']);
    });

    it('should retain first category when clearing group would reduce below minRequired of 1', () => {
      const initial = ['badminton', 'football'];
      const updated = clearInGroup(initial, mockTaxonomy[0].categories, 1);
      // Retains at least 1 category from the group to satisfy minRequired
      assert.deepStrictEqual(updated, ['badminton']);
    });
  });

  describe('Group Slug Resolution & Fallback', () => {
    it('should preserve valid active group slug', () => {
      const resolved = resolveActiveMainSlug(mockTaxonomy, 'cognitive-mind');
      assert.strictEqual(resolved, 'cognitive-mind');
    });

    it('should reset to first available group when active slug is not found in taxonomy', () => {
      const resolved = resolveActiveMainSlug(mockTaxonomy, 'non-existent-group');
      assert.strictEqual(resolved, 'sports');
    });

    it('should default to sports when taxonomy array is empty', () => {
      const resolved = resolveActiveMainSlug([], 'anything');
      assert.strictEqual(resolved, 'sports');
    });
  });
});
