import React from 'react';
import { 
  LayoutDashboard, UserCheck, CheckCircle, FileText, Calendar, 
  Clipboard, Users, Settings, ChevronDown, Clock, LogOut 
} from 'lucide-react';
import { DEFAULT_LOGO_URL } from '../../utils/helpers';

export default function SidebarContent({ user, activeTab, setActiveTab, onLogout, settings, pendingCount }) {
  const btnClass = (id) => `w-full text-left p-3 mb-1 rounded flex items-center justify-between transition-colors font-medium text-sm
    ${activeTab === id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`;

  const LogoImg = settings.logoUrl || DEFAULT_LOGO_URL;
  const isManagement = ['admin', 'operator', 'pengelola'].includes(user.role);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* HEADER SIDEBAR */}
      <div className="p-5 bg-slate-800 border-b border-slate-700 flex items-center gap-3 flex-shrink-0">
        <img src={LogoImg} className="w-10 h-10 object-contain bg-white rounded-full p-0.5" alt="Logo"/>
        <div className="overflow-hidden">
           <h1 className="font-bold text-lg leading-tight truncate">{settings.opdShort}</h1>
           <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-blue-400 uppercase tracking-wide truncate block">{user.role}</span>
        </div>
      </div>
      
      {/* MENU LIST (SCROLLABLE) */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {isManagement ? (
          <>
            <button onClick={()=>setActiveTab('admin_dashboard')} className={btnClass('admin_dashboard')}>
               <div className="flex items-center"><LayoutDashboard size={16} className="mr-3"/> Dashboard</div>
            </button>
            
            <div className="text-xs font-bold text-slate-500 uppercase mt-4 mb-2 px-2 flex items-center"><ChevronDown size={12} className="mr-1"/>Absensi</div>
            <button onClick={()=>setActiveTab('input_absensi')} className={btnClass('input_absensi')}>
               <div className="flex items-center"><UserCheck size={16} className="mr-3"/> Input Absensi</div>
            </button>
            
            <button onClick={()=>setActiveTab('terima_absensi')} className={btnClass('terima_absensi')}>
               <div className="flex items-center"><CheckCircle size={16} className="mr-3"/> Terima Absensi</div>
               {pendingCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                     {pendingCount}
                  </span>
               )}
            </button>
            
            <div className="text-xs font-bold text-slate-500 uppercase mt-4 mb-2 px-2 flex items-center"><ChevronDown size={12} className="mr-1"/>Laporan</div>
            <button onClick={()=>setActiveTab('laporan_harian')} className={btnClass('laporan_harian')}>
               <div className="flex items-center"><FileText size={16} className="mr-3"/> Laporan Harian</div>
            </button>
            <button onClick={()=>setActiveTab('laporan_bulanan')} className={btnClass('laporan_bulanan')}>
               <div className="flex items-center"><Calendar size={16} className="mr-3"/> Rekapan Bulanan</div>
            </button>
            <button onClick={()=>setActiveTab('cetak_manual')} className={btnClass('cetak_manual')}>
               <div className="flex items-center"><Clipboard size={16} className="mr-3"/> Cetak Absensi Manual</div>
            </button>
            
            <div className="text-xs font-bold text-slate-500 uppercase mt-4 mb-2 px-2 flex items-center"><ChevronDown size={12} className="mr-1"/>Manajemen</div>
            
            {/* === MENU SURAT DINAS (BARU) === */}
            <button onClick={()=>setActiveTab('manajemen_surat')} className={btnClass('manajemen_surat')}>
               <div className="flex items-center"><FileText size={16} className="mr-3"/> Surat Dinas</div>
            </button>
            {/* ============================= */}

            <button onClick={()=>setActiveTab('data_pegawai')} className={btnClass('data_pegawai')}>
               <div className="flex items-center"><Users size={16} className="mr-3"/> Data Pegawai</div>
            </button>
            <button onClick={()=>setActiveTab('settings')} className={btnClass('settings')}>
               <div className="flex items-center"><Settings size={16} className="mr-3"/> Pengaturan</div>
            </button>
          </>
        ) : (
          <>
             <button onClick={()=>setActiveTab('admin_dashboard')} className={btnClass('admin_dashboard')}>
               <div className="flex items-center"><LayoutDashboard size={16} className="mr-3"/> Dashboard</div>
             </button>
             
             <div className="text-xs font-bold text-slate-500 uppercase mt-2 mb-2 px-2 flex items-center"><ChevronDown size={12} className="mr-1"/>Menu Pegawai</div>
             <button onClick={()=>setActiveTab('user_absensi')} className={btnClass('user_absensi')}>
               <div className="flex items-center"><UserCheck size={16} className="mr-3"/> Absensi Mandiri</div>
             </button>
             <button onClick={()=>setActiveTab('user_laporan_status')} className={btnClass('user_laporan_status')}>
               <div className="flex items-center"><Clock size={16} className="mr-3"/> Status Absensi</div>
             </button>
             <button onClick={()=>setActiveTab('user_laporan_harian')} className={btnClass('user_laporan_harian')}>
               <div className="flex items-center"><FileText size={16} className="mr-3"/> Laporan Harian</div>
             </button>
             <button onClick={()=>setActiveTab('user_rekapan')} className={btnClass('user_rekapan')}>
               <div className="flex items-center"><Calendar size={16} className="mr-3"/> Rekapan Saya</div>
             </button>
             <button onClick={()=>setActiveTab('cetak_manual')} className={btnClass('cetak_manual')}>
               <div className="flex items-center"><Clipboard size={16} className="mr-3"/> Cetak Absensi Manual</div>
             </button>
          </>
        )}
      </div>

      {/* FOOTER SIDEBAR (LOGOUT) */}
      <div className="p-4 border-t border-slate-700 bg-slate-800 flex-shrink-0">
         <div className="mb-4">
            <p className="text-sm font-semibold truncate">{user.nama}</p>
            <p className="text-xs text-slate-400 truncate">{user.jabatan}</p>
         </div>
         <button onClick={onLogout} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded flex items-center justify-center text-sm transition-colors">
            <LogOut size={16} className="mr-2"/> Log Out
         </button>
      </div>
    </div>
  );
}