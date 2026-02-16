const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// @route   POST /api/subscriptions/create-checkout
// @desc    Create Stripe checkout session
// @access  Private
router.post('/create-checkout', protect, async (req, res, next) => {
  try {
    const { tier } = req.body; // 'premium' or 'premium_plus'
    const User = require('../models/User');
    const user = await User.findById(req.user._id);

    const priceId = tier === 'premium' 
      ? process.env.STRIPE_PREMIUM_PRICE_ID 
      : process.env.STRIPE_PREMIUM_PLUS_PRICE_ID;

    const session = await stripe.checkout.sessions.create({
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
        userId: user._id.toString(),
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
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const User = require('../models/User');

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const { userId, tier } = session.metadata;
      
      await User.findByIdAndUpdate(userId, {
        'subscription.tier': tier,
        'subscription.status': 'active',
        'subscription.stripeCustomerId': session.customer,
        'subscription.stripeSubscriptionId': session.subscription
      });
      
      const user = await User.findById(userId);
      user.updateStorageLimit();
      await user.save();
      break;

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      const customer = await User.findOne({ 'subscription.stripeCustomerId': subscription.customer });
      
      if (customer) {
        customer.subscription.status = subscription.status;
        customer.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        
        if (subscription.status !== 'active') {
          customer.subscription.tier = 'free';
          customer.updateStorageLimit();
        }
        
        await customer.save();
      }
      break;
  }

  res.json({ received: true });
});

// @route   POST /api/subscriptions/cancel
// @desc    Cancel subscription
// @access  Private
router.post('/cancel', protect, async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id);

    if (!user.subscription.stripeSubscriptionId) {
      return res.status(400).json({
        success: false,
        error: 'No active subscription found'
      });
    }

    await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    user.subscription.status = 'cancelled';
    await user.save();

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
    const User = require('../models/User');
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      subscription: user.subscription,
      storage: user.storage
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
