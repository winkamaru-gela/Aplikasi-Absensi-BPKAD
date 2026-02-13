import React from 'react';
import { FlaskConical, Construction, ArrowLeft } from 'lucide-react';

export default function AdminManajemenSurat() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl animate-in fade-in zoom-in duration-500">
      
      {/* Icon Visual */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-blue-200 rounded-full blur-xl opacity-50"></div>
        <div className="relative bg-white p-6 rounded-full shadow-lg border border-slate-100">
           <FlaskConical size={64} className="text-blue-600" />
        </div>
        <div className="absolute -bottom-2 -right-2 bg-yellow-400 p-2 rounded-full border-4 border-white shadow-sm">
           <Construction size={24} className="text-yellow-900" />
        </div>
      </div>

      {/* Judul & Pesan */}
      <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3 text-center">
        Masih dalam Tahap Riset dan Analisis Teknis
      </h2>
      
      <p className="text-slate-500 text-center max-w-lg mb-8 leading-relaxed">
        Modul <strong>Manajemen Surat Dinas atau Aplikasi Surat </strong> saat ini sedang dalam tahap riset dan analisis oleh pengembang untuk memastikan fungsi dan fitur dapat diterapkan ke dalam aplikasi absensi saat ini. Semoga fitur ini dapat direalisasikan ke dalam aplikasi ini dan dapat menjalankan sistem manajemen absensi maupun manajemen surat </p>

      {/* Badge Status */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="px-6 py-3 bg-blue-50 text-blue-700 rounded-lg font-bold text-sm border border-blue-200 flex items-center shadow-sm">
           <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-pulse"></span>
           Status: Research & Development (R&D)
        </div>
      </div>

      <p className="mt-12 text-xs text-slate-400 uppercase tracking-widest font-semibold">
        Darwin Kamarudin (Dev) © {new Date().getFullYear()}
      </p>
    </div>
  );
}