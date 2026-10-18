export interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

/**
 * Normalizes any stored feature data (JSON array, JSON string, or multiline string)
 * into a clean, human-readable multiline string for textareas (1 point per line).
 */
export function formatFeaturesToText(raw: any, fallbackText: string = ''): string {
  if (raw === null || raw === undefined) return fallbackText;

  // If already an array
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const prefix = item.included === false ? '- ' : '';
          return `${prefix}${item.text || item.name || item.title || ''}`;
        }
        return String(item);
      })
      .filter(Boolean)
      .join('\n');
  }

  if (typeof raw !== 'string') return String(raw);

  const trimmed = raw.trim();
  if (!trimmed) return fallbackText;

  // Check if it's JSON encoded (e.g. '["point 1", "point 2"]')
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object') {
              const prefix = item.included === false ? '- ' : '';
              return `${prefix}${item.text || item.name || item.title || ''}`;
            }
            return String(item);
          })
          .filter(Boolean)
          .join('\n');
      }
    } catch {
      // Fall through to plain text handling
    }
  }

  // If it's already a clean multiline or comma separated text
  return trimmed;
}

/**
 * Parses any plan feature representation (JSON array, string, multiline)
 * into structured PlanFeature[] for rendering feature lists on pricing cards.
 */
export function parseFeatures(
  raw: any,
  defaultFeatures: PlanFeature[] = []
): PlanFeature[] {
  if (raw === null || raw === undefined) return defaultFeatures;

  let items: any[] = [];

  // Check if it's an array
  if (Array.isArray(raw)) {
    items = raw;
  } else if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return defaultFeatures;

    // Check if JSON encoded
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          items = parsed;
        } else if (parsed && typeof parsed === 'object') {
          items = parsed.features || Object.values(parsed);
        }
      } catch {
        // Fall back to newline split
        items = trimmed.split('\n');
      }
    } else {
      items = trimmed.split('\n');
    }
  }

  if (!items || items.length === 0) return defaultFeatures;

  const result: PlanFeature[] = items
    .map((item) => {
      if (item && typeof item === 'object') {
        const text = String(item.text || item.name || item.title || '').trim();
        if (!text) return null;
        return {
          text: text.replace(/^[-+✕✓*•❌✅]\s*/, '').replace(/^(no|excluded):\s*/i, ''),
          included: item.included !== false && !text.startsWith('-'),
          highlight: Boolean(item.highlight),
        };
      }

      const line = String(item || '').trim();
      if (!line) return null;

      // Handle brackets or quote artifacts if any remain
      const cleanLine = line.replace(/^[\["'\s]+|[\]"'\s]+$/g, '').trim();
      if (!cleanLine) return null;

      const isExcluded =
        cleanLine.startsWith('-') ||
        cleanLine.startsWith('✕') ||
        cleanLine.startsWith('❌') ||
        cleanLine.toLowerCase().startsWith('no:') ||
        cleanLine.toLowerCase().startsWith('excluded:');

      const isHighlight =
        cleanLine.includes('#1') ||
        cleanLine.toLowerCase().includes('priority') ||
        cleanLine.toLowerCase().includes('gold') ||
        cleanLine.toLowerCase().includes('whatsapp');

      const finalText = cleanLine
        .replace(/^[-+✕✓*•❌✅]\s*/, '')
        .replace(/^(no|excluded):\s*/i, '');

      return {
        text: finalText,
        included: !isExcluded,
        highlight: isHighlight,
      };
    })
    .filter(Boolean) as PlanFeature[];

  return result.length > 0 ? result : defaultFeatures;
}

/**
 * Serializes PlanFeature[] into a clean JSON string for database storage
 * in PlatformConfig (freePlanFeatures, standardPlanFeatures, premiumPlanFeatures).
 */
export function serializeFeatureItems(items: PlanFeature[]): string {
  if (!items || items.length === 0) return '';
  return JSON.stringify(
    items
      .map((it) => ({
        text: (it.text || '').trim(),
        included: it.included !== false,
        ...(it.highlight ? { highlight: true } : {}),
      }))
      .filter((it) => it.text.length > 0)
  );
}
