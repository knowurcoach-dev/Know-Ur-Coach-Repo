import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Independently purges Coaching Centres / Academies and their child relational records
 * (facilities, batches, offerings, reviews, leads, kyc inspections, and coach users)
 * without touching carousel slides, activities, categories, parents, or platform config.
 */
export async function cleanAcademies(client: PrismaClient = prisma) {
  console.log('🧹 [CLEAN-ACADEMY] Purging all coaching centres and related records...');

  // 1. Delete dependent relational items in safe dependency order
  const delAttendance = await client.attendance.deleteMany();
  const delBooking = await client.booking.deleteMany();
  const delSavedCentre = await client.savedCentre.deleteMany();
  const delReview = await client.review.deleteMany();
  const delLead = await client.lead.deleteMany();
  const delKycInspection = await client.kycInspection.deleteMany();
  const delFacility = await client.facility.deleteMany();
  const delBatch = await client.batch.deleteMany();
  const delOffering = await client.academyOffering.deleteMany();
  const delPaymentTransactions = await client.paymentTransaction.deleteMany();

  // 2. Delete Coaching Centres
  const delCoachingCentre = await client.coachingCentre.deleteMany();

  // 3. Delete Coach Users (preserving ADMIN and PARENT users)
  const delCoachUsers = await client.user.deleteMany({
    where: { role: Role.COACH },
  });

  console.log(`✅ [CLEAN-ACADEMY] Deleted:
  - ${delCoachingCentre.count} Coaching Centres (Academies)
  - ${delCoachUsers.count} Coach User accounts
  - ${delBatch.count} Batches
  - ${delFacility.count} Facilities
  - ${delOffering.count} Offerings
  - ${delLead.count} Leads
  - ${delReview.count} Reviews
  - ${delKycInspection.count} KYC Inspections
  - ${delBooking.count} Bookings
  - ${delAttendance.count} Attendances`);

  return {
    centres: delCoachingCentre.count,
    coachUsers: delCoachUsers.count,
    batches: delBatch.count,
    facilities: delFacility.count,
    offerings: delOffering.count,
  };
}

// Standalone execution support
if (require.main === module || process.argv[1]?.includes('clean-academy')) {
  cleanAcademies()
    .catch((err) => {
      console.error('❌ [CLEAN-ACADEMY] Clean failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
