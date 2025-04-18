import React from 'react';
import { Link as ScrollLink } from 'react-scroll';
import { Link } from 'react-router-dom';

export function Hero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYtMi42ODYgNi02cy0yLjY4Ni02LTYtNi02IDIuNjg2LTYgNiAyLjY4NiA2IDYgNnptMCAwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9nPjwvc3ZnPg==')] opacity-10"></div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 text-center pt-16 md:pt-20 lg:pt-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
            Ubah Foto Produk Anda dengan AI
          </h1>
          
          <p className="text-xl sm:text-2xl text-purple-200 mb-10 sm:mb-12 max-w-3xl mx-auto">
            Foto Produk Kini Makin Mudah. Sempurna untuk e-commerce, pemasaran, dan banyak lagi.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Link 
              to="/login?mode=signup" 
              className="w-full sm:w-auto px-8 py-4 text-lg bg-white text-purple-900 rounded-lg font-semibold hover:bg-purple-100 transition-colors"
            >
              Mulai Sekarang
            </Link>
            <ScrollLink
              to="how-it-works"
              smooth={true}
              duration={500}
              className="w-full sm:w-auto px-8 py-4 text-lg bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors cursor-pointer"
            >
              Pelajari Lebih Lanjut
            </ScrollLink>
          </div>

          <div className="mt-12 sm:mt-16">
            <img
              src="https://images.unsplash.com/photo-1542744094-24638eff58bb?q=80&w=2069&auto=format&fit=crop"
              alt="AI-enhanced product photography"
              className="rounded-xl shadow-2xl max-w-full mx-auto"
              width="1200"
              height="800"
            />
          </div>
        </div>
      </div>
    </div>
  );
}