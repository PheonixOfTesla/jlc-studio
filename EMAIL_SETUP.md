# Email Setup for Contact Form

## Overview
The contact form now sends inquiries to **jlcstudiollc@gmail.com** via a Vercel serverless function using Nodemailer.

## Setup Instructions

### Step 1: Create App Password (Gmail)
Since Gmail requires app passwords for third-party applications:

1. Go to your Google Account: https://myaccount.google.com/
2. Click **"Security"** in the left sidebar
3. Enable **"2-Step Verification"** (if not already enabled)
4. Go back to **Security** tab
5. Scroll down to **"App passwords"**
6. Select **"Mail"** and **"Windows Computer"** (or your platform)
7. Copy the 16-character password generated

### Step 2: Set Environment Variables

In your Vercel project, add these environment variables:

**Variable Name:** `EMAIL_USER`
**Value:** `jlcstudiollc@gmail.com`

**Variable Name:** `EMAIL_PASSWORD`
**Value:** (paste the 16-character app password from Step 1)

#### How to Add Environment Variables to Vercel:
1. Go to https://vercel.com
2. Select your **JLC Studio** project
3. Go to **Settings** → **Environment Variables**
4. Add the two variables above
5. Save

### Step 3: Local Development (Optional)

To test locally, create a `.env.local` file in the project root:

```
EMAIL_USER=jlcstudiollc@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

Then run:
```bash
npm install
npm run dev
```

### Step 4: Test the Form

1. Visit your website's contact page
2. Fill out the form with test data
3. Submit the form
4. Check that an email arrives at jlcstudiollc@gmail.com

## How It Works

### User Submits Form
1. User fills out contact form on contact.html
2. Form validates required fields (name, email, message)
3. Client-side JavaScript collects form data

### Email Sent to JLC Studio
4. Form data sent to `/api/send-email` endpoint
5. Vercel function processes the request
6. **Inquiry email** sent to jlcstudiollc@gmail.com with:
   - All form data formatted nicely
   - Reply-to set to customer email
   - Subject line with customer name

### Confirmation Sent to Customer
7. **Confirmation email** sent to customer with:
   - Thank you message
   - Next steps
   - Contact information
   - Phone number

### Success Message Shown
8. User sees "Thank You!" message with link back to home

## Email Contents

### Inquiry Email (to jlcstudiollc@gmail.com)
- Includes: Name, Email, Phone, Service, Event Date, Budget, Message
- Reply-to: Customer's email address
- Subject: "New Inquiry from [Name] - JLC Studio Website"

### Confirmation Email (to customer)
- Personalized thank you message
- What to expect next
- Contact information
- Links to social media

## Troubleshooting

### Email not arriving?
1. **Check environment variables** - Verify EMAIL_USER and EMAIL_PASSWORD are set in Vercel
2. **Check app password** - Gmail app passwords expire or can be revoked
3. **Check spam folder** - Email might be flagged as spam
4. **Check API endpoint** - Verify `/api/send-email.js` file exists

### "Method not allowed" error?
- Only POST requests are allowed
- Check that form is using POST method

### "Missing required fields" error?
- Ensure name, email, and message are filled in
- These three fields are mandatory

### nodemailer error?
- Run `npm install` to install dependencies
- For Vercel: dependencies in package.json are automatically installed during build

## Alternative Email Services

If you want to use a different email service, you can modify `/api/send-email.js`:

**SendGrid:**
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
```

**Mailgun:**
```javascript
const mailgun = require('mailgun.js');
const mg = mailgun.client({username: 'api', key: process.env.MAILGUN_API_KEY});
```

Contact support if you need help switching services.

## Security Notes

- Environment variables are NEVER exposed to the client
- Form data is validated on both client and server
- Email addresses are sanitized to prevent injection
- Confirmation emails only go to verified customer email (form input)

## Support

If you have questions or need help:
- Call: (941) 769-7526
- Email: jlcstudiollc@gmail.com
