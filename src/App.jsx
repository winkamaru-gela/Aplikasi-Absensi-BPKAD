import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronLeft, List } from 'lucide-react';

// --- CUSTOM HOOK (LOGIC) ---
import { useAppData } from './hooks/useAppData';
import { DEFAULT_LOGO_URL } from './utils/helpers';

// --- COMPONENTS ---
import LoginPage from './components/auth/LoginPage';
import SidebarContent from './components/layout/SidebarContent';

// === KOMPONEN ADMIN ===
import AdminDashboard from './components/admin/AdminDashboard';
import AdminInputAbsensi from './components/admin/AdminInputAbsensi';
import AdminLaporanHarian from './components/admin/AdminLaporanHarian';
import AdminRekapanBulanan from './components/admin/AdminRekapanBulanan';
import AdminTerimaAbsensi from './components/admin/AdminTerimaAbsensi';
import AdminDataPegawai from './components/admin/AdminDataPegawai';
import AdminSettings from './components/admin/AdminSettings';
import AdminCetakAbsensiManual from './components/admin/AdminCetakAbsensiManual';
import AdminManajemenSurat from './components/admin/AdminManajemenSurat';
import AdminRekapanTahunan from './components/admin/AdminRekapanTahunan';

// === KOMPONEN USER ===
import UserAbsensi from './components/user/UserAbsensi';
import UserLaporanStatus from './components/user/UserLaporanStatus';
import UserRekapan from './components/user/UserRekapan';

export default function App() {
  const { 
    appUser, 
    employees, 
    attendance, 
    settings, 
    holidays, 
    loading, 
    handleAppLogin, 
    handleAppLogout 
  } = useAppData();

  const [activeTab, setActiveTab] = useState('admin_dashboard'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  useEffect(() => {
     setActiveTab('admin_dashboard');
  }, [appUser]);

  const onLogin = (u, p) => {
      const success = handleAppLogin(u, p);
      if(!success) alert('Username atau password salah!');
  };

  const onLogout = () => {
      handleAppLogout();
      setIsMobileMenuOpen(false);
  };

  if (loading) return (
    <div className="flex flex-col h-screen items-center justify-center bg-slate-100">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 font-bold text-slate-500">Menghubungkan ke Server...</p>
    </div>
  );

  if (!appUser) return <LoginPage onLogin={onLogin} settings={settings} />;

  const isManagement = ['admin', 'operator', 'pengelola'].includes(appUser.role);
  const pendingCount = attendance.filter(l => l.statusApproval === 'pending').length;
  const isLandscape = activeTab === 'cetak_manual' || activeTab === 'manajemen_surat' || activeTab === 'rekapan_tahunan';

  const getHeaderTitle = () => {
    switch(activeTab) {
        case 'admin_dashboard': return 'Dashboard';
        case 'input_absensi': return 'Input Absensi';
        case 'laporan_harian': return 'Laporan Harian';
        case 'laporan_bulanan': return 'Rekapan Bulanan';
        case 'rekapan_tahunan': return 'Rekapan Tahunan';
        case 'cetak_manual': return 'Cetak Manual';
        case 'manajemen_surat': return 'Aplikasi Surat';
        case 'terima_absensi': return 'Verifikasi Absensi';
        case 'data_pegawai': return 'Data Pegawai';
        case 'settings': return 'Pengaturan';
        case 'user_absensi': return 'Absensi Mandiri';
        case 'user_laporan_status': return 'Status Absensi';
        case 'user_rekapan': return 'Rekapan Bulanan';
        case 'user_laporan_harian': return 'Laporan Harian';
        default: return 'Aplikasi Absensi';
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col md:flex-row print:bg-white print:block print:h-auto text-slate-800 overflow-hidden font-sans">
      
      {/* --- BACKDROP MOBILE --- */}
      {isMobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-[60] md:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* --- SIDEBAR --- */}
      <div id="sidebar-container" className={`
          fixed md:relative inset-y-0 left-0 z-[70] 
          w-64 bg-slate-900 text-white shadow-xl transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
          ${isDesktopSidebarOpen ? 'md:translate-x-0' : 'md:-translate-x-full md:w-0'}
          flex flex-col h-full print:hidden
      `}>
         <SidebarContent 
            user={appUser} 
            activeTab={activeTab} 
            setActiveTab={(tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); }} 
            onLogout={onLogout} 
            settings={settings} 
            pendingCount={pendingCount}
            isDesktopSidebarOpen={isDesktopSidebarOpen}
            setIsDesktopSidebarOpen={setIsDesktopSidebarOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
         />
      </div>
      
      {/* --- MAIN CONTENT WRAPPER --- */}
      <main id="main-content" className="flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-300 w-full">
        
        {/* HEADER (Sticky Top) */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 md:px-6 flex-shrink-0 print:hidden z-10 sticky top-0">
            <div className="flex items-center gap-3">
                {/* Tombol Toggle Mobile */}
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                    className="md:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                >
                    <List size={24}/>
                </button>

                {/* Tombol Toggle Desktop */}
                <button 
                    onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)} 
                    className="hidden md:block p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                    title={isDesktopSidebarOpen ? "Tutup Sidebar" : "Buka Sidebar"}
                >
                    <List size={24}/>
                </button>

                {/* Judul Halaman (Sembunyikan di Mobile Kecil jika sempit, atau gunakan truncate) */}
                <h2 className="font-bold text-lg text-slate-800 line-clamp-1 md:block hidden">{getHeaderTitle()}</h2>
                {/* Judul Mobile (Lebih kecil) */}
                <h2 className="font-bold text-md text-slate-800 md:hidden">{getHeaderTitle()}</h2>
            </div>
            
            {/* INFORMASI USER (Tampil di Mobile & Desktop) */}
            <div className="flex items-center gap-3">
                {/* Text Container: Tampil block (bukan hidden) */}
                <div className="text-right">
                    <p className="text-sm font-bold text-slate-700 leading-tight">{appUser.nama}</p>
                    
                    {/* Logika Subtitle: NIP (User) atau Role (Admin) */}
                    <p className="text-[10px] md:text-xs text-slate-500 uppercase">
                        {appUser.role === 'user' 
                            ? `NIP. ${appUser.nip || '-'}` 
                            : appUser.role
                        }
                    </p>
                </div>
                
                {/* Avatar: Sedikit diperkecil di mobile jika perlu, tapi w-10 biasanya oke */}
                <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm border border-blue-200 flex-shrink-0">
                    {appUser.nama.charAt(0)}
                </div>
            </div>
        </header>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible bg-gray-50">
            <style>{`
            @media print {
                @page { size: ${isLandscape ? 'landscape' : 'portrait'}; margin: 10mm; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; height: auto !important; overflow: visible !important; }
                #sidebar-container, header, button { display: none !important; }
                #main-content { width: 100% !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; display: block !important; }
            }
            `}</style>

            {isManagement ? (
            <>
                {activeTab === 'admin_dashboard' && <AdminDashboard employees={employees} attendance={attendance} settings={settings} />}
                {activeTab === 'input_absensi' && <AdminInputAbsensi employees={employees} attendance={attendance} />}
                {activeTab === 'laporan_harian' && <AdminLaporanHarian employees={employees} attendance={attendance} settings={settings} holidays={holidays} />}
                {activeTab === 'laporan_bulanan' && <AdminRekapanBulanan employees={employees} attendance={attendance} settings={settings} user={appUser} />}
                {activeTab === 'rekapan_tahunan' && <AdminRekapanTahunan employees={employees} attendance={attendance} settings={settings} />}
                {activeTab === 'cetak_manual' && <AdminCetakAbsensiManual employees={employees} settings={settings} holidays={holidays} />} 
                {activeTab === 'manajemen_surat' && <AdminManajemenSurat employees={employees} settings={settings} user={appUser} />}
                {activeTab === 'terima_absensi' && <AdminTerimaAbsensi employees={employees} attendance={attendance} />}
                {activeTab === 'data_pegawai' && <AdminDataPegawai employees={employees} currentUser={appUser} />}
                {activeTab === 'settings' && <AdminSettings settings={settings} holidays={holidays} employees={employees} user={appUser} />}
            </>
            ) : (
            <>
                {activeTab === 'admin_dashboard' && <AdminDashboard employees={employees} attendance={attendance} settings={settings} />}
                {activeTab === 'user_absensi' && <UserAbsensi user={appUser} attendance={attendance} holidays={holidays} />}
                {activeTab === 'user_laporan_status' && <UserLaporanStatus user={appUser} attendance={attendance} />}
                
                {activeTab === 'user_laporan_harian' && <AdminLaporanHarian employees={employees} attendance={attendance} settings={settings} isUserView={true} holidays={holidays} />}
                {activeTab === 'user_rekapan' && <UserRekapan user={appUser} attendance={attendance} settings={settings} employees={employees} />}
                {activeTab === 'rekapan_tahunan' && <AdminRekapanTahunan employees={employees} attendance={attendance} settings={settings} user={appUser} />}
                
                {activeTab === 'cetak_manual' && <AdminCetakAbsensiManual employees={employees} settings={settings} holidays={holidays} />}
            </>
            )}
        </div>
      </main>
    </div>
  );
}