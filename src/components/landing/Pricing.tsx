import React from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Pricing() {
  const plans = [
    {
      name: "Basic",
      price: "50",
      description: "Perfect for individuals and small businesses",
      features: [
        "100 AI-enhanced photos per month",
        "Basic photo modifications",
        "Standard support",
        "Access to all basic features",
        "Export in standard quality"
      ]
    },
    {
      name: "Agency",
      price: "150",
      description: "Ideal for agencies and large businesses",
      features: [
        "Unlimited AI-enhanced photos",
        "Advanced photo modifications",
        "Priority support",
        "Token transfer capability",
        "Export in premium quality",
        "Custom branding options",
        "Team collaboration tools"
      ],
      featured: true
    }
  ];

  return (
    <div id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Choose the perfect plan for your needs. No hidden fees.
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-2xl p-8 ${
                plan.featured
                  ? 'bg-purple-900 text-white shadow-xl scale-105'
                  : 'bg-white border-2 border-gray-100'
              }`}
            >
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className={`${plan.featured ? 'text-purple-200' : 'text-gray-600'} mb-6`}>
                {plan.description}
              </p>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className={`${plan.featured ? 'text-purple-200' : 'text-gray-600'}`}>
                  {' '}tokens
                </span>
              </div>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className={`w-5 h-5 ${plan.featured ? 'text-purple-300' : 'text-purple-600'}`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/login?mode=signup"
                className={`block text-center py-3 px-6 rounded-lg font-semibold transition-colors ${
                  plan.featured
                    ? 'bg-white text-purple-900 hover:bg-purple-50'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}