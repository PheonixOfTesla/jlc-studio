/**
 * Vercel Serverless Function - Stripe Webhook Handler
 * Detects referral conversions and sends payout notifications
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const { buffer } = require('micro');

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Initialize Google Sheets
async function getGoogleSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  return google.sheets({ version: 'v4', auth });
}

// Look up referrer by code
async function lookupReferrer(sheets, spreadsheetId, code) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Referrers!A:H'
  });

  const rows = response.data.values || [];
  const dataRows = rows.slice(1);

  for (const row of dataRows) {
    if (row[0] === code) {
      return {
        code: row[0],
        name: row[1],
        email: row[2],
        phone: row[3],
        paymentMethod: row[4],
        paymentDetails: row[5],
        created: row[6],
        status: row[7]
      };
    }
  }
  return null;
}

// Log conversion to Google Sheets
async function logConversion(sheets, spreadsheetId, data) {
  const timestamp = new Date().toISOString();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Conversions!A:G',
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [[
        data.code,                    // A: Referral Code
        data.customerName,            // B: Customer Name
        data.customerEmail,           // C: Customer Email
        data.service,                 // D: Service/Product
        data.amount,                  // E: Amount
        timestamp,                    // F: Date
        'Pending'                     // G: Payout Status
      ]]
    }
  });
}

// Helper function to escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Get raw body for signature verification
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Check for referral code in metadata
    const referralCode = session.metadata?.referral_code;

    if (!referralCode) {
      // No referral code, just acknowledge the webhook
      return res.status(200).json({ received: true, referral: false });
    }

    try {
      const sheets = await getGoogleSheetsClient();
      const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

      // Look up referrer
      const referrer = await lookupReferrer(sheets, spreadsheetId, referralCode);

      if (!referrer) {
        console.log(`Referral code not found: ${referralCode}`);
        return res.status(200).json({
          received: true,
          referral: true,
          error: 'Referral code not found'
        });
      }

      // Extract customer info from session
      const customerName = session.customer_details?.name || 'Customer';
      const customerEmail = session.customer_details?.email || 'Not provided';
      const amountPaid = (session.amount_total / 100).toFixed(2);
      const serviceName = session.metadata?.service_name || 'JLC Studio Service';

      // Log conversion to Google Sheets
      await logConversion(sheets, spreadsheetId, {
        code: referralCode,
        customerName,
        customerEmail,
        service: serviceName,
        amount: `$${amountPaid}`
      });

      // Email JLynne - Payout notification
      const jlynneHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #C4A052; text-align: center;">Referral Conversion - Payout Due!</h2>

          <div style="background: #3b4a3a; padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0;">
            <p style="color: #f5f2ed; margin: 0 0 5px; font-size: 14px;">PAYOUT AMOUNT</p>
            <p style="color: #C4A052; font-size: 48px; font-weight: bold; margin: 0;">$50</p>
          </div>

          <h3 style="color: #3b4a3a; border-bottom: 2px solid #C4A052; padding-bottom: 10px;">Referrer Details</h3>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Name:</strong> ${escapeHtml(referrer.name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(referrer.email)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(referrer.phone || 'Not provided')}</p>
            <p><strong>Referral Code:</strong> <span style="color: #C4A052; font-weight: bold;">${referralCode}</span></p>
          </div>

          <h3 style="color: #3b4a3a; border-bottom: 2px solid #C4A052; padding-bottom: 10px;">Payout Method</h3>
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #4CAF50;">
            <p style="margin: 0;"><strong>${escapeHtml(referrer.paymentMethod)}:</strong> ${escapeHtml(referrer.paymentDetails)}</p>
          </div>

          <h3 style="color: #3b4a3a; border-bottom: 2px solid #C4A052; padding-bottom: 10px;">Customer Details</h3>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Customer:</strong> ${escapeHtml(customerName)}</p>
            <p><strong>Email:</strong> ${escapeHtml(customerEmail)}</p>
            <p><strong>Service:</strong> ${escapeHtml(serviceName)}</p>
            <p><strong>Amount Paid:</strong> $${amountPaid}</p>
          </div>

          <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
            <p style="margin: 0; color: #e65100;"><strong>Action Required:</strong> Send $50 to ${escapeHtml(referrer.name)} via ${escapeHtml(referrer.paymentMethod)}</p>
          </div>

          <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
            Conversion logged: ${new Date().toLocaleString()}
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: 'jlcstudiollc@gmail.com',
        subject: `💰 Referral Payout Due: $50 to ${referrer.name} (${referrer.paymentMethod})`,
        html: jlynneHTML
      });

      // Email referrer - You earned $50!
      const referrerHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #C4A052; text-align: center;">You Just Earned $50!</h2>

          <div style="background: #3b4a3a; padding: 30px; border-radius: 12px; text-align: center; margin: 25px 0;">
            <p style="color: #f5f2ed; margin: 0 0 10px; font-size: 14px;">YOUR REFERRAL BONUS</p>
            <p style="color: #C4A052; font-size: 48px; font-weight: bold; margin: 0;">$50</p>
          </div>

          <p>Hi ${escapeHtml(referrer.name.split(' ')[0])},</p>

          <p>Great news! Someone you referred just booked with JLC Studio using your code <strong>${referralCode}</strong>.</p>

          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0;"><strong>Your $50 payout will be sent via:</strong></p>
            <p style="margin: 10px 0 0; font-size: 18px; color: #2e7d32;">${escapeHtml(referrer.paymentMethod)}: ${escapeHtml(referrer.paymentDetails)}</p>
          </div>

          <p>We process payouts within 3-5 business days. Keep sharing your code to earn more!</p>

          <div style="background: #f5f2ed; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
            <p style="margin: 0 0 10px; color: #666;">Your referral link:</p>
            <a href="https://jlcstudio.art/booking?ref=${referralCode}" style="color: #C4A052; font-weight: bold;">jlcstudio.art/booking?ref=${referralCode}</a>
          </div>

          <p style="margin-top: 30px;">Thank you for spreading the word!</p>
          <p><strong>JLC Studio Team</strong></p>
        </div>
      `;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: referrer.email,
        subject: `You earned $50! Your referral just booked with JLC Studio`,
        html: referrerHTML
      });

      return res.status(200).json({
        received: true,
        referral: true,
        referralCode,
        referrerName: referrer.name,
        payoutNotificationSent: true
      });

    } catch (error) {
      console.error('Error processing referral:', error);
      return res.status(200).json({
        received: true,
        referral: true,
        error: error.message
      });
    }
  }

  // Handle other event types if needed
  return res.status(200).json({ received: true });
};

// Vercel config for raw body (needed for Stripe signature verification)
module.exports.config = {
  api: {
    bodyParser: false
  }
};
