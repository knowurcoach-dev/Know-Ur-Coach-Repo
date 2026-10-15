import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logAdminAction } from '@/lib/audit';

export interface AcademyReviewItem {
  id: string;
  coachingCentreId: string;
  academyName?: string;
  userId: string;
  parentName: string;
  parentPhone?: string | null;
  parentEmail?: string | null;
  childName?: string | null;
  batchName?: string | null;
  rating: number;
  comment?: string | null;
  images: string[];
  isVerifiedEnrollment: boolean;
  status: string;
  coachReply?: string | null;
  repliedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  helpfulCount?: number;
}

export interface ReviewEligibilityResult {
  isEligible: boolean;
  reason: 'LOGGED_OUT' | 'NOT_PARENT' | 'NOT_ENROLLED' | 'ELIGIBLE';
  message: string;
  parentName?: string;
  enrolledChildren?: Array<{
    childName: string;
    batchName: string;
    bookingId: string;
  }>;
  existingReview?: AcademyReviewItem | null;
}

/**
 * Checks whether the currently logged in user is a parent with an active/confirmed
 * enrollment booking for the specified coaching centre.
 */
export async function checkParentReviewEligibility(academyId: string): Promise<ReviewEligibilityResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return {
        isEligible: false,
        reason: 'LOGGED_OUT',
        message: 'Sign in to share your verified parent review.',
      };
    }

    const user = session.user as any;
    const userId = user.id;

    // Check if user has an existing review for this academy
    const existing = await (prisma as any).review.findFirst({
      where: {
        coachingCentreId: academyId,
        userId: userId,
      },
    });

    const mappedExisting = existing
      ? {
          ...existing,
          createdAt: existing.createdAt.toISOString(),
          updatedAt: existing.updatedAt?.toISOString(),
          repliedAt: existing.repliedAt?.toISOString() || null,
        }
      : null;

    // Super Admin is always granted audit review rights for testing/moderation
    if (user.role === 'ADMIN') {
      return {
        isEligible: true,
        reason: 'ELIGIBLE',
        message: 'Platform Admin Audit Mode: Review authorized.',
        parentName: user.name || 'Platform Inspector',
        enrolledChildren: [
          { childName: 'Demo Student (Admin Audit)', batchName: 'All Batches', bookingId: 'admin-audit' },
        ],
        existingReview: mappedExisting,
      };
    }

    // Must have a parent role
    if (user.role !== 'PARENT' && user.role !== 'USER') {
      return {
        isEligible: false,
        reason: 'NOT_PARENT',
        message: 'Only parents of enrolled students can review coaching academies.',
        existingReview: mappedExisting,
      };
    }

    // Lookup ParentProfile
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId },
      include: {
        children: true,
        bookings: {
          where: {
            coachingCentreId: academyId,
          },
          include: {
            child: true,
            batch: true,
          },
        },
      },
    });

    if (!parentProfile || !parentProfile.bookings || parentProfile.bookings.length === 0) {
      return {
        isEligible: false,
        reason: 'NOT_ENROLLED',
        message: 'Only parents with a child enrolled in this academy can post verified reviews.',
        existingReview: mappedExisting,
      };
    }

    const enrolledChildren = parentProfile.bookings.map((b) => ({
      childName: b.child?.fullName || 'Enrolled Child',
      batchName: b.batch?.name || 'Verified Regular Batch',
      bookingId: b.id,
    }));

    return {
      isEligible: true,
      reason: 'ELIGIBLE',
      message: 'Verified enrolled parent. You are authorized to review this academy.',
      parentName: parentProfile.fullName || user.name || 'Verified Parent',
      enrolledChildren,
      existingReview: mappedExisting,
    };
  } catch (err: any) {
    console.error('[checkParentReviewEligibility error]:', err);
    return {
      isEligible: false,
      reason: 'NOT_ENROLLED',
      message: 'Could not verify academy enrollment at this time.',
    };
  }
}

/**
 * Submits or updates a verified parent review for an academy
 */
export async function submitAcademyReview(data: {
  academyId: string;
  rating: number;
  comment?: string;
  images?: string[];
  childName?: string;
  batchName?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, message: 'You must be signed in to submit a review.' };
    }

    const user = session.user as any;
    const userId = user.id;

    // Verify rating bounds
    const rating = Math.min(5, Math.max(1, Math.round(Number(data.rating) || 5)));

    // Verify enrollment eligibility
    const eligibility = await checkParentReviewEligibility(data.academyId);
    if (!eligibility.isEligible && user.role !== 'ADMIN') {
      return { success: false, message: eligibility.message };
    }

    const cleanComment = (data.comment || '').trim();
    const cleanImages = Array.isArray(data.images) ? data.images.filter(Boolean) : [];
    const parentName = eligibility.parentName || user.name || 'Verified Parent';
    const parentPhone = user.phone || null;
    const childName = data.childName || eligibility.enrolledChildren?.[0]?.childName || 'Enrolled Student';
    const batchName = data.batchName || eligibility.enrolledChildren?.[0]?.batchName || 'General Batch';

    // Check if an existing review exists to update or insert
    const existing = await (prisma as any).review.findFirst({
      where: {
        coachingCentreId: data.academyId,
        userId: userId,
      },
    });

    let savedReview;
    if (existing) {
      savedReview = await (prisma as any).review.update({
        where: { id: existing.id },
        data: {
          rating,
          comment: cleanComment,
          images: cleanImages,
          childName,
          batchName,
          status: 'APPROVED',
          updatedAt: new Date(),
        },
      });
    } else {
      savedReview = await (prisma as any).review.create({
        data: {
          coachingCentreId: data.academyId,
          userId: userId,
          rating,
          comment: cleanComment,
          images: cleanImages,
          parentName,
          parentPhone,
          childName,
          batchName,
          isVerifiedEnrollment: true,
          status: 'APPROVED',
        },
      });
    }

    // Dynamically recalculate and update academy average rating & reviewsCount
    await recalculateAcademyRating(data.academyId);

    // Audit log
    await logAdminAction({
      actorEmail: user.email || 'parent@knowurcoach.in',
      actorRole: user.role || 'PARENT',
      action: existing ? 'ACADEMY_REVIEW_UPDATED' : 'ACADEMY_REVIEW_CREATED',
      targetModel: 'Review',
      targetId: savedReview.id,
      details: {
        academyId: data.academyId,
        rating,
        childName,
        imagesCount: cleanImages.length,
      },
    });

    return {
      success: true,
      message: 'Thank you! Your verified review has been published.',
      review: {
        ...savedReview,
        createdAt: savedReview.createdAt.toISOString(),
      },
    };
  } catch (err: any) {
    console.error('[submitAcademyReview error]:', err);
    return { success: false, message: err?.message || 'Failed to submit review.' };
  }
}

/**
 * Recalculates and updates the coaching centre's rating and reviews count
 */
export async function recalculateAcademyRating(academyId: string) {
  try {
    const approvedReviews = await (prisma as any).review.findMany({
      where: {
        coachingCentreId: academyId,
        status: 'APPROVED',
      },
      select: { rating: true },
    });

    const reviewsCount = approvedReviews.length;
    let avgRating = 5.0;

    if (reviewsCount > 0) {
      const sum = approvedReviews.reduce((acc: number, r: any) => acc + (Number(r.rating) || 5), 0);
      avgRating = Number((sum / reviewsCount).toFixed(1));
    }

    await prisma.coachingCentre.update({
      where: { id: academyId },
      data: {
        rating: avgRating,
        reviewsCount: reviewsCount,
      },
    });

    return { rating: avgRating, reviewsCount };
  } catch (err) {
    console.warn('[recalculateAcademyRating error]:', err);
    return null;
  }
}

/**
 * Retrieves all approved reviews for a given academy with breakdown distribution
 */
export async function getAcademyReviews(academyId: string) {
  try {
    const reviews = await (prisma as any).review.findMany({
      where: {
        coachingCentreId: academyId,
        status: 'APPROVED',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Rating breakdown (counts of 5, 4, 3, 2, 1 stars)
    const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r: any) => {
      const star = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5)));
      breakdown[star] = (breakdown[star] || 0) + 1;
    });

    const total = reviews.length;
    const avg =
      total > 0
        ? Number(
            (
              reviews.reduce((acc: number, r: any) => acc + (Number(r.rating) || 5), 0) / total
            ).toFixed(1)
          )
        : 5.0;

    const mapped = reviews.map((r: any) => ({
      id: r.id,
      coachingCentreId: r.coachingCentreId,
      userId: r.userId,
      parentName: r.parentName || r.user?.name || 'Verified Parent',
      parentEmail: r.user?.email || null,
      parentPhone: r.parentPhone || null,
      childName: r.childName || null,
      batchName: r.batchName || null,
      rating: r.rating,
      comment: r.comment || '',
      images: Array.isArray(r.images) ? r.images : [],
      isVerifiedEnrollment: Boolean(r.isVerifiedEnrollment),
      status: r.status,
      coachReply: r.coachReply || null,
      repliedAt: r.repliedAt ? r.repliedAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
    }));

    return {
      success: true,
      reviews: mapped,
      totalCount: total,
      averageRating: avg,
      breakdown,
    };
  } catch (err: any) {
    console.error('[getAcademyReviews error]:', err);
    return {
      success: false,
      reviews: [],
      totalCount: 0,
      averageRating: 5.0,
      breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }
}

/**
 * Retrieves all parent reviews across all academies for the System Admin table
 */
export async function getAllReviewsForAdmin(limit = 100) {
  try {
    const reviews = await (prisma as any).review.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        centre: {
          select: {
            id: true,
            name: true,
            locality: true,
            city: true,
            headCoachName: true,
            category: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return reviews.map((r: any) => ({
      id: r.id,
      coachingCentreId: r.coachingCentreId,
      academyName: r.centre?.name || 'Academy',
      academyLocality: r.centre?.locality || '',
      headCoachName: r.centre?.headCoachName || '',
      userId: r.userId,
      parentName: r.parentName || r.user?.name || 'Parent',
      parentEmail: r.user?.email || null,
      parentPhone: r.parentPhone || r.user?.phone || null,
      childName: r.childName || null,
      batchName: r.batchName || null,
      rating: r.rating,
      comment: r.comment || '',
      images: Array.isArray(r.images) ? r.images : [],
      isVerifiedEnrollment: Boolean(r.isVerifiedEnrollment),
      status: r.status || 'APPROVED',
      coachReply: r.coachReply || null,
      repliedAt: r.repliedAt ? r.repliedAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch (err: any) {
    console.error('[getAllReviewsForAdmin error]:', err);
    return [];
  }
}

/**
 * Admin action: toggle review status (APPROVED / HIDDEN / FLAGGED)
 */
export async function updateReviewStatusByAdmin(reviewId: string, status: 'APPROVED' | 'HIDDEN' | 'FLAGGED') {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return { success: false, message: 'Unauthorized. Admin role required.' };
    }

    const updated = await (prisma as any).review.update({
      where: { id: reviewId },
      data: { status },
      select: { coachingCentreId: true, id: true },
    });

    if (updated?.coachingCentreId) {
      await recalculateAcademyRating(updated.coachingCentreId);
    }

    await logAdminAction({
      actorEmail: session.user?.email || 'admin@knowurcoach.in',
      actorRole: 'ADMIN',
      action: `REVIEW_STATUS_${status}`,
      targetModel: 'Review',
      targetId: reviewId,
      details: { status },
    });

    return { success: true, message: `Review status changed to ${status}.` };
  } catch (err: any) {
    console.error('[updateReviewStatusByAdmin error]:', err);
    return { success: false, message: 'Failed to update review status.' };
  }
}

/**
 * Admin action: delete a review
 */
export async function deleteReviewByAdmin(reviewId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return { success: false, message: 'Unauthorized. Admin role required.' };
    }

    const review = await (prisma as any).review.findUnique({
      where: { id: reviewId },
      select: { coachingCentreId: true },
    });

    await (prisma as any).review.delete({
      where: { id: reviewId },
    });

    if (review?.coachingCentreId) {
      await recalculateAcademyRating(review.coachingCentreId);
    }

    await logAdminAction({
      actorEmail: session.user?.email || 'admin@knowurcoach.in',
      actorRole: 'ADMIN',
      action: 'REVIEW_DELETED',
      targetModel: 'Review',
      targetId: reviewId,
    });

    return { success: true, message: 'Review successfully removed.' };
  } catch (err: any) {
    console.error('[deleteReviewByAdmin error]:', err);
    return { success: false, message: 'Failed to delete review.' };
  }
}

// ========================================================
// HOMEPAGE TESTIMONIALS / PLATFORM REVIEWS MANAGEMENT
// ========================================================

import { PlatformReviewItem, INITIAL_PLATFORM_REVIEWS } from '@/lib/platform-reviews-data';
export type { PlatformReviewItem };
export { INITIAL_PLATFORM_REVIEWS };

/**
 * Retrieves all active homepage reviews from DB, seeding initial ones if empty
 */
export async function getHomepageReviews(): Promise<PlatformReviewItem[]> {
  try {
    const list = await (prisma as any).platformReview.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    if (!list || list.length === 0) {
      // Seed default testimonials into DB so Admin can modify them
      for (const item of INITIAL_PLATFORM_REVIEWS) {
        await (prisma as any).platformReview.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            name: item.name,
            location: item.location,
            childInfo: item.childInfo,
            discipline: item.discipline,
            quote: item.quote,
            rating: item.rating,
            avatarBg: item.avatarBg,
            initials: item.initials,
            order: item.order,
            isActive: item.isActive,
          },
          update: {},
        }).catch(() => null);
      }
      return INITIAL_PLATFORM_REVIEWS;
    }

    return list.map((r: any) => ({
      id: r.id,
      name: r.name,
      location: r.location,
      childInfo: r.childInfo,
      discipline: r.discipline,
      quote: r.quote,
      rating: r.rating,
      avatarBg: r.avatarBg,
      initials: r.initials,
      order: r.order,
      isActive: r.isActive,
    }));
  } catch (err) {
    console.warn('[getHomepageReviews fallback to defaults]:', err);
    return INITIAL_PLATFORM_REVIEWS;
  }
}

/**
 * Admin action: get all platform reviews (including inactive)
 */
export async function getAllHomepageReviewsForAdmin(): Promise<PlatformReviewItem[]> {
  try {
    const list = await (prisma as any).platformReview.findMany({
      orderBy: { order: 'asc' },
    });
    if (!list || list.length === 0) {
      return INITIAL_PLATFORM_REVIEWS;
    }
    return list;
  } catch (err) {
    return INITIAL_PLATFORM_REVIEWS;
  }
}

/**
 * Admin action: create or update a homepage review
 */
export async function saveHomepageReviewByAdmin(data: Partial<PlatformReviewItem>) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return { success: false, message: 'Unauthorized. Admin role required.' };
    }

    const name = (data.name || 'Parent').trim();
    const initials = name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'PR';

    if (data.id && !data.id.startsWith('new-')) {
      const updated = await (prisma as any).platformReview.update({
        where: { id: data.id },
        data: {
          name,
          location: data.location || 'Agra',
          childInfo: data.childInfo || 'Parent',
          discipline: data.discipline || 'Sports',
          quote: data.quote || '',
          rating: Number(data.rating) || 5,
          avatarBg: data.avatarBg || 'bg-emerald-600',
          initials,
          order: Number(data.order) || 0,
          isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        },
      });

      await logAdminAction({
        actorEmail: session.user?.email || 'admin@knowurcoach.in',
        actorRole: 'ADMIN',
        action: 'HOMEPAGE_REVIEW_UPDATED',
        targetModel: 'PlatformReview',
        targetId: data.id,
        details: { name },
      });

      return { success: true, message: 'Homepage review updated successfully!', item: updated };
    } else {
      const created = await (prisma as any).platformReview.create({
        data: {
          name,
          location: data.location || 'Agra',
          childInfo: data.childInfo || 'Parent',
          discipline: data.discipline || 'Sports',
          quote: data.quote || '',
          rating: Number(data.rating) || 5,
          avatarBg: data.avatarBg || 'bg-emerald-600',
          initials,
          order: Number(data.order) || 0,
          isActive: true,
        },
      });

      await logAdminAction({
        actorEmail: session.user?.email || 'admin@knowurcoach.in',
        actorRole: 'ADMIN',
        action: 'HOMEPAGE_REVIEW_CREATED',
        targetModel: 'PlatformReview',
        targetId: created.id,
        details: { name },
      });

      return { success: true, message: 'New homepage review created successfully!', item: created };
    }
  } catch (err: any) {
    console.error('[saveHomepageReviewByAdmin error]:', err);
    return { success: false, message: err?.message || 'Failed to save review.' };
  }
}

/**
 * Admin action: delete a homepage review
 */
export async function deleteHomepageReviewByAdmin(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return { success: false, message: 'Unauthorized. Admin role required.' };
    }

    await (prisma as any).platformReview.delete({
      where: { id },
    });

    await logAdminAction({
      actorEmail: session.user?.email || 'admin@knowurcoach.in',
      actorRole: 'ADMIN',
      action: 'HOMEPAGE_REVIEW_DELETED',
      targetModel: 'PlatformReview',
      targetId: id,
    });

    return { success: true, message: 'Homepage review deleted.' };
  } catch (err: any) {
    console.error('[deleteHomepageReviewByAdmin error]:', err);
    return { success: false, message: 'Failed to delete review.' };
  }
}
