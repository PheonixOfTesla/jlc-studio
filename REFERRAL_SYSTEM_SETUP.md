# JLC Studio Referral System Setup Guide

This guide walks through setting up the automated referral system for JLC Studio.

## Overview

The referral system works as follows:
1. **Referrers register** at `/referral` → receive unique code (e.g., `JLC-SM-7K3P`)
2. **Referred customers** visit `/booking?ref=CODE` → code is captured
3. **When customer pays** via Stripe → webhook triggers notifications
4. **JLynne receives email** with payout details (Venmo/PayPal/Zelle/Check)
5. **Referrer receives email** confirming their $50 reward

---

## Step 1: Google Cloud Setup (Free)

### Create Project & Enable Sheets API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "JLC Studio Referrals"
3. Go to **APIs & Services** → **Library**
4. Search for "Google Sheets API" and **Enable** it

### Create Service Account
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Name: `jlc-referrals`
4. Click **Create and Continue** → **Done**
5. Click on the service account you just created
6. Go to **Keys** tab → **Add Key** → **Create new key**
7. Choose **JSON** → Download the file
8. **Keep this file safe!** You'll need it for Vercel

### Create Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create new spreadsheet: "JLC Studio Referrals"
3. Rename the first tab to: `Referrers`
4. Add header row in A1:H1:
   ```
   Code | Name | Email | Phone | PaymentMethod | PaymentDetails | Created | Status
   ```
5. Create second tab named: `Conversions`
6. Add header row in A1:G1:
   ```
   Code | Customer | Email | Service | Amount | Date | PayoutStatus
   ```

### Share Sheet with Service Account
1. Copy the service account email from the JSON file (looks like: `jlc-referrals@xxx.iam.gserviceaccount.com`)
2. In Google Sheets, click **Share**
3. Paste the service account email and give **Editor** access

### Get Sheet ID
1. Look at your Google Sheet URL:
   ```
   https://docs.google.com/spreadsheets/d/1ABC123xyz.../edit
   ```
2. The Sheet ID is the part between `/d/` and `/edit`: `1ABC123xyz...`

---

## Step 2: Stripe Setup

### Configure Webhook
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/) → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://jlcstudio.art/api/stripe-webhook`
4. Select event: `checkout.session.completed`
5. Click **Add endpoint**
6. Click on your new webhook → **Reveal** signing secret
7. Copy the secret (starts with `whsec_`)

### Get API Keys
1. Go to **Developers** → **API keys**
2. Copy the **Secret key** (starts with `sk_live_` or `sk_test_`)
3. Copy the **Publishable key** (starts with `pk_live_` or `pk_test_`)

**Note:** Use test keys for testing, live keys for production.

---

## Step 3: Vercel Environment Variables

Go to your Vercel project → **Settings** → **Environment Variables**

Add these variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_xxx...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | `whsec_xxx...` |
| `GOOGLE_SHEETS_ID` | Google Sheet ID | `1ABC123xyz...` |
| `GOOGLE_SHEETS_CREDENTIALS` | **Entire JSON file contents** | `{"type":"service_account",...}` |
| `EMAIL_USER` | Gmail address | `jlcstudiollc@gmail.com` |
| `EMAIL_PASSWORD` | Gmail app password | (see email setup) |
| `SITE_URL` | Your site URL | `https://jlcstudio.art` |

### For GOOGLE_SHEETS_CREDENTIALS:
1. Open the JSON file you downloaded from Google Cloud
2. Copy the **entire contents** of the file
3. Paste it as the value (yes, the whole JSON object)

---

## Step 4: Install Dependencies

After deploying to Vercel, run:
```bash
npm install
```

Or Vercel will automatically install dependencies from package.json.

---

## Step 5: Testing

### Test Referrer Signup
1. Go to `https://jlcstudio.art/referral`
2. Fill out the form with test data
3. Check Google Sheet - new row should appear in "Referrers"
4. Check email - confirmation should arrive

### Test Booking with Referral
1. Go to `https://jlcstudio.art/booking?ref=YOUR-TEST-CODE`
2. Verify the referral banner appears at the top
3. Click "Book & Pay Now" on a paid consultation
4. Complete Stripe test checkout (use card: 4242 4242 4242 4242)
5. Check Google Sheet - new row in "Conversions"
6. Check both emails - payout notification to JLynne, confirmation to referrer

### Test Stripe Webhook (Local Development)
Use Stripe CLI for local testing:
```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

---

## Files Created/Modified

### New Files
- `/api/referral-signup.js` - Handles referrer registration
- `/api/stripe-webhook.js` - Handles Stripe payment events
- `/api/create-checkout.js` - Creates Stripe checkout sessions
- `/booking-success.html` - Success page after payment

### Modified Files
- `/referral.html` - Now has real form instead of mailto
- `/booking.html` - Captures referral codes, uses Stripe Checkout
- `/vercel.json` - Added new routes
- `/package.json` - Added `micro` dependency

---

## How Payouts Work

When a referred customer completes payment:

1. **JLynne receives email** with:
   - Referrer's name and contact info
   - Payout method (Venmo/PayPal/Zelle/Check)
   - Payment details (username/email/address)
   - Customer details and amount paid

2. **JLynne manually sends $50** via the specified method

3. **Referrer receives email** confirming:
   - Their referral converted
   - $50 is coming their way

---

## Troubleshooting

### Webhook not working
- Check Vercel function logs in dashboard
- Verify webhook secret matches
- Test with Stripe CLI locally first

### Google Sheets not updating
- Verify service account has Editor access to sheet
- Check that sheet tabs are named exactly "Referrers" and "Conversions"
- Verify GOOGLE_SHEETS_CREDENTIALS is the full JSON object

### Emails not sending
- Verify EMAIL_PASSWORD is an App Password, not your Gmail password
- Check that EMAIL_USER is correct
- See EMAIL_SETUP.md for Gmail configuration

---

## Cost

All services used are free:
- **Vercel**: Free tier (plenty for this use case)
- **Google Sheets API**: Free
- **Stripe**: Only charges when payments are processed
- **Nodemailer/Gmail**: Free for low volume

---

## Questions?

Contact the developer or email jlcstudiollc@gmail.com
