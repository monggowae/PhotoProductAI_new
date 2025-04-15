import React, { useState, useEffect } from 'react';
import { Camera, Loader2, ImageIcon, Download, Share2, AlertTriangle, Link, Coins, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { Toast } from '../components/shared/Toast';
import { GuideSection } from '../components/shared/GuideSection';

export function PhotoModification() {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState('');
  const user = useAuthStore((state) => state.user);
  const [serviceFee, setServiceFee] = useState(0);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' as 'error' | 'success' });
  const [modificationText, setModificationText] = useState('');

  useEffect(() => {
    fetchServiceFee();
  }, []);

  const fetchServiceFee = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('int_value')
        .eq('key', 'service_fees_photo_modification')
        .single();

      if (error) throw error;

      const fee = data?.int_value || 4;
      setServiceFee(fee);
    } catch (err) {
      console.error('Error fetching service fee:', err);
      setServiceFee(4); // Fallback value
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const recordTokenUsage = async (status: 'success' | 'failed') => {
    try {
      await supabase.rpc('record_token_usage', {
        p_user_id: user?.id,
        p_service: 'photo_modification',
        p_tokens_used: serviceFee,
        p_status: status
      });

      if (status === 'success' && user) {
        useAuthStore.setState({
          user: {
            ...user,
            apiTokens: user.apiTokens - serviceFee
          }
        });
      }
    } catch (err) {
      console.error('Error recording token usage:', err);
    }
  };

  const checkTokenBalance = () => {
    if (!user) {
      showToast('Please log in to use this service');
      return false;
    }

    if (user.apiTokens < serviceFee) {
      showToast(`Insufficient tokens. You need ${serviceFee} tokens for this operation. Please request more tokens.`);
      return false;
    }

    return true;
  };

  const modifyImage = async () => {
    if (!imageUrl.trim()) {
      showToast('Please enter an image URL');
      return;
    }

    if (!modificationText.trim()) {
      showToast('Please enter modification instructions');
      return;
    }

    if (!checkTokenBalance()) {
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const response = await fetch('https://n8n-production-7ce8.up.railway.app/webhook/modif_foto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          modificationText,
          userId: user?.id
        })
      });

      const contentType = response.headers.get('content-type');
      let result;

      if (contentType?.includes('application/json')) {
        result = await response.json();
        setResult(result.url || result.imageUrl || JSON.stringify(result, null, 2));
        await recordTokenUsage('success');
      } else if (contentType?.includes('image/')) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setResult(url);
        await recordTokenUsage('success');
      } else {
        const text = await response.text();
        setResult(text);
        await recordTokenUsage('success');
      }
    } catch (err) {
      setError('Failed to modify image. Please try again later.');
      await recordTokenUsage('failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!result) return;
    
    try {
      await navigator.share({
        title: 'Modified Photo',
        text: 'Check out this modified photo!',
        url: result
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const clearImage = () => {
    setImageUrl('');
  };

  const guideSteps = [
    {
      text: "Upload your image or enter a valid image URL that you want to modify.",
      image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=2038&auto=format&fit=crop",
    },
    {
      text: "Enter detailed instructions for how you want to modify the image. Be specific about colors, effects, or changes needed.",
      image: "https://images.unsplash.com/photo-1505238680356-667803448bb6?q=80&w=2070&auto=format&fit=crop",
    },
    {
      text: "Review our video guide for tips on writing effective modification instructions.",
      videoUrl: "https://www.youtube.com/watch?v=OgDJjCBuPRU"
    },
    {
      text: "Click 'Modify Image' and wait for your modified photo to be generated.",
    }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <GuideSection 
        title="How to Modify Photos"
        steps={guideSteps}
      />

      <div className="flex items-center gap-3 mb-8">
        <Camera className="w-8 h-8 text-purple-600" />
        <h1 className="text-3xl font-bold text-gray-900">Photo Modification</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Original Image</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Link className="h-5 w-5 text-gray-400" />
                  </div>
                  {imageUrl && (
                    <button
                      onClick={clearImage}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modification Instructions
              </label>
              <textarea
                value={modificationText}
                onChange={(e) => setModificationText(e.target.value)}
                placeholder="Describe how you want to modify the image..."
                className="w-full h-32 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                <Coins className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  Cost: {serviceFee} tokens
                </span>
              </div>
              <button
                onClick={modifyImage}
                disabled={loading || !user?.apiTokens || user.apiTokens < serviceFee}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Modifying...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5" />
                    Modify Image
                  </>
                )}
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Modified Image</h2>
            {result && (
              <div className="flex gap-2">
                <a
                  href={result}
                  download="modified-photo"
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                  title="Download Image"
                >
                  <Download className="w-5 h-5" />
                </a>
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                  title="Share Image"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-4 relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-pulse"></div>
                  <div className="absolute top-0 left-0 w-16 h-16 border-4 border-purple-600 rounded-full animate-spin border-t-transparent"></div>
                </div>
              </div>
            ) : result ? (
              typeof result === 'string' && result.startsWith('{') ? (
                <pre className="p-4 overflow-auto h-full">
                  {result}
                </pre>
              ) : (
                <img
                  src={result}
                  alt="Modified photo"
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Modified image will appear here
              </div>
            )}
          </div>

          {result && (
            <div className="flex items-start gap-2 p-4 bg-amber-50 rounded-lg text-amber-800">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                Please note that modified images are not stored in our system. 
                Make sure to download your image before leaving this page.
              </p>
            </div>
          )}
        </div>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </div>
  );
}