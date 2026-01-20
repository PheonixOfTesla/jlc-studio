/**
 * Vercel Serverless Function - Contact Form Email Handler
 * Sends contact form inquiries to jlcstudiollc@gmail.com
 */

const nodemailer = require('nodemailer');

// Email configuration - using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, service, eventDate, budget, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields: name, email, message' });
    }

    // Create HTML email body
    const emailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #C4A052; border-bottom: 2px solid #C4A052; padding-bottom: 10px;">New Inquiry from JLC Studio Website</h2>

        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          ${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ''}
          ${service ? `<p><strong>Service Interest:</strong> ${escapeHtml(service)}</p>` : ''}
          ${eventDate ? `<p><strong>Event Date:</strong> ${escapeHtml(eventDate)}</p>` : ''}
          ${budget ? `<p><strong>Budget Range:</strong> ${escapeHtml(budget)}</p>` : ''}
        </div>

        <h3 style="color: #333; margin-top: 20px;">Message:</h3>
        <p style="background: #fff; padding: 15px; border-left: 4px solid #C4A052; white-space: pre-wrap;">
          ${escapeHtml(message)}
        </p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          <p>This inquiry was submitted via the JLC Studio website contact form.</p>
          <p>Reply directly to: ${escapeHtml(email)}</p>
        </div>
      </div>
    `;

    // Create plain text version
    const emailText = `
NEW INQUIRY FROM JLC STUDIO WEBSITE

Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Service Interest: ${service || 'Not specified'}
Event Date: ${eventDate || 'Not specified'}
Budget: ${budget || 'Not specified'}

Message:
${message}

---
Reply to: ${email}
    `;

    // Send email to JLC Studio
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'jlcstudiollc@gmail.com',
      replyTo: email,
      subject: `New Inquiry from ${name} - JLC Studio Website`,
      text: emailText,
      html: emailHTML
    };

    const info = await transporter.sendMail(mailOptions);

    // Send confirmation email to customer
    const confirmationHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #C4A052;">Thank You for Contacting JLC Studio!</h2>

        <p>Hi ${escapeHtml(name)},</p>

        <p>We've received your inquiry and appreciate you reaching out. Our team will review your message and get back to you within 24 business hours.</p>

        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>What happens next:</strong></p>
          <ul>
            <li>We'll review your inquiry carefully</li>
            <li>We'll reach out to discuss your vision and project details</li>
            <li>We'll provide you with a timeline and next steps</li>
          </ul>
        </div>

        <p>In the meantime, feel free to:</p>
        <ul>
          <li>Call us at (941) 769-7526</li>
          <li>Follow us on Instagram @jlcstudio</li>
          <li>Check out our portfolio at jlcstudio.com</li>
        </ul>

        <p style="margin-top: 30px; color: #666;">Best regards,<br><strong>JLC Studio Team</strong></p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px;">
          <p>This is an automated confirmation email. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    const confirmationMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'We Received Your Inquiry - JLC Studio',
      html: confirmationHTML
    };

    await transporter.sendMail(confirmationMailOptions);

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({
      error: 'Failed to send email',
      message: error.message
    });
  }
};

// Helper function to escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
