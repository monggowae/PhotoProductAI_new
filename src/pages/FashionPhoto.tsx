import React, { useState, useEffect } from 'react';
import { Camera, Loader2, ImageIcon, Download, Share2, AlertTriangle, Link, Coins, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { Toast } from '../components/shared/Toast';
import { GuideSection } from '../components/shared/GuideSection';

export function FashionPhoto() {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState('');
  const user = useAuthStore((state) => state.user);
  const [angle, setAngle] = useState('front');
  const [ratio, setRatio] = useState('1:1');
  const [gender, setGender] = useState('man');
  const [serviceFee, setServiceFee] = useState(0);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' as 'error' | 'success' });

  const guideSteps = [
    {
      text: "Upload your fashion item image or enter a valid image URL. Ensure the image shows the garment clearly.",
      image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=2067&auto=format&fit=crop",
    },
    {
      text: "Choose the desired angle view for your fashion item. This affects how the garment will be displayed.",
      image: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop",
    },
    {
      text: "Select the appropriate aspect ratio for your intended use (social media, e-commerce, etc.).",
      videoUrl: "https://www.youtube.com/watch?v=OgDJjCBuPRU"
    },
    {
      text: "Choose the model gender to match your target audience.",
    },
    {
      text: "Click 'Generate' to create your professional fashion photo.",
    }
  ];

  useEffect(() => {
    fetchServiceFee();
  }, []);

  const fetchServiceFee = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('int_value')
        .eq('key', 'service_fees_fashion_photography')
        .single();

      if (error) throw error;

      const fee = data?.int_value || 6;
      setServiceFee(fee);
    } catch (err) {
      console.error('Error fetching service fee:', err);
      setServiceFee(6); // Fallback value
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
        p_service: 'fashion_photography',
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

  const generateImage = async () => {
    if (!imageUrl.trim()) {
      showToast('Please enter an image URL');
      return;
    }

    if (!checkTokenBalance()) {
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const response = await fetch('https://n8n-production-7ce8.up.railway.app/webhook/foto_fashion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          angle,
          ratio,
          gender,
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
      setError('Failed to generate image. Please try again later.');
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
        title: 'Generated Fashion Photo',
        text: 'Check out this AI-generated fashion photo!',
        url: result
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const clearImageUrl = () => {
    setImageUrl('');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <GuideSection 
        title="How to Generate Fashion Photos"
        steps={guideSteps}
      />

      <div className="flex items-center gap-3 mb-8">
        <Camera className="w-8 h-8 text-purple-600" />
        <h1 className="text-3xl font-bold text-gray-900">Fashion Photography Generator</h1>
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
                      onClick={clearImageUrl}
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
                Angle
              </label>
              <select
                value={angle}
                onChange={(e) => setAngle(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="front">Front View</option>
                <option value="side">Side View</option>
                <option value="top">Top View</option>
                <option value="45-degree">45° Angle</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ratio
              </label>
              <select
                value={ratio}
                onChange={(e) => setRatio(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="1:1">1:1 (Square)</option>
                <option value="4:3">4:3</option>
                <option value="16:9">16:9</option>
                <option value="3:4">3:4 (Portrait)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="man">Man</option>
                <option value="woman">Woman</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                <Coins className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  Cost: {serviceFee} tokens
                </span>
              </div>
              <button
                onClick={generateImage}
                disabled={loading || !user?.apiTokens || user.apiTokens < serviceFee}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5" />
                    Generate
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
            <h2 className="text-xl font-semibold text-gray-900">Generated Image</h2>
            {result && (
              <div className="flex gap-2">
                <a
                  href={result}
                  download="generated-fashion"
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
                  alt="Generated fashion"
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Generated image will appear here
              </div>
            )}
          </div>

          {result && (
            <div className="flex items-start gap-2 p-4 bg-amber-50 rounded-lg text-amber-800">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                Please note that generated images are not stored in our system. 
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