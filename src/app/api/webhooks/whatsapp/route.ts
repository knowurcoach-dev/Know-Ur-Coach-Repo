import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TicketCategory } from '@prisma/client';
import crypto from 'crypto';

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: {
    body: string;
  };
}

export interface WhatsAppContact {
  profile: {
    name: string;
  };
  wa_id: string;
}

export interface WhatsAppChangeValue {
  messaging_product: string;
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: WhatsAppContact[];
  messages?: WhatsAppMessage[];
}

export interface WhatsAppWebhookBody {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: WhatsAppChangeValue;
      field: string;
    }>;
  }>;
}

/**
 * GET Handler: Meta WhatsApp Cloud API Webhook Verification Challenge
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const expectedToken =
    process.env.WHATSAPP_VERIFY_TOKEN || 'knowurcoach_meta_verify_2026';

  if (mode === 'subscribe' && token === expectedToken) {
    return new Response(challenge || '', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return new Response('Forbidden: Invalid Verification Token', { status: 403 });
}

/**
 * POST Handler: Process Incoming WhatsApp Parent/Coach Messages
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    // Cryptographic signature verification if app secret is configured (HIGH-06)
    if (appSecret) {
      const signatureHeader = req.headers.get('x-hub-signature-256') || '';
      if (!signatureHeader.startsWith('sha256=')) {
        return NextResponse.json({ error: 'Missing or malformed WhatsApp signature' }, { status: 401 });
      }

      const receivedHash = signatureHeader.slice(7);
      const expectedHash = crypto
        .createHmac('sha256', appSecret)
        .update(rawBody)
        .digest('hex');

      const isValid =
        receivedHash.length === expectedHash.length &&
        crypto.timingSafeEqual(Buffer.from(receivedHash), Buffer.from(expectedHash));

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid WhatsApp webhook signature' }, { status: 401 });
      }
    }

    const body: WhatsAppWebhookBody = JSON.parse(rawBody);

    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ignored' }, { status: 404 });
    }

    const changes = body.entry?.[0]?.changes?.[0]?.value;
    const messages = changes?.messages;
    const contacts = changes?.contacts;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ status: 'no_messages' }, { status: 200 });
    }

    const firstMsg = messages[0];
    const fromPhone = firstMsg.from;
    const senderName = contacts?.[0]?.profile?.name || 'Agra Parent';
    const messageText = firstMsg.text?.body || '[Media or Attachment]';

    // Normalize phone number (strip leading 91 country code if present)
    const normalizedPhone = fromPhone.startsWith('91') && fromPhone.length === 12
      ? fromPhone.slice(2)
      : fromPhone;

    // 1. Try to find matching Lead in Coach CRM
    const existingLead = await prisma.lead.findFirst({
      where: {
        OR: [{ parentPhone: fromPhone }, { parentPhone: normalizedPhone }],
      },
    });

    if (existingLead) {
      await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          inquiryNotes: `${existingLead.inquiryNotes}\n[Parent WA ${new Date().toLocaleTimeString('en-IN')}]: ${messageText}`,
          status: existingLead.status === 'new' ? 'contacted' : existingLead.status,
        },
      });

      return NextResponse.json({
        success: true,
        action: 'lead_updated',
        leadId: existingLead.id,
      });
    }

    // 2. Otherwise create or update Support Ticket for Parent Inquiry
    const randomTicketId = `TKT-AGRA-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const newTicket = await prisma.supportTicket.create({
      data: {
        ticketId: randomTicketId,
        fullName: senderName,
        phone: normalizedPhone,
        category: TicketCategory.TRIAL_PASS,
        description: messageText,
        status: 'OPEN',
      },
    });

    return NextResponse.json({
      success: true,
      action: 'ticket_created',
      ticketId: newTicket.ticketId,
      sender: senderName,
    });
  } catch (error: any) {
    console.error('[WhatsApp Webhook Error]', error);
    return NextResponse.json(
      { error: 'WhatsApp webhook processing failed', message: error.message },
      { status: 500 }
    );
  }
}

