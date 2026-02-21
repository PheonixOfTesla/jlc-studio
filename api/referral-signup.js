/**
 * Vercel Serverless Function - Referral Signup Handler
 * Creates unique referral codes and stores referrer info in Google Sheets
 */

const { google } = require('googleapis');
const nodemailer = require('nodemailer');

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

// Generate unique referral code: JLC-{INITIALS}-{4RANDOM}
function generateReferralCode(firstName, lastName) {
  const initials = (firstName[0] + lastName[0]).toUpperCase();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
  let random = '';
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `JLC-${initials}-${random}`;
}

// Check if code already exists
async function codeExists(sheets, spreadsheetId, code) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Referrers!A:A'
  });
  const values = response.data.values || [];
  return values.some(row => row[0] === code);
}

module.exports = async (req, res) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firstName, lastName, email, phone, paymentMethod, paymentDetails } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !paymentMethod || !paymentDetails) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['firstName', 'lastName', 'email', 'paymentMethod', 'paymentDetails']
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Initialize Google Sheets
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    // Check if email already registered
    const existingResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Referrers!C:C'
    });
    const existingEmails = existingResponse.data.values || [];
    const emailExists = existingEmails.some(row => row[0]?.toLowerCase() === email.toLowerCase());

    if (emailExists) {
      // Look up their existing code
      const allData = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Referrers!A:C'
      });
      const rows = allData.data.values || [];
      const existingRow = rows.find(row => row[2]?.toLowerCase() === email.toLowerCase());

      return res.status(400).json({
        error: 'Email already registered',
        existingCode: existingRow ? existingRow[0] : null,
        message: 'This email is already registered for referrals.'
      });
    }

    // Generate unique code
    let code = generateReferralCode(firstName, lastName);
    let attempts = 0;
    while (await codeExists(sheets, spreadsheetId, code) && attempts < 10) {
      code = generateReferralCode(firstName, lastName);
      attempts++;
    }

    // Add referrer to Google Sheets
    const timestamp = new Date().toISOString();
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Referrers!A:H',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[
          code,                           // A: Code
          `${firstName} ${lastName}`,     // B: Name
          email,                          // C: Email
          phone || '',                    // D: Phone
          paymentMethod,                  // E: PaymentMethod
          paymentDetails,                 // F: PaymentDetails
          timestamp,                      // G: Created
          'Active'                        // H: Status
        ]]
      }
    });

    // Send confirmation email to referrer
    const confirmationHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #C4A052; text-align: center;">Welcome to JLC Studio Referrals!</h2>

        <p>Hi ${escapeHtml(firstName)},</p>

        <p>You're all set to start earning! Here's your unique referral code:</p>

        <div style="background: #3b4a3a; padding: 30px; border-radius: 12px; text-align: center; margin: 25px 0;">
          <p style="color: #f5f2ed; margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Your Referral Code</p>
          <p style="color: #C4A052; font-size: 32px; font-weight: bold; margin: 0; letter-spacing: 3px;">${code}</p>
        </div>

        <h3 style="color: #3b4a3a; margin-top: 30px;">How It Works:</h3>
        <ol style="color: #666; line-height: 1.8;">
          <li><strong>Share your code</strong> with friends planning events, weddings, or needing custom work</li>
          <li><strong>They mention your code</strong> when booking with JLC Studio</li>
          <li><strong>You get $50</strong> when they complete their booking!</li>
        </ol>

        <div style="background: #f5f2ed; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h4 style="color: #3b4a3a; margin: 0 0 10px;">Share This Link:</h4>
          <p style="margin: 0; word-break: break-all;">
            <a href="https://jlcstudio.art/booking?ref=${code}" style="color: #C4A052;">https://jlcstudio.art/booking?ref=${code}</a>
          </p>
        </div>

        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #666;"><strong>Your payout method:</strong> ${escapeHtml(paymentMethod)} - ${escapeHtml(paymentDetails)}</p>
        </div>

        <p style="color: #666; font-size: 14px;">Questions? Reply to this email or call us at (941) 769-7526.</p>

        <p style="margin-top: 30px;">Best,<br><strong>JLC Studio Team</strong></p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Your JLC Studio Referral Code: ${code}`,
      html: confirmationHTML
    });

    // Notify JLynne of new referrer
    const notifyHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #C4A052;">New Referrer Signed Up!</h2>

        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${escapeHtml(firstName)} ${escapeHtml(lastName)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(phone || 'Not provided')}</p>
          <p><strong>Code:</strong> <span style="color: #C4A052; font-weight: bold;">${code}</span></p>
          <p><strong>Payout:</strong> ${escapeHtml(paymentMethod)} - ${escapeHtml(paymentDetails)}</p>
        </div>

        <p style="color: #666; font-size: 12px;">Signed up: ${new Date().toLocaleString()}</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'jlcstudiollc@gmail.com',
      subject: `New Referrer: ${firstName} ${lastName} (${code})`,
      html: notifyHTML
    });

    return res.status(200).json({
      success: true,
      code,
      message: 'Referral code created successfully',
      shareUrl: `https://jlcstudio.art/booking?ref=${code}`
    });

  } catch (error) {
    console.error('Referral signup error:', error);
    return res.status(500).json({
      error: 'Failed to create referral code',
      message: error.message
    });
  }
};

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
