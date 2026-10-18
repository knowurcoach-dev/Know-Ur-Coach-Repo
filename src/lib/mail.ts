import nodemailer from 'nodemailer';

export interface SendOtpOptions {
  to: string;
  otp: string;
  role?: string;
  purpose?: string;
}

export interface BookingConfirmationOptions {
  to: string;
  parentName: string;
  childName: string;
  centreName: string;
  passId: string;
  date: string;
  timeSlot: string;
  address?: string;
  phone?: string;
}

export interface CoachKycStatusOptions {
  to: string;
  coachName: string;
  centreName: string;
  status: 'APPROVED' | 'REJECTED' | 'REFERRED_BACK' | 'INSPECTION_SCHEDULED';
  badge?: string;
  remarks?: string;
  reason?: string;
}

export interface ParentInquiryOptions {
  to: string;
  centreName: string;
  parentName: string;
  parentPhone: string;
  childName: string;
  childAge: number;
  inquiryNotes: string;
}

export interface WelcomeEmailOptions {
  to: string;
  name: string;
  role: 'Coach' | 'Parent' | 'Platform Admin';
}

export interface SendEmailResult {
  success: boolean;
  simulated?: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Creates and returns a Nodemailer transporter configured for Gmail SMTP
 */
export function createTransporter() {
  const user = (process.env.GMAIL_USER || process.env.SMTP_USER || '').trim();
  const rawPass = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '').trim();
  const pass = rawPass.replace(/\s+/g, '');
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = process.env.SMTP_SECURE !== 'false';

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

function getSenderInfo() {
  const senderEmail = (process.env.GMAIL_USER || process.env.SMTP_USER || 'knowurcoach@gmail.com').trim();
  const from = process.env.SMTP_FROM || `KnowUrCoach <${senderEmail}>`;
  return { senderEmail, from };
}

/**
 * Sends a 6-digit verification OTP to the user's email via Gmail SMTP.
 */
export async function sendOtpEmail({
  to,
  otp,
  role = 'User',
  purpose = 'Sign In / Verification',
}: SendOtpOptions): Promise<SendEmailResult> {
  const transporter = createTransporter();
  const { from } = getSenderInfo();

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>KnowUrCoach Verification Code</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
        .wrapper { max-width: 540px; margin: 30px auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #0a1128 0%, #1e1b4b 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .logo-text { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; }
        .logo-accent { color: #10b981; }
        .subtitle { font-size: 13px; color: #94a3b8; margin-top: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
        .description { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .otp-box { background: #f0fdf4; border: 2px dashed #10b981; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-label { font-size: 11px; text-transform: uppercase; font-weight: 800; color: #047857; letter-spacing: 1.5px; margin-bottom: 6px; }
        .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #065f46; margin: 0; }
        .expiry-note { font-size: 12px; color: #64748b; text-align: center; margin-top: 10px; }
        .info-pill { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; margin-bottom: 16px; }
        .footer { background: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
        .footer a { color: #10b981; text-decoration: none; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <div class="logo-text">KnowUr<span class="logo-accent">Coach</span></div>
          <div class="subtitle">Verified Sports & Activities Across India</div>
        </div>
        <div class="content">
          <div class="info-pill">${role} ${purpose}</div>
          <div class="greeting">Hello!</div>
          <p class="description">
            We received a request to authenticate your <strong>${role}</strong> account on KnowUrCoach. Use the verification code below to complete your request:
          </p>

          <div class="otp-box">
            <div class="otp-label">Your One-Time Password</div>
            <div class="otp-code">${otp}</div>
            <div class="expiry-note">⏱️ Valid for 10 minutes • Do not share this code with anyone</div>
          </div>

          <p class="description" style="font-size: 13px; color: #64748b; margin-top: 20px;">
            If you did not request this OTP, you can safely ignore this email. Your account remains protected.
          </p>
        </div>
        <div class="footer">
          KnowUrCoach • 100% Escrow Protection & NIS Certified Coaches<br>
          Need help? Contact <a href="mailto:knowurcoach@gmail.com">knowurcoach@gmail.com</a>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
KnowUrCoach - Verification Code

Hello!

Use the following 6-digit OTP to complete your ${role} ${purpose}:
OTP: ${otp}

This code is valid for 10 minutes. Never share this OTP with anyone.

KnowUrCoach
Support: knowurcoach@gmail.com
  `.trim();

  if (!transporter) {
    console.log(`[KnowUrCoach Mail Service (DEV MODE)] ✉️ Simulated OTP to: ${to} -> ${otp}`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: `Your KnowUrCoach Verification Code: ${otp}`,
      text: textContent,
      html: htmlContent,
    });

    console.log(`[KnowUrCoach Mail Service] ✅ OTP delivered to ${to}. Message ID: ${info.messageId}`);
    return { success: true, simulated: false, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[KnowUrCoach Mail Service] ❌ Failed to send OTP:`, error?.message || error);
    return { success: false, error: error?.message || 'Failed to send verification email' };
  }
}

/**
 * Sends a booking confirmation email for a trial or admission pass.
 */
export async function sendBookingConfirmationEmail(options: BookingConfirmationOptions): Promise<SendEmailResult> {
  const transporter = createTransporter();
  const { from } = getSenderInfo();
  const { to, parentName, childName, centreName, passId, date, timeSlot, address, phone } = options;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Booking Confirmed - ${centreName}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
        .wrapper { max-width: 560px; margin: 30px auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #064e3b 0%, #065f46 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .pass-badge { background: #10b981; color: #ffffff; font-weight: 800; font-size: 11px; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; letter-spacing: 1px; }
        .title { font-size: 22px; font-weight: 900; margin-top: 10px; }
        .content { padding: 32px 28px; }
        .card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 20px; margin: 20px 0; }
        .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
        .label { color: #64748b; font-weight: 600; }
        .value { color: #0f172a; font-weight: 800; text-align: right; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <span class="pass-badge">Pass Confirmed</span>
          <div class="title">You're All Set! 🏸</div>
          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Verified trial entry booked on KnowUrCoach</p>
        </div>
        <div class="content">
          <p style="font-size: 15px; font-weight: 600;">Dear ${parentName},</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Your trial booking for <strong>${childName}</strong> at <strong>${centreName}</strong> is confirmed. Please show your Entry Pass ID at the reception upon arrival.
          </p>

          <div class="card">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: #047857; margin-bottom: 12px;">Pass Summary</div>
            <div class="row"><span class="label">Pass ID:</span><span class="value" style="color: #047857;">${passId}</span></div>
            <div class="row"><span class="label">Student Name:</span><span class="value">${childName}</span></div>
            <div class="row"><span class="label">Academy:</span><span class="value">${centreName}</span></div>
            <div class="row"><span class="label">Session Date:</span><span class="value">${date}</span></div>
            <div class="row"><span class="label">Batch Time:</span><span class="value">${timeSlot}</span></div>
            ${address ? `<div class="row"><span class="label">Location:</span><span class="value">${address}</span></div>` : ''}
            ${phone ? `<div class="row"><span class="label">Academy Helpline:</span><span class="value">${phone}</span></div>` : ''}
          </div>

          <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
            🛡️ <strong>Safety Guarantee:</strong> All centres listed on KnowUrCoach are verified for CCTV surveillance, certified mentors, and emergency first-aid protocols.
          </p>
        </div>
        <div class="footer">
          KnowUrCoach • Need assistance? Reach us at <a href="mailto:knowurcoach@gmail.com" style="color: #10b981;">knowurcoach@gmail.com</a>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.log(`[KnowUrCoach Mail Service (DEV MODE)] ✉️ Simulated Booking Email to: ${to} (Pass: ${passId})`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: `Booking Confirmed: ${passId} for ${childName} at ${centreName}`,
      html: htmlContent,
      text: `Booking Confirmed!\nPass ID: ${passId}\nChild: ${childName}\nAcademy: ${centreName}\nDate: ${date}\nTime: ${timeSlot}`,
    });

    console.log(`[KnowUrCoach Mail Service] ✅ Booking confirmation delivered to ${to}. Message ID: ${info.messageId}`);
    return { success: true, simulated: false, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[KnowUrCoach Mail Service] ❌ Failed to send booking confirmation:`, error?.message || error);
    return { success: false, error: error?.message || 'Failed to deliver booking email' };
  }
}

/**
 * Sends a KYC verification status update email to a coach or academy owner.
 */
export async function sendCoachKycStatusEmail(options: CoachKycStatusOptions): Promise<SendEmailResult> {
  const transporter = createTransporter();
  const { from } = getSenderInfo();
  const { to, coachName, centreName, status, badge, remarks, reason } = options;

  const isApproved = status === 'APPROVED';
  const isReferred = status === 'REFERRED_BACK';

  const statusTitle = isApproved
    ? 'Congratulations! Your Profile is Approved 🎉'
    : isReferred
    ? 'Action Required: Profile Referred Back'
    : 'Profile Status Update';

  const headerGradient = isApproved
    ? 'linear-gradient(135deg, #064e3b 0%, #047857 100%)'
    : isReferred
    ? 'linear-gradient(135deg, #78350f 0%, #d97706 100%)'
    : 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>${statusTitle}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
        .wrapper { max-width: 560px; margin: 30px auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; }
        .header { background: ${headerGradient}; padding: 32px 24px; text-align: center; color: #ffffff; }
        .content { padding: 32px 28px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin: 20px 0; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <div style="font-size: 22px; font-weight: 900;">${statusTitle}</div>
          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">${centreName} on KnowUrCoach</p>
        </div>
        <div class="content">
          <p style="font-size: 15px; font-weight: 600;">Dear ${coachName || 'Coach'},</p>

          ${isApproved ? `
            <p style="font-size: 14px; color: #334155; line-height: 1.6;">
              Great news! Your academy <strong>${centreName}</strong> has been audited and officially approved by the Platform Administrator${badge ? ` with <strong>${badge}</strong> status` : ''}.
            </p>
            <p style="font-size: 14px; color: #334155; line-height: 1.6;">
              Your activities and batches are now visible to parents searching for verified sports and activities. You can manage your enrolled students, batches, and inquiries directly from your dashboard.
            </p>
          ` : isReferred ? `
            <p style="font-size: 14px; color: #334155; line-height: 1.6;">
              Your profile for <strong>${centreName}</strong> was reviewed by the Platform Administrator and requires additional clarification before it can be verified.
            </p>
            <div class="card" style="background: #fffbeb; border-color: #fde68a;">
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: #b45309; margin-bottom: 6px;">Administrator Remarks</div>
              <p style="font-size: 13px; color: #92400e; margin: 0; line-height: 1.5;">${remarks || 'Please update your verification documents or facility details in your dashboard.'}</p>
            </div>
            <p style="font-size: 14px; color: #334155; line-height: 1.6;">
              Please log in to your dashboard to review the feedback and re-submit your profile for approval.
            </p>
          ` : `
            <p style="font-size: 14px; color: #334155; line-height: 1.6;">
              Your profile for <strong>${centreName}</strong> has been updated. Reason: ${reason || 'Details do not meet platform verification guidelines.'}
            </p>
          `}

          <div style="text-align: center; margin-top: 28px;">
            <a href="http://localhost:3000/coach/dashboard" style="background: #10b981; color: #ffffff; padding: 12px 24px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 14px; display: inline-block;">
              Open Coach Dashboard
            </a>
          </div>
        </div>
        <div class="footer">
          KnowUrCoach • Verification Desk<br>
          Questions? Contact our team at <a href="mailto:knowurcoach@gmail.com" style="color: #10b981;">knowurcoach@gmail.com</a>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.log(`[KnowUrCoach Mail Service (DEV MODE)] ✉️ Simulated KYC status email to ${to}: ${status}`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: `KnowUrCoach Status Update: ${centreName} (${status})`,
      html: htmlContent,
      text: `Status Update for ${centreName}: ${status}\nRemarks: ${remarks || reason || 'Please check your dashboard.'}`,
    });

    console.log(`[KnowUrCoach Mail Service] ✅ KYC status email delivered to ${to}. Message ID: ${info.messageId}`);
    return { success: true, simulated: false, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[KnowUrCoach Mail Service] ❌ Failed to send KYC email:`, error?.message || error);
    return { success: false, error: error?.message || 'Failed to deliver KYC status email' };
  }
}

/**
 * Sends welcome email to newly registered parents or coaches.
 */
export async function sendWelcomeEmail(options: WelcomeEmailOptions): Promise<SendEmailResult> {
  const transporter = createTransporter();
  const { from } = getSenderInfo();
  const { to, name, role } = options;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Welcome to KnowUrCoach</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
        .wrapper { max-width: 540px; margin: 30px auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #0a1128 0%, #1e1b4b 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .content { padding: 32px 28px; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <div style="font-size: 24px; font-weight: 900;">KnowUr<span style="color: #10b981;">Coach</span></div>
          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.85;">Welcome to India's Premier Sports & Academy Discovery Hub</p>
        </div>
        <div class="content">
          <p style="font-size: 16px; font-weight: 700; color: #0f172a;">Welcome, ${name}!</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Thank you for registering on KnowUrCoach as a <strong>${role}</strong>. We are thrilled to have you in our nationwide sports and activity community.
          </p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            ${role === 'Coach'
              ? 'Complete your profile and upload your coaching certifications to get verified and start receiving student admissions.'
              : 'Discover top-rated sports academies, Vedic math gyms, and swimming pools across verified localities nationwide.'}
          </p>
        </div>
        <div class="footer">
          KnowUrCoach • Need assistance? Write to <a href="mailto:knowurcoach@gmail.com" style="color: #10b981;">knowurcoach@gmail.com</a>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.log(`[KnowUrCoach Mail Service (DEV MODE)] ✉️ Simulated Welcome Email to ${to}`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: `Welcome to KnowUrCoach!`,
      html: htmlContent,
      text: `Welcome to KnowUrCoach, ${name}!\nThank you for joining as a ${role}.`,
    });

    console.log(`[KnowUrCoach Mail Service] ✅ Welcome email delivered to ${to}. Message ID: ${info.messageId}`);
    return { success: true, simulated: false, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[KnowUrCoach Mail Service] ❌ Failed to send welcome email:`, error?.message || error);
    return { success: false, error: error?.message || 'Failed to deliver welcome email' };
  }
}

export interface CoachTrialWelcomeOptions {
  to: string;
  coachName: string;
  centreName: string;
  trialDurationDays: number;
  expiresAt: Date;
}

/**
 * Sends notification email when coach registers with an active Free Partner Trial.
 */
export async function sendCoachTrialWelcomeEmail(options: CoachTrialWelcomeOptions): Promise<SendEmailResult> {
  const transporter = createTransporter();
  const { from } = getSenderInfo();
  const { to, coachName, centreName, trialDurationDays, expiresAt } = options;

  const expiryFormatted = expiresAt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const monthsCount = Math.round(trialDurationDays / 30);
  const durationLabel = monthsCount >= 1 ? `${monthsCount} Month${monthsCount > 1 ? 's' : ''}` : `${trialDurationDays} Days`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Free Trial Activated</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
        .wrapper { max-width: 560px; margin: 30px auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #064e3b 0%, #0f172a 100%); padding: 36px 28px; text-align: center; color: #ffffff; }
        .badge { display: inline-block; background: #10b981; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
        .content { padding: 32px 28px; }
        .card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 18px 20px; margin: 20px 0; }
        .btn { display: inline-block; background: #10b981; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 10px; margin-top: 16px; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <span class="badge">Partner Onboarding</span>
          <div style="font-size: 24px; font-weight: 900;">Welcome to KnowUr<span style="color: #34d399;">Coach</span></div>
          <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Your Free Partner Trial is Now Active!</p>
        </div>
        <div class="content">
          <p style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 0;">Hello ${coachName},</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Congratulations on registering <strong>${centreName}</strong> on KnowUrCoach. To help you launch and explore all platform capabilities, your complimentary <strong>${durationLabel} Free Partner Trial</strong> has been activated.
          </p>
          <div class="card">
            <div style="font-size: 13px; font-weight: 700; color: #166534; margin-bottom: 6px;">Your Trial Details:</div>
            <div style="font-size: 13px; color: #15803d; line-height: 1.5;">
              • <strong>Status:</strong> Active Complimentary Trial<br>
              • <strong>Duration:</strong> ${durationLabel} (${trialDurationDays} Days)<br>
              • <strong>Valid Until:</strong> ${expiryFormatted}<br>
              • <strong>Includes:</strong> Batches, Student Roster, Trial Booking Leads & Operations
            </div>
          </div>
          <p style="font-size: 13px; color: #64748b; line-height: 1.6;">
            You can manage schedules, record QR attendance, and receive parent trial bookings directly in your coach portal during this period.
          </p>
          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/coach/dashboard" class="btn">Open Coach Dashboard</a>
          </div>
        </div>
        <div class="footer">
          KnowUrCoach Partner Network • Need assistance? Write to <a href="mailto:knowurcoach@gmail.com" style="color: #10b981;">knowurcoach@gmail.com</a>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.log(`[KnowUrCoach Mail Service (DEV MODE)] ✉️ Simulated Coach Trial Welcome Email to ${to} (Expires: ${expiryFormatted})`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: `🎉 Your ${durationLabel} Free Partner Trial is Active — KnowUrCoach`,
      html: htmlContent,
      text: `Hello ${coachName},\n\nYour ${durationLabel} Free Partner Trial for ${centreName} is now active until ${expiryFormatted}.\nLog in to your coach dashboard to get started.`,
    });
    console.log(`[KnowUrCoach Mail Service] ✅ Coach trial welcome email delivered to ${to}. Message ID: ${info.messageId}`);
    return { success: true, simulated: false, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[KnowUrCoach Mail Service] ❌ Failed to send coach trial welcome email:`, error?.message || error);
    return { success: false, error: error?.message || 'Failed to deliver trial welcome email' };
  }
}

export interface SubscriptionExpiryWarningOptions {
  to: string;
  coachName: string;
  centreName: string;
  planName: string;
  daysRemaining: number;
  expiresAt: Date;
  renewalUrl?: string;
}

/**
 * Sends a reminder email when a coach's trial or subscription is expiring in <= 7 days.
 */
export async function sendSubscriptionExpiryWarningEmail(options: SubscriptionExpiryWarningOptions): Promise<SendEmailResult> {
  const transporter = createTransporter();
  const { from } = getSenderInfo();
  const { to, coachName, centreName, planName, daysRemaining, expiresAt, renewalUrl } = options;

  const expiryFormatted = expiresAt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const link = renewalUrl || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/coach/plans`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Subscription Expiring Soon</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
        .wrapper { max-width: 560px; margin: 30px auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #78350f 0%, #0f172a 100%); padding: 36px 28px; text-align: center; color: #ffffff; }
        .badge { display: inline-block; background: #f59e0b; color: #000000; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
        .content { padding: 32px 28px; }
        .card { background: #fffbeb; border: 1px solid #fde68a; border-radius: 14px; padding: 18px 20px; margin: 20px 0; }
        .btn { display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 10px; margin-top: 16px; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <span class="badge">Urgent Notice</span>
          <div style="font-size: 24px; font-weight: 900;">Plan Expiring in ${daysRemaining} Days</div>
          <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">${centreName}</p>
        </div>
        <div class="content">
          <p style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 0;">Hello ${coachName},</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            This is a courtesy reminder that your <strong>${planName}</strong> on KnowUrCoach will expire on <strong>${expiryFormatted}</strong> (${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining).
          </p>
          <div class="card">
            <div style="font-size: 13px; font-weight: 700; color: #92400e; margin-bottom: 6px;">To Avoid Disruption:</div>
            <div style="font-size: 13px; color: #b45309; line-height: 1.5;">
              Renew your subscription before <strong>${expiryFormatted}</strong> to keep your academy listed on the public directory and preserve continuous access to attendance tracking and lead management.
            </div>
          </div>
          <div style="text-align: center;">
            <a href="${link}" class="btn">Renew Subscription Now</a>
          </div>
        </div>
        <div class="footer">
          KnowUrCoach Partner Network • Need assistance? Write to <a href="mailto:knowurcoach@gmail.com" style="color: #4f46e5;">knowurcoach@gmail.com</a>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.log(`[KnowUrCoach Mail Service (DEV MODE)] ✉️ Simulated Subscription Expiry Warning to ${to} (${daysRemaining}d left)`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: `⚠️ Action Required: Your KnowUrCoach Subscription Expires in ${daysRemaining} Days`,
      html: htmlContent,
      text: `Hello ${coachName},\n\nYour ${planName} for ${centreName} expires on ${expiryFormatted} (${daysRemaining} days left). Renew now: ${link}`,
    });
    return { success: true, simulated: false, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[KnowUrCoach Mail Service] ❌ Failed to send expiry warning email:`, error?.message || error);
    return { success: false, error: error?.message || 'Failed to deliver expiry warning email' };
  }
}

