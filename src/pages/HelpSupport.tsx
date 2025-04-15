import React, { useState } from 'react';
import { Mail, Phone, MessageCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export function HelpSupport() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  const faqItems: FAQItem[] = [
    {
      category: "Getting Started",
      question: "Bagaimana cara memulai menggunakan PhotoProductAI?",
      answer: "Untuk memulai, daftar akun terlebih dahulu, lalu beli token yang Anda butuhkan. Setelah itu, Anda dapat langsung mengunggah foto dan menggunakan fitur AI kami untuk meningkatkan kualitas foto produk Anda."
    },
    {
      category: "Getting Started",
      question: "Berapa token yang saya butuhkan untuk memulai?",
      answer: "Kami merekomendasikan untuk memulai dengan minimal 50 token. Setiap layanan memiliki biaya token yang berbeda, mulai dari 4-10 token per penggunaan."
    },
    {
      category: "Tokens",
      question: "Bagaimana cara membeli token tambahan?",
      answer: "Anda dapat membeli token tambahan melalui halaman Token Requests. Pilih jumlah token yang Anda inginkan dan tunggu persetujuan admin. Setelah disetujui, token akan langsung ditambahkan ke akun Anda."
    },
    {
      category: "Tokens",
      question: "Berapa lama token berlaku?",
      answer: "Token berlaku selama 30 hari sejak tanggal pembelian atau transfer. Pastikan untuk menggunakan token Anda sebelum masa berlaku habis."
    },
    {
      category: "Technical",
      question: "Format foto apa yang didukung?",
      answer: "Kami mendukung format foto JPG, PNG, dan WEBP. Ukuran maksimal file adalah 10MB, dengan resolusi minimal 800x800 piksel untuk hasil terbaik."
    },
    {
      category: "Technical",
      question: "Berapa lama proses generate foto?",
      answer: "Proses generate foto biasanya memakan waktu 10-30 detik, tergantung pada kompleksitas foto dan jenis layanan yang dipilih."
    },
    {
      category: "Account",
      question: "Bagaimana cara mengubah informasi profil?",
      answer: "Kunjungi halaman Profile di menu navigasi, di sana Anda dapat mengubah nama, nomor telepon, dan kata sandi akun Anda."
    },
    {
      category: "Account",
      question: "Bagaimana jika saya lupa kata sandi?",
      answer: "Klik 'Lupa kata sandi?' di halaman login, masukkan email Anda, dan ikuti instruksi yang dikirimkan ke email Anda untuk mengatur ulang kata sandi."
    }
  ];

  const filteredFAQs = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = Array.from(new Set(faqItems.map(item => item.category)));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Help & Support</h1>
        <p className="text-gray-600">Temukan jawaban untuk pertanyaan umum atau hubungi tim support kami.</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari pertanyaan atau topik..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* FAQ Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
          
          {categories.map(category => (
            <div key={category} className="mb-8">
              <h3 className="text-lg font-semibold text-purple-600 mb-4">{category}</h3>
              <div className="space-y-4">
                {filteredFAQs
                  .filter(item => item.category === category)
                  .map((item, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedItem(expandedItem === index ? null : index)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                      >
                        <span className="font-medium text-gray-900">{item.question}</span>
                        {expandedItem === index ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                      {expandedItem === index && (
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                          <p className="text-gray-600">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Support Section */}
        <div className="lg:col-span-1">
          <div className="bg-purple-50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Hubungi Kami</h2>
            <p className="text-gray-600 mb-6">
              Tidak menemukan jawaban yang Anda cari? Tim support kami siap membantu Anda.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-700">
                <Mail className="w-5 h-5 text-purple-600" />
                <a href="mailto:support@photoproductai.com" className="hover:text-purple-600">
                  support@photoproductai.com
                </a>
              </div>
              
              <div className="flex items-center gap-3 text-gray-700">
                <Phone className="w-5 h-5 text-purple-600" />
                <a href="tel:+6281234567890" className="hover:text-purple-600">
                  +62 812-3456-7890
                </a>
              </div>

              <div className="flex items-center gap-3 text-gray-700">
                <MessageCircle className="w-5 h-5 text-purple-600" />
                <span>Live chat tersedia</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-purple-100">
              <h3 className="font-medium text-gray-900 mb-2">Jam Operasional</h3>
              <p className="text-gray-600">
                Senin - Jumat: 09:00 - 18:00 WIB<br />
                Sabtu: 09:00 - 15:00 WIB
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}