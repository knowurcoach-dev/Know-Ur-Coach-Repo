import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 23: Bookmarks Synchronization & Optimistic Rollback Engine Tests', () => {
  // Replicating getStoredBookmarks / setStoredBookmarks logic from useBookmarks.ts
  function parseStoredBookmarks(raw: string | null): string[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  // Simulated Bookmark State Machine
  class BookmarkStore {
    savedIds: string[];
    toastMessages: string[] = [];
    serverFailMode: boolean = false;

    constructor(initialIds: string[] = []) {
      this.savedIds = [...initialIds];
    }

    async toggleBookmark(centreId: string, centreName: string = 'Academy'): Promise<boolean> {
      if (!centreId) return false;

      const currentlySaved = this.savedIds.includes(centreId);
      const nextSaved = !currentlySaved;

      // 1. Optimistic update
      const previousIds = [...this.savedIds];
      this.savedIds = nextSaved
        ? [...this.savedIds, centreId]
        : this.savedIds.filter((id) => id !== centreId);

      // 2. User toast feedback
      this.toastMessages.push(
        nextSaved
          ? `❤️ Saved ${centreName} to your shortlist`
          : `Removed ${centreName} from shortlist`
      );

      // 3. Simulated server sync
      if (this.serverFailMode) {
        // Rollback optimistic update on server error
        this.savedIds = previousIds;
        this.toastMessages.push('⚠️ Could not update bookmark on server. Please try again.');
        return currentlySaved;
      }

      return nextSaved;
    }
  }

  describe('LocalStorage Data Parsing & Error Recovery', () => {
    it('should parse valid JSON array of academy IDs', () => {
      const raw = JSON.stringify(['acad-delhi-01', 'acad-agra-02']);
      const parsed = parseStoredBookmarks(raw);
      assert.deepStrictEqual(parsed, ['acad-delhi-01', 'acad-agra-02']);
    });

    it('should return empty array for null, undefined, or empty string', () => {
      assert.deepStrictEqual(parseStoredBookmarks(null), []);
      assert.deepStrictEqual(parseStoredBookmarks(''), []);
    });

    it('should recover gracefully from corrupted or malformed JSON string', () => {
      const corruptJson = '{"broken": [true';
      const parsed = parseStoredBookmarks(corruptJson);
      assert.deepStrictEqual(parsed, []);
    });

    it('should return empty array if stored data is not an array (e.g. object or number)', () => {
      assert.deepStrictEqual(parseStoredBookmarks('{"id": "acad-1"}'), []);
      assert.deepStrictEqual(parseStoredBookmarks('12345'), []);
      assert.deepStrictEqual(parseStoredBookmarks('"string_only"'), []);
    });
  });

  describe('Optimistic Toggle State Mutations', () => {
    it('should optimistically add academy to shortlist and emit success toast', async () => {
      const store = new BookmarkStore(['acad-01']);

      const nextSaved = await store.toggleBookmark('acad-02', 'Delhi Tennis Academy');

      assert.strictEqual(nextSaved, true);
      assert.deepStrictEqual(store.savedIds, ['acad-01', 'acad-02']);
      assert.ok(store.toastMessages.includes('❤️ Saved Delhi Tennis Academy to your shortlist'));
    });

    it('should optimistically remove academy from shortlist when already saved', async () => {
      const store = new BookmarkStore(['acad-01', 'acad-02']);

      const nextSaved = await store.toggleBookmark('acad-01', 'Agra Badminton Star');

      assert.strictEqual(nextSaved, false);
      assert.deepStrictEqual(store.savedIds, ['acad-02']);
      assert.ok(store.toastMessages.includes('Removed Agra Badminton Star from shortlist'));
    });
  });

  describe('Server Failure Rollback Safety', () => {
    it('should immediately rollback state and display error toast when server sync fails', async () => {
      const store = new BookmarkStore(['acad-01']);
      store.serverFailMode = true; // Simulate network or server error

      const result = await store.toggleBookmark('acad-02', 'Agra Tennis Club');

      // Returns previous state (false)
      assert.strictEqual(result, false);

      // Store should remain rolled back to original ['acad-01']
      assert.deepStrictEqual(store.savedIds, ['acad-01']);

      // Error toast emitted
      assert.ok(
        store.toastMessages.includes('⚠️ Could not update bookmark on server. Please try again.')
      );
    });
  });
});
