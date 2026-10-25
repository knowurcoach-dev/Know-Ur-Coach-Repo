/**
 * Utility to generate and trigger a printable / downloadable Payment Receipt
 * for Coach / Academy Subscription Plan purchases on Knowurcoach.
 */

export interface CoachInvoiceDetails {
  invoiceNumber?: string;
  orderId?: string;
  paymentId: string;
  date?: string;
  coachName: string;
  centreName: string;
  coachEmail?: string;
  coachPhone?: string;
  locality?: string;
  city?: string;
  address?: string;
  planName: string;
  planTier?: string;
  billingCycle: string;
  amount: number; // Flat plan amount in INR (no GST)
  expiresAt: string;
  status?: string;
}

export function downloadCoachInvoice(data: CoachInvoiceDetails) {
  if (typeof window === 'undefined') return;

  const invoiceNo = data.invoiceNumber || `REC-KUC-${new Date().getFullYear()}-${data.paymentId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`;
  const invoiceDate = data.date || new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const totalAmount = Number(data.amount) || 0;
  const isFreeTrial = totalAmount === 0 || data.billingCycle === 'trial' || data.billingCycle === 'free';

  const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Payment Receipt - ${invoiceNo} - Knowurcoach</title>
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
    .invoice-container {
      max-width: 740px;
      margin: 0 auto;
      border: 2px solid #0f172a;
      border-radius: 16px;
      padding: 32px;
      background: #ffffff;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e2e8f0;
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
    .company-details {
      font-size: 11px;
      color: #64748b;
      margin-top: 6px;
      line-height: 1.4;
    }
    .invoice-badge-box {
      text-align: right;
    }
    .invoice-title {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .invoice-meta {
      font-size: 11px;
      color: #475569;
      margin-top: 6px;
      line-height: 1.6;
    }
    .invoice-meta strong {
      color: #0f172a;
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
      font-size: 11px;
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
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 12px;
    }
    .items-table th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.05em;
      padding: 10px 12px;
      text-align: left;
    }
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
    }
    .calculation-box {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 24px;
    }
    .calc-table {
      width: 300px;
      font-size: 12px;
      border-collapse: collapse;
    }
    .calc-table td {
      padding: 8px 10px;
    }
    .calc-table .total-row td {
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
      font-weight: 900;
      font-size: 15px;
      color: #0f172a;
      padding: 10px;
    }
    .status-stamp {
      display: inline-block;
      background: #ecfdf5;
      color: #065f46;
      border: 2px solid #059669;
      font-weight: 900;
      font-size: 13px;
      padding: 6px 16px;
      border-radius: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .terms {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      font-size: 11px;
      color: #64748b;
      line-height: 1.5;
    }
    .signature-area {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }
    .seal-box {
      font-size: 11px;
      color: #64748b;
    }
    .signatory {
      text-align: right;
      font-size: 11px;
      color: #475569;
    }
    .signatory strong {
      display: block;
      color: #0f172a;
      font-size: 12px;
      margin-top: 4px;
    }
    @media print {
      body { padding: 0; background: #fff; }
      .invoice-container { border: 1px solid #000; box-shadow: none; border-radius: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div>
        <div class="brand-wrap">
          <img src="/images/brand/logo-full.png" alt="Knowurcoach" class="brand-logo-img" onerror="this.style.display='none'" />
          <div class="brand">Knowur<span>coach</span></div>
        </div>
        <div class="company-details">
          <strong>Knowurcoach</strong><br />
          Official Coach &amp; Academy Partner Platform<br />
          Email: support@knowurcoach.in
        </div>
      </div>
      <div class="invoice-badge-box">
        <div class="invoice-title">Subscription Receipt</div>
        <div class="invoice-meta">
          Receipt No: <strong>${invoiceNo}</strong><br />
          Date: <strong>${invoiceDate}</strong><br />
          Payment Ref: <strong>${data.paymentId}</strong>
        </div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h4>Academy Partner Details</h4>
        <div class="row">
          <span>Academy Name:</span>
          <strong>${data.centreName}</strong>
        </div>
        <div class="row">
          <span>Coach / Founder:</span>
          <strong>${data.coachName}</strong>
        </div>
        ${data.coachEmail ? `
        <div class="row">
          <span>Email Address:</span>
          <strong>${data.coachEmail}</strong>
        </div>` : ''}
        ${data.coachPhone ? `
        <div class="row">
          <span>Contact Phone:</span>
          <strong>${data.coachPhone}</strong>
        </div>` : ''}
        ${data.locality ? `
        <div class="row">
          <span>Location:</span>
          <strong>${data.locality}${data.city ? `, ${data.city}` : ''}</strong>
        </div>` : ''}
      </div>

      <div class="card">
        <h4>Subscription &amp; Plan Details</h4>
        <div class="row">
          <span>Selected Plan:</span>
          <strong>${data.planName}</strong>
        </div>
        <div class="row">
          <span>Billing Cycle:</span>
          <strong style="text-transform: capitalize;">${data.billingCycle}</strong>
        </div>
        <div class="row">
          <span>Payment Gateway:</span>
          <strong>${isFreeTrial ? 'Complimentary Free Tier' : 'Razorpay Secure'}</strong>
        </div>
        <div class="row">
          <span>Subscription Valid Until:</span>
          <strong style="color: #059669;">${data.expiresAt}</strong>
        </div>
        <div class="row">
          <span>Payment Status:</span>
          <strong style="color: #059669;">PAID &amp; ACTIVE</strong>
        </div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 50px;">S.No</th>
          <th>Description of Services</th>
          <th style="width: 120px;">Billing Term</th>
          <th style="width: 120px; text-align: right;">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>
            <strong>${data.planName} Subscription</strong><br />
            <span style="font-size: 11px; color: #64748b;">
              Verified partner badge, top locality search placement, batch management &amp; student lead alerts.
            </span>
          </td>
          <td style="text-transform: capitalize;">${data.billingCycle}</td>
          <td style="text-align: right; font-weight: 700;">₹${totalAmount.toLocaleString('en-IN')}</td>
        </tr>
      </tbody>
    </table>

    <div class="calculation-box">
      <table class="calc-table">
        <tr class="total-row">
          <td>Total Amount Paid:</td>
          <td style="text-align: right; color: #0066ff;">
            ₹${totalAmount.toLocaleString('en-IN')}
          </td>
        </tr>
      </table>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div class="status-stamp">
        ✓ Payment Verified &amp; Confirmed
      </div>
      <div style="font-size: 11px; color: #64748b;">
        Mode: ${isFreeTrial ? 'Free Starter Tier' : 'Razorpay Online (UPI/Cards/NetBanking)'}
      </div>
    </div>

    <div class="terms">
      <strong>Terms:</strong>
      <ol style="margin: 6px 0 0 16px; padding: 0;">
        <li>This receipt is digitally generated for your Knowurcoach partner subscription.</li>
        <li>Subscription benefits and directory visibility remain active until the renewal date specified.</li>
        <li>For any questions or support, contact support@knowurcoach.in quoting receipt number <strong>${invoiceNo}</strong>.</li>
      </ol>
    </div>

    <div class="signature-area">
      <div class="seal-box">
        Knowurcoach Partner Network
      </div>
      <div class="signatory">
        Issued by <strong>Knowurcoach</strong><br /><br />
        <strong>Authorized Signatory</strong>
      </div>
    </div>
  </div>

  <div class="no-print" style="text-align: center; margin-top: 24px;">
    <button onclick="window.print()" style="background: #0066ff; color: #fff; font-weight: 800; font-size: 14px; padding: 12px 28px; border: none; border-radius: 10px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,102,255,0.25);">
      🖨️ Print / Save Receipt (PDF)
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
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  }
}
