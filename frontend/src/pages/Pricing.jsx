import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { subscriptionAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Pricing() {
  const handleSubscribe = async (tier) => {
    try {
      const { data } = await subscriptionAPI.createCheckout(tier);
      window.location.href = data.url;
    } catch (error) {
      toast.error('Failed to start checkout');
    }
  };

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for small families getting started',
      features: [
        'Up to 100 family members',
        '1 GB storage',
        'Basic family tree',
        '50 photos',
        'Event calendar',
        'Email support',
      ],
      cta: 'Get Started',
      action: () => window.location.href = '/register',
      highlighted: false,
    },
    {
      name: 'Premium',
      price: '$9.99',
      period: 'per month',
      description: 'For growing families who want more',
      features: [
        'Unlimited family members',
        '50 GB storage',
        'Advanced tree layouts',
        'Unlimited photos & videos',
        'PDF exports',
        'Custom themes',
        'Priority support',
        'Ad-free experience',
      ],
      cta: 'Upgrade to Premium',
      action: () => handleSubscribe('premium'),
      highlighted: true,
    },
    {
      name: 'Premium Plus',
      price: '$19.99',
      period: 'per month',
      description: 'Ultimate package for serious genealogists',
      features: [
        'Everything in Premium',
        '200 GB storage',
        'DNA integration',
        'Historical records search',
        'Professional tree printing',
        'Family book generation',
        'Advanced analytics',
        'White-glove support',
      ],
      cta: 'Upgrade to Premium Plus',
      action: () => handleSubscribe('premium_plus'),
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start free and upgrade as your family tree grows. Cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`card ${
                plan.highlighted
                  ? 'ring-2 ring-primary-600 shadow-xl transform scale-105'
                  : ''
              }`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold text-primary-600">{plan.price}</span>
                  <span className="text-gray-600 ml-2">/{plan.period}</span>
                </div>
                <p className="text-gray-600 mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="text-green-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={plan.action}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  plan.highlighted
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="card">
              <h3 className="font-semibold text-lg mb-2">Can I change plans later?</h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div className="card">
              <h3 className="font-semibold text-lg mb-2">What happens to my data if I cancel?</h3>
              <p className="text-gray-600">
                Your data is always yours. If you cancel, your account reverts to the free tier and you can export all your data.
              </p>
            </div>
            <div className="card">
              <h3 className="font-semibold text-lg mb-2">Do you offer refunds?</h3>
              <p className="text-gray-600">
                Yes, we offer a 30-day money-back guarantee on all paid plans. No questions asked.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
