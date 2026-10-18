import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PlanFeature } from '@/lib/plan-features';

describe('Phase 34: Dynamic Plan Features Editor State & Bulk Parsing Tests', () => {
  // Logic extracted directly from DynamicPlanFeaturesEditor.tsx
  function parseBulkFeatures(bulkText: string, currentFeatures: PlanFeature[]): PlanFeature[] {
    if (!bulkText.trim()) {
      return currentFeatures;
    }
    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const newFeatures: PlanFeature[] = lines.map((line) => {
      const isExcluded =
        line.startsWith('-') ||
        line.startsWith('✕') ||
        line.startsWith('❌') ||
        line.toLowerCase().startsWith('no:');
      const text = line
        .replace(/^[-+✕✓*•❌✅]\s*/, '')
        .replace(/^(no|excluded):\s*/i, '')
        .trim();
      return {
        text,
        included: !isExcluded,
        highlight: text.startsWith('#1') || text.includes('Golden'),
      };
    });

    return [...currentFeatures, ...newFeatures];
  }

  function moveFeatureUp(features: PlanFeature[], index: number): PlanFeature[] {
    if (index <= 0 || index >= features.length) return features;
    const updated = [...features];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    return updated;
  }

  function moveFeatureDown(features: PlanFeature[], index: number): PlanFeature[] {
    if (index < 0 || index >= features.length - 1) return features;
    const updated = [...features];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    return updated;
  }

  function addFeature(features: PlanFeature[], insertIndex?: number): PlanFeature[] {
    const newPoint: PlanFeature = { text: '', included: true };
    if (insertIndex !== undefined && insertIndex >= 0) {
      const updated = [...features];
      updated.splice(insertIndex + 1, 0, newPoint);
      return updated;
    }
    return [...features, newPoint];
  }

  function toggleIncluded(features: PlanFeature[], index: number): PlanFeature[] {
    if (index < 0 || index >= features.length) return features;
    const updated = [...features];
    updated[index] = {
      ...updated[index],
      included: updated[index].included === false ? true : false,
    };
    return updated;
  }

  function toggleHighlight(features: PlanFeature[], index: number): PlanFeature[] {
    if (index < 0 || index >= features.length) return features;
    const updated = [...features];
    updated[index] = {
      ...updated[index],
      highlight: !updated[index].highlight,
    };
    return updated;
  }

  function computeFeatureCounts(features: PlanFeature[]) {
    const includedCount = features.filter((f) => f.included !== false).length;
    const excludedCount = features.filter((f) => f.included === false).length;
    return { includedCount, excludedCount, total: features.length };
  }

  describe('Bulk Paste Parsing & Sanitization', () => {
    it('should correctly parse standard bulleted included features', () => {
      const rawText = `
        ✓ Certified NIS Badmintion Coach
        • Olympic standard synthetic turf
        + Free first trial kit included
      `;
      const result = parseBulkFeatures(rawText, []);

      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].text, 'Certified NIS Badmintion Coach');
      assert.strictEqual(result[0].included, true);
      assert.strictEqual(result[1].text, 'Olympic standard synthetic turf');
      assert.strictEqual(result[1].included, true);
      assert.strictEqual(result[2].text, 'Free first trial kit included');
      assert.strictEqual(result[2].included, true);
    });

    it('should detect excluded features via -, ✕, ❌, or no: prefixes', () => {
      const rawText = `
        - Personal locker facility
        ✕ Transport pick & drop
        ❌ AC waiting lounge
        no: Weekend tournament entry fee
      `;
      const result = parseBulkFeatures(rawText, []);

      assert.strictEqual(result.length, 4);
      assert.strictEqual(result[0].included, false);
      assert.strictEqual(result[0].text, 'Personal locker facility');
      assert.strictEqual(result[1].included, false);
      assert.strictEqual(result[1].text, 'Transport pick & drop');
      assert.strictEqual(result[2].included, false);
      assert.strictEqual(result[2].text, 'AC waiting lounge');
      assert.strictEqual(result[3].included, false);
      assert.strictEqual(result[3].text, 'Weekend tournament entry fee');
    });

    it('should automatically flag highlight for #1 ranking or Golden tier features', () => {
      const rawText = `
        #1 Top Rated Swimming Academy in Agra
        Golden Badge of Excellence verified by SAI
        Standard 3-day weekly sessions
      `;
      const result = parseBulkFeatures(rawText, []);

      assert.strictEqual(result[0].highlight, true);
      assert.strictEqual(result[1].highlight, true);
      assert.strictEqual(result[2].highlight, false);
    });

    it('should ignore empty lines and whitespace padding during bulk paste', () => {
      const rawText = `
        

        Valid Feature 1
        

        Valid Feature 2
        
      `;
      const result = parseBulkFeatures(rawText, []);
      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].text, 'Valid Feature 1');
      assert.strictEqual(result[1].text, 'Valid Feature 2');
    });

    it('should append bulk parsed items without clobbering existing features', () => {
      const existing: PlanFeature[] = [{ text: 'Existing Point', included: true }];
      const result = parseBulkFeatures('• New Point 1\n• New Point 2', existing);

      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].text, 'Existing Point');
      assert.strictEqual(result[1].text, 'New Point 1');
      assert.strictEqual(result[2].text, 'New Point 2');
    });
  });

  describe('Point Reordering & Boundary Conditions', () => {
    const sampleFeatures: PlanFeature[] = [
      { text: 'First Point', included: true },
      { text: 'Second Point', included: true },
      { text: 'Third Point', included: false },
    ];

    it('should move an item up by swapping with the predecessor', () => {
      const reordered = moveFeatureUp(sampleFeatures, 1);
      assert.strictEqual(reordered[0].text, 'Second Point');
      assert.strictEqual(reordered[1].text, 'First Point');
    });

    it('should no-op when trying to move the top item up', () => {
      const reordered = moveFeatureUp(sampleFeatures, 0);
      assert.deepStrictEqual(reordered, sampleFeatures);
    });

    it('should move an item down by swapping with the successor', () => {
      const reordered = moveFeatureDown(sampleFeatures, 1);
      assert.strictEqual(reordered[1].text, 'Third Point');
      assert.strictEqual(reordered[2].text, 'Second Point');
    });

    it('should no-op when trying to move the bottom item down', () => {
      const reordered = moveFeatureDown(sampleFeatures, 2);
      assert.deepStrictEqual(reordered, sampleFeatures);
    });

    it('should insert a blank point immediately after a specified index', () => {
      const inserted = addFeature(sampleFeatures, 0);
      assert.strictEqual(inserted.length, 4);
      assert.strictEqual(inserted[0].text, 'First Point');
      assert.strictEqual(inserted[1].text, '');
      assert.strictEqual(inserted[2].text, 'Second Point');
    });
  });

  describe('Feature Toggling & Metric Counter Accuracy', () => {
    it('should toggle included flag from true to false and vice-versa', () => {
      const features: PlanFeature[] = [{ text: 'Trial Pass', included: true }];
      const toggledOff = toggleIncluded(features, 0);
      assert.strictEqual(toggledOff[0].included, false);

      const toggledOn = toggleIncluded(toggledOff, 0);
      assert.strictEqual(toggledOn[0].included, true);
    });

    it('should toggle highlight flag cleanly', () => {
      const features: PlanFeature[] = [{ text: 'VIP Attention', included: true, highlight: false }];
      const highlighted = toggleHighlight(features, 0);
      assert.strictEqual(highlighted[0].highlight, true);

      const unhighlighted = toggleHighlight(highlighted, 0);
      assert.strictEqual(unhighlighted[0].highlight, false);
    });

    it('should compute exact counts for included and excluded plan items', () => {
      const features: PlanFeature[] = [
        { text: 'Feature 1', included: true },
        { text: 'Feature 2', included: false },
        { text: 'Feature 3', included: true },
        { text: 'Feature 4', included: false },
        { text: 'Feature 5', included: true },
      ];

      const stats = computeFeatureCounts(features);
      assert.strictEqual(stats.total, 5);
      assert.strictEqual(stats.includedCount, 3);
      assert.strictEqual(stats.excludedCount, 2);
    });
  });
});
