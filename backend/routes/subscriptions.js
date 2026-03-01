const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { User } = require('../models/index');

// Lazily initialize Stripe to avoid crash when key is not configured
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'your_stripe_secret_key') {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in your .env file.');
  }
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
};

// @route   POST /api/subscriptions/create-checkout
// @desc    Create Stripe checkout session
// @access  Private
router.post('/create-checkout', protect, async (req, res, next) => {
  try {
    const { tier } = req.body; // 'premium' or 'premium_plus'
    const user = await User.findByPk(req.user.id);

    const priceId = tier === 'premium' 
      ? process.env.STRIPE_PREMIUM_PRICE_ID 
      : process.env.STRIPE_PREMIUM_PLUS_PRICE_ID;

    const session = await getStripe().checkout.sessions.create({
      customer_email: user.email,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancelled`,
      metadata: {
        userId: user.id,
        tier
      }
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/subscriptions/webhook
// @desc    Stripe webhook
// @access  Public
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = getStripe().webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const { userId, tier } = session.metadata;
      await User.update(
        {
          subscription: tier,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription
        },
        { where: { id: userId } }
      );
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const customer = await User.findOne({ where: { stripeCustomerId: subscription.customer } });
      if (customer && subscription.status !== 'active') {
        await customer.update({ subscription: 'free' });
      }
      break;
    }
  }

  res.json({ received: true });
});

// @route   POST /api/subscriptions/cancel
// @desc    Cancel subscription
// @access  Private
router.post('/cancel', protect, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user || !user.stripeSubscriptionId) {
      return res.status(400).json({
        success: false,
        error: 'No active subscription found'
      });
    }

    await getStripe().subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    res.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the billing period'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/subscriptions/status
// @desc    Get subscription status
// @access  Private
router.get('/status', protect, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      subscription: {
        tier: user.subscription,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId
      },
      storage: { storageUsed: user.storageUsed }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
