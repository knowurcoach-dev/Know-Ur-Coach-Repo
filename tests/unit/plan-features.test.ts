import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  parseFeatures,
  formatFeaturesToText,
  serializeFeatureItems,
  PlanFeature,
} from '@/lib/plan-features';

describe('Phase 6: Plan Features Parsing & Serialization Utility Tests', () => {
  const fallbackDefaults: PlanFeature[] = [
    { text: 'Verified Directory Listing', included: true },
    { text: 'Roster Management', included: true },
    { text: 'Top #1 Priority', included: false },
  ];

  describe('parseFeatures()', () => {
    it('should return fallback defaults when input is null, undefined, or empty string', () => {
      assert.deepStrictEqual(parseFeatures(null, fallbackDefaults), fallbackDefaults);
      assert.deepStrictEqual(parseFeatures(undefined, fallbackDefaults), fallbackDefaults);
      assert.deepStrictEqual(parseFeatures('', fallbackDefaults), fallbackDefaults);
      assert.deepStrictEqual(parseFeatures('   ', fallbackDefaults), fallbackDefaults);
    });

    it('should parse newline-separated plain text into included and excluded features', () => {
      const rawText = `
        Verified Academy Profile
        Unlimited Student Leads
        - Top #1 Priority in Locality
        ❌ Golden Safety Trust Badge
      `;

      const features = parseFeatures(rawText, fallbackDefaults);
      assert.strictEqual(features.length, 4);

      assert.strictEqual(features[0].text, 'Verified Academy Profile');
      assert.strictEqual(features[0].included, true);

      assert.strictEqual(features[1].text, 'Unlimited Student Leads');
      assert.strictEqual(features[1].included, true);

      // Excluded with hyphen prefix
      assert.strictEqual(features[2].text, 'Top #1 Priority in Locality');
      assert.strictEqual(features[2].included, false);

      // Excluded with cross icon
      assert.strictEqual(features[3].text, 'Golden Safety Trust Badge');
      assert.strictEqual(features[3].included, false);
    });

    it('should automatically set highlight flag on key premier selling points', () => {
      const rawText = `
        #1 Top Locality Ranking
        Golden Verified Premier Academy Badge
        Instant WhatsApp lead alerts to coach
        Regular Batch Management
      `;

      const features = parseFeatures(rawText);
      assert.strictEqual(features[0].highlight, true); // '#1'
      assert.strictEqual(features[1].highlight, true); // 'Gold'
      assert.strictEqual(features[2].highlight, true); // 'WhatsApp'
      assert.strictEqual(features[3].highlight, false); // Regular
    });

    it('should parse JSON-encoded string from database column', () => {
      const jsonFeatures = JSON.stringify([
        { text: 'National Directory Listing', included: true },
        { text: 'Attendance Roster', included: true },
        { text: 'Priority Search', included: false },
      ]);

      const parsed = parseFeatures(jsonFeatures);
      assert.strictEqual(parsed.length, 3);
      assert.strictEqual(parsed[0].text, 'National Directory Listing');
      assert.strictEqual(parsed[0].included, true);
      assert.strictEqual(parsed[2].included, false);
    });
  });

  describe('formatFeaturesToText() for Admin Textarea', () => {
    it('should format PlanFeature[] into clean multiline text, prefixing excluded items with hyphen', () => {
      const items: PlanFeature[] = [
        { text: 'Feature One', included: true },
        { text: 'Feature Two', included: false },
        { text: 'Feature Three', included: true },
      ];

      const text = formatFeaturesToText(items);
      const lines = text.split('\n');
      assert.strictEqual(lines[0], 'Feature One');
      assert.strictEqual(lines[1], '- Feature Two');
      assert.strictEqual(lines[2], 'Feature Three');
    });

    it('should return fallback text when input is null or empty', () => {
      assert.strictEqual(formatFeaturesToText(null, 'Default point'), 'Default point');
      assert.strictEqual(formatFeaturesToText('', 'Default point'), 'Default point');
    });
  });

  describe('serializeFeatureItems() for Database Persistence', () => {
    it('should serialize feature list into clean valid JSON string for database storage', () => {
      const items: PlanFeature[] = [
        { text: 'Feature One', included: true },
        { text: 'Feature Two', included: false },
        { text: '   ', included: true }, // Blank item should be filtered out
      ];

      const serialized = serializeFeatureItems(items);
      const deserialized = JSON.parse(serialized);

      assert.strictEqual(deserialized.length, 2);
      assert.strictEqual(deserialized[0].text, 'Feature One');
      assert.strictEqual(deserialized[0].included, true);
      assert.strictEqual(deserialized[1].text, 'Feature Two');
      assert.strictEqual(deserialized[1].included, false);
    });
  });
});
