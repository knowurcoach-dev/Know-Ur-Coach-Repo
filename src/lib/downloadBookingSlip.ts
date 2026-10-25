/**
 * Utility to generate and trigger a printable / downloadable booking confirmation slip & voucher.
 * Formatted cleanly for A4 printing and saving as PDF.
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
  courtOrVenue?: string; // Batch name or Venue arena
  feeInfo?: string;
  bookingDate?: string;
  dateBooked?: string;
  paymentStatus?: string;
}

export function downloadBookingSlip(data: BookingSlipDetails) {
  if (typeof window === 'undefined') return;

  const rawRef = data.referenceNo || data.bookingId || `REF-${Date.now().toString().slice(-6)}`;
  const cleanRef = '#' + rawRef.replace(/^#+/, '');
  const bookingDate = data.bookingDate || data.dateBooked || new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const isFreeTrial = data.type === 'trial' || !data.type || (data.feeInfo && data.feeInfo.toLowerCase().includes('free'));
  const isTournament = data.type === 'tournament';

  const typeBadge = isFreeTrial
    ? 'Free Trial Pass'
    : isTournament
    ? 'Official Tournament Entry Pass'
    : 'Monthly Batch Admission';

  const voucherTitle = isFreeTrial
    ? 'FREE TRIAL PASS'
    : isTournament
    ? 'TOURNAMENT PARTICIPATION ENTRY PASS'
    : 'MONTHLY BATCH ADMISSION SLIP';

  const batchOrProgram = data.courtOrVenue || (isFreeTrial ? 'Free Trial Coaching Batch' : 'Standard Regular Batch');

  const slipHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${voucherTitle} - ${cleanRef} - Knowurcoach</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      line-height: 1.5;
    }
    .slip-container {
      max-width: 720px;
      margin: 0 auto;
      border: 2px solid ${isFreeTrial ? '#059669' : '#0066ff'};
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
    .brand-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo-img {
      height: 38px;
      width: auto;
      object-fit: contain;
    }
    .brand {
      font-size: 24px;
      font-weight: 900;
      color: #0066ff;
      letter-spacing: -0.5px;
    }
    .brand span { color: #0a1128; }
    .badge {
      display: inline-block;
      background: ${isFreeTrial ? '#ecfdf5' : '#eff6ff'};
      color: ${isFreeTrial ? '#065f46' : '#1e40af'};
      border: 1px solid ${isFreeTrial ? '#a7f3d0' : '#bfdbfe'};
      font-size: 11px;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
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
      letter-spacing: 0.05em;
    }
    .ref-number {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      background: #f1f5f9;
      padding: 6px 14px;
      border-radius: 8px;
      display: inline-block;
      margin-top: 4px;
      border: 1px solid #e2e8f0;
    }
    .title-banner {
      background: ${isFreeTrial ? '#f0fdf4' : '#f8fafc'};
      border: 1px solid ${isFreeTrial ? '#bbf7d0' : '#e2e8f0'};
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .title-banner h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 800;
      color: #0a1128;
    }
    .title-banner .sub {
      margin-top: 3px;
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
      border-radius: 14px;
      padding: 18px;
    }
    .card h4 {
      margin: 0 0 12px 0;
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
      margin-bottom: 8px;
      color: #334155;
    }
    .row:last-child {
      margin-bottom: 0;
    }
    .row strong {
      color: #0f172a;
      font-weight: 700;
      text-align: right;
    }
    .status-highlight-card {
      background: ${isFreeTrial ? '#ecfdf5' : '#eff6ff'};
      border: 1.5px solid ${isFreeTrial ? '#a7f3d0' : '#bfdbfe'};
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .status-tag {
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: ${isFreeTrial ? '#065f46' : '#1e40af'};
    }
    .status-desc {
      font-size: 12px;
      color: #475569;
      margin-top: 2px;
    }
    .admission-terms-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 24px;
      font-size: 12px;
      color: #334155;
    }
    .admission-terms-box strong {
      color: #0f172a;
    }
    .guidelines {
      border-top: 1px solid #e2e8f0;
      padding-top: 18px;
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
      body { padding: 0; background: #fff; }
      .slip-container { border: 1px solid #94a3b8; box-shadow: none; border-radius: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="slip-container">
    <div class="header">
      <div>
        <div class="brand-wrap">
          <img src="/images/brand/logo-full.png" alt="Knowurcoach" class="brand-logo-img" onerror="this.style.display='none'" />
          <div class="brand">Knowur<span>coach</span></div>
        </div>
        <div class="badge">${typeBadge}</div>
      </div>
      <div class="ref-box">
        <div class="ref-label">Reference Number</div>
        <div class="ref-number">${cleanRef}</div>
        <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Booked On: ${bookingDate}</div>
      </div>
    </div>

    <div class="title-banner">
      <div>
        <h2>${data.academyName}</h2>
        <div class="sub">${data.category || 'Sports & Youth Activities'} • ${data.locality || 'Agra'}${data.city ? `, ${data.city}` : ''}</div>
      </div>
      <div style="text-align: right;">
        <span style="background: ${isFreeTrial ? '#059669' : '#0066ff'}; color: #fff; font-size: 11px; font-weight: 800; padding: 6px 14px; border-radius: 8px;">
          ${voucherTitle}
        </span>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h4>Student &amp; Parent Info</h4>
        <div class="row">
          <span>Student Name:</span>
          <strong>${data.studentName}</strong>
        </div>
        ${data.studentAge ? `
        <div class="row">
          <span>Student Age:</span>
          <strong>${data.studentAge} Years</strong>
        </div>` : ''}
        ${data.parentName ? `
        <div class="row">
          <span>Parent / Guardian:</span>
          <strong>${data.parentName}</strong>
        </div>` : ''}
        ${data.parentPhone ? `
        <div class="row">
          <span>Contact Number:</span>
          <strong>${data.parentPhone}</strong>
        </div>` : ''}
      </div>

      <div class="card">
        <h4>Batch &amp; Session Details</h4>
        <div class="row">
          <span>Batch / Program:</span>
          <strong>${batchOrProgram}</strong>
        </div>
        <div class="row">
          <span>Schedule &amp; Timings:</span>
          <strong>${data.schedule || 'Scheduled Session'}</strong>
        </div>
        <div class="row">
          <span>Head Coach:</span>
          <strong>${data.coachName || 'Certified Academy Coach'}</strong>
        </div>
        <div class="row">
          <span>Academy Helpline:</span>
          <strong>${data.contactPhone || '+91 97625 77714'}</strong>
        </div>
      </div>
    </div>

    ${isFreeTrial ? `
    <div class="status-highlight-card">
      <div>
        <div class="status-tag">✓ Confirmed Free Trial Pass</div>
        <div class="status-desc">
          Meet the coach, explore the facilities, and experience the training session.
        </div>
      </div>
      <div style="text-align: right; font-size: 11px; font-weight: 800; color: #059669; background: #ffffff; padding: 6px 14px; border-radius: 8px; border: 1px solid #a7f3d0;">
        Pass Confirmed
      </div>
    </div>
    ` : `
    <div class="admission-terms-box">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <strong>Monthly Batch Tuition Fee:</strong>
        <span style="font-weight: 700; color: #0f172a;">${data.feeInfo || 'Direct Academy Settlement'}</span>
      </div>
      <div style="font-size: 11px; color: #64748b;">
        Tuition fees are settled directly with the academy management at the reception desk upon joining.
      </div>
    </div>
    `}

    <div class="guidelines">
      <strong>Important Reporting Guidelines for Parents:</strong>
      <ol style="margin: 6px 0 0 18px; padding: 0;">
        <li>Please arrive 10-15 minutes prior to the scheduled batch timing.</li>
        <li>Present this pass or quote Reference No. <strong>${cleanRef}</strong> at the academy reception.</li>
        <li>Ensure your child wears comfortable athletic wear / sports shoes and carries a water bottle.</li>
        <li>Parents are welcome to observe the training session from designated visitor areas.</li>
      </ol>
    </div>

    <div class="footer">
      <span>Knowurcoach • Connecting Parents with Top Coaches &amp; Academies</span>
      <span>Support: support@knowurcoach.in</span>
    </div>
  </div>

  <div class="no-print" style="text-align: center; margin-top: 24px;">
    <button onclick="window.print()" style="background: #0066ff; color: #fff; font-weight: 800; font-size: 14px; padding: 12px 28px; border: none; border-radius: 10px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,102,255,0.25);">
      🖨️ Print / Save Pass (PDF)
    </button>
  </div>

  <script>
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
