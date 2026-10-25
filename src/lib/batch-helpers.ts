import { getCategoryDisplayName, getCategoryEmoji } from './categories';

export interface BatchItemFormatted {
  id?: string;
  coachingCentreId?: string;
  name: string;
  schedule: string;
  pureSchedule: string;
  category?: string;
  categoryDisplayName?: string;
  categoryEmoji?: string;
  coachName?: string;
  ageGroup: string;
  totalSeats: number;
  seatsFilled?: number;
  monthlyFee: number;
  isAdmissionsOpen?: boolean;
  [key: string]: any;
}

/**
 * Serializes batch pure schedule, category slug, and coach name into a robust string.
 * Format: "Tue, Thu, Sat • 4:00 PM - 5:15 PM • [Category: badminton] • [Coach: Coach Rajesh]"
 */
export function serializeBatchSchedule(params: {
  schedule: string;
  category?: string;
  coachName?: string;
}): string {
  // Strip any existing metadata tags first to avoid duplicates
  let pure = (params.schedule || '')
    .replace(/•\s*\[Category:\s*[^\]]+\]/gi, '')
    .replace(/•\s*\[Coach:\s*[^\]]+\]/gi, '')
    .replace(/\[Category:\s*[^\]]+\]/gi, '')
    .replace(/\[Coach:\s*[^\]]+\]/gi, '')
    .trim();

  // Remove trailing bullet or dash if left over
  pure = pure.replace(/[•\-|]\s*$/, '').trim();

  const parts = [pure];

  if (params.category && params.category.trim()) {
    parts.push(`• [Category: ${params.category.trim().toLowerCase()}]`);
  }

  if (params.coachName && params.coachName.trim()) {
    parts.push(`• [Coach: ${params.coachName.trim()}]`);
  }

  return parts.join(' ').trim();
}

/**
 * Parses raw schedule string to extract pure schedule, category, and coach name.
 */
export function parseBatchSchedule(rawSchedule: string = ''): {
  pureSchedule: string;
  category?: string;
  coachName?: string;
} {
  if (!rawSchedule) {
    return { pureSchedule: '' };
  }

  let category: string | undefined;
  let coachName: string | undefined;

  const catMatch = rawSchedule.match(/\[Category:\s*([^\]]+)\]/i);
  if (catMatch && catMatch[1]) {
    category = catMatch[1].trim().toLowerCase();
  }

  const coachMatch = rawSchedule.match(/\[Coach:\s*([^\]]+)\]/i);
  if (coachMatch && coachMatch[1]) {
    coachName = coachMatch[1].trim();
  }

  let pure = rawSchedule
    .replace(/•\s*\[Category:\s*[^\]]+\]/gi, '')
    .replace(/•\s*\[Coach:\s*[^\]]+\]/gi, '')
    .replace(/\[Category:\s*[^\]]+\]/gi, '')
    .replace(/\[Coach:\s*[^\]]+\]/gi, '')
    .trim();

  pure = pure.replace(/[•\-|]\s*$/, '').trim();

  return {
    pureSchedule: pure || rawSchedule,
    category,
    coachName,
  };
}

/**
 * Formats a Batch DB object into an enriched BatchItemFormatted with category emoji and display names.
 */
export function formatBatchItem(batch: any, defaultCategory?: string): BatchItemFormatted {
  if (!batch) {
    return {
      name: '',
      schedule: '',
      pureSchedule: '',
      ageGroup: '',
      totalSeats: 15,
      monthlyFee: 1800,
    };
  }

  const parsed = parseBatchSchedule(batch.schedule || '');
  const safeDefault = typeof defaultCategory === 'string' ? defaultCategory : '';
  const rawCategory = typeof batch.category === 'string' 
    ? batch.category 
    : (typeof parsed.category === 'string' ? parsed.category : safeDefault);
  const category = (rawCategory || '').toLowerCase();
  const coachName = typeof batch.coachName === 'string' ? batch.coachName : (typeof parsed.coachName === 'string' ? parsed.coachName : undefined);
  const pureSchedule = parsed.pureSchedule || batch.schedule || '';

  const enrolledBookingsCount = Array.isArray(batch.bookings)
    ? batch.bookings.filter((b: any) => b.passType === 'MONTHLY_BATCH').length
    : 0;
  const trialBookingsCount = Array.isArray(batch.bookings)
    ? batch.bookings.filter((b: any) => b.passType === 'FREE_TRIAL').length
    : 0;

  const actualSeats = Math.max(
    Number(batch.seatsFilled) || 0,
    enrolledBookingsCount
  );

  return {
    id: batch.id,
    coachingCentreId: batch.coachingCentreId,
    name: batch.name || '',
    schedule: batch.schedule || '',
    pureSchedule,
    category: category || undefined,
    categoryDisplayName: category ? getCategoryDisplayName(category) : undefined,
    categoryEmoji: category ? getCategoryEmoji(category) : undefined,
    coachName,
    ageGroup: batch.ageGroup || '6 - 14 Yrs',
    totalSeats: Number(batch.totalSeats) || 15,
    seatsFilled: actualSeats,
    seats: `${actualSeats}/${Number(batch.totalSeats) || 15} Enrolled`,
    monthlyFee: Number(batch.monthlyFee) || 1800,
    isAdmissionsOpen: batch.isAdmissionsOpen ?? true,
    bookings: batch.bookings || undefined,
    trialCount: trialBookingsCount,
  };
}
