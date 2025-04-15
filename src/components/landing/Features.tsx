import React from 'react';
import { Camera, Image, Paintbrush, Zap, Clock, Shield } from 'lucide-react';

export function Features() {
  const features = [
    {
      icon: <Camera className="w-8 h-8 text-purple-600" />,
      title: "Kualitas Profesional",
      description: "Solusi sempurna untuk pebisnis e-commerce yang ingin membuat foto produk berkualitas tinggi dengan cepat dan mudah"
    },
    {
      icon: <Image className="w-8 h-8 text-purple-600" />,
      title: "Berbagai Gaya",
      description: "Pilih dari berbagai gaya fotografi dan sudut pengambilan gambar"
    },
    {
      icon: <Paintbrush className="w-8 h-8 text-purple-600" />,
      title: "Modifikasi Kustom",
      description: "Sesuaikan dan sempurnakan foto Anda sesuai kebutuhan"
    },
    {
      icon: <Zap className="w-8 h-8 text-purple-600" />,
      title: "Hasil Instan",
      description: "Dapatkan foto yang telah ditingkatkan dalam hitungan detik"
    },
    {
      icon: <Clock className="w-8 h-8 text-purple-600" />,
      title: "Tersedia 24/7",
      description: "Buat foto profesional kapan saja, di mana saja"
    },
    {
      icon: <Shield className="w-8 h-8 text-purple-600" />,
      title: "Platform Aman",
      description: "Foto dan data Anda selalu terlindungi"
    }
  ];

  return (
    <div id="features" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Fitur Unggulan
        </h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Semua yang Anda butuhkan untuk membuat foto produk menakjubkan yang mendorong penjualan
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}