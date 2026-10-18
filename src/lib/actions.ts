"use server";

import prisma from "@/lib/prisma";
import { revalidatePath, updateTag, revalidateTag } from "next/cache";

function invalidateTag(tag: string) {
  try {
    updateTag(tag);
  } catch {
    try {
      revalidateTag(tag, { expire: 0 });
    } catch {
      // Non-fatal if invoked outside an active Next.js request lifecycle
    }
  }
}
import { getCachedDiscoveryData } from "@/lib/cached-queries";
import bcrypt from "bcryptjs";
import { KycStatus, SafetyGrade, SubscriptionPlan, CoachType, Role, PassType, EscrowStatus } from "@prisma/client";
import { logAdminAction } from "@/lib/audit";
import { PlatformCategory, getCategoryDisplayName } from "@/lib/categories";
import { DEFAULT_HERO_SLIDES, HeroSlideData } from "@/lib/hero-slides";
import { DEFAULT_HERO_CAROUSEL_THEME, HeroCarouselTheme } from "@/lib/hero-theme";
import { readHeroCarouselTheme, writeHeroCarouselTheme } from "@/lib/hero-theme-server";
import { sendBookingConfirmationEmail, sendCoachKycStatusEmail, sendWelcomeEmail } from "@/lib/mail";
import { buildStatusNotesWithDocs, parseDocsPayload, updateDocStatusInStatusNotes } from "@/lib/coach-docs";
import { formatBatchItem, serializeBatchSchedule } from "@/lib/batch-helpers";
import { verifyOtp } from "@/lib/otp";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import crypto from "crypto";

async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Unauthorized: Platform Administrator privileges required. Please sign in.");
  }

  const userRole = (session.user as any)?.role;
  const userEmail = (session.user as any)?.email?.toLowerCase();
  const isAdminRole =
    userRole === Role.ADMIN ||
    userRole === 'ADMIN' ||
    String(userRole).toUpperCase() === 'ADMIN';
  const isKnownAdminEmail =
    userEmail === 'admin@knowurcoach.in' ||
    userEmail === 'admin.rawat@knowurcoach.com';

  if (!isAdminRole && !isKnownAdminEmail) {
    throw new Error("Unauthorized: Platform Administrator privileges required.");
  }

  return session;
}

async function requireAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Unauthorized: Please sign in to perform this action.");
  }
  return session.user as any;
}

async function requireParentSession() {
  const user = await requireAuthenticatedUser();
  const isAdmin = user.role === Role.ADMIN || user.email === 'admin@knowurcoach.in' || user.email === 'admin.rawat@knowurcoach.com';

  const parent = await prisma.parentProfile.findFirst({
    where: {
      OR: [
        { userId: user.id },
        { user: { email: { equals: user.email?.toLowerCase(), mode: 'insensitive' } } },
        ...(user.phone ? [{ user: { phone: user.phone } }] : []),
      ],
    },
    include: { user: true, children: true },
  });

  if (!parent && !isAdmin) {
    throw new Error("Unauthorized: Active parent account required.");
  }
  return { user, parent, isAdmin };
}

async function requireCoachSession(targetCentreId?: string) {
  const user = await requireAuthenticatedUser();
  const isAdmin = user.role === Role.ADMIN || user.email === 'admin@knowurcoach.in' || user.email === 'admin.rawat@knowurcoach.com';

  const centre = await prisma.coachingCentre.findFirst({
    where: targetCentreId
      ? { id: targetCentreId }
      : {
          OR: [
            { ownerUserId: user.id },
            { owner: { email: { equals: user.email?.toLowerCase(), mode: 'insensitive' } } },
            ...(user.phone ? [{ phone: user.phone }] : []),
          ],
        },
    include: { owner: true, batches: true },
  });

  if (!centre) {
    throw new Error("Coaching academy centre not found.");
  }

  const isOwner = centre.ownerUserId === user.id ||
    (centre.owner && centre.owner.email?.toLowerCase() === user.email?.toLowerCase()) ||
    (centre.phone && user.phone && centre.phone === user.phone);

  if (!isAdmin && !isOwner) {
    throw new Error("Access denied: You are not authorized to manage this coaching academy.");
  }

  return { user, centre, isAdmin };
}


// ==========================================
// 1. ATTENDANCE & CHECK-IN ACTIONS
// ==========================================

export interface StudentCheckInResult {
  success: boolean;
  studentId: string;
  studentName: string;
  batchId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  timestamp: string;
  message: string;
}

export async function checkInStudent(
  studentId: string,
  studentName?: string,
  batchId?: string,
  status: 'PRESENT' | 'ABSENT' | 'LATE' = 'PRESENT'
): Promise<StudentCheckInResult> {
  const timestamp = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const isPresent = status === 'PRESENT';

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return {
        success: false,
        studentId,
        studentName: studentName || 'Student',
        batchId: batchId || '',
        status,
        timestamp,
        message: 'Authentication required to check in students.',
      };
    }
    const user = session.user as any;
    const isAdmin = user.role === Role.ADMIN || user.email === 'admin@knowurcoach.in' || user.email === 'admin.rawat@knowurcoach.com';

    // 1. Attempt to find the booking by booking.id OR childId
    let booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { id: studentId },
          { childId: studentId },
        ],
      },
      include: {
        batch: true,
        child: true,
        centre: true,
      },
    });

    if (booking) {
      if (!isAdmin) {
        const coachCentre = await prisma.coachingCentre.findFirst({
          where: {
            OR: [
              { ownerUserId: user.id },
              { owner: { email: { equals: user.email?.toLowerCase(), mode: 'insensitive' } } },
              ...(user.phone ? [{ phone: user.phone }] : []),
            ],
          },
        });
        if (!coachCentre || booking.coachingCentreId !== coachCentre.id) {
          return {
            success: false,
            studentId,
            studentName: studentName || 'Student',
            batchId: batchId || '',
            status,
            timestamp,
            message: 'Unauthorized: Cannot check in student from another coaching academy.',
          };
        }
      }

      const effectiveBatchId = booking.batchId || batchId || '';
      const effectiveChildId = booking.childId;
      const effectiveName = studentName || booking.child?.fullName || 'Student';

      // 2. Check if an attendance entry already exists for today's session (same calendar date)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const existingToday = await prisma.attendance.findFirst({
        where: {
          bookingId: booking.id,
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      });

      if (existingToday) {
        await prisma.attendance.update({
          where: { id: existingToday.id },
          data: {
            isPresent,
            date: new Date(),
          },
        });
      } else {
        await prisma.attendance.create({
          data: {
            bookingId: booking.id,
            batchId: effectiveBatchId,
            childId: effectiveChildId,
            isPresent,
            date: new Date(),
          },
        });
      }

      // 3. Update booking check-in state
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          isCheckedIn: isPresent,
          checkedInAt: isPresent ? new Date() : null,
        },
      });

      // 4. Invalidate relevant caches across dashboards
      revalidatePath('/coach/dashboard');
      revalidatePath('/coach/attendance');
      revalidatePath('/parent/bookings');
      revalidatePath('/parent/passes');
      revalidatePath('/parent/dashboard');

      return {
        success: true,
        studentId,
        studentName: effectiveName,
        batchId: effectiveBatchId,
        status,
        timestamp,
        message: `Marked ${effectiveName} as ${status} at ${timestamp}`,
      };
    }
  } catch (err) {
    console.warn("DB checkInStudent error:", err);
  }

  return {
    success: false,
    studentId,
    studentName: studentName || 'Student',
    batchId: batchId || '',
    status,
    timestamp,
    message: `Could not find active booking to check in ${studentName || 'student'}.`,
  };
}

// ==========================================
// 2. TRIAL & SESSION BOOKING ACTIONS
// ==========================================

export interface TrialBookingResult {
  success: boolean;
  bookingId: string;
  centreId: string;
  childName: string;
  date: string;
  timeSlot: string;
  feePaid: number;
  qrCode: string;
  status: 'CONFIRMED' | 'PENDING' | 'ALREADY_BOOKED' | 'CANCELLED';
  message: string;
  isExisting?: boolean;
}

// Helper to resolve parent profile
async function resolveParentProfile(parentEmail?: string, parentName?: string, parentPhone?: string) {
  const cleanEmail = parentEmail?.trim().toLowerCase();

  // Strictly return null if no email is provided (prevent unauthenticated guests from resolving default parents)
  if (!cleanEmail) {
    return null;
  }

  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: cleanEmail, mode: 'insensitive' } },
        { phone: cleanEmail },
        { id: cleanEmail },
      ],
    },
    include: { parentProfile: { include: { children: true } } },
  });

  if (user) {
    if (user.parentProfile) {
      return user.parentProfile;
    }
    // If user exists without parentProfile (e.g. Admin or Coach exploring parent features), create one for this user
    const newParent = await prisma.parentProfile.create({
      data: {
        userId: user.id,
        fullName: (user as any).name || parentName || 'Verified Parent Member',
        locality: 'Kamla Nagar',
        city: 'Agra',
      },
      include: { children: true },
    });
    return newParent;
  }

  // If user does not exist but parentName is explicitly provided during a flow
  if (parentName) {
    const newUser = await prisma.user.create({
      data: {
        id: `usr-parent-${Date.now()}`,
        email: cleanEmail,
        phone: parentPhone || '+91 98370 11222',
        role: Role.PARENT,
        parentProfile: {
          create: {
            fullName: parentName,
            locality: 'Kamla Nagar',
            city: 'Agra',
          },
        },
      },
      include: { parentProfile: { include: { children: true } } },
    });
    return newUser.parentProfile;
  }

  return null;
}

// Helper to resolve centre
async function resolveCentre(centreId?: string, centreName?: string) {
  let centre = null;
  if (centreId) {
    centre = await prisma.coachingCentre.findUnique({
      where: { id: centreId },
      include: { batches: true },
    });
  }
  if (!centre && centreName) {
    centre = await prisma.coachingCentre.findFirst({
      where: { name: { contains: centreName.trim(), mode: 'insensitive' } },
      include: { batches: true },
    });
  }
  if (!centre) {
    centre = await prisma.coachingCentre.findFirst({
      include: { batches: true },
    });
  }
  return centre;
}

// Helper to resolve children
async function resolveChildren(parent: any, childNames?: string[], childIds?: string[], singleChildName?: string, singleChildId?: string) {
  const children: any[] = [];
  const existingChildren = parent.children || [];

  const ids = childIds && childIds.length > 0 ? childIds : (singleChildId ? [singleChildId] : []);
  for (const id of ids) {
    const match = existingChildren.find((c: any) => c.id === id);
    if (match && !children.find((c: any) => c.id === match.id)) {
      children.push(match);
    }
  }

  const names = childNames && childNames.length > 0 ? childNames : (singleChildName ? [singleChildName] : []);
  for (const name of names) {
    if (!name || !name.trim()) continue;
    const cleanName = name.trim();
    let match = children.find((c: any) => c.fullName.toLowerCase() === cleanName.toLowerCase());
    if (!match) {
      match = existingChildren.find((c: any) => c.fullName.toLowerCase() === cleanName.toLowerCase());
    }
    if (!match) {
      match = await prisma.childProfile.create({
        data: {
          parentId: parent.id,
          fullName: cleanName,
          age: 8,
          grade: 'Grade 3',
          interests: [],
        },
      });
      existingChildren.push(match);
    }
    if (match && !children.find((c: any) => c.id === match.id)) {
      children.push(match);
    }
  }

  if (children.length === 0 && existingChildren.length > 0) {
    children.push(existingChildren[0]);
  }

  return children;
}

export async function bookTrialSession(data: {
  centreId: string;
  centreName: string;
  batchId?: string;
  batchName?: string;
  childName?: string;
  childNames?: string[];
  childId?: string;
  childIds?: string[];
  date: string;
  timeSlot: string;
  parentPhone?: string;
  parentEmail?: string;
  parentName?: string;
}): Promise<TrialBookingResult> {
  // Enforce authentication: Guest users must not be allowed to book trials without account
  if (!data.parentEmail || !data.parentEmail.trim()) {
    return {
      success: false,
      isExisting: false,
      bookingId: '',
      centreId: data.centreId,
      childName: data.childName || 'Child',
      date: data.date,
      timeSlot: data.timeSlot,
      feePaid: 0,
      qrCode: '',
      status: 'CANCELLED',
      message: 'Please log in or sign up to book a free trial session.',
    };
  }

  const primaryBookingId = `TRL-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const qrCode = `KUC-PASS-${primaryBookingId}`;

  try {
    const parent = await resolveParentProfile(data.parentEmail, data.parentName, data.parentPhone);
    if (!parent) {
      throw new Error('Parent profile could not be resolved. Please log in again.');
    }
    const centre = await resolveCentre(data.centreId, data.centreName);
    const children = await resolveChildren(parent, data.childNames, data.childIds, data.childName, data.childId);

    const newlyBookedChildren: any[] = [];
    const alreadyBookedChildren: any[] = [];
    let firstExistingBooking: any = null;
    let firstNewBookingId: string | null = null;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      // Check if child already has an active Free Trial booking for this centre
      const existingTrial = await prisma.booking.findFirst({
        where: {
          parentId: parent.id,
          childId: child.id,
          coachingCentreId: centre ? centre.id : null,
          passType: PassType.FREE_TRIAL,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingTrial) {
        alreadyBookedChildren.push({ child, passId: existingTrial.passId });
        if (!firstExistingBooking) firstExistingBooking = existingTrial;
      } else {
        const curBookingId = `TRL-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        if (!firstNewBookingId) firstNewBookingId = curBookingId;
        await prisma.booking.create({
          data: {
            passId: curBookingId,
            passType: PassType.FREE_TRIAL,
            parentId: parent.id,
            childId: child.id,
            coachingCentreId: centre ? centre.id : null,
            batchId: data.batchId || null,
            scheduledAt: new Date(),
            grossAmount: 0.00,
            creditApplied: 0.00,
            netAmountPaid: 0.00,
            escrowStatus: EscrowStatus.RELEASED_TO_COACH,
          },
        });

        if (centre) {
          await prisma.lead.create({
            data: {
              coachingCentreId: centre.id,
              parentName: parent.fullName || data.parentName || 'Parent',
              parentPhone: parent.emergencyContactPhone || data.parentPhone || '',
              childName: child.fullName,
              childAge: child.age || 8,
              inquiryNotes: `Free Trial Session - Date: ${data.date}, Slot: ${data.timeSlot}${data.batchName ? ` • Batch: ${data.batchName}` : ''}`,
              status: 'trial',
            },
          }).catch((err) => console.warn('Could not create lead on trial booking:', err));
        }

        newlyBookedChildren.push({ child, passId: curBookingId });
      }
    }

    revalidatePath('/parent/bookings');
    revalidatePath('/parent/dashboard');
    revalidatePath('/parent/passes');
    revalidatePath('/coach/leads');
    revalidatePath('/coach/attendance');
    revalidatePath('/coach/dashboard');

    // Case 1: ALL requested children already had an active trial pass for this centre
    if (newlyBookedChildren.length === 0 && alreadyBookedChildren.length > 0) {
      const existingPassId = firstExistingBooking?.passId || primaryBookingId;
      const childNamesList = alreadyBookedChildren.map(x => x.child.fullName).join(', ');
      return {
        success: true,
        isExisting: true,
        bookingId: existingPassId,
        centreId: data.centreId,
        childName: childNamesList,
        date: data.date,
        timeSlot: data.timeSlot,
        feePaid: 0,
        qrCode: `KUC-PASS-${existingPassId}`,
        status: 'ALREADY_BOOKED',
        message: `${childNamesList} already has an active Free Trial pass (${existingPassId}) for ${centre?.name || data.centreName}! Your existing pass is ready to use in My Bookings.`,
      };
    }

    // Case 2: At least one new booking created
    const effectivePassId = firstNewBookingId || primaryBookingId;
    const targetEmail = data.parentEmail || (parent ? (await prisma.user.findUnique({ where: { id: parent.userId } }))?.email : null);
    if (targetEmail) {
      const childNamesList = newlyBookedChildren.map(c => c.child.fullName).join(', ');
      sendBookingConfirmationEmail({
        to: targetEmail,
        parentName: data.parentName || parent?.fullName || 'Parent',
        childName: childNamesList,
        centreName: data.centreName || centre?.name || 'Sports Academy',
        passId: effectivePassId,
        date: data.date,
        timeSlot: data.timeSlot,
        address: centre?.address || undefined,
        phone: centre?.phone || undefined,
      }).catch((err) => console.warn('Non-blocking booking email warning:', err));
    }

    const formattedChildName = data.childNames && data.childNames.length > 0
      ? data.childNames.join(', ')
      : (data.childName || 'Child');

    let successMsg = `Free trial pass ${effectivePassId} confirmed for ${newlyBookedChildren.map(x => x.child.fullName).join(', ')} at ${data.centreName}`;
    if (alreadyBookedChildren.length > 0) {
      successMsg += `. Note: ${alreadyBookedChildren.map(x => `${x.child.fullName} already has active pass ${x.passId}`).join(', ')}.`;
    }

    return {
      success: true,
      isExisting: false,
      bookingId: effectivePassId,
      centreId: data.centreId,
      childName: formattedChildName,
      date: data.date,
      timeSlot: data.timeSlot,
      feePaid: 0,
      qrCode,
      status: 'CONFIRMED',
      message: successMsg,
    };
  } catch (err: any) {
    console.error("DB booking create error:", err);
    return {
      success: false,
      isExisting: false,
      bookingId: '',
      centreId: data.centreId,
      childName: data.childName || 'Child',
      date: data.date,
      timeSlot: data.timeSlot,
      feePaid: 0,
      qrCode: '',
      status: 'CANCELLED',
      message: err?.message || 'Failed to complete free trial booking. Please try again.',
    };
  }
}

export async function enrollMonthlyBatch(data: {
  centreId: string;
  centreName: string;
  batchId?: string;
  batchName?: string;
  childName?: string;
  childNames?: string[];
  childId?: string;
  parentPhone?: string;
  parentEmail?: string;
  parentName?: string;
}): Promise<{ success: boolean; bookingId: string; passId: string; message: string; isExisting?: boolean }> {
  // Enforce authentication: Guest users must not be allowed to enroll without account
  if (!data.parentEmail || !data.parentEmail.trim()) {
    return {
      success: false,
      bookingId: '',
      passId: '',
      message: 'Please log in or sign up to enroll in monthly batches.',
    };
  }

  const primaryPassId = `KUC-BAT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  try {
    const parent = await resolveParentProfile(data.parentEmail, data.parentName, data.parentPhone);
    if (!parent) {
      throw new Error('Parent profile could not be resolved. Please log in again.');
    }
    const centre = await resolveCentre(data.centreId, data.centreName);
    const children = await resolveChildren(parent, data.childNames, undefined, data.childName, data.childId);

    const selectedBatch = centre?.batches?.find((b: any) => b.id === data.batchId) || (centre?.batches && centre.batches[0]) || null;
    if (selectedBatch) {
      if (selectedBatch.totalSeats > 0 && selectedBatch.seatsFilled >= selectedBatch.totalSeats) {
        return {
          success: false,
          isExisting: false,
          bookingId: '',
          passId: '',
          message: `The batch "${selectedBatch.name}" is already at full capacity (${selectedBatch.seatsFilled}/${selectedBatch.totalSeats} seats). Please select another batch.`,
        };
      }
      if (selectedBatch.isAdmissionsOpen === false) {
        return {
          success: false,
          isExisting: false,
          bookingId: '',
          passId: '',
          message: `Admissions for the batch "${selectedBatch.name}" are currently closed.`,
        };
      }
    }

    const tuitionFee = selectedBatch?.monthlyFee
      ? Number(selectedBatch.monthlyFee)
      : (centre?.monthlyTuitionFee ? Number(centre.monthlyTuitionFee) : 1800.00);

    const newlyEnrolledChildren: any[] = [];
    const alreadyEnrolledChildren: any[] = [];
    let firstExistingPassId: string | null = null;
    let firstNewPassId: string | null = null;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      // Check if child already has an active monthly batch at this centre
      const existingBatch = await prisma.booking.findFirst({
        where: {
          parentId: parent.id,
          childId: child.id,
          coachingCentreId: centre ? centre.id : null,
          passType: PassType.MONTHLY_BATCH,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingBatch) {
        alreadyEnrolledChildren.push({ child, passId: existingBatch.passId });
        if (!firstExistingPassId) firstExistingPassId = existingBatch.passId;
      } else {
        const curPassId = `KUC-BAT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        if (!firstNewPassId) firstNewPassId = curPassId;
        const createdBooking = await prisma.booking.create({
          data: {
            passId: curPassId,
            passType: PassType.MONTHLY_BATCH,
            parentId: parent.id,
            childId: child.id,
            coachingCentreId: centre ? centre.id : null,
            batchId: selectedBatch ? selectedBatch.id : null,
            scheduledAt: new Date(),
            grossAmount: tuitionFee,
            creditApplied: 0.00,
            netAmountPaid: 0.00, // Offline direct fee settlement
            escrowStatus: EscrowStatus.HELD,
          },
        });

        // Record first session attendance registration
        if (selectedBatch) {
          await prisma.attendance.create({
            data: {
              bookingId: createdBooking.id,
              batchId: selectedBatch.id,
              childId: child.id,
              isPresent: false,
            },
          }).catch(() => {});

          await prisma.batch.update({
            where: { id: selectedBatch.id },
            data: { seatsFilled: { increment: 1 } },
          }).catch(() => {});
        }

        if (centre) {
          await prisma.lead.create({
            data: {
              coachingCentreId: centre.id,
              parentName: parent.fullName || data.parentName || 'Parent',
              parentPhone: parent.emergencyContactPhone || data.parentPhone || '',
              childName: child.fullName,
              childAge: child.age || 8,
              inquiryNotes: `Monthly Batch Enrollment - ${selectedBatch?.name || 'Class'} (${selectedBatch?.schedule || ''}) • Fee ₹${tuitionFee}/mo (Payable Directly to Academy Offline)`,
              status: 'enrolled',
            },
          }).catch((err) => console.warn('Could not create lead on monthly batch:', err));
        }

        newlyEnrolledChildren.push({ child, passId: curPassId });
      }
    }

    revalidatePath('/parent/bookings');
    revalidatePath('/parent/dashboard');
    revalidatePath('/parent/payments');
    revalidatePath('/parent/passes');
    revalidatePath('/coach/leads');
    revalidatePath('/coach/attendance');
    revalidatePath('/coach/dashboard');
    revalidatePath('/coach/batches');
    revalidatePath('/coach/revenue');
    revalidatePath('/activities');

    // Case 1: ALL requested children already had an active monthly batch enrollment
    if (newlyEnrolledChildren.length === 0 && alreadyEnrolledChildren.length > 0) {
      const childNamesList = alreadyEnrolledChildren.map(x => x.child.fullName).join(', ');
      return {
        success: true,
        isExisting: true,
        bookingId: firstExistingPassId || primaryPassId,
        passId: firstExistingPassId || primaryPassId,
        message: `${childNamesList} is already enrolled in a monthly batch at ${centre?.name || data.centreName} (Pass: ${firstExistingPassId})! Your enrollment is active in My Bookings.`,
      };
    }

    const effectivePassId = firstNewPassId || primaryPassId;
    let msg = `Monthly batch pass ${effectivePassId} generated for ${newlyEnrolledChildren.map(x => x.child.fullName).join(', ')}`;
    if (alreadyEnrolledChildren.length > 0) {
      msg += `. Note: ${alreadyEnrolledChildren.map(x => `${x.child.fullName} already enrolled with pass ${x.passId}`).join(', ')}.`;
    }

    return {
      success: true,
      isExisting: false,
      bookingId: effectivePassId,
      passId: effectivePassId,
      message: msg,
    };
  } catch (err: any) {
    console.error("DB enrollMonthlyBatch error:", err);
    return {
      success: false,
      isExisting: false,
      bookingId: '',
      passId: '',
      message: err?.message || 'Failed to complete monthly batch enrollment. Please try again.',
    };
  }
}

export async function registerTournamentEntry(data: {
  competitionId?: string;
  competitionTitle: string;
  childName?: string;
  childNames?: string[];
  childId?: string;
  parentPhone?: string;
  parentEmail?: string;
  parentName?: string;
}): Promise<{ success: boolean; bookingId: string; passId: string; message: string }> {
  // 1. Enforce authentication: Guest users must not be allowed to register
  if (!data.parentEmail || !data.parentEmail.trim()) {
    return {
      success: false,
      bookingId: '',
      passId: '',
      message: 'Authentication required. Please sign in or create a parent account to register for tournaments.',
    };
  }

  const primaryPassId = `KUC-TRN-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  try {
    const parent = await resolveParentProfile(data.parentEmail, data.parentName, data.parentPhone);
    if (!parent) {
      return {
        success: false,
        bookingId: '',
        passId: '',
        message: 'Parent profile could not be found. Please sign in with a registered parent account.',
      };
    }

    const children = await resolveChildren(parent, data.childNames, undefined, data.childName, data.childId);
    if (!children || children.length === 0) {
      return {
        success: false,
        bookingId: '',
        passId: '',
        message: 'Please select at least one child participant for tournament entry.',
      };
    }

    let comp = null;
    if (data.competitionId) {
      comp = await prisma.competition.findUnique({ where: { id: data.competitionId } });
    }
    if (!comp && data.competitionTitle) {
      comp = await prisma.competition.findFirst({
        where: { title: { contains: data.competitionTitle.trim(), mode: 'insensitive' } },
      });
    }
    if (!comp) {
      comp = await prisma.competition.findFirst();
    }

    const regFee = comp?.registrationFee ? Number(comp.registrationFee) : 450.00;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const curPassId = i === 0 ? primaryPassId : `KUC-TRN-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

      await prisma.booking.create({
        data: {
          passId: curPassId,
          passType: PassType.TOURNAMENT_ENTRY,
          parentId: parent.id,
          childId: child.id,
          competitionId: comp ? comp.id : null,
          scheduledAt: new Date(),
          grossAmount: regFee,
          creditApplied: 0.00,
          netAmountPaid: 0.00, // Offline direct registration fee
          escrowStatus: EscrowStatus.HELD,
        },
      });
    }

    revalidatePath('/parent/bookings');
    revalidatePath('/parent/dashboard');
    revalidatePath('/competitions');

    const names = data.childNames && data.childNames.length > 0 ? data.childNames.join(', ') : (data.childName || 'Child');
    return {
      success: true,
      bookingId: primaryPassId,
      passId: primaryPassId,
      message: `Official tournament pass generated for ${names}! Entry confirmed for ${data.competitionTitle}.`,
    };
  } catch (err) {
    console.error("DB registerTournamentEntry error:", err);
    return {
      success: false,
      bookingId: '',
      passId: '',
      message: 'Failed to complete tournament registration due to a server error. Please try again.',
    };
  }
}


// ==========================================
// 3. COACH & ACADEMY APPROVAL / MODERATION ACTIONS
// ==========================================

export async function approveCoachKyc(
  centreId: string,
  centreName: string,
  inspector: string = 'Er. S. Rawat'
) {
  await requireAdminSession();
  try {
    // Read existing centre to preserve document payload (fixes verified → pending toggle bug)
    const existing = await prisma.coachingCentre.findUnique({ where: { id: centreId }, include: { owner: true } });
    const existingPayload = existing ? parseDocsPayload(existing) : null;

    // Mark all submitted docs as VERIFIED in the payload
    const verifiedPayload = existingPayload ? {
      ...existingPayload,
      govId: existingPayload.govId ? { ...existingPayload.govId, status: 'VERIFIED' as const } : undefined,
      nisCert: existingPayload.nisCert ? { ...existingPayload.nisCert, status: 'VERIFIED' as const } : undefined,
      verifiedAt: new Date().toISOString(),
    } : null;

    const approvalText = `Approved & Verified by ${inspector} on ${new Date().toLocaleDateString('en-IN')}`;
    const newStatusNotes = verifiedPayload
      ? buildStatusNotesWithDocs(approvalText, verifiedPayload)
      : approvalText;

    // Account Tiers Rule:
    // Standard Account: Automatically grant "Verified" badge and make profile public
    // Premier Account: Automatically grant both "Verified" badge AND "Top of Area Sponsored" placement/badge + public profile
    const isPremier = existing?.planTier === SubscriptionPlan.PREMIUM;

    const updated = await prisma.coachingCentre.update({
      where: { id: centreId },
      data: {
        kycStatus: KycStatus.APPROVED,
        safetyGrade: SafetyGrade.GRADE_A_PLUS,
        isSuspended: false,
        isActive: true,
        isVerifiedBatch: true,
        isTopInArea: isPremier ? true : (existing?.isTopInArea ?? false),
        statusNotes: newStatusNotes,
        rejectionReason: null,
        referredBackRemarks: null,
      },
      include: {
        owner: true,
      },
    });

    await logAdminAction({
      actorEmail: 'admin@knowurcoach.in',
      actorRole: 'ADMIN',
      action: 'COACH_APPROVED',
      targetModel: 'CoachingCentre',
      targetId: centreId,
      details: { centreName, inspector, status: 'APPROVED' },
    });

    if (updated?.owner?.email) {
      sendCoachKycStatusEmail({
        to: updated.owner.email,
        coachName: updated.headCoachName || 'Coach',
        centreName: updated.name,
        status: 'APPROVED',
        badge: 'Verified Academy',
      }).catch(err => console.warn('Non-blocking KYC approval email error:', err));
    }

    if (updated?.owner?.id) {
      await prisma.notification.create({
        data: {
          userId: updated.owner.id,
          title: 'Academy Application Approved! 🎉',
          message: `Congratulations! Your academy ${updated.name} has been verified and approved by the platform admin. Your public listing is now active and live!`,
          type: 'kyc',
        },
      }).catch(() => null);
    }

    invalidateTag('discovery');
    invalidateTag('academies');
    invalidateTag(`academy-${centreId}`);
    revalidatePath('/activities');
    revalidatePath(`/activities/${centreId}`);
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/admin/verify-coaches');
    return {
      success: true,
      centreId,
      centreName,
      status: 'APPROVED',
      inspector,
      approvedAt: new Date().toISOString(),
      message: `${centreName} successfully verified and approved!`,
    };
  } catch (err: any) {
    console.error("DB approveCoachKyc error:", err);
    return {
      success: false,
      centreId,
      centreName,
      message: err?.message || `Failed to approve ${centreName}`,
    };
  }
}

export async function rejectCoachKyc(
  centreId: string,
  centreName: string,
  reason: string,
  inspector: string = 'Er. S. Rawat'
) {
  await requireAdminSession();
  try {
    // Preserve existing document payload when rejecting
    const existing = await prisma.coachingCentre.findUnique({ where: { id: centreId } });
    const existingPayload = existing ? parseDocsPayload(existing) : null;
    const rejectionText = `Rejected by ${inspector} on ${new Date().toLocaleDateString('en-IN')}`;
    const newStatusNotes = existingPayload
      ? buildStatusNotesWithDocs(rejectionText, existingPayload)
      : rejectionText;

    const updated = await prisma.coachingCentre.update({
      where: { id: centreId },
      data: {
        kycStatus: KycStatus.REJECTED,
        rejectionReason: reason,
        statusNotes: newStatusNotes,
      },
      include: {
        owner: true,
      },
    });

    await logAdminAction({
      actorEmail: 'admin@knowurcoach.in',
      actorRole: 'ADMIN',
      action: 'COACH_REJECTED',
      targetModel: 'CoachingCentre',
      targetId: centreId,
      details: { centreName, reason, inspector },
    });

    if (updated?.owner?.email) {
      sendCoachKycStatusEmail({
        to: updated.owner.email,
        coachName: updated.headCoachName || 'Coach',
        centreName: updated.name,
        status: 'REJECTED',
        reason,
      }).catch(err => console.warn('Non-blocking KYC rejection email error:', err));
    }

    if (updated?.owner?.id) {
      await prisma.notification.create({
        data: {
          userId: updated.owner.id,
          title: 'KYC Application Status Update',
          message: `Your verification application for ${updated.name} was rejected. Reason: ${reason}`,
          type: 'kyc',
        },
      }).catch(() => null);
    }

    invalidateTag('discovery');
    invalidateTag('academies');
    invalidateTag(`academy-${centreId}`);
    revalidatePath('/activities');
    revalidatePath(`/activities/${centreId}`);
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/admin/verify-coaches');
    return {
      success: true,
      centreId,
      message: `${centreName} marked as REJECTED with reason recorded.`,
    };
  } catch (err: any) {
    console.error("DB rejectCoachKyc error:", err);
    return {
      success: false,
      centreId,
      message: err?.message || `Failed to reject ${centreName}`,
    };
  }
}

export async function referBackCoachKyc(
  centreId: string,
  centreName: string,
  remarks: string,
  inspector: string = 'Er. S. Rawat'
) {
  await requireAdminSession();
  try {
    // Preserve existing document payload when referring back
    const existing = await prisma.coachingCentre.findUnique({ where: { id: centreId } });
    const existingPayload = existing ? parseDocsPayload(existing) : null;
    const referText = `Referred back by ${inspector} on ${new Date().toLocaleDateString('en-IN')}: ${remarks}`;
    const newStatusNotes = existingPayload
      ? buildStatusNotesWithDocs(referText, existingPayload)
      : referText;

    const updated = await prisma.coachingCentre.update({
      where: { id: centreId },
      data: {
        kycStatus: KycStatus.REFERRED_BACK,
        referredBackRemarks: remarks,
        statusNotes: newStatusNotes,
      },
      include: {
        owner: true,
      },
    });

    await logAdminAction({
      actorEmail: 'admin@knowurcoach.in',
      actorRole: 'ADMIN',
      action: 'COACH_REFERRED_BACK',
      targetModel: 'CoachingCentre',
      targetId: centreId,
      details: { centreName, remarks, inspector },
    });

    if (updated?.owner?.email) {
      sendCoachKycStatusEmail({
        to: updated.owner.email,
        coachName: updated.headCoachName || 'Coach',
        centreName: updated.name,
        status: 'REFERRED_BACK',
        remarks,
      }).catch(err => console.warn('Non-blocking KYC referBack email error:', err));
    }

    if (updated?.owner?.id) {
      await prisma.notification.create({
        data: {
          userId: updated.owner.id,
          title: 'Action Required: Application Referred Back',
          message: `Compliance officer remarks: ${remarks}. Please update your verification documents in your coach portal.`,
          type: 'kyc',
        },
      }).catch(() => null);
    }

    invalidateTag('discovery');
    invalidateTag('academies');
    invalidateTag(`academy-${centreId}`);
    revalidatePath('/activities');
    revalidatePath(`/activities/${centreId}`);
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/admin/verify-coaches');
    return {
      success: true,
      centreId,
      message: `${centreName} referred back to coach with remarks.`,
    };
  } catch (err: any) {
    console.error("DB referBackCoachKyc error:", err);
    return {
      success: false,
      centreId,
      message: err?.message || `Failed to refer back ${centreName}`,
    };
  }
}

export async function suspendCoach(centreId: string, notes: string = "Suspended by admin") {
  await requireAdminSession();
  try {
    await prisma.coachingCentre.update({
      where: { id: centreId },
      data: {
        isSuspended: true,
        isActive: false,
        kycStatus: KycStatus.SUSPENDED,
        statusNotes: notes,
      },
    });
    invalidateTag('discovery');
    invalidateTag('academies');
    invalidateTag(`academy-${centreId}`);
    revalidatePath('/admin');
    revalidatePath('/admin/coaches');
    revalidatePath('/admin/academies');
    revalidatePath('/activities');
    revalidatePath(`/activities/${centreId}`);
    revalidatePath('/');
    return { success: true, message: "Coach academy temporarily suspended." };
  } catch (err: any) {
    console.error("DB suspendCoach error:", err);
    return { success: false, message: err?.message || "Failed to suspend coach academy." };
  }
}

export async function unsuspendCoach(centreId: string) {
  await requireAdminSession();
  try {
    const existing = await prisma.coachingCentre.findUnique({ where: { id: centreId } });
    const isPremier = existing?.planTier === SubscriptionPlan.PREMIUM;
    await prisma.coachingCentre.update({
      where: { id: centreId },
      data: {
        isSuspended: false,
        isActive: true,
        kycStatus: KycStatus.APPROVED,
        isVerifiedBatch: true,
        isTopInArea: isPremier ? true : (existing?.isTopInArea ?? false),
        statusNotes: `Reactivated on ${new Date().toLocaleDateString('en-IN')}`,
      },
    });
    invalidateTag('discovery');
    invalidateTag('academies');
    invalidateTag(`academy-${centreId}`);
    revalidatePath('/admin');
    revalidatePath('/admin/coaches');
    revalidatePath('/admin/academies');
    revalidatePath('/activities');
    revalidatePath(`/activities/${centreId}`);
    revalidatePath('/');
    return { success: true, message: "Coach academy reactivated and restored to live directory." };
  } catch (err: any) {
    console.error("DB unsuspendCoach error:", err);
    return { success: false, message: err?.message || "Failed to reactivate coach academy." };
  }
}

export async function updateCoachPlan(
  centreId: string,
  planTier: SubscriptionPlan,
  isTopInArea?: boolean,
  isVerifiedBatch?: boolean,
  coachType: CoachType = CoachType.INDIVIDUAL
) {
  await requireAdminSession();
  try {
    const finalTopInArea = isTopInArea !== undefined ? isTopInArea : planTier === SubscriptionPlan.PREMIUM;
    const finalVerifiedBatch = isVerifiedBatch !== undefined ? isVerifiedBatch : (planTier === SubscriptionPlan.PREMIUM || planTier === SubscriptionPlan.STANDARD);
    await prisma.coachingCentre.update({
      where: { id: centreId },
      data: {
        planTier,
        isTopInArea: finalTopInArea,
        isVerifiedBatch: finalVerifiedBatch,
        coachType,
      },
    });
    invalidateTag('discovery');
    invalidateTag('academies');
    invalidateTag(`academy-${centreId}`);
    revalidatePath('/admin');
    revalidatePath('/admin/coaches');
    revalidatePath('/admin/academies');
    revalidatePath('/activities');
    revalidatePath(`/activities/${centreId}`);
    revalidatePath('/');
    return {
      success: true,
      message: `Updated plan tier to ${planTier} (Top in Area: ${finalTopInArea ? 'Yes' : 'No'}, Verified: ${finalVerifiedBatch ? 'Yes' : 'No'})`,
    };
  } catch (err: any) {
    console.error("DB updateCoachPlan error:", err);
    return { success: false, message: err?.message || "Failed to update coach plan." };
  }
}

export async function deleteCoach(centreId: string) {
  await requireAdminSession();
  try {
    await prisma.attendance.deleteMany({ where: { batch: { coachingCentreId: centreId } } });
    await prisma.booking.updateMany({ where: { coachingCentreId: centreId }, data: { coachingCentreId: null, batchId: null } });
    await prisma.paymentTransaction.deleteMany({ where: { coachingCentreId: centreId } });
    await prisma.review.deleteMany({ where: { coachingCentreId: centreId } });
    await prisma.savedCentre.deleteMany({ where: { coachingCentreId: centreId } });
    await prisma.kycInspection.deleteMany({ where: { coachingCentreId: centreId } });
    await prisma.facility.deleteMany({ where: { coachingCentreId: centreId } });
    await prisma.batch.deleteMany({ where: { coachingCentreId: centreId } });
    await prisma.lead.deleteMany({ where: { coachingCentreId: centreId } });
    await prisma.coachingCentre.delete({ where: { id: centreId } });
    invalidateTag('discovery');
    invalidateTag('academies');
    invalidateTag(`academy-${centreId}`);
    revalidatePath('/admin');
    revalidatePath('/admin/verify-coaches');
    revalidatePath('/admin/coaches');
    revalidatePath('/admin/academies');
    revalidatePath('/activities');
    revalidatePath(`/activities/${centreId}`);
    revalidatePath('/');
    return { success: true, message: "Coaching center deleted successfully." };
  } catch (err: any) {
    console.error("DB deleteCoach error:", err);
    return { success: false, message: err?.message || "Failed to delete coaching center." };
  }
}

export async function updateCoachDetails(
  centreId: string,
  data: {
    name?: string;
    category?: string;
    tagline?: string;
    locality?: string;
    address?: string;
    phone?: string;
    headCoachName?: string;
    monthlyTuitionFee?: number;
    trialFee?: number;
    planTier?: SubscriptionPlan;
    isTopInArea?: boolean;
    isVerifiedBatch?: boolean;
    coachType?: CoachType;
    safetyGrade?: SafetyGrade;
    kycStatus?: KycStatus;
    statusNotes?: string;
    isSuspended?: boolean;
    isActive?: boolean;
    rejectionReason?: string | null;
    referredBackRemarks?: string | null;
  }
) {
  await requireAdminSession();
  try {
    // If planTier is being updated, apply account tier rules:
    // Premier Account: Automatically grant both "Verified" and "Top of Area Sponsored" placement
    // Standard Account: Automatically grant "Verified"
    let finalTopInArea = data.isTopInArea;
    let finalVerifiedBatch = data.isVerifiedBatch;

    if (data.planTier === SubscriptionPlan.PREMIUM) {
      if (finalTopInArea === undefined) finalTopInArea = true;
      if (finalVerifiedBatch === undefined) finalVerifiedBatch = true;
    } else if (data.planTier === SubscriptionPlan.STANDARD) {
      if (finalVerifiedBatch === undefined) finalVerifiedBatch = true;
    }

    const isApprovedKyc = data.kycStatus === KycStatus.APPROVED;
    const isSuspendedKyc = data.kycStatus === KycStatus.SUSPENDED;

    await prisma.coachingCentre.update({
      where: { id: centreId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.tagline !== undefined && { tagline: data.tagline }),
        ...(data.locality !== undefined && { locality: data.locality }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.headCoachName !== undefined && { headCoachName: data.headCoachName }),
        ...(data.monthlyTuitionFee !== undefined && { monthlyTuitionFee: data.monthlyTuitionFee }),
        ...(data.trialFee !== undefined && { trialFee: data.trialFee }),
        ...(data.planTier !== undefined && { planTier: data.planTier }),
        ...(finalTopInArea !== undefined && { isTopInArea: finalTopInArea }),
        ...(finalVerifiedBatch !== undefined && { isVerifiedBatch: finalVerifiedBatch }),
        ...(data.coachType !== undefined && { coachType: data.coachType }),
        ...(data.safetyGrade !== undefined && { safetyGrade: data.safetyGrade }),
        ...(data.kycStatus !== undefined && {
          kycStatus: data.kycStatus,
          isActive: isApprovedKyc,
          isSuspended: isSuspendedKyc,
        }),
        ...(data.isSuspended !== undefined && {
          isSuspended: data.isSuspended,
          isActive: !data.isSuspended,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.statusNotes !== undefined && { statusNotes: data.statusNotes }),
        ...(data.rejectionReason !== undefined && { rejectionReason: data.rejectionReason }),
        ...(data.referredBackRemarks !== undefined && { referredBackRemarks: data.referredBackRemarks }),
      },
    });
    invalidateTag('discovery');
    invalidateTag('academies');
    invalidateTag(`academy-${centreId}`);
    revalidatePath('/admin');
    revalidatePath('/admin/verify-coaches');
    revalidatePath('/admin/coaches');
    revalidatePath('/admin/academies');
    revalidatePath('/activities');
    revalidatePath(`/activities/${centreId}`);
    revalidatePath('/');
    return { success: true, message: "Coach details saved successfully." };
  } catch (err: any) {
    console.error("DB updateCoachDetails error:", err);
    return { success: false, message: err?.message || "Failed to update coach details." };
  }
}

// ==========================================
// 4. PARENTS & STUDENTS MODERATION ACTIONS
// ==========================================

export async function suspendParent(parentId: string, notes?: string) {
  await requireAdminSession();
  try {
    await prisma.parentProfile.update({
      where: { id: parentId },
      data: {
        isSuspended: true,
        notes: notes || "Account suspended by administrator",
      },
    });
    revalidatePath('/admin');
    return { success: true, message: "Parent account suspended." };
  } catch (err: any) {
    console.error("DB suspendParent error:", err);
    return { success: false, message: err?.message || "Failed to suspend parent account." };
  }
}

export async function unsuspendParent(parentId: string) {
  await requireAdminSession();
  try {
    await prisma.parentProfile.update({
      where: { id: parentId },
      data: {
        isSuspended: false,
        notes: null,
      },
    });
    revalidatePath('/admin');
    return { success: true, message: "Parent account activated." };
  } catch (err: any) {
    console.error("DB unsuspendParent error:", err);
    return { success: false, message: err?.message || "Failed to activate parent account." };
  }
}

export async function adjustParentCredit(parentId: string, amount: number, notes?: string) {
  await requireAdminSession();
  revalidatePath('/admin');
  return { success: true, message: `Parent promotional credits and fees are permanently disabled (Zero Fee Guarantee).` };
}

export async function deleteParent(parentId: string) {
  await requireAdminSession();
  try {
    const parent = await prisma.parentProfile.findUnique({ where: { id: parentId } });
    if (parent) {
      await prisma.attendance.deleteMany({ where: { booking: { parentId } } });
      await prisma.booking.deleteMany({ where: { parentId } });
      await prisma.savedCentre.deleteMany({ where: { parentId } });
      await prisma.notification.deleteMany({ where: { userId: parent.userId } });
      await prisma.childProfile.deleteMany({ where: { parentId } });
      await prisma.parentProfile.delete({ where: { id: parentId } });
      await prisma.user.delete({ where: { id: parent.userId } });
    }
    revalidatePath('/admin');
    return { success: true, message: "Parent profile removed successfully." };
  } catch (err: any) {
    console.error("DB deleteParent error:", err);
    return { success: false, message: err?.message || "Failed to delete parent profile." };
  }
}

// ==========================================
// 5. ACTIVITIES & CATEGORIES CRUD ACTIONS
// ==========================================

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
    if (path === '/' || path === '/activities') {
      invalidateTag('discovery');
    }
  } catch {
    // Non-fatal if invoked outside an active Next.js request lifecycle (e.g. standalone scripts)
  }
}

function safeRevalidateTag(tag: string) {
  try {
    invalidateTag(tag);
  } catch {
    // Non-fatal if invoked outside an active Next.js request lifecycle
  }
}

export async function createActivity(data: {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  icon?: string;
  accentColor?: string;
  order?: number;
}) {
  try {
    await requireAdminSession();
    if (!data.name || !data.name.trim()) {
      return { success: false, message: "Activity name is required." };
    }
    const cleanName = data.name.trim();
    const cleanSlug = (data.slug?.trim() || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')).toLowerCase();
    const fallbackImage = "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80";

    const existing = await prisma.majorActivity.findFirst({
      where: {
        OR: [
          { slug: cleanSlug },
          { name: { equals: cleanName, mode: 'insensitive' } },
        ],
      },
    });

    let activity;
    if (existing) {
      activity = await prisma.majorActivity.update({
        where: { id: existing.id },
        data: {
          name: cleanName,
          description: data.description !== undefined ? data.description.trim() : existing.description,
          imageUrl: data.imageUrl?.trim() || existing.imageUrl || fallbackImage,
          icon: data.icon?.trim() || existing.icon,
          accentColor: data.accentColor?.trim() || existing.accentColor,
          order: data.order !== undefined ? data.order : existing.order,
          isActive: true,
        },
      });
    } else {
      activity = await prisma.majorActivity.create({
        data: {
          name: cleanName,
          slug: cleanSlug,
          description: data.description?.trim() || "",
          imageUrl: data.imageUrl?.trim() || fallbackImage,
          icon: data.icon?.trim() || "Trophy",
          accentColor: data.accentColor?.trim() || "#10B981",
          order: data.order ?? 0,
          isActive: true,
        },
      });
    }

    safeRevalidatePath('/admin');
    safeRevalidatePath('/admin/categories');
    safeRevalidatePath('/activities');
    safeRevalidatePath('/');
    return { success: true, activity: toPlainObject(activity), message: `Activity "${cleanName}" saved successfully!` };
  } catch (err: any) {
    console.error("DB createActivity error:", err);
    return { success: false, message: err?.message || "Failed to create activity." };
  }
}

export const createMajorActivity = createActivity;

export async function updateActivity(id: string, data: {
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  icon?: string;
  accentColor?: string;
  isActive?: boolean;
  order?: number;
}) {
  try {
    await requireAdminSession();
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.slug !== undefined) updateData.slug = data.slug.trim().toLowerCase();
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl.trim();
    if (data.icon !== undefined) updateData.icon = data.icon.trim();
    if (data.accentColor !== undefined) updateData.accentColor = data.accentColor.trim();
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.order !== undefined) updateData.order = data.order;

    const activity = await prisma.majorActivity.update({
      where: { id },
      data: updateData,
    });
    safeRevalidatePath('/admin');
    safeRevalidatePath('/admin/categories');
    safeRevalidatePath('/activities');
    safeRevalidatePath('/');
    return { success: true, activity: toPlainObject(activity), message: `Activity "${activity.name}" updated successfully!` };
  } catch (err: any) {
    console.error("DB updateActivity error:", err);
    return { success: false, message: err?.message || "Failed to update activity." };
  }
}

export const updateMajorActivity = updateActivity;

export async function deleteActivity(id: string) {
  try {
    await requireAdminSession();
    const activity = await prisma.majorActivity.delete({
      where: { id },
    });
    safeRevalidatePath('/admin');
    safeRevalidatePath('/admin/categories');
    safeRevalidatePath('/activities');
    safeRevalidatePath('/');
    return { success: true, message: `Activity "${activity.name}" and all linked categories deleted.` };
  } catch (err: any) {
    console.error("DB deleteActivity error:", err);
    return { success: false, message: err?.message || "Failed to delete activity." };
  }
}

export const deleteMajorActivity = deleteActivity;

export async function createCategory(data: {
  activityId: string;
  name: string;
  slug?: string;
  shortDesc?: string;
  imageUrl?: string;
  icon?: string;
  badge?: string;
  order?: number;
}) {
  try {
    await requireAdminSession();
    if (!data.name || !data.name.trim()) {
      return { success: false, message: "Category name is required." };
    }
    if (!data.activityId) {
      return { success: false, message: "Please select an activity to link this category to." };
    }

    const cleanName = data.name.trim();
    let cleanSlug = (data.slug?.trim() || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')).toLowerCase();
    const fallbackImage = "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=80";

    const existing = await prisma.discipline.findFirst({
      where: {
        OR: [
          { slug: cleanSlug },
          { name: { equals: cleanName, mode: 'insensitive' }, activityId: data.activityId },
        ],
      },
    });

    let category;
    if (existing) {
      category = await prisma.discipline.update({
        where: { id: existing.id },
        data: {
          activityId: data.activityId,
          name: cleanName,
          shortDesc: data.shortDesc !== undefined ? data.shortDesc.trim() : existing.shortDesc,
          imageUrl: data.imageUrl?.trim() || existing.imageUrl || fallbackImage,
          icon: data.icon?.trim() || existing.icon,
          badge: data.badge !== undefined ? (data.badge?.trim() || null) : existing.badge,
          order: data.order !== undefined ? data.order : existing.order,
          isActive: true,
        },
        include: { activity: true },
      });
    } else {
      const slugUsed = await prisma.discipline.findUnique({ where: { slug: cleanSlug } });
      if (slugUsed) {
        cleanSlug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;
      }

      category = await prisma.discipline.create({
        data: {
          activityId: data.activityId,
          name: cleanName,
          slug: cleanSlug,
          shortDesc: data.shortDesc?.trim() || "",
          imageUrl: data.imageUrl?.trim() || fallbackImage,
          icon: data.icon?.trim() || "Sparkle",
          badge: data.badge?.trim() || null,
          order: data.order ?? 0,
          isActive: true,
        },
        include: { activity: true },
      });
    }

    safeRevalidatePath('/admin');
    safeRevalidatePath('/admin/categories');
    safeRevalidatePath('/activities');
    safeRevalidatePath('/');
    return { success: true, category: toPlainObject(category), message: `Category "${cleanName}" saved successfully!` };
  } catch (err: any) {
    console.error("DB createCategory error:", err);
    return { success: false, message: err?.message || "Failed to create category." };
  }
}

export const createDiscipline = createCategory;

export async function updateCategory(id: string, data: {
  activityId?: string;
  name?: string;
  slug?: string;
  shortDesc?: string;
  imageUrl?: string;
  icon?: string;
  badge?: string;
  isActive?: boolean;
  order?: number;
}) {
  try {
    await requireAdminSession();
    const updateData: any = {};
    if (data.activityId !== undefined) updateData.activityId = data.activityId;
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.slug !== undefined) updateData.slug = data.slug.trim().toLowerCase();
    if (data.shortDesc !== undefined) updateData.shortDesc = data.shortDesc.trim();
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl.trim();
    if (data.icon !== undefined) updateData.icon = data.icon.trim();
    if (data.badge !== undefined) updateData.badge = data.badge?.trim() || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.order !== undefined) updateData.order = data.order;

    const category = await prisma.discipline.update({
      where: { id },
      data: updateData,
      include: {
        activity: true,
      },
    });
    safeRevalidatePath('/admin');
    safeRevalidatePath('/admin/categories');
    safeRevalidatePath('/activities');
    safeRevalidatePath('/');
    return { success: true, category: toPlainObject(category), message: `Category "${category.name}" updated successfully!` };
  } catch (err: any) {
    console.error("DB updateCategory error:", err);
    return { success: false, message: err?.message || "Failed to update category." };
  }
}

export const updateDiscipline = updateCategory;

export async function deleteCategory(id: string) {
  try {
    await requireAdminSession();
    const category = await prisma.discipline.delete({
      where: { id },
    });
    safeRevalidatePath('/admin');
    safeRevalidatePath('/admin/categories');
    safeRevalidatePath('/activities');
    safeRevalidatePath('/');
    return { success: true, message: `Category "${category.name}" deleted.` };
  } catch (err: any) {
    console.error("DB deleteCategory error:", err);
    return { success: false, message: err?.message || "Failed to delete category." };
  }
}

export const deleteDiscipline = deleteCategory;

export async function seedDefaultActivitiesAndCategories() {
  try {
    await requireAdminSession();

    const standardActivities = [
      {
        slug: 'sports',
        name: 'Sports & Athletics',
        icon: 'Trophy',
        accentColor: '#10B981',
        description: 'Elite sports academies, professional coaching & turf facilities across Agra.',
        imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
        order: 1,
        categories: [
          { name: 'Badminton', slug: 'badminton', badge: 'Free Trial', icon: 'Trophy', imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80', shortDesc: 'Indoor wooden & synthetic court coaching for beginners & tournament pros.', order: 1 },
          { name: 'Lawn Tennis', slug: 'tennis', badge: 'Trending', icon: 'Trophy', imageUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80', shortDesc: 'Clay and hard court tennis lessons by AITA certified coaches.', order: 2 },
          { name: 'Cricket Academy', slug: 'cricket', badge: 'Popular', icon: 'Trophy', imageUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=600&q=80', shortDesc: 'Net practice with bowling machines, turf wickets & match simulation.', order: 3 },
          { name: 'Football & Turf Soccer', slug: 'football', badge: 'Free Trial', icon: 'Trophy', imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80', shortDesc: 'Grass & FIFA-approved turf soccer training with tactical drills.', order: 4 },
          { name: 'Swimming & Aquatics', slug: 'swimming', badge: 'Heated Pool', icon: 'Trophy', imageUrl: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=600&q=80', shortDesc: 'Certified lifeguards, all-weather temperature controlled training.', order: 5 },
          { name: 'Martial Arts & Taekwondo', slug: 'martial-arts', badge: 'Black Belt Coach', icon: 'Trophy', imageUrl: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=600&q=80', shortDesc: 'Self defense, belt grading & tournament sparring for kids & teens.', order: 6 },
          { name: 'Roller Skating', slug: 'skating', badge: 'Beginner Friendly', icon: 'Trophy', imageUrl: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=600&q=80', shortDesc: 'Speed skating and artistic rink sessions with safety gear focus.', order: 7 },
          { name: 'Athletics & Gymnastics', slug: 'athletics', badge: 'Fitness Focus', icon: 'Trophy', imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80', shortDesc: 'Agility, track sprint technique and flexibility conditioning.', order: 8 },
        ],
      },
      {
        slug: 'brain-booster',
        name: 'Brain Booster & STEM',
        icon: 'Brain',
        accentColor: '#6366F1',
        description: 'Robotics, Vedic Maths, Chess, and junior coding classes to accelerate intellectual growth.',
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        order: 2,
        categories: [
          { name: 'Robotics & Automation Lab', slug: 'robotics', badge: 'Free Trial', icon: 'Brain', imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80', shortDesc: 'Hands-on Arduino, Lego robotics & mechanical hardware assemblies.', order: 1 },
          { name: 'Vedic Maths & Abacus', slug: 'abacus', badge: 'Top Rated', icon: 'Brain', imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80', shortDesc: 'Speed arithmetic, mental calculation, and Olympiad competition prep.', order: 2 },
          { name: 'Chess Masterclass', slug: 'chess', badge: 'FIDE Certified', icon: 'Brain', imageUrl: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=600&q=80', shortDesc: 'Opening strategies, positional mastery & rated tournament preparation.', order: 3 },
          { name: 'Coding & AI for Juniors', slug: 'coding', badge: 'High Demand', icon: 'Brain', imageUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=600&q=80', shortDesc: 'Block coding, Python foundations, and generative AI basics for kids.', order: 4 },
          { name: 'Science & Experiential Labs', slug: 'science-labs', badge: 'Hands-On', icon: 'Brain', imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80', shortDesc: 'Physics and chemistry experiments with safe interactive kits.', order: 5 },
        ],
      },
      {
        slug: 'arts',
        name: 'Cultural & Fine Arts',
        icon: 'Palette',
        accentColor: '#EC4899',
        description: 'Classical dance, instrumental studio, and fine arts masterclasses guided by gurus.',
        imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
        order: 3,
        categories: [
          { name: 'Kathak & Classical Dance', slug: 'dance', badge: 'Certified Guru', icon: 'Palette', imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80', shortDesc: 'Traditional Lucknow/Jaipur gharana footwork and mudras.', order: 1 },
          { name: 'Western Dance & Hip Hop', slug: 'western-dance', badge: 'Free Trial', icon: 'Palette', imageUrl: 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=600&q=80', shortDesc: 'Freestyle, contemporary, Bollywood and urban choreographies.', order: 2 },
          { name: 'Classical Vocal & Sangeet', slug: 'music', badge: 'Classical', icon: 'Palette', imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80', shortDesc: 'Hindustani classical riyaaz, harmonium and vocal range exercises.', order: 3 },
          { name: 'Guitar & Keyboard Studio', slug: 'instruments', badge: 'Trinity Grade', icon: 'Palette', imageUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=600&q=80', shortDesc: 'Acoustic, electric guitar, synth keyboard chords and staff notation.', order: 4 },
          { name: 'Fine Arts & Sketching', slug: 'fine-arts', badge: 'Exhibition Track', icon: 'Palette', imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80', shortDesc: 'Acrylics, water color, charcoal shading and portfolio curation.', order: 5 },
        ],
      },
    ];

    let activitiesCount = 0;
    let categoriesCount = 0;

    for (const act of standardActivities) {
      const savedAct = await prisma.majorActivity.upsert({
        where: { slug: act.slug },
        update: {
          name: act.name,
          icon: act.icon,
          accentColor: act.accentColor,
          description: act.description,
          imageUrl: act.imageUrl,
          order: act.order,
          isActive: true,
        },
        create: {
          name: act.name,
          slug: act.slug,
          icon: act.icon,
          accentColor: act.accentColor,
          description: act.description,
          imageUrl: act.imageUrl,
          order: act.order,
          isActive: true,
        },
      });
      activitiesCount++;

      for (const cat of act.categories) {
        await prisma.discipline.upsert({
          where: { slug: cat.slug },
          update: {
            activityId: savedAct.id,
            name: cat.name,
            icon: cat.icon,
            badge: cat.badge,
            imageUrl: cat.imageUrl,
            shortDesc: cat.shortDesc,
            order: cat.order,
            isActive: true,
          },
          create: {
            activityId: savedAct.id,
            name: cat.name,
            slug: cat.slug,
            icon: cat.icon,
            badge: cat.badge,
            imageUrl: cat.imageUrl,
            shortDesc: cat.shortDesc,
            order: cat.order,
            isActive: true,
          },
        });
        categoriesCount++;
      }
    }

    safeRevalidatePath('/admin');
    safeRevalidatePath('/admin/categories');
    safeRevalidatePath('/activities');
    safeRevalidatePath('/');

    return {
      success: true,
      message: `Successfully seeded ${activitiesCount} Major Activities and ${categoriesCount} Categories to Supabase!`,
    };
  } catch (err: any) {
    console.error("DB seedDefaultActivitiesAndCategories error:", err);
    return { success: false, message: err?.message || "Failed to seed activities and categories." };
  }
}

export async function createCompetition(data: {
  title: string;
  sport: string;
  category: string;
  organizer: string;
  dates: string;
  timing: string;
  venue: string;
  locality: string;
  registrationFee: number;
  ageDivisions: string;
  prizePool: string;
  equipmentRules?: string;
  reportingRules?: string;
  matchFormat?: string;
  umpiringRules?: string;
  creatorRole?: string;
  creatorEmail?: string;
}) {
  try {
    // RBAC: strictly verify caller session
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    if (!session || (sessionRole !== Role.COACH && sessionRole !== Role.ADMIN)) {
      return { success: false, message: 'Unauthorized. Only registered coaches, organizers, and administrators can host tournaments.' };
    }

    const comp = await prisma.competition.create({
      data: {
        title: data.title,
        sport: data.sport,
        category: data.category,
        organizer: data.organizer,
        dates: data.dates,
        timing: data.timing,
        venue: data.venue,
        locality: data.locality,
        registrationFee: data.registrationFee,
        ageDivisions: data.ageDivisions,
        prizePool: data.prizePool,
        equipmentRules: data.equipmentRules || "Standard safety equipment mandatory.",
        reportingRules: data.reportingRules || "Reporting 30 minutes before match time.",
        matchFormat: data.matchFormat || "Knockout format.",
        umpiringRules: data.umpiringRules || "Federation certified officials.",
      },
    });
    invalidateTag('discovery');
    invalidateTag('competitions');
    revalidatePath('/admin');
    revalidatePath('/admin/competitions');
    revalidatePath('/competitions');
    revalidatePath('/');
    return { success: true, competition: comp, message: `Tournament "${data.title}" created successfully!` };
  } catch (err: any) {
    console.error("DB createCompetition error:", err);
    return { success: false, message: err?.message || "Failed to create tournament." };
  }
}

export async function deleteCompetition(id: string) {
  await requireAdminSession();
  try {
    await prisma.booking.updateMany({ where: { competitionId: id }, data: { competitionId: null } });
    await prisma.competition.delete({ where: { id } });
    invalidateTag('discovery');
    invalidateTag('competitions');
    revalidatePath('/admin');
    revalidatePath('/admin/competitions');
    revalidatePath('/competitions');
    revalidatePath('/');
    return { success: true, message: "Tournament deleted successfully." };
  } catch (err: any) {
    console.error("DB deleteCompetition error:", err);
    return { success: false, message: err?.message || "Failed to delete tournament." };
  }
}

// ==========================================
// 6. PLATFORM CONFIGURATION & STYLING ACTIONS
// ==========================================

export async function updatePlatformConfig(data: {
  siteName?: string;
  tagline?: string;
  themeColor?: string;
  bgColor?: string;
  fontSize?: string;
  borderRadius?: string;
  standardPlanPrice?: number;
  premiumPlanPrice?: number;
  allowTrialBookings?: boolean;
  allowFreeTierPublicListing?: boolean;
  enableFreePlan?: boolean;
  enableStandardPlan?: boolean;
  enablePremiumPlan?: boolean;
  freePlanFeatures?: string;
  standardPlanFeatures?: string;
  premiumPlanFeatures?: string;
}) {
  const adminSession = await requireAdminSession();
  try {
    const config = await prisma.platformConfig.upsert({
      where: { id: 'default' },
      update: {
        ...data,
        ...(data.standardPlanPrice !== undefined && { standardPlanPrice: data.standardPlanPrice }),
        ...(data.premiumPlanPrice !== undefined && { premiumPlanPrice: data.premiumPlanPrice }),
        ...(data.allowTrialBookings !== undefined && { allowTrialBookings: data.allowTrialBookings }),
        ...(data.allowFreeTierPublicListing !== undefined && { allowFreeTierPublicListing: data.allowFreeTierPublicListing }),
        ...(data.enableFreePlan !== undefined && { enableFreePlan: data.enableFreePlan }),
        ...(data.enableStandardPlan !== undefined && { enableStandardPlan: data.enableStandardPlan }),
        ...(data.enablePremiumPlan !== undefined && { enablePremiumPlan: data.enablePremiumPlan }),
        ...(data.freePlanFeatures !== undefined && { freePlanFeatures: data.freePlanFeatures }),
        ...(data.standardPlanFeatures !== undefined && { standardPlanFeatures: data.standardPlanFeatures }),
        ...(data.premiumPlanFeatures !== undefined && { premiumPlanFeatures: data.premiumPlanFeatures }),
      },
      create: {
        id: 'default',
        siteName: data.siteName || 'KnowUrCoach',
        tagline: data.tagline || 'Hyperlocal Sports & Academy Discovery across India',
        themeColor: data.themeColor || 'emerald',
        bgColor: data.bgColor || 'slate',
        fontSize: data.fontSize || 'normal',
        borderRadius: data.borderRadius || 'rounded-xl',
        standardPlanPrice: data.standardPlanPrice ?? 1499.00,
        premiumPlanPrice: data.premiumPlanPrice ?? 3999.00,
        allowTrialBookings: data.allowTrialBookings ?? true,
        allowFreeTierPublicListing: data.allowFreeTierPublicListing ?? true,
        enableFreePlan: data.enableFreePlan ?? true,
        enableStandardPlan: data.enableStandardPlan ?? true,
        enablePremiumPlan: data.enablePremiumPlan ?? true,
        freePlanFeatures: data.freePlanFeatures ?? null,
        standardPlanFeatures: data.standardPlanFeatures ?? null,
        premiumPlanFeatures: data.premiumPlanFeatures ?? null,
      },
    });

    await logAdminAction({
      actorEmail: adminSession.user?.email || 'admin@knowurcoach.in',
      actorRole: 'ADMIN',
      action: 'CONFIG_UPDATED',
      targetModel: 'PlatformConfig',
      targetId: 'default',
      details: {
        standardPlanPrice: data.standardPlanPrice,
        premiumPlanPrice: data.premiumPlanPrice,
        allowFreeTierPublicListing: data.allowFreeTierPublicListing,
        enableFreePlan: data.enableFreePlan,
      },
    });

    invalidateTag('discovery');
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/admin/plans');
    revalidatePath('/admin/theme');
    revalidatePath('/admin/config');
    revalidatePath('/coach/plans');
    revalidatePath('/coach/dashboard');
    revalidatePath('/activities');
    return { success: true, config: toPlainObject(config), message: "Platform settings saved successfully!" };
  } catch (err: any) {
    console.error("DB updatePlatformConfig error:", err);
    return { success: false, message: err?.message || "Failed to save platform configuration." };
  }
}

function toPlainObject<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export async function getAdminDashboardData() {
  try {
    await requireAdminSession();
    const [coaches, parents, categories, config, stats, competitions, majorActivities, disciplines] = await Promise.all([
      prisma.coachingCentre.findMany({
        include: {
          batches: true,
          facilities: true,
          owner: {
            select: {
              id: true,
              email: true,
              phone: true,
              role: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: [{ isTopInArea: 'desc' }, { rating: 'desc' }],
        take: 200,
      }),
      prisma.parentProfile.findMany({
        include: {
          children: true,
          bookings: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              role: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { user: { createdAt: 'desc' } },
        take: 200,
      }),
      prisma.category.findMany({
        orderBy: { order: 'asc' },
      }),
      prisma.platformConfig.findUnique({
        where: { id: 'default' },
      }),
      prisma.booking.count(),
      prisma.competition.findMany({
        orderBy: { registrationFee: 'asc' },
      }),
      prisma.majorActivity.findMany({
        include: {
          disciplines: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      }),
      prisma.discipline.findMany({
        include: {
          activity: true,
        },
        orderBy: [
          { activityId: 'asc' },
          { order: 'asc' },
        ],
      }),
    ]);

    const mappedActivities = (majorActivities || []).map((act: any) => ({
      id: act.id,
      name: act.name,
      slug: act.slug,
      description: act.description,
      imageUrl: act.imageUrl,
      icon: act.icon,
      accentColor: act.accentColor,
      order: act.order,
      isActive: act.isActive,
      categories: (act.disciplines || []).map((d: any) => ({
        id: d.id,
        activityId: d.activityId,
        name: d.name,
        slug: d.slug,
        shortDesc: d.shortDesc,
        imageUrl: d.imageUrl,
        icon: d.icon,
        badge: d.badge,
        order: d.order,
        isActive: d.isActive,
      })),
    }));

    const mappedCategories = (disciplines || []).map((d: any) => ({
      id: d.id,
      activityId: d.activityId,
      activity: d.activity,
      name: d.name,
      slug: d.slug,
      shortDesc: d.shortDesc,
      imageUrl: d.imageUrl,
      icon: d.icon,
      badge: d.badge,
      order: d.order,
      isActive: d.isActive,
    }));

    const mappedCoaches = (coaches || []).map((c: any) => ({
      ...c,
      batches: (c.batches || []).map((b: any) => formatBatchItem(b, c.category)),
    }));

    const result = {
      coaches: mappedCoaches,
      parents,
      activities: mappedActivities,
      categories: mappedCategories,
      competitions: competitions || [],
      config: config || {
        id: 'default',
        siteName: 'KnowUrCoach',
        tagline: 'Hyperlocal Sports & Academy Discovery across India',
        themeColor: 'emerald',
        bgColor: 'slate',
        fontSize: 'normal',
        borderRadius: 'rounded-xl',
        standardPlanPrice: 1499.00,
        premiumPlanPrice: 3999.00,
        allowTrialBookings: true,
        allowFreeTierPublicListing: false,
        enableFreePlan: false,
        enableStandardPlan: true,
        enablePremiumPlan: true,
        freePlanFeatures: null,
        standardPlanFeatures: null,
        premiumPlanFeatures: null,
      },
      stats: {
        totalCoaches: coaches.length,
        pendingApprovals: coaches.filter((c) => c.kycStatus === KycStatus.PENDING || c.kycStatus === KycStatus.DOCS_REVIEW).length,
        approvedCoaches: coaches.filter((c) => c.kycStatus === KycStatus.APPROVED).length,
        totalParents: parents.length,
        totalBookings: stats,
        totalCompetitions: (competitions || []).length,
        totalActivities: mappedActivities.length,
        totalCategories: mappedCategories.length,
      },
    };

    return toPlainObject(result);
  } catch (err) {
    console.error("[DB_ERROR] Failed to fetch admin dashboard data:", err);
    throw new Error("Database error: Failed to fetch admin dashboard data");
  }
}

export async function getDiscoveryData() {
  try {
    return await getCachedDiscoveryData();
  } catch (err) {
    console.error("[DB_ERROR] Failed to fetch discovery data from database:", err);
    throw new Error("Database error: Failed to fetch discovery data");
  }
}

export async function updateLeadStatus(
  leadId: string,
  status: 'new' | 'contacted' | 'trial' | 'enrolled'
) {
  try {
    await prisma.lead.update({
      where: { id: leadId },
      data: { status },
    });
    return {
      success: true,
      leadId,
      status,
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("[DB_ERROR] Failed to update lead status:", err);
    throw new Error("Database error: Failed to update lead status");
  }
}

export async function getActiveCategories(): Promise<PlatformCategory[]> {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
    return toPlainObject(categories || []);
  } catch (err) {
    console.error("[DB_ERROR] Failed to fetch active categories from database:", err);
    throw new Error("Database error: Failed to fetch active categories");
  }
}

export async function registerCoachAcademy(data: {
  acadName: string;
  founder: string;
  email: string;
  phone: string;
  category?: string;
  categories?: string[];
  locality: string;
  address: string;
  pincode?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  password?: string;
  plan?: string;
  otp?: string;
  docs?: {
    govIdDocName?: string;
    govIdNumber?: string;
    govIdUrl?: string;
    nisCertDocName?: string;
    nisCertUrl?: string;
    venuePhotoNames?: string[];
  };
  safetyChecklist?: {
    cctvMonitored?: boolean;
    nisCertified?: boolean;
    policeVerifiedStaff?: boolean;
    firstAidAvailable?: boolean;
  };
}) {
  try {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhone = data.phone.trim().replace(/\D/g, '');

    // Mandatory Email OTP verification for coach registration
    if (!data.otp || !data.otp.trim()) {
      return {
        success: false,
        message: 'A 6-digit email verification code (OTP) is required to complete coach registration.',
      };
    }

    const otpResult = verifyOtp(cleanEmail, data.otp.trim());
    if (!otpResult.valid) {
      return {
        success: false,
        message: otpResult.error || 'Invalid or expired OTP code. Please request a new verification code.',
      };
    }

    // Check if user already exists with this email or phone
    const userByEmail = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } },
      include: { coachingCentre: true },
    });

    const userByPhone = cleanPhone
      ? await prisma.user.findFirst({
          where: { phone: cleanPhone },
          include: { coachingCentre: true },
        })
      : null;

    let user: any = null;
    const hashedPassword = data.password ? await bcrypt.hash(data.password.trim(), 12) : undefined;

    if (userByEmail) {
      if (userByEmail.role === Role.ADMIN) {
        return {
          success: false,
          message: 'This email address is reserved for Platform Administration. Please use an official academy email address.',
        };
      } else if (userByEmail.role === Role.COACH && userByEmail.coachingCentre) {
        return {
          success: false,
          alreadyExists: true,
          message: `An academy account with this email (${cleanEmail}) is already registered. Please sign in to your Coach dashboard.`,
        };
      } else {
        // Reuse / upgrade user account for this coach
        user = userByEmail;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            role: Role.COACH,
            ...(hashedPassword ? { passwordHash: hashedPassword } : {}),
            ...(cleanPhone && !user.phone ? { phone: cleanPhone } : {}),
          },
        });
      }
    } else if (userByPhone) {
      if (userByPhone.role === Role.ADMIN) {
        return {
          success: false,
          message: 'This phone number is reserved for Platform Administration.',
        };
      } else if (userByPhone.role === Role.COACH && userByPhone.coachingCentre) {
        return {
          success: false,
          alreadyExists: true,
          message: `An academy account with this phone number (${cleanPhone}) is already registered. Please sign in to your Coach dashboard.`,
        };
      } else if (userByPhone.email && userByPhone.email.toLowerCase() !== cleanEmail) {
        // Prevent blind account takeover of other user's account by phone collision
        return {
          success: false,
          message: `This phone number (${cleanPhone}) is already linked to another registered email. Please sign in or use a distinct contact number.`,
        };
      } else {
        user = userByPhone;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            email: cleanEmail,
            role: Role.COACH,
            ...(hashedPassword ? { passwordHash: hashedPassword } : {}),
          },
        });
      }
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          phone: cleanPhone,
          role: Role.COACH,
          passwordHash: hashedPassword,
        },
      });
    }

    const categoryList = (data.categories && data.categories.length > 0)
      ? data.categories.map((s) => s.trim().toLowerCase()).filter(Boolean)
      : (data.category ? data.category.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean) : ['badminton']);
    const categorySlug = categoryList.length > 0 ? categoryList.join(',') : 'badminton';
    const localitySlug = (data.locality || 'kamla-nagar').toLowerCase().replace(/\s+/g, '-');
    // Default coach plan is FREE upon registration
    const planTier =
      data.plan === 'premium' || data.plan === 'pro'
        ? SubscriptionPlan.PREMIUM
        : data.plan === 'standard'
        ? SubscriptionPlan.STANDARD
        : SubscriptionPlan.FREE;

    // Check if documents were attached in the onboarding wizard
    const hasGovId = Boolean(
      data.docs?.govIdUrl ||
      (data.docs?.govIdDocName && data.docs.govIdDocName !== 'Govt_ID_Pending.pdf' && data.docs.govIdDocName !== 'Provided')
    );
    const hasNisCert = Boolean(
      data.docs?.nisCertUrl ||
      (data.docs?.nisCertDocName && data.docs.nisCertDocName !== 'NIS_Coach_Certificate.pdf' && data.docs.nisCertDocName !== 'Provided')
    );
    const venuePhotosList = (data.docs?.venuePhotoNames || []).filter(Boolean);

    let statusNotesWithPayload: string | undefined = undefined;
    let initialKycStatus: KycStatus = KycStatus.PENDING;

    if (hasGovId || hasNisCert || venuePhotosList.length > 0) {
      initialKycStatus = KycStatus.DOCS_REVIEW;
      const docParts = [];
      if (hasGovId) docParts.push(`Govt ID (${data.docs?.govIdDocName || 'Attached'})`);
      if (hasNisCert) docParts.push(`NIS Cert (${data.docs?.nisCertDocName || 'Attached'})`);
      if (venuePhotosList.length > 0) docParts.push(`Photos (${venuePhotosList.length} files)`);
      const docSummary = docParts.length > 0 ? `Uploaded docs: ${docParts.join(', ')}.` : '';
      const statusNotesText = `In-app digital KYC submitted on ${new Date().toLocaleDateString('en-IN')}. ${docSummary}`;

      statusNotesWithPayload = buildStatusNotesWithDocs(statusNotesText, {
        govId: hasGovId ? {
          name: data.docs?.govIdDocName || 'Govt_ID.pdf',
          number: data.docs?.govIdNumber || undefined,
          url: data.docs?.govIdUrl,
          status: 'PENDING',
        } : undefined,
        nisCert: hasNisCert ? {
          name: data.docs?.nisCertDocName || 'NIS_Certificate.pdf',
          url: data.docs?.nisCertUrl,
          status: 'PENDING',
        } : undefined,
        venuePhotos: venuePhotosList.map((url, i) => ({
          url,
          title: `Venue / Facility Photo #${i + 1}`,
        })),
        venuePhotosStatus: venuePhotosList.length > 0 ? 'PENDING' : undefined,
      });
    }

    const fullAddress = data.pincode && !data.address.includes(data.pincode)
      ? `${data.address.trim()}, PIN: ${data.pincode.trim()}`
      : data.address.trim();

    let centre = await prisma.coachingCentre.findUnique({
      where: { ownerUserId: user.id },
    });

    const categoryHeadline = categoryList.map(getCategoryDisplayName).slice(0, 2).join(' & ');

    if (centre) {
      centre = await prisma.coachingCentre.update({
        where: { id: centre.id },
        data: {
          name: data.acadName,
          category: categorySlug,
          locality: localitySlug,
          address: fullAddress,
          phone: cleanPhone,
          headCoachName: data.founder,
          latitude: data.latitude,
          longitude: data.longitude,
          planTier,
          ...(initialKycStatus === KycStatus.DOCS_REVIEW && {
            kycStatus: KycStatus.DOCS_REVIEW,
            statusNotes: statusNotesWithPayload,
            cctvMonitored: Boolean(data.safetyChecklist?.cctvMonitored),
            nisCertified: Boolean(data.safetyChecklist?.nisCertified),
            policeVerifiedStaff: Boolean(data.safetyChecklist?.policeVerifiedStaff),
            firstAidAvailable: Boolean(data.safetyChecklist?.firstAidAvailable),
            referredBackRemarks: null,
          }),
        },
      });
    } else {
      centre = await prisma.coachingCentre.create({
        data: {
          ownerUserId: user.id,
          name: data.acadName,
          tagline: `Premier ${categoryHeadline} in ${data.locality || data.city || 'Agra'}`,
          category: categorySlug,
          locality: localitySlug,
          address: fullAddress,
          phone: cleanPhone,
          rating: 5.0,
          reviewsCount: 0,
          monthlyTuitionFee: 1500.00,
          trialFee: 0.00,
          eligibleAgeGroup: '4 - 17 Yrs',
          headCoachName: data.founder,
          headCoachBio: `NIS / Certified Head Coach at ${data.acadName}`,
          coachesCount: 2,
          studentCoachRatio: '1 : 8',
          latitude: data.latitude,
          longitude: data.longitude,
          safetyGrade: SafetyGrade.PENDING_AUDIT,
          kycStatus: initialKycStatus,
          statusNotes: statusNotesWithPayload,
          cctvMonitored: Boolean(data.safetyChecklist?.cctvMonitored),
          nisCertified: Boolean(data.safetyChecklist?.nisCertified),
          policeVerifiedStaff: Boolean(data.safetyChecklist?.policeVerifiedStaff),
          firstAidAvailable: Boolean(data.safetyChecklist?.firstAidAvailable),
          coachType: CoachType.INSTITUTE,
          planTier,
          isTopInArea: false,
          isVerifiedBatch: false,
        },
      });
    }

    if (initialKycStatus === KycStatus.DOCS_REVIEW && user?.id) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Application Submitted for Review',
          message: `Your academy registration and verification documents for ${data.acadName} have been submitted to the platform admin. Review takes 24–48 hours.`,
          type: 'kyc',
        },
      }).catch(() => null);
    }

    // Send welcome email to coach (non-blocking)
    sendWelcomeEmail({
      to: cleanEmail,
      name: data.founder || data.acadName,
      role: 'Coach',
    }).catch(err => console.warn('Non-blocking welcome email error:', err));

    // Non-blocking revalidation
    try {
      revalidatePath('/admin');
      revalidatePath('/admin/verify-coaches');
      revalidatePath('/admin/academies');
      revalidatePath('/activities');
    } catch (revalErr) {
      console.warn('Non-blocking revalidatePath notice:', revalErr);
    }

    return { success: true, centre: toPlainObject(centre), message: 'Academy registered successfully! Complete your profile in dashboard.' };
  } catch (err) {
    console.warn("DB registerCoachAcademy error:", err);
    return { success: false, message: 'Could not register academy in database. Please check your network and details.' };
  }
}

export async function registerParentAccount(data: {
  fullName: string;
  email: string;
  phone: string;
  locality: string;
  pincode?: string;
  city?: string;
  password?: string;
  otp?: string;
  children: Array<{
    name: string;
    age: number | string;
    interests?: string[];
  }>;
}) {
  try {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhone = data.phone.trim();
    const cleanCity = data.city?.trim() || 'Agra';

    // Mandatory Email OTP verification for parent registration just like academy/coaches
    if (!data.otp || !data.otp.trim()) {
      return {
        success: false,
        message: 'A 6-digit email verification code (OTP) is required to complete parent registration.',
      };
    }

    const otpResult = verifyOtp(cleanEmail, data.otp.trim());
    if (!otpResult.valid) {
      return {
        success: false,
        message: otpResult.error || 'Invalid or expired OTP code. Please request a new verification code.',
      };
    }

    // Strict duplicate and cross-role check:
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { phone: cleanPhone },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === cleanEmail) {
        if (existingUser.role === Role.COACH) {
          return {
            success: false,
            message: "This email is already registered as a Coach / Academy account. Each email can only be associated with one account role. Please sign in to your Coach portal or use a different email address for Parent registration.",
          };
        }
        if (existingUser.role === Role.ADMIN) {
          return {
            success: false,
            message: "This email is associated with a Platform Administrator account. Please sign in to your admin portal.",
          };
        }
        if (existingUser.role === Role.PARENT) {
          return {
            success: false,
            message: `A parent account with email ${cleanEmail} already exists. Please sign in to your parent dashboard instead of registering again.`,
          };
        }
      }

      if (existingUser.phone === cleanPhone) {
        return {
          success: false,
          message: `An account with phone number ${cleanPhone} is already registered. Please sign in or use a different phone number.`,
        };
      }
    }

    const hashedPassword = data.password ? await bcrypt.hash(data.password.trim(), 12) : undefined;

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        phone: cleanPhone,
        role: Role.PARENT,
        passwordHash: hashedPassword,
      },
    });

    // Find or create ParentProfile
    let parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: user.id },
      include: { children: true },
    });

    const fullLocality = data.pincode && !data.locality.includes(data.pincode)
      ? `${data.locality.trim()} - ${data.pincode.trim()}`
      : data.locality.trim();

    if (!parentProfile) {
      parentProfile = await prisma.parentProfile.create({
        data: {
          userId: user.id,
          fullName: data.fullName.trim(),
          locality: fullLocality,
          city: cleanCity,
        },
        include: { children: true },
      });
    } else {
      parentProfile = await prisma.parentProfile.update({
        where: { id: parentProfile.id },
        data: {
          fullName: data.fullName.trim(),
          locality: fullLocality,
          city: cleanCity,
        },
        include: { children: true },
      });
    }

    // Create child profiles
    if (data.children && data.children.length > 0) {
      for (const ch of data.children) {
        if (ch.name?.trim()) {
          const ageNum = parseInt(String(ch.age)) || 8;
          await prisma.childProfile.create({
            data: {
              parentId: parentProfile.id,
              fullName: ch.name.trim(),
              age: ageNum,
              interests: ch.interests || [],
            },
          });
        }
      }
    }

    // Send welcome email to parent
    sendWelcomeEmail({
      to: cleanEmail,
      name: data.fullName,
      role: 'Parent',
    }).catch(err => console.warn('Non-blocking welcome email error:', err));

    revalidatePath('/parent/dashboard');
    revalidatePath('/parent/bookings');
    return {
      success: true,
      parent: toPlainObject(parentProfile),
      message: 'Parent account created successfully!',
    };
  } catch (err) {
    console.warn("DB registerParentAccount error:", err);
    return { success: false, message: 'Could not register parent in database.' };
  }
}

export async function getCoachDashboardData(userEmailOrId?: string) {
  try {
    let centre = null;
    const clean = userEmailOrId?.trim().toLowerCase();

    if (userEmailOrId && clean) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: userEmailOrId },
            { email: { equals: clean, mode: 'insensitive' } },
            { phone: clean },
          ],
        },
        include: {
          coachingCentre: {
            include: {
              facilities: true,
              batches: {
                include: {
                  bookings: true,
                },
              },
              bookings: {
                include: {
                  child: true,
                  parent: true,
                  batch: true,
                  attendances: {
                    orderBy: { date: 'desc' },
                    take: 20,
                  },
                },
                orderBy: { createdAt: 'desc' },
                take: 50,
              },
            },
          },
        },
      });

      if (user?.coachingCentre) {
        centre = user.coachingCentre;
      } else if (user && user.role === Role.COACH) {
        // Automatically ensure coachingCentre exists for coach user
        try {
          centre = await prisma.coachingCentre.create({
            data: {
              ownerUserId: user.id,
              name: user.email ? `${user.email.split('@')[0]}'s Academy` : 'Sports Academy',
              tagline: 'Premier Sports & Activities Academy',
              category: 'sports',
              locality: 'central-agra',
              address: 'Agra, Uttar Pradesh',
              phone: user.phone || '9876543210',
              rating: 5.0,
              reviewsCount: 0,
              monthlyTuitionFee: 1500.0,
              trialFee: 0.0,
              eligibleAgeGroup: '4 - 17 Yrs',
              headCoachName: 'Head Coach',
              headCoachBio: 'Certified Coach at Academy',
              coachesCount: 1,
              studentCoachRatio: '1 : 10',
              safetyGrade: SafetyGrade.PENDING_AUDIT,
              kycStatus: KycStatus.PENDING,
              coachType: CoachType.INSTITUTE,
              planTier: SubscriptionPlan.FREE,
            },
            include: {
              facilities: true,
              batches: true,
              bookings: {
                include: { child: true, parent: true },
                orderBy: { createdAt: 'desc' },
                take: 10,
              },
            },
          });
        } catch (createErr) {
          console.warn("Could not auto-create coachingCentre for coach:", createErr);
        }
      }
    }

    // No unauthenticated fallback: caller must provide a valid coach identity
    if (!centre && !userEmailOrId) {
      return { success: false, centre: null, config: null };
    }

    if (!centre && (clean === 'coach@knowurcoach.in' || clean === 'coach@knowyourcoach.in')) {
      centre = await prisma.coachingCentre.findFirst({
        include: {
          facilities: true,
          batches: {
            include: {
              bookings: true,
            },
          },
          bookings: {
            include: { child: true, parent: true },
            take: 10,
          },
        },
      });
    }

    const config = await prisma.platformConfig.findUnique({
      where: { id: 'default' },
    });

    const plainCentre = centre ? toPlainObject(centre) : null;
    if (plainCentre) {
      (plainCentre as any).categories = plainCentre.category
        ? plainCentre.category.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean)
        : [];
      if (Array.isArray((plainCentre as any).batches)) {
        (plainCentre as any).batches = (plainCentre as any).batches.map((b: any) => formatBatchItem(b, plainCentre.category));
      }
    }

    return {
      success: true,
      centre: plainCentre,
      config: config ? toPlainObject(config) : null,
    };
  } catch (err) {
    console.error("[DB_ERROR] Failed to fetch coach dashboard data:", err);
    throw new Error("Database error: Failed to fetch coach dashboard data");
  }
}

export async function submitCoachKycProfile(data: {
  centreId?: string;
  userEmail?: string;
  safetyChecklist: {
    cctvMonitored?: boolean;
    nisCertified?: boolean;
    policeVerifiedStaff?: boolean;
    firstAidAvailable?: boolean;
    facilities?: string[];
  };
  docs?: {
    govIdDocName?: string;
    govIdNumber?: string;
    govIdUrl?: string;
    nisCertDocName?: string;
    nisCertUrl?: string;
    venuePhotoNames?: string[];
  };
  planTier?: 'starter' | 'pro' | SubscriptionPlan;
  batches?: Array<{
    name: string;
    category?: string;
    coachName?: string;
    schedule: string;
    ageGroup: string;
    totalSeats: number;
    monthlyFee: number;
  }>;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, message: 'Authentication required to submit KYC.' };
    }
    const user = session.user as any;
    const isAdmin = user.role === Role.ADMIN || user.email === 'admin@knowurcoach.in' || user.email === 'admin.rawat@knowurcoach.com';

    let targetCentreId = data.centreId;

    if (!targetCentreId && data.userEmail) {
      const coachData = await getCoachDashboardData(data.userEmail);
      if (coachData.centre?.id) {
        targetCentreId = coachData.centre.id;
      }
    }

    if (!targetCentreId) {
      const centre = await prisma.coachingCentre.findFirst({
        where: {
          OR: [
            { ownerUserId: user.id },
            { owner: { email: { equals: user.email?.toLowerCase(), mode: 'insensitive' } } },
            ...(user.phone ? [{ phone: user.phone }] : []),
          ],
        },
      });
      if (centre) targetCentreId = centre.id;
    }

    if (!targetCentreId) {
      return { success: false, message: 'Could not identify your academy profile. Please refresh the page and try again, or contact support.' };
    }

    const centreToUpdate = await prisma.coachingCentre.findUnique({
      where: { id: targetCentreId },
      include: { owner: true },
    });
    if (!centreToUpdate) {
      return { success: false, message: 'Academy centre not found in database.' };
    }

    if (!isAdmin && centreToUpdate.ownerUserId !== user.id && centreToUpdate.owner?.email?.toLowerCase() !== user.email?.toLowerCase()) {
      return { success: false, message: 'Access denied: You do not have permission to submit KYC for this academy.' };
    }

    const hasGovId = Boolean(
      data.docs?.govIdUrl ||
      (data.docs?.govIdDocName && data.docs.govIdDocName !== 'Govt_ID_Pending.pdf' && data.docs.govIdDocName !== 'Provided')
    );
    const hasNisCert = Boolean(
      data.docs?.nisCertUrl ||
      (data.docs?.nisCertDocName && data.docs.nisCertDocName !== 'NIS_Coach_Certificate.pdf' && data.docs.nisCertDocName !== 'Provided')
    );
    const venuePhotosList = (data.docs?.venuePhotoNames || []).filter(Boolean);

    const docParts = [];
    if (hasGovId) docParts.push(`Govt ID (${data.docs?.govIdDocName || 'Attached'})`);
    if (hasNisCert) docParts.push(`NIS Cert (${data.docs?.nisCertDocName || 'Attached'})`);
    if (venuePhotosList.length > 0) docParts.push(`Photos (${venuePhotosList.length} files)`);

    const docSummary = docParts.length > 0 ? `Uploaded docs: ${docParts.join(', ')}.` : 'No verification documents attached.';
    const statusNotesText = `In-app digital KYC submitted on ${new Date().toLocaleDateString('en-IN')}. ${docSummary}`;

    const statusNotesWithPayload = buildStatusNotesWithDocs(statusNotesText, {
      govId: hasGovId
        ? {
            name: data.docs?.govIdDocName || 'Govt_ID.pdf',
            number: data.docs?.govIdNumber || undefined,
            url: data.docs?.govIdUrl,
            status: 'PENDING',
          }
        : undefined,
      nisCert: hasNisCert
        ? {
            name: data.docs?.nisCertDocName || 'NIS_Certificate.pdf',
            url: data.docs?.nisCertUrl,
            status: 'PENDING',
          }
        : undefined,
      venuePhotos: venuePhotosList.map((url, i) => ({
        url,
        title: `Venue / Facility Photo #${i + 1}`,
      })),
      venuePhotosStatus: venuePhotosList.length > 0 ? 'PENDING' : undefined,
    });

    // Update centre
    const updatedCentre = await prisma.coachingCentre.update({
      where: { id: targetCentreId },
      data: {
        kycStatus: KycStatus.DOCS_REVIEW,
        cctvMonitored: Boolean(data.safetyChecklist.cctvMonitored),
        nisCertified: Boolean(data.safetyChecklist.nisCertified),
        policeVerifiedStaff: Boolean(data.safetyChecklist.policeVerifiedStaff),
        firstAidAvailable: Boolean(data.safetyChecklist.firstAidAvailable),
        statusNotes: statusNotesWithPayload,
        referredBackRemarks: null,
      },
      include: { batches: true, facilities: true },
    });

    // Add facilities if provided in batch
    if (data.safetyChecklist.facilities && data.safetyChecklist.facilities.length > 0) {
      const validFacs = data.safetyChecklist.facilities.filter(Boolean);
      const existingFacs = await prisma.facility.findMany({
        where: { coachingCentreId: targetCentreId },
        select: { description: true },
      });
      const existingSet = new Set(existingFacs.map((f) => f.description));
      const toCreate = validFacs
        .filter((fac) => !existingSet.has(fac))
        .map((fac) => ({ coachingCentreId: targetCentreId!, description: fac }));

      if (toCreate.length > 0) {
        await prisma.facility.createMany({
          data: toCreate,
          skipDuplicates: true,
        });
      }
    }

    // Add / update batches if provided
    if (data.batches && data.batches.length > 0) {
      for (const b of data.batches) {
        if (b.name?.trim()) {
          const finalSchedule = serializeBatchSchedule({
            schedule: b.schedule,
            category: b.category,
            coachName: b.coachName,
          });
          const existing = await prisma.batch.findFirst({
            where: { coachingCentreId: targetCentreId, name: b.name.trim() },
          });
          if (existing) {
            await prisma.batch.update({
              where: { id: existing.id },
              data: {
                schedule: finalSchedule,
                ageGroup: b.ageGroup,
                totalSeats: b.totalSeats,
                monthlyFee: b.monthlyFee,
              },
            });
          } else {
            await prisma.batch.create({
              data: {
                coachingCentreId: targetCentreId,
                name: b.name.trim(),
                schedule: finalSchedule,
                ageGroup: b.ageGroup,
                totalSeats: b.totalSeats,
                monthlyFee: b.monthlyFee,
              },
            });
          }
        }
      }
    }

    if (updatedCentre?.ownerUserId) {
      await prisma.notification.create({
        data: {
          userId: updatedCentre.ownerUserId,
          title: 'KYC Verification Submitted',
          message: `Your academy documents and safety checklist for ${updatedCentre.name} have been submitted for compliance audit. Review takes 24–48 hours.`,
          type: 'kyc',
        },
      }).catch(() => null);
    }

    invalidateTag('discovery');
    invalidateTag('academies');
    invalidateTag(`academy-${targetCentreId}`);
    revalidatePath('/coach/dashboard');
    revalidatePath('/coach/batches');
    revalidatePath('/admin');
    revalidatePath('/admin/verify-coaches');
    revalidatePath('/activities');
    revalidatePath(`/activities/${targetCentreId}`);
    revalidatePath('/');

    return {
      success: true,
      centre: toPlainObject(updatedCentre),
      message: 'KYC profile & verification documents submitted for compliance review!',
    };
  } catch (err) {
    console.warn("DB submitCoachKycProfile error:", err);
    return { success: false, message: 'Could not submit KYC profile in database.' };
  }
}

export async function updateCoachAcademyProfile(data: {
  centreId: string;
  name?: string;
  category?: string;
  categories?: string[];
  tagline?: string;
  phone?: string;
  address?: string;
  locality?: string;
  monthlyTuitionFee?: number;
  eligibleAgeGroup?: string;
  headCoachName?: string;
  headCoachBio?: string;
  batches?: Array<{
    name: string;
    schedule: string;
    ageGroup: string;
    totalSeats: number;
    monthlyFee: number;
  }>;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, message: 'Authentication required to update academy profile.' };
    }
    const user = session.user as any;
    const isAdmin = user.role === Role.ADMIN || user.email === 'admin@knowurcoach.in' || user.email === 'admin.rawat@knowurcoach.com';

    const targetCentre = await prisma.coachingCentre.findUnique({
      where: { id: data.centreId },
      include: { owner: true },
    });
    if (!targetCentre) {
      return { success: false, message: 'Academy centre not found.' };
    }

    if (!isAdmin && targetCentre.ownerUserId !== user.id && targetCentre.owner?.email?.toLowerCase() !== user.email?.toLowerCase()) {
      return { success: false, message: 'Access denied: You are not authorized to update this academy profile.' };
    }

    const categorySlug = (data.categories && data.categories.length > 0)
      ? data.categories.map((s) => s.trim().toLowerCase()).filter(Boolean).join(',')
      : (data.category ? data.category.trim() : undefined);

    const updated = await prisma.coachingCentre.update({
      where: { id: data.centreId },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(categorySlug ? { category: categorySlug } : {}),
        ...(data.tagline ? { tagline: data.tagline } : {}),
        ...(data.phone ? { phone: data.phone } : {}),
        ...(data.address ? { address: data.address } : {}),
        ...(data.locality ? { locality: data.locality.toLowerCase().replace(/\s+/g, '-') } : {}),
        ...(data.monthlyTuitionFee ? { monthlyTuitionFee: data.monthlyTuitionFee } : {}),
        ...(data.eligibleAgeGroup ? { eligibleAgeGroup: data.eligibleAgeGroup } : {}),
        ...(data.headCoachName ? { headCoachName: data.headCoachName } : {}),
        ...(data.headCoachBio ? { headCoachBio: data.headCoachBio } : {}),
      },
    });

    if (data.batches && data.batches.length > 0) {
      for (const b of data.batches) {
        if (b.name?.trim()) {
          const existing = await prisma.batch.findFirst({
            where: { coachingCentreId: data.centreId, name: b.name.trim() },
          });
          if (existing) {
            await prisma.batch.update({
              where: { id: existing.id },
              data: {
                schedule: b.schedule,
                ageGroup: b.ageGroup,
                totalSeats: b.totalSeats,
                monthlyFee: b.monthlyFee,
              },
            });
          } else {
            await prisma.batch.create({
              data: {
                coachingCentreId: data.centreId,
                name: b.name.trim(),
                schedule: b.schedule,
                ageGroup: b.ageGroup,
                totalSeats: b.totalSeats,
                monthlyFee: b.monthlyFee,
              },
            });
          }
        }
      }
    }

    invalidateTag('discovery');
    invalidateTag('academies');
    invalidateTag(`academy-${data.centreId}`);
    revalidatePath('/coach/dashboard');
    revalidatePath('/activities');
    revalidatePath(`/activities/${data.centreId}`);
    revalidatePath('/');
    return { success: true, centre: toPlainObject(updated) };
  } catch (err) {
    console.warn("DB updateCoachAcademyProfile error:", err);
    return { success: false, message: 'Could not update academy profile.' };
  }
}

// ==========================================
// PARENT DASHBOARD & ACCOUNT ACTIONS
// ==========================================

export async function getParentDashboardData(userEmailOrId?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, parent: null, bookings: [], children: [], savedCentres: [] };
    }
    const sessionUser = session.user as any;
    const isAdmin = sessionUser.role === Role.ADMIN || sessionUser.email === 'admin@knowurcoach.in' || sessionUser.email === 'admin.rawat@knowurcoach.com';

    const clean = (isAdmin && userEmailOrId ? userEmailOrId : (sessionUser.email || sessionUser.id))?.trim().toLowerCase();

    if (!clean) {
      return { success: false, parent: null, bookings: [], children: [], savedCentres: [] };
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: clean, mode: 'insensitive' } },
          { phone: clean },
          { id: clean },
        ],
      },
      include: {
        parentProfile: {
          include: {
            children: true,
            bookings: {
              include: {
                child: true,
                centre: true,
                batch: true,
                competition: true,
                attendances: true,
              },
              orderBy: { createdAt: 'desc' },
            },
            savedCentres: true,
          },
        },
      },
    });

    if (user && !user.parentProfile) {
      const newParentProfile = await prisma.parentProfile.create({
        data: {
          userId: user.id,
          fullName: (user as any).name || 'Verified Parent Member',
          locality: 'Kamla Nagar',
          city: 'Agra',
        },
        include: {
          children: true,
          bookings: {
            include: {
              child: true,
              centre: true,
              batch: true,
              competition: true,
              attendances: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          savedCentres: true,
        },
      });
      user = {
        ...user,
        parentProfile: newParentProfile,
      };
    }

    if (!user || !user.parentProfile) {
      return { success: false, parent: null, bookings: [], children: [], savedCentres: [] };
    }

    // Also fetch the coaching centres for savedCentres
    const savedCentreIds = user.parentProfile.savedCentres.map((sc) => sc.coachingCentreId);
    let centresDetails: any[] = [];
    if (savedCentreIds.length > 0) {
      centresDetails = await prisma.coachingCentre.findMany({
        where: { id: { in: savedCentreIds } },
        include: { facilities: true, batches: true },
      });
    }

    const savedCentresWithDetails = user.parentProfile.savedCentres.map((sc) => {
      const match = centresDetails.find((c) => c.id === sc.coachingCentreId);
      return {
        ...sc,
        centre: match ? toPlainObject(match) : null,
      };
    }).filter((sc) => Boolean(sc.centre));

    return {
      success: true,
      parent: toPlainObject(user.parentProfile),
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
      },
      bookings: toPlainObject(user.parentProfile.bookings || []),
      children: toPlainObject(user.parentProfile.children || []),
      savedCentres: toPlainObject(savedCentresWithDetails),
    };
  } catch (err) {
    console.error("[DB_ERROR] Failed to fetch parent dashboard data:", err);
    throw new Error("Database error: Failed to fetch parent dashboard data");
  }
}

export async function addChildProfile(
  userEmailOrId: string,
  child: { fullName: string; age: number | string; grade?: string; interests?: string[] }
) {
  try {
    const { parent, isAdmin } = await requireParentSession();
    const effectiveParent = isAdmin && userEmailOrId
      ? (await resolveParentProfile(userEmailOrId)) || parent
      : parent;

    if (!effectiveParent) {
      return { success: false, message: 'Parent profile not found.' };
    }

    const newChild = await prisma.childProfile.create({
      data: {
        parentId: effectiveParent.id,
        fullName: child.fullName.trim(),
        age: parseInt(String(child.age), 10) || 5,
        grade: child.grade?.trim() || null,
        interests: child.interests || [],
      },
    });

    revalidatePath('/parent/bookings');
    revalidatePath('/parent/children');
    return { success: true, child: toPlainObject(newChild) };
  } catch (err: any) {
    console.warn("DB addChildProfile error:", err);
    return { success: false, message: err?.message || 'Could not add child profile.' };
  }
}

export async function deleteChildProfile(childId: string) {
  try {
    const { parent, isAdmin } = await requireParentSession();
    const targetChild = await prisma.childProfile.findUnique({ where: { id: childId } });
    if (!targetChild) {
      return { success: false, message: 'Child profile not found.' };
    }

    if (!isAdmin && targetChild.parentId !== parent?.id) {
      return { success: false, message: 'Unauthorized: Cannot delete a child profile belonging to another parent.' };
    }

    await prisma.attendance.deleteMany({ where: { childId } });
    await prisma.booking.deleteMany({ where: { childId } });
    await prisma.childProfile.delete({
      where: { id: childId },
    });
    revalidatePath('/parent/bookings');
    revalidatePath('/parent/children');
    return { success: true };
  } catch (err: any) {
    console.warn("DB deleteChildProfile error:", err);
    return { success: false, message: err?.message || 'Could not delete child profile.' };
  }
}

export async function updateParentProfile(
  userEmailOrId: string,
  data: {
    fullName?: string;
    phone?: string;
    locality?: string;
    city?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  }
) {
  try {
    const { parent, isAdmin } = await requireParentSession();
    const effectiveParent = isAdmin && userEmailOrId
      ? (await resolveParentProfile(userEmailOrId)) || parent
      : parent;

    if (!effectiveParent) {
      return { success: false, message: 'Parent profile not found.' };
    }

    if (data.phone && data.phone.trim() !== (effectiveParent as any).user?.phone) {
      await prisma.user.update({
        where: { id: effectiveParent.userId },
        data: { phone: data.phone.trim() },
      });
    }

    const updatedProfile = await prisma.parentProfile.update({
      where: { id: effectiveParent.id },
      data: {
        ...(data.fullName ? { fullName: data.fullName.trim() } : {}),
        ...(data.locality ? { locality: data.locality.trim() } : {}),
        ...(data.city ? { city: data.city.trim() } : {}),
        emergencyContactName: data.emergencyContactName?.trim() || null,
        emergencyContactPhone: data.emergencyContactPhone?.trim() || null,
      },
    });

    revalidatePath('/parent/dashboard');
    revalidatePath('/parent/settings');
    revalidatePath('/parent/bookings');
    return { success: true, profile: toPlainObject(updatedProfile) };
  } catch (err: any) {
    console.warn("DB updateParentProfile error:", err);
    return { success: false, message: err?.message || 'Could not update parent profile.' };
  }
}

// ==========================================
// COACH SUB-ROUTES & LEADS ACTIONS
// ==========================================

export async function getCoachLeadsData(coachEmailOrId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, leads: [], centre: null };
    }
    const sessionUser = session.user as any;
    const isAdmin = sessionUser.role === Role.ADMIN || sessionUser.email === 'admin@knowurcoach.in' || sessionUser.email === 'admin.rawat@knowurcoach.com';
    const clean = (isAdmin && coachEmailOrId ? coachEmailOrId : (sessionUser.email || sessionUser.id))?.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: clean, mode: 'insensitive' } },
          { phone: clean },
          { id: clean },
        ],
      },
      include: { coachingCentre: true },
    });

    const centreId = user?.coachingCentre?.id;
    if (!centreId) {
      return { success: true, leads: [], centre: null };
    }

    const [dbLeads, dbBookings] = await Promise.all([
      prisma.lead.findMany({
        where: { coachingCentreId: centreId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.findMany({
        where: { coachingCentreId: centreId },
        include: {
          child: true,
          parent: { include: { user: true } },
          batch: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Format any existing bookings as leads if not already represented in dbLeads
    const existingKeys = new Set(
      dbLeads.map((l) => `${(l.childName || '').toLowerCase()}_${(l.parentName || '').toLowerCase()}`)
    );

    const bookingLeads: any[] = [];
    for (const bk of dbBookings) {
      const childName = bk.child?.fullName || 'Child';
      const parentName = bk.parent?.fullName || 'Parent';
      const key = `${childName.toLowerCase()}_${parentName.toLowerCase()}`;
      if (!existingKeys.has(key)) {
        existingKeys.add(key);
        const isTrial = bk.passType === PassType.FREE_TRIAL;
        bookingLeads.push({
          id: bk.id,
          coachingCentreId: centreId,
          parentName,
          parentPhone: bk.parent?.emergencyContactPhone || bk.parent?.user?.phone || '9876543210',
          childName,
          childAge: bk.child?.age || 8,
          inquiryNotes: isTrial
            ? `Free Trial Session Pass (${bk.passId})`
            : `Enrolled in ${bk.batch?.name || 'Monthly Batch'} (${bk.batch?.schedule || ''}) • Pass ${bk.passId}`,
          status: isTrial ? 'trial' : 'enrolled',
          createdAt: bk.createdAt,
        });
      }
    }

    const combinedLeads = [...dbLeads, ...bookingLeads].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      success: true,
      centre: toPlainObject(user.coachingCentre),
      leads: toPlainObject(combinedLeads),
    };
  } catch (err) {
    console.error("[DB_ERROR] Failed to fetch coach leads data:", err);
    throw new Error("Database error: Failed to fetch coach leads data");
  }
}

export async function updateCoachLeadStatus(leadId: string, status: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, message: 'Authentication required.' };
    }
    const sessionUser = session.user as any;
    const isAdmin = sessionUser.role === Role.ADMIN || sessionUser.email === 'admin@knowurcoach.in' || sessionUser.email === 'admin.rawat@knowurcoach.com';

    const targetLead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { centre: true },
    });
    if (!targetLead) {
      return { success: false, message: 'Lead not found.' };
    }

    if (!isAdmin && targetLead.centre.ownerUserId !== sessionUser.id && targetLead.centre.phone !== sessionUser.phone) {
      return { success: false, message: 'Unauthorized: Cannot modify lead belonging to another academy.' };
    }

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: { status },
    });
    revalidatePath('/coach/leads');
    return { success: true, lead: toPlainObject(updated) };
  } catch (err: any) {
    console.warn("DB updateCoachLeadStatus error:", err);
    return { success: false, message: err?.message || 'Could not update lead status.' };
  }
}

export async function createCoachLead(data: {
  centreId: string;
  parentName: string;
  parentPhone: string;
  childName: string;
  childAge: number;
  inquiryNotes: string;
  status?: string;
}) {
  try {
    const lead = await prisma.lead.create({
      data: {
        coachingCentreId: data.centreId,
        parentName: data.parentName.trim(),
        parentPhone: data.parentPhone.trim(),
        childName: data.childName.trim(),
        childAge: data.childAge,
        inquiryNotes: data.inquiryNotes.trim(),
        status: data.status || 'new',
      },
    });
    revalidatePath('/coach/leads');
    return { success: true, lead: toPlainObject(lead) };
  } catch (err) {
    console.warn("DB createCoachLead error:", err);
    return { success: false, message: 'Could not create lead.' };
  }
}

export async function getCoachAttendanceData(coachEmailOrId: string) {
  try {
    const clean = coachEmailOrId?.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: clean, mode: 'insensitive' } },
          { phone: clean },
          { id: clean },
        ],
      },
      include: {
        coachingCentre: {
          include: {
            batches: {
              include: {
                bookings: {
                  include: {
                    child: true,
                    parent: true,
                    attendances: {
                      orderBy: { date: 'desc' },
                      take: 20,
                    },
                  },
                },
                attendances: {
                  include: { child: true },
                  orderBy: { date: 'desc' },
                  take: 50,
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.coachingCentre) {
      return { success: true, batches: [], centre: null };
    }

    return {
      success: true,
      centre: toPlainObject(user.coachingCentre),
      batches: toPlainObject(user.coachingCentre.batches || []),
    };
  } catch (err) {
    console.error("[DB_ERROR] Failed to fetch coach attendance data:", err);
    throw new Error("Database error: Failed to fetch coach attendance data");
  }
}

export async function recordBatchAttendance(data: {
  batchId: string;
  childId: string;
  bookingId?: string;
  isPresent: boolean;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, message: 'Authentication required to record attendance.' };
    }
    const user = session.user as any;
    const isAdmin = user.role === Role.ADMIN || user.email === 'admin@knowurcoach.in' || user.email === 'admin.rawat@knowurcoach.com';

    let booking = null;
    if (data.bookingId) {
      booking = await prisma.booking.findUnique({
        where: { id: data.bookingId },
        include: { child: true },
      });
    }

    if (!booking) {
      booking = await prisma.booking.findFirst({
        where: {
          OR: [
            { batchId: data.batchId, childId: data.childId },
            { childId: data.childId },
            { id: data.childId },
          ],
        },
        include: { child: true },
      });
    }

    if (!booking) {
      return { success: false, message: 'No active booking found for this student.' };
    }

    if (!isAdmin) {
      const coachCentre = await prisma.coachingCentre.findFirst({
        where: {
          OR: [
            { ownerUserId: user.id },
            { owner: { email: { equals: user.email?.toLowerCase(), mode: 'insensitive' } } },
            ...(user.phone ? [{ phone: user.phone }] : []),
          ],
        },
      });
      if (!coachCentre || booking.coachingCentreId !== coachCentre.id) {
        return { success: false, message: 'Unauthorized: Cannot record attendance for another coaching academy.' };
      }
    }

    const effectiveBatchId = booking.batchId || data.batchId;
    const effectiveChildId = booking.childId || data.childId;

    // Check if an attendance entry already exists for today's session (same calendar date)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const existingToday = await prisma.attendance.findFirst({
      where: {
        bookingId: booking.id,
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    let attendance;
    if (existingToday) {
      attendance = await prisma.attendance.update({
        where: { id: existingToday.id },
        data: {
          isPresent: data.isPresent,
          date: new Date(),
        },
      });
    } else {
      attendance = await prisma.attendance.create({
        data: {
          bookingId: booking.id,
          batchId: effectiveBatchId,
          childId: effectiveChildId,
          isPresent: data.isPresent,
          date: new Date(),
        },
      });
    }

    // Keep booking check-in state synchronized
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        isCheckedIn: data.isPresent,
        checkedInAt: data.isPresent ? new Date() : null,
      },
    });

    revalidatePath('/coach/attendance');
    revalidatePath('/coach/dashboard');
    revalidatePath('/parent/bookings');
    revalidatePath('/parent/passes');
    revalidatePath('/parent/dashboard');

    return { success: true, attendance: toPlainObject(attendance) };
  } catch (err) {
    console.warn("DB recordBatchAttendance error:", err);
    return { success: false, message: 'Could not record attendance.' };
  }
}

export async function getCoachBatchesData(coachEmailOrId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, batches: [], centre: null };
    }
    const sessionUser = session.user as any;
    const isAdmin = sessionUser.role === Role.ADMIN || sessionUser.email === 'admin@knowurcoach.in' || sessionUser.email === 'admin.rawat@knowurcoach.com';
    const clean = (isAdmin && coachEmailOrId ? coachEmailOrId : (sessionUser.email || sessionUser.id))?.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: clean, mode: 'insensitive' } },
          { phone: clean },
          { id: clean },
        ],
      },
      include: {
        coachingCentre: {
          include: {
            batches: {
              include: {
                bookings: {
                  include: { child: true, parent: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.coachingCentre) {
      return { success: true, batches: [], centre: null };
    }

    return {
      success: true,
      centre: toPlainObject(user.coachingCentre),
      batches: toPlainObject(user.coachingCentre.batches || []).map((b: any) =>
        formatBatchItem(b, user?.coachingCentre?.category)
      ),
    };
  } catch (err) {
    console.error("[DB_ERROR] Failed to fetch coach batches data:", err);
    throw new Error("Database error: Failed to fetch coach batches data");
  }
}

export async function saveCoachBatch(
  centreId: string,
  batchData: {
    id?: string;
    name: string;
    category?: string;
    coachName?: string;
    schedule: string;
    ageGroup: string;
    totalSeats: number;
    monthlyFee: number;
  }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, message: 'Authentication required to manage batches.' };
    }
    const user = session.user as any;
    const isAdmin = user.role === Role.ADMIN || user.email === 'admin@knowurcoach.in' || user.email === 'admin.rawat@knowurcoach.com';

    const centre = await prisma.coachingCentre.findUnique({ where: { id: centreId } });
    if (!centre) {
      return { success: false, message: 'Coaching centre not found.' };
    }

    if (!isAdmin && centre.ownerUserId !== user.id && centre.phone !== user.phone) {
      return { success: false, message: 'Access denied: You are not authorized to manage batches for this academy.' };
    }

    const finalSchedule = serializeBatchSchedule({
      schedule: batchData.schedule,
      category: batchData.category,
      coachName: batchData.coachName,
    });
    if (batchData.id) {
      const existingBatch = await prisma.batch.findUnique({ where: { id: batchData.id } });
      if (!existingBatch || existingBatch.coachingCentreId !== centreId) {
        return { success: false, message: 'Batch not found at this academy.' };
      }

      const updated = await prisma.batch.update({
        where: { id: batchData.id },
        data: {
          name: batchData.name.trim(),
          schedule: finalSchedule,
          ageGroup: batchData.ageGroup.trim(),
          totalSeats: Number(batchData.totalSeats) || 15,
          monthlyFee: Number(batchData.monthlyFee) || 1500,
        },
      });
      revalidatePath('/coach/batches');
      revalidatePath('/coach/dashboard');
      revalidatePath('/activities');
      return { success: true, batch: formatBatchItem(toPlainObject(updated)) };
    } else {
      const created = await prisma.batch.create({
        data: {
          coachingCentreId: centreId,
          name: batchData.name.trim(),
          schedule: finalSchedule,
          ageGroup: batchData.ageGroup.trim(),
          totalSeats: Number(batchData.totalSeats) || 15,
          monthlyFee: Number(batchData.monthlyFee) || 1500,
        },
      });
      revalidatePath('/coach/batches');
      revalidatePath('/coach/dashboard');
      revalidatePath('/activities');
      return { success: true, batch: formatBatchItem(toPlainObject(created)) };
    }
  } catch (err) {
    console.warn("DB saveCoachBatch error:", err);
    return { success: false, message: 'Could not save batch.' };
  }
}

export async function deleteCoachBatch(batchId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, message: 'Authentication required to delete batch.' };
    }
    const user = session.user as any;
    const isAdmin = user.role === Role.ADMIN || user.email === 'admin@knowurcoach.in' || user.email === 'admin.rawat@knowurcoach.com';

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { centre: true },
    });
    if (!batch) {
      return { success: false, message: 'Batch not found.' };
    }

    if (!isAdmin && batch.centre.ownerUserId !== user.id && batch.centre.phone !== user.phone) {
      return { success: false, message: 'Access denied: You are not authorized to delete batches for this academy.' };
    }

    await prisma.attendance.deleteMany({ where: { batchId } });
    await prisma.booking.updateMany({ where: { batchId }, data: { batchId: null } });
    await prisma.batch.delete({
      where: { id: batchId },
    });
    revalidatePath('/coach/batches');
    revalidatePath('/coach/dashboard');
    return { success: true };
  } catch (err) {
    console.warn("DB deleteCoachBatch error:", err);
    return { success: false, message: 'Could not delete batch.' };
  }
}

export async function getCoachRevenueData(coachEmailOrId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return {
        success: false,
        centre: null,
        monthlyEstimatedRevenue: 0,
        annualProjectedRevenue: 0,
        totalEnrolledStudents: 0,
        totalCapacity: 0,
        capacityUtilizationPct: 0,
        batchesSummary: [],
        recentAdmissions: [],
      };
    }
    const sessionUser = session.user as any;
    const isAdmin = sessionUser.role === Role.ADMIN || sessionUser.email === 'admin@knowurcoach.in' || sessionUser.email === 'admin.rawat@knowurcoach.com';
    const clean = (isAdmin && coachEmailOrId ? coachEmailOrId : (sessionUser.email || sessionUser.id))?.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: clean, mode: 'insensitive' } },
          { phone: clean },
          { id: clean },
        ],
      },
      include: {
        coachingCentre: {
          include: {
            batches: {
              include: {
                bookings: {
                  include: { child: true, parent: true },
                },
              },
            },
            bookings: {
              include: { child: true, parent: true, batch: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!user || !user.coachingCentre) {
      return {
        success: true,
        centre: null,
        monthlyEstimatedRevenue: 0,
        annualProjectedRevenue: 0,
        totalEnrolledStudents: 0,
        totalCapacity: 0,
        capacityUtilizationPct: 0,
        batchesSummary: [],
        recentAdmissions: [],
      };
    }

    const centre = user.coachingCentre;
    const batches = centre.batches || [];
    const allBookings = centre.bookings || [];

    let totalMonthlyEstimatedRevenue = 0;
    let totalEnrolledStudents = 0;
    let totalCapacity = 0;

    const batchesSummary = batches.map((batch: any) => {
      const enrolledCount = Math.max(
        Number(batch.seatsFilled) || 0,
        Array.isArray(batch.bookings) ? batch.bookings.length : 0
      );
      const capacity = Number(batch.totalSeats) || 15;
      const fee = Number(batch.monthlyFee) || Number(centre.monthlyTuitionFee) || 1800;
      const batchMonthlyRevenue = enrolledCount * fee;
      const maxPossibleRevenue = capacity * fee;

      totalMonthlyEstimatedRevenue += batchMonthlyRevenue;
      totalEnrolledStudents += enrolledCount;
      totalCapacity += capacity;

      return {
        id: batch.id,
        name: batch.name,
        schedule: batch.schedule,
        ageGroup: batch.ageGroup,
        enrolledCount,
        capacity,
        monthlyFee: fee,
        estimatedRevenue: batchMonthlyRevenue,
        maxPossibleRevenue,
        utilizationPct: capacity > 0 ? Math.round((enrolledCount / capacity) * 100) : 0,
      };
    });

    if (totalCapacity === 0 && batches.length > 0) totalCapacity = batches.length * 15;
    const capacityUtilizationPct = totalCapacity > 0 ? Math.round((totalEnrolledStudents / totalCapacity) * 100) : 0;
    const annualProjectedRevenue = totalMonthlyEstimatedRevenue * 12;

    const recentAdmissions = allBookings.map((bk: any) => ({
      id: bk.id,
      passId: bk.passId,
      passType: bk.passType,
      studentName: bk.child?.fullName || 'Student',
      parentName: bk.parent?.fullName || 'Parent',
      batchName: bk.batch?.name || 'General Batch',
      batchSchedule: bk.batch?.schedule || '',
      monthlyFee: Number(bk.batch?.monthlyFee) || Number(bk.grossAmount) || Number(centre.monthlyTuitionFee) || 1800,
      enrolledAt: bk.createdAt,
    }));

    return {
      success: true,
      centre: toPlainObject(centre),
      monthlyEstimatedRevenue: totalMonthlyEstimatedRevenue,
      annualProjectedRevenue,
      totalEnrolledStudents,
      totalCapacity,
      capacityUtilizationPct,
      batchesSummary,
      recentAdmissions,
    };
  } catch (err) {
    console.error("[DB_ERROR] Failed to fetch coach revenue data:", err);
    throw new Error("Database error: Failed to fetch coach revenue data");
  }
}

export async function toggleCentreBookmark(userEmailOrId?: string, centreId?: string) {
  try {
    if (!centreId) {
      return { success: false, message: 'Centre ID is required.' };
    }

    if (!userEmailOrId || !userEmailOrId.trim()) {
      return { success: false, message: 'Authentication required. Please sign in to save academies.' };
    }

    const parent = await resolveParentProfile(userEmailOrId);
    if (!parent) {
      return { success: false, message: 'Parent profile required.' };
    }

    const finalCentreId = centreId.trim();

    const parentId = parent.id;
    const existing = await prisma.savedCentre.findFirst({
      where: { parentId, coachingCentreId: finalCentreId },
    });

    if (existing) {
      await prisma.savedCentre.delete({ where: { id: existing.id } });
      revalidatePath('/parent/saved');
      revalidatePath('/activities');
      return { success: true, saved: false, centreId: finalCentreId };
    } else {
      await prisma.savedCentre.create({
        data: { parentId, coachingCentreId: finalCentreId },
      });
      revalidatePath('/parent/saved');
      revalidatePath('/activities');
      return { success: true, saved: true, centreId: finalCentreId };
    }
  } catch (err) {
    console.warn("DB toggleCentreBookmark error:", err);
    return { success: false, message: 'Could not toggle saved state.' };
  }
}

export async function getSavedCentreIds(userEmailOrId?: string): Promise<string[]> {
  try {
    if (!userEmailOrId || !userEmailOrId.trim()) {
      return [];
    }
    const parent = await resolveParentProfile(userEmailOrId);
    if (!parent) return [];
    const saved = await prisma.savedCentre.findMany({
      where: { parentId: parent.id },
      select: { coachingCentreId: true },
    });
    return saved.map((s) => s.coachingCentreId);
  } catch (err) {
    console.error("[DB_ERROR] Failed to fetch saved centre IDs from database:", err);
    throw new Error("Database error: Failed to fetch saved centre IDs");
  }
}

export async function verifyCoachDocument(
  centreId: string,
  docType: 'GOVT_ID' | 'NIS_CERT' | 'VENUE_PHOTOS' | string,
  status: 'VERIFIED' | 'REJECTED',
  reason?: string
) {
  await requireAdminSession();
  try {
    const centre = await prisma.coachingCentre.findUnique({
      where: { id: centreId },
      include: { owner: true },
    });
    if (!centre) {
      return { success: false, message: 'Academy centre not found in database.' };
    }

    const updatedStatusNotes = updateDocStatusInStatusNotes(centre.statusNotes, docType, status);

    const updated = await prisma.coachingCentre.update({
      where: { id: centreId },
      data: {
        statusNotes: updatedStatusNotes,
      },
      include: { owner: true, batches: true, facilities: true },
    });

    if (centre.ownerUserId) {
      const docLabel =
        docType === 'GOVT_ID'
          ? 'Government Photo ID'
          : docType === 'NIS_CERT'
          ? 'NIS Coaching Certificate'
          : 'Venue & Safety Photos';

      await prisma.notification.create({
        data: {
          userId: centre.ownerUserId,
          title: status === 'VERIFIED' ? `Document Verified: ${docLabel} ✓` : `Document Flagged: ${docLabel}`,
          message:
            status === 'VERIFIED'
              ? `Your ${docLabel} has been audited and approved by the compliance officer.`
              : `Your ${docLabel} was flagged: ${reason || 'Please re-upload a clear copy.'}`,
          type: 'kyc',
        },
      }).catch(() => null);
    }

    revalidatePath('/admin');
    revalidatePath('/admin/verify-coaches');
    revalidatePath('/admin/coaches');
    revalidatePath('/coach/dashboard');

    return {
      success: true,
      centre: toPlainObject(updated),
      message: `Document status updated to ${status}.`,
    };
  } catch (err) {
    console.error('DB verifyCoachDocument error:', err);
    return { success: false, message: 'Could not update document verification status.' };
  }
}

export async function updateCoachSubscriptionPlan(
  centreId: string,
  planTier: SubscriptionPlan,
  billingCycle: 'monthly' | 'annual' = 'monthly',
  paymentId?: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, message: 'Authentication required to update subscription plan.' };
    }
    const userRole = (session.user as any).role;
    const userEmail = (session.user as any).email;
    const userId = (session.user as any).id;

    const centre = await prisma.coachingCentre.findUnique({
      where: { id: centreId },
      include: { owner: true },
    });
    if (!centre) {
      return { success: false, message: 'Academy centre not found in database.' };
    }

    const isAdmin = userRole === Role.ADMIN || userEmail === 'admin@knowurcoach.in' || userEmail === 'admin.rawat@knowurcoach.com';
    const isOwner = centre.ownerUserId === userId || (centre.owner && centre.owner.email === userEmail);

    if (!isAdmin && !isOwner) {
      return { success: false, message: 'Access denied: You are not authorized to manage this academy.' };
    }

    // Coaches can only activate FREE tier directly. Paid tiers require verified payment checkout
    if (!isAdmin && planTier !== SubscriptionPlan.FREE) {
      return {
        success: false,
        message: 'Paid subscription tiers must be activated through verified payment checkout.',
      };
    }

    const config = await prisma.platformConfig.findUnique({
      where: { id: 'default' },
    });

    if (planTier === SubscriptionPlan.FREE && config?.enableFreePlan === false) {
      return {
        success: false,
        message: 'The free plan is currently disabled by platform admin. Please choose Standard or Premier.',
      };
    }

    const now = new Date();
    const durationDays = billingCycle === 'annual' ? 365 : 30;
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const finalPaymentId = paymentId || (planTier === SubscriptionPlan.FREE ? `free_tier_${Date.now()}` : `pay_rzp_${Date.now()}`);

    const updated = await prisma.coachingCentre.update({
      where: { id: centreId },
      data: {
        planTier,
        isTopInArea: planTier === SubscriptionPlan.PREMIUM,
        planPaymentId: finalPaymentId,
        planPurchasedAt: now,
        planExpiresAt: planTier === SubscriptionPlan.FREE ? null : expiresAt,
        planBillingCycle: billingCycle,
      },
      include: { owner: true, batches: true, facilities: true },
    });

    const planName =
      planTier === SubscriptionPlan.PREMIUM
        ? 'Verified Premier Partner'
        : planTier === SubscriptionPlan.STANDARD
        ? 'Standard Growth Partner'
        : 'Starter Partner (Free Tier)';

    if (centre.ownerUserId) {
      await prisma.notification.create({
        data: {
          userId: centre.ownerUserId,
          title: `Subscription Plan Active: ${planName} 🚀`,
          message: planTier === SubscriptionPlan.FREE
            ? `Your Free Partner plan is now active! All academy operations are unlocked.`
            : `Your ${planName} subscription (${billingCycle}) is active via Razorpay! Payment Ref: ${finalPaymentId}. All features unlocked!`,
          type: 'subscription',
        },
      }).catch(() => null);
    }

    await logAdminAction({
      actorEmail: centre.owner?.email || 'coach@knowurcoach.in',
      actorRole: 'COACH',
      action: 'COACH_PLAN_PURCHASED',
      targetModel: 'CoachingCentre',
      targetId: centreId,
      details: {
        centreName: centre.name,
        planTier,
        billingCycle,
        paymentId: finalPaymentId,
        expiresAt,
      },
    });

    revalidatePath('/coach/dashboard');
    revalidatePath('/coach/plans');
    revalidatePath('/coach/listings');
    revalidatePath('/coach/batches');
    revalidatePath('/coach/attendance');
    revalidatePath('/coach/leads');
    revalidatePath('/coach/revenue');
    revalidatePath('/admin/plans');
    revalidatePath('/admin/academies');
    revalidatePath('/admin/coaches');
    revalidatePath('/activities');
    revalidatePath('/');

    return {
      success: true,
      centre: toPlainObject(updated),
      message: `Successfully activated ${planName} subscription!`,
    };
  } catch (err) {
    console.error('DB updateCoachSubscriptionPlan error:', err);
    return { success: false, message: 'Could not update subscription plan in database.' };
  }
}

export async function getUserNotifications(userEmailOrId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, notifications: [], unreadCount: 0 };

    const sessionUser = session.user as any;
    const isAdmin = sessionUser.role === Role.ADMIN || sessionUser.email === 'admin@knowurcoach.in' || sessionUser.email === 'admin.rawat@knowurcoach.com';
    const clean = (isAdmin && userEmailOrId ? userEmailOrId : (sessionUser.email || sessionUser.id))?.trim().toLowerCase();
    if (!clean) return { success: false, notifications: [], unreadCount: 0 };

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: clean, mode: 'insensitive' } },
          { phone: clean },
          { id: clean },
        ],
      },
    });

    if (!user) {
      return { success: false, notifications: [], unreadCount: 0 };
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return {
      success: true,
      notifications: toPlainObject(notifications),
      unreadCount,
    };
  } catch (err) {
    console.warn('DB getUserNotifications error:', err);
    return { success: false, notifications: [], unreadCount: 0 };
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
    return { success: true };
  } catch (err) {
    return { success: false };
  }
}

export async function markAllNotificationsAsRead(userEmailOrId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false };
    const sessionUser = session.user as any;
    const isAdmin = sessionUser.role === Role.ADMIN || sessionUser.email === 'admin@knowurcoach.in';
    const clean = (isAdmin && userEmailOrId ? userEmailOrId : (sessionUser.email || sessionUser.id))?.trim().toLowerCase();
    if (!clean) return { success: false };

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: clean, mode: 'insensitive' } },
          { phone: clean },
          { id: clean },
        ],
      },
    });

    if (user) {
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
    }

    return { success: true };
  } catch (err) {
    return { success: false };
  }
}

export async function getTaxonomyCategories() {
  try {
    const activities = await prisma.majorActivity.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        disciplines: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (activities && activities.length > 0) {
      return activities.map((act) => ({
        id: act.id,
        name: act.name,
        slug: act.slug,
        categories: act.disciplines.map((d) => ({
          id: d.id,
          name: d.name,
          slug: d.slug,
          icon: d.icon,
        })),
      }));
    }
    return [];
  } catch (err) {
    console.error("[DB_ERROR] Failed to fetch taxonomy categories from database:", err);
    throw new Error("Database error: Failed to fetch taxonomy categories");
  }
}

// ==========================================
// RAZORPAY PAYMENT SETTINGS & CHECKOUT ACTIONS
// ==========================================

export async function getPaymentSettingsAction() {
  try {
    await requireAdminSession();
    const { getMaskedPaymentSettings } = await import('@/lib/payments');
    const settings = await getMaskedPaymentSettings();
    return { success: true, settings };
  } catch (err: any) {
    console.error('getPaymentSettingsAction error:', err);
    return { success: false, message: err.message || 'Unauthorized or failed to get payment settings' };
  }
}

export async function updatePaymentSettingsAction(data: {
  isTestMode?: boolean;
  razorpayTestKeyId?: string;
  razorpayTestKeySecret?: string;
  razorpayLiveKeyId?: string;
  razorpayLiveKeySecret?: string;
  webhookSecret?: string;
}) {
  try {
    const adminSession = await requireAdminSession();
    const { updatePaymentSettings } = await import('@/lib/payments');
    const actorEmail = (adminSession.user as any)?.email || 'admin@knowurcoach.in';
    return await updatePaymentSettings(data, actorEmail);
  } catch (err: any) {
    console.error('updatePaymentSettingsAction error:', err);
    return { success: false, message: err.message || 'Unauthorized: Only platform administrators can change payment settings.' };
  }
}

export async function createRazorpayOrderAction(params: {
  centreId: string;
  planTier: SubscriptionPlan;
  billingCycle?: 'monthly' | 'annual';
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, message: 'Authentication required to initiate checkout.' };
    }
    const user = session.user as any;
    const isAdmin = user.role === Role.ADMIN || user.email === 'admin@knowurcoach.in';

    const centre = await prisma.coachingCentre.findUnique({ where: { id: params.centreId } });
    if (!centre) {
      return { success: false, message: 'Academy centre not found.' };
    }

    if (!isAdmin && centre.ownerUserId !== user.id && centre.phone !== user.phone) {
      return { success: false, message: 'Access denied: You are not authorized to create orders for this academy.' };
    }

    const { createSubscriptionOrder } = await import('@/lib/payments');
    return await createSubscriptionOrder(params);
  } catch (err: any) {
    console.error('createRazorpayOrderAction error:', err);
    return { success: false, message: err.message || 'Failed to create order' };
  }
}

export async function verifyRazorpayPaymentAction(params: {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
  centreId: string;
  planTier: SubscriptionPlan;
  billingCycle?: 'monthly' | 'annual';
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, message: 'Authentication required to verify payment.' };
    }
    const user = session.user as any;
    const isAdmin = user.role === Role.ADMIN || user.email === 'admin@knowurcoach.in';

    const centre = await prisma.coachingCentre.findUnique({ where: { id: params.centreId } });
    if (!centre) {
      return { success: false, message: 'Academy centre not found.' };
    }

    if (!isAdmin && centre.ownerUserId !== user.id && centre.phone !== user.phone) {
      return { success: false, message: 'Access denied: You are not authorized to verify payments for this academy.' };
    }

    const { verifyAndActivateSubscription } = await import('@/lib/payments');
    return await verifyAndActivateSubscription(params);
  } catch (err: any) {
    console.error('verifyRazorpayPaymentAction error:', err);
    return { success: false, message: err.message || 'Failed to verify payment' };
  }
}

export async function recordPaymentFailureAction(params: {
  orderId?: string;
  paymentId?: string;
  centreId?: string;
  errorCode?: string;
  errorDescription?: string;
  errorReason?: string;
  errorSource?: string;
  errorStep?: string;
  rawError?: any;
  notes?: any;
}) {
  try {
    const { recordFailedPayment } = await import('@/lib/payments');
    return await recordFailedPayment(params);
  } catch (err: any) {
    console.error('recordPaymentFailureAction error:', err);
    return { success: false, message: err.message || 'Failed to record failed payment' };
  }
}

export async function getPaymentTransactionsAction(limit = 100) {
  try {
    await requireAdminSession();
    const list = await prisma.paymentTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        centre: {
          select: {
            id: true,
            name: true,
            phone: true,
            locality: true,
            owner: {
              select: {
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      transactions: list.map((t) => ({
        id: t.id,
        orderId: t.orderId,
        paymentId: t.paymentId,
        centreId: t.coachingCentreId,
        centreName: t.centre?.name || 'Coaching Academy',
        locality: t.centre?.locality || '',
        contactPhone: t.centre?.phone || t.centre?.owner?.phone || '',
        contactEmail: t.centre?.owner?.email || '',
        planTier: t.planTier,
        billingCycle: t.billingCycle,
        amount: Number(t.amount),
        currency: t.currency,
        status: t.status,
        isTestMode: t.isTestMode,
        paymentMethod: t.paymentMethod,
        notes: t.notes,
        rawResponse: t.rawResponse,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  } catch (err: any) {
    console.error('getPaymentTransactionsAction error:', err);
    return { success: false, transactions: [] };
  }
}

export async function getAcademyById(id: string) {
  try {
    const cleanId = id?.trim();
    if (!cleanId) return { success: false, centre: null };

    const { getCachedAcademyById } = await import('@/lib/cached-queries');
    const centre = await getCachedAcademyById(cleanId);

    if (!centre) {
      return { success: false, centre: null };
    }

    return {
      success: true,
      centre,
    };
  } catch (err) {
    console.error("[DB_ERROR] Failed to fetch academy by id:", err);
    throw new Error("Database error: Failed to fetch academy profile");
  }
}

// ==========================================
// HERO CAROUSEL SLIDE MANAGEMENT ACTIONS
// ==========================================

export async function getHeroSlides() {
  try {
    const slides = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
    return toPlainObject(slides || []);
  } catch (err) {
    console.error("[DB_ERROR] Failed to get hero slides:", err);
    throw new Error("Database error: Failed to get hero slides");
  }
}

export async function getAdminHeroSlides() {
  try {
    await requireAdminSession();
    let slides = await prisma.heroSlide.findMany({
      orderBy: { order: 'asc' },
    });
    if (!slides || slides.length === 0) {
      // Auto-seed default slides so admin can manage them immediately
      for (const s of DEFAULT_HERO_SLIDES) {
        await prisma.heroSlide.create({
          data: {
            title: s.title,
            subtitle: s.subtitle,
            badge: s.badge,
            imageUrl: s.imageUrl,
            ctaText: s.ctaText,
            ctaLink: s.ctaLink,
            secondaryCtaText: s.secondaryCtaText,
            secondaryCtaLink: s.secondaryCtaLink,
            accentGradient: s.accentGradient,
            order: s.order,
            isActive: s.isActive,
            showBadge: s.showBadge ?? true,
            showTitle: s.showTitle ?? true,
            showSubtitle: s.showSubtitle ?? true,
            showPrimaryCta: s.showPrimaryCta ?? true,
            showSecondaryCta: s.showSecondaryCta ?? true,
          },
        });
      }
      slides = await prisma.heroSlide.findMany({
        orderBy: { order: 'asc' },
      });
    }
    return { success: true, slides: toPlainObject(slides) };
  } catch (err: any) {
    console.error("[DB_ERROR] Failed to get admin hero slides:", err);
    return { success: false, slides: [], error: err.message || "Database error: Failed to get admin hero slides" };
  }
}

export async function createHeroSlide(data: Partial<HeroSlideData>) {
  try {
    await requireAdminSession();
    if (!data.title?.trim() || !data.imageUrl?.trim()) {
      return { success: false, message: "Title and Image URL are required." };
    }
    const maxOrder = await prisma.heroSlide.aggregate({ _max: { order: true } });
    const nextOrder = (maxOrder._max.order ?? 0) + 1;

    const slide = await prisma.heroSlide.create({
      data: {
        title: data.title.trim(),
        subtitle: data.subtitle?.trim() || null,
        badge: data.badge?.trim() || null,
        imageUrl: data.imageUrl.trim(),
        ctaText: data.ctaText?.trim() || "Explore Activities",
        ctaLink: data.ctaLink?.trim() || "/activities",
        secondaryCtaText: data.secondaryCtaText?.trim() || "Book Free Trial",
        secondaryCtaLink: data.secondaryCtaLink?.trim() || "/activities",
        accentGradient: data.accentGradient || "from-blue-600 via-indigo-600 to-emerald-600",
        order: data.order ?? nextOrder,
        isActive: data.isActive ?? true,
        showBadge: data.showBadge ?? true,
        showTitle: data.showTitle ?? true,
        showSubtitle: data.showSubtitle ?? true,
        showPrimaryCta: data.showPrimaryCta ?? true,
        showSecondaryCta: data.showSecondaryCta ?? true,
      },
    });

    invalidateTag('discovery');
    revalidatePath('/');
    return { success: true, slide: toPlainObject(slide), message: "Slide created successfully!" };
  } catch (err: any) {
    console.error("createHeroSlide error:", err);
    return { success: false, message: err.message || "Failed to create slide." };
  }
}

export async function updateHeroSlide(id: string, data: Partial<HeroSlideData>) {
  try {
    await requireAdminSession();
    const slide = await prisma.heroSlide.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.subtitle !== undefined && { subtitle: data.subtitle?.trim() || null }),
        ...(data.badge !== undefined && { badge: data.badge?.trim() || null }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl.trim() }),
        ...(data.ctaText !== undefined && { ctaText: data.ctaText?.trim() || null }),
        ...(data.ctaLink !== undefined && { ctaLink: data.ctaLink?.trim() || null }),
        ...(data.secondaryCtaText !== undefined && { secondaryCtaText: data.secondaryCtaText?.trim() || null }),
        ...(data.secondaryCtaLink !== undefined && { secondaryCtaLink: data.secondaryCtaLink?.trim() || null }),
        ...(data.accentGradient !== undefined && { accentGradient: data.accentGradient }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.showBadge !== undefined && { showBadge: data.showBadge }),
        ...(data.showTitle !== undefined && { showTitle: data.showTitle }),
        ...(data.showSubtitle !== undefined && { showSubtitle: data.showSubtitle }),
        ...(data.showPrimaryCta !== undefined && { showPrimaryCta: data.showPrimaryCta }),
        ...(data.showSecondaryCta !== undefined && { showSecondaryCta: data.showSecondaryCta }),
      },
    });

    invalidateTag('discovery');
    revalidatePath('/');
    return { success: true, slide: toPlainObject(slide), message: "Slide updated successfully!" };
  } catch (err: any) {
    console.error("updateHeroSlide error:", err);
    return { success: false, message: err.message || "Failed to update slide." };
  }
}

export async function deleteHeroSlide(id: string) {
  try {
    await requireAdminSession();
    await prisma.heroSlide.delete({
      where: { id },
    });

    invalidateTag('discovery');
    revalidatePath('/');
    return { success: true, message: "Slide deleted successfully!" };
  } catch (err: any) {
    console.error("deleteHeroSlide error:", err);
    return { success: false, message: err.message || "Failed to delete slide." };
  }
}

export async function reorderHeroSlides(slideOrders: { id: string; order: number }[]) {
  try {
    await requireAdminSession();
    if (slideOrders.length > 0) {
      await prisma.$transaction(
        slideOrders.map((item) =>
          prisma.heroSlide.update({
            where: { id: item.id },
            data: { order: item.order },
          })
        )
      );
    }
    invalidateTag('discovery');
    revalidatePath('/');
    return { success: true, message: "Slides reordered successfully!" };
  } catch (err: any) {
    console.error("reorderHeroSlides error:", err);
    return { success: false, message: err.message || "Failed to reorder slides." };
  }
}

export async function seedDefaultHeroSlides() {
  try {
    await requireAdminSession();
    await prisma.heroSlide.deleteMany();
    await prisma.heroSlide.createMany({
      data: DEFAULT_HERO_SLIDES.map((s) => ({
        title: s.title,
        subtitle: s.subtitle,
        badge: s.badge,
        imageUrl: s.imageUrl,
        ctaText: s.ctaText,
        ctaLink: s.ctaLink,
        secondaryCtaText: s.secondaryCtaText,
        secondaryCtaLink: s.secondaryCtaLink,
        accentGradient: s.accentGradient,
        order: s.order,
        isActive: s.isActive,
        showBadge: s.showBadge ?? true,
        showTitle: s.showTitle ?? true,
        showSubtitle: s.showSubtitle ?? true,
        showPrimaryCta: s.showPrimaryCta ?? true,
        showSecondaryCta: s.showSecondaryCta ?? true,
      })),
      skipDuplicates: true,
    });
    invalidateTag('discovery');
    revalidatePath('/');
    return { success: true, message: "Default hero slides seeded successfully!" };
  } catch (err: any) {
    console.error("seedDefaultHeroSlides error:", err);
    return { success: false, message: err.message || "Failed to seed slides." };
  }
}

export async function getHeroCarouselThemeAction() {
  try {
    const theme = await readHeroCarouselTheme();
    return { success: true, theme };
  } catch (err: any) {
    console.error("getHeroCarouselThemeAction error:", err);
    return { success: false, theme: DEFAULT_HERO_CAROUSEL_THEME, message: err?.message };
  }
}

export async function updateHeroCarouselThemeAction(themeData: Partial<HeroCarouselTheme>) {
  try {
    const adminSession = await requireAdminSession();
    const updated = await writeHeroCarouselTheme(themeData);

    await logAdminAction({
      actorEmail: adminSession.user?.email || 'admin@knowurcoach.in',
      actorRole: 'ADMIN',
      action: 'CONFIG_UPDATED',
      targetModel: 'HeroCarouselTheme',
      targetId: 'carousel-theme',
      details: themeData as Record<string, any>,
    });

    invalidateTag('discovery');
    revalidatePath('/');
    revalidatePath('/admin/theme');
    revalidatePath('/admin/hero-slides');

    return { success: true, theme: updated, message: "Hero carousel theme and visual styling saved successfully!" };
  } catch (err: any) {
    console.error("updateHeroCarouselThemeAction error:", err);
    return { success: false, message: err?.message || "Failed to save hero carousel theme." };
  }
}

export async function resetHeroCarouselThemeAction() {
  try {
    const adminSession = await requireAdminSession();
    const reset = await writeHeroCarouselTheme(DEFAULT_HERO_CAROUSEL_THEME);

    await logAdminAction({
      actorEmail: adminSession.user?.email || 'admin@knowurcoach.in',
      actorRole: 'ADMIN',
      action: 'CONFIG_UPDATED',
      targetModel: 'HeroCarouselTheme',
      targetId: 'carousel-theme',
      details: { action: 'RESET_TO_DEFAULTS' },
    });

    invalidateTag('discovery');
    revalidatePath('/');
    revalidatePath('/admin/theme');
    revalidatePath('/admin/hero-slides');

    return { success: true, theme: reset, message: "Hero carousel theme reset to recommended defaults!" };
  } catch (err: any) {
    console.error("resetHeroCarouselThemeAction error:", err);
    return { success: false, message: err?.message || "Failed to reset hero carousel theme." };
  }
}
