/**
 * Vercel Serverless Function - Create Stripe Checkout Session
 * Creates checkout sessions for paid consultations with referral tracking
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PRODUCTS = {
  'design-consultation': {
    name: 'Design Consultation (60 min)',
    description: 'In-depth planning session with expert guidance for floral and decor design.',
    price: 15000, // $150.00 in cents
    calLink: 'https://cal.com/jlynne-huffer-8qatfj'
  },
  'wedding-consultation': {
    name: 'Wedding Consultation (90 min)',
    description: 'Comprehensive wedding planning including florals, decor, and tailoring coordination.',
    price: 20000, // $200.00 in cents
    calLink: 'https://cal.com/jlynne-huffer-8qatfj'
  },
  'event-deposit': {
    name: 'Event Date Deposit',
    description: 'Non-refundable deposit to secure your event date. Credited toward final invoice.',
    price: 50000, // $500.00 in cents
    calLink: 'https://cal.com/jlynne-huffer-8qatfj'
  }
};

module.exports = async (req, res) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { productId, referralCode, customerEmail } = req.body;

    // Validate product
    const product = PRODUCTS[productId];
    if (!product) {
      return res.status(400).json({
        error: 'Invalid product',
        validProducts: Object.keys(PRODUCTS)
      });
    }

    // Build metadata
    const metadata = {
      product_id: productId,
      service_name: product.name,
      cal_link: product.calLink
    };

    // Add referral code if provided
    if (referralCode) {
      metadata.referral_code = referralCode;
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.name,
              description: product.description
            },
            unit_amount: product.price
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.SITE_URL || 'https://jlcstudio.art'}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL || 'https://jlcstudio.art'}/booking`,
      customer_email: customerEmail || undefined,
      metadata,
      // Collect customer info
      billing_address_collection: 'required',
      // Add customer details to session for webhook
      payment_intent_data: {
        metadata
      }
    });

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Checkout session error:', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message
    });
  }
};
