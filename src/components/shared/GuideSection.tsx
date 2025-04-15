import React, { useState } from 'react';
import { Info, PlayCircle, X } from 'lucide-react';

interface GuideSectionProps {
  title: string;
  steps: {
    text: string;
    image?: string;
    videoUrl?: string;
  }[];
}

export function GuideSection({ title, steps }: GuideSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  const toggleGuide = () => setIsOpen(!isOpen);

  const handleVideoClick = (videoUrl?: string) => {
    if (videoUrl) {
      setActiveVideoUrl(videoUrl);
    }
  };

  return (
    <div className="mb-8 bg-white rounded-xl shadow-lg overflow-hidden">
      <div 
        className="flex items-center justify-between p-4 bg-purple-50 cursor-pointer"
        onClick={toggleGuide}
      >
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
        <button className="text-gray-500 hover:text-gray-700">
          {isOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Info className="w-5 h-5" />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="p-6">
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">{index + 1}</span>
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-gray-700">{step.text}</p>
                  {step.image && (
                    <img 
                      src={step.image} 
                      alt={`Step ${index + 1}`}
                      className="rounded-lg shadow-md max-w-full h-auto"
                    />
                  )}
                  {step.videoUrl && (
                    <button
                      onClick={() => handleVideoClick(step.videoUrl)}
                      className="flex items-center gap-2 text-purple-600 hover:text-purple-700"
                    >
                      <PlayCircle className="w-5 h-5" />
                      <span>Watch Video Guide</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Modal */}
      {activeVideoUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg w-full max-w-4xl">
            <div className="flex justify-end mb-2">
              <button 
                onClick={() => setActiveVideoUrl(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="relative" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={activeVideoUrl.replace('watch?v=', 'embed/')}
                title="Video Guide"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}