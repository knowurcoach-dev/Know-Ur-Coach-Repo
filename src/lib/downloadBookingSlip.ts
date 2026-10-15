/**
 * Utility to generate and trigger a printable / downloadable booking confirmation slip.
 * Clean, branded layout formatted for thermal or A4 printing and saving as PDF.
 */

export interface BookingSlipDetails {
  bookingId?: string;
  referenceNo?: string;
  type?: 'trial' | 'batch' | 'tournament';
  academyName: string;
  category?: string;
  locality?: string;
  city?: string;
  address?: string;
  coachName?: string;
  contactPhone?: string;
  studentName: string;
  studentAge?: number | string;
  parentName?: string;
  parentPhone?: string;
  schedule?: string;
  courtOrVenue?: string;
  feeInfo?: string;
  bookingDate?: string;
  dateBooked?: string;
  paymentStatus?: string;
}

export function downloadBookingSlip(data: BookingSlipDetails) {
  if (typeof window === 'undefined') return;

  const refNo = data.referenceNo || data.bookingId || `REF-${Date.now().toString().slice(-6)}`;
  const cleanRef = refNo.startsWith('#') ? refNo : `#${refNo}`;
  const bookingDate = data.bookingDate || new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const typeLabel =
    data.type === 'trial'
      ? 'FREE TRIAL ADMISSION'
      : data.type === 'tournament'
      ? 'TOURNAMENT PARTICIPATION ENTRY'
      : 'MONTHLY BATCH ADMISSION';

  const isFreeTrial = data.type === 'trial' || (data.feeInfo && data.feeInfo.toLowerCase().includes('free'));
  const feeLabel = isFreeTrial ? '₹0 (Free Trial Session)' : (data.feeInfo || 'Direct Academy Settlement');

  const slipHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Booking Slip - ${cleanRef} - KnowUrCoach</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      line-height: 1.45;
    }
    .slip-container {
      max-width: 680px;
      margin: 0 auto;
      border: 2px solid #0066ff;
      border-radius: 20px;
      padding: 32px;
      background: #ffffff;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px dashed #cbd5e1;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand {
      font-size: 22px;
      font-weight: 900;
      color: #0066ff;
      letter-spacing: -0.5px;
    }
    .brand span { color: #0a1128; }
    .badge {
      display: inline-block;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      font-size: 11px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 999px;
      text-transform: uppercase;
      margin-top: 6px;
    }
    .ref-box {
      text-align: right;
    }
    .ref-label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    .ref-number {
      font-family: monospace;
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      background: #f1f5f9;
      padding: 6px 12px;
      border-radius: 8px;
      display: inline-block;
      margin-top: 4px;
    }
    .title-banner {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .title-banner h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 800;
      color: #0a1128;
    }
    .title-banner .sub {
      margin-top: 2px;
      font-size: 12px;
      color: #64748b;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
    }
    .card h4 {
      margin: 0 0 10px 0;
      font-size: 12px;
      text-transform: uppercase;
      color: #0066ff;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 6px;
      color: #334155;
    }
    .row strong {
      color: #0f172a;
      font-weight: 700;
      text-align: right;
    }
    .payment-notice {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 14px 18px;
      font-size: 12px;
      color: #166534;
      margin-bottom: 24px;
    }
    .payment-notice strong {
      display: block;
      font-size: 13px;
      margin-bottom: 3px;
    }
    .guidelines {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
    }
    .footer {
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #94a3b8;
      border-top: 2px dashed #cbd5e1;
      padding-top: 16px;
    }
    @media print {
      body { padding: 0; }
      .slip-container { border: 1px solid #000; box-shadow: none; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="slip-container">
    <div class="header">
      <div>
        <div class="brand">KnowUr<span>Coach</span></div>
        <div class="badge">Official Verified Admission Slip</div>
      </div>
      <div class="ref-box">
        <div class="ref-label">Reference Number</div>
        <div class="ref-number">${cleanRef}</div>
        <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Booked on ${bookingDate}</div>
      </div>
    </div>

    <div class="title-banner">
      <div>
        <h2>${data.academyName}</h2>
        <div class="sub">${data.category || 'Sports & Skills'} • ${data.locality || 'Agra'}${data.city ? `, ${data.city}` : ''}</div>
      </div>
      <div style="text-align: right;">
        <span style="background: #0066ff; color: #fff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 6px;">
          ${typeLabel}
        </span>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h4>Student Details</h4>
        <div class="row">
          <span>Student:</span>
          <strong>${data.studentName}</strong>
        </div>
        ${data.studentAge ? `
        <div class="row">
          <span>Age:</span>
          <strong>${data.studentAge} Years</strong>
        </div>` : ''}
        ${data.parentName ? `
        <div class="row">
          <span>Parent / Guardian:</span>
          <strong>${data.parentName}</strong>
        </div>` : ''}
        ${data.parentPhone ? `
        <div class="row">
          <span>Emergency Contact:</span>
          <strong>${data.parentPhone}</strong>
        </div>` : ''}
      </div>

      <div class="card">
        <h4>Session Schedule</h4>
        <div class="row">
          <span>Schedule / Timings:</span>
          <strong>${data.schedule || 'Scheduled Session'}</strong>
        </div>
        <div class="row">
          <span>Court / Ground:</span>
          <strong>${data.courtOrVenue || 'Main Arena'}</strong>
        </div>
        <div class="row">
          <span>Assigned Coach:</span>
          <strong>${data.coachName || 'Certified Head Coach'}</strong>
        </div>
        <div class="row">
          <span>Academy Contact:</span>
          <strong>${data.contactPhone || '+91 98970 12345'}</strong>
        </div>
      </div>
    </div>

    <div class="payment-notice">
      <strong>Tuition Terms: ${feeLabel}</strong>
      <span>
        ${isFreeTrial 
          ? 'This is a complimentary 100% Free Trial session. No fees are payable to the academy or platform for this session.'
          : 'KnowUrCoach charges ₹0 platform fee. Tuition fee is settled directly with the academy management or head coach at the reception desk.'}
      </span>
    </div>

    <div class="guidelines">
      <strong>Important Reporting Guidelines for Parents:</strong>
      <ol style="margin: 6px 0 0 18px; padding: 0;">
        <li>Please arrive 10 minutes prior to the scheduled start time.</li>
        <li>Present this Reference Slip (or quote <strong>${cleanRef}</strong>) at the reception counter or coach desk.</li>
        <li>Ensure your child wears standard athletic footwear and carries a refillable water bottle.</li>
        <li>Parents are welcome to observe the training session from designated visitor seating.</li>
      </ol>
    </div>

    <div class="footer">
      <span>KnowUrCoach India • Verified Sports & Youth Activities Directory</span>
      <span>Helpline: support@knowurcoach.in</span>
    </div>
  </div>

  <div class="no-print" style="text-align: center; margin-top: 20px;">
    <button onclick="window.print()" style="background: #0066ff; color: #fff; font-weight: 800; font-size: 14px; padding: 10px 24px; border: none; border-radius: 8px; cursor: pointer;">
      🖨️ Print / Save as PDF
    </button>
  </div>

  <script>
    // Automatically trigger print dialog on window open
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 400);
    });
  </script>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(slipHtml);
    printWindow.document.close();
  }
}
