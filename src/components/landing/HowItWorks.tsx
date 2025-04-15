import React, { useState } from 'react';
import { Play, X } from 'lucide-react';

export function HowItWorks() {
  const [showVideo, setShowVideo] = useState(false);

  const steps = [
    {
      title: "Upload Your Photo",
      description: "Simply upload your product photo or provide an image URL to get started.",
      image: "https://images.unsplash.com/photo-1586880244406-556ebe35f282?q=80&w=2187&auto=format&fit=crop"
    },
    {
      title: "Choose Your Style",
      description: "Select from various professional photography styles and angles.",
      image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto=format&fit=crop"
    },
    {
      title: "AI Enhancement",
      description: "Our AI technology enhances your photo to professional quality.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=2070&auto=format&fit=crop"
    }
  ];

  return (
    <div id="how-it-works" className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">How It Works</h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Transform your product photos into professional masterpieces in just three simple steps
        </p>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <img
                src={step.image}
                alt={step.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={() => setShowVideo(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Play className="w-5 h-5" />
            Watch Tutorial
          </button>
        </div>

        {showVideo && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl">
              <div className="flex justify-end p-2">
                <button
                  onClick={() => setShowVideo(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="relative pb-[56.25%]">
                <iframe
                  src="https://www.youtube.com/embed/OgDJjCBuPRU"
                  className="absolute inset-0 w-full h-full rounded-b-lg"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}