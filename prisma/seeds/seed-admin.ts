import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Independently seeds or refreshes Platform Administrator, PlatformConfig, and PaymentSettings.
 * Unaffected by academies, carousel slides, or categories.
 */
export async function seedAdmin(client: PrismaClient = prisma) {
  console.log('🛡️ [SEED-ADMIN] Starting platform admin and configuration bootstrap...');

  // 1. BOOTSTRAP PLATFORM ADMINISTRATOR
  const adminEmail = (process.env.ADMIN_EMAIL?.trim().toLowerCase()) || 'admin@knowurcoach.com';
  const adminInitialPass = process.env.ADMIN_INITIAL_PASSWORD?.trim() || 'Admin@12345';
  const adminPhone = process.env.ADMIN_PHONE?.trim() || '+919999988888';

  const passwordHash = await bcrypt.hash(adminInitialPass, 12);

  const adminUser = await client.user.upsert({
    where: { phone: adminPhone },
    update: {
      email: adminEmail,
      role: Role.ADMIN,
      passwordHash,
      isActive: true,
    },
    create: {
      id: `usr_${adminEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      email: adminEmail,
      phone: adminPhone,
      role: Role.ADMIN,
      passwordHash,
      isActive: true,
    },
  });
  console.log(`  ✓ Platform Administrator ready: ${adminUser.email} (Phone: ${adminUser.phone})`);

  // 2. BOOTSTRAP PLATFORM CONFIG
  const config = await client.platformConfig.upsert({
    where: { id: 'default' },
    update: {
      siteName: 'KnowUrCoach',
      tagline: 'Hyperlocal Sports & Academy Discovery in Agra',
      themeColor: 'emerald',
      bgColor: 'slate',
      fontSize: 'normal',
      borderRadius: 'rounded-xl',
      allowTrialBookings: true,
      allowFreeTierPublicListing: true,
      enableFreePlan: true,
      enableStandardPlan: true,
      enablePremiumPlan: true,
      standardPlanPrice: 1499.00,
      premiumPlanPrice: 3999.00,
      freePlanFeatures: JSON.stringify([
        'Public academy profile with address & verified badge',
        'Up to 2 active sport batches with seat tracking',
        'Direct parent inquiries and chat leads',
        'Digital free trial booking management',
      ]),
      standardPlanFeatures: JSON.stringify([
        'Everything in Free Tier',
        'Featured ranking in search & category exploration',
        'Up to 8 active batches with schedule management',
        'Live parent attendance QR verification scanner',
        'Automated WhatsApp & SMS parent notifications',
        'Priority KYC on-ground safety audit verification',
      ]),
      premiumPlanFeatures: JSON.stringify([
        'Everything in Standard Tier',
        'Guaranteed Top 3 "Top in Area" verified banner',
        'Unlimited batches & specialized tournament hosting',
        'Automated tuition fee escrow payouts to bank',
        'Dedicated relationship manager & seasonal campaign blasts',
        'Multi-coach staff access & safety compliance dossier',
      ]),
    },
    create: {
      id: 'default',
      siteName: 'KnowUrCoach',
      tagline: 'Hyperlocal Sports & Academy Discovery in Agra',
      themeColor: 'emerald',
      bgColor: 'slate',
      fontSize: 'normal',
      borderRadius: 'rounded-xl',
      allowTrialBookings: true,
      allowFreeTierPublicListing: true,
      enableFreePlan: true,
      enableStandardPlan: true,
      enablePremiumPlan: true,
      standardPlanPrice: 1499.00,
      premiumPlanPrice: 3999.00,
      freePlanFeatures: JSON.stringify([
        'Public academy profile with address & verified badge',
        'Up to 2 active sport batches with seat tracking',
        'Direct parent inquiries and chat leads',
        'Digital free trial booking management',
      ]),
      standardPlanFeatures: JSON.stringify([
        'Everything in Free Tier',
        'Featured ranking in search & category exploration',
        'Up to 8 active batches with schedule management',
        'Live parent attendance QR verification scanner',
        'Automated WhatsApp & SMS parent notifications',
        'Priority KYC on-ground safety audit verification',
      ]),
      premiumPlanFeatures: JSON.stringify([
        'Everything in Standard Tier',
        'Guaranteed Top 3 "Top in Area" verified banner',
        'Unlimited batches & specialized tournament hosting',
        'Automated tuition fee escrow payouts to bank',
        'Dedicated relationship manager & seasonal campaign blasts',
        'Multi-coach staff access & safety compliance dossier',
      ]),
    },
  });
  console.log(`  ✓ PlatformConfig verified: ${config.siteName}`);

  // 3. BOOTSTRAP PAYMENT SETTINGS
  await client.paymentSettings.upsert({
    where: { id: 'default' },
    update: {
      razorpayTestKeyId: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      razorpayTestKeySecret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_agra_2026',
    },
    create: {
      id: 'default',
      razorpayTestKeyId: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      razorpayTestKeySecret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
      razorpayLiveKeyId: null,
      razorpayLiveKeySecret: null,
      isTestMode: true,
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_agra_2026',
    },
  });
  console.log('  ✓ PaymentSettings initialized.');

  console.log('✅ [SEED-ADMIN] Platform admin & settings ready.');
  return { adminUser, config };
}

// Standalone execution support
if (require.main === module || process.argv[1]?.includes('seed-admin')) {
  seedAdmin()
    .catch((err) => {
      console.error('❌ [SEED-ADMIN] Seeding failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
