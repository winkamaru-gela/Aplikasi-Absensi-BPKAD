import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronLeft } from 'lucide-react';
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { onSnapshot, addDoc, getDocs } from "firebase/firestore";

// --- IMPORTS STRUKTUR BARU ---
import { auth, getCollectionPath } from './lib/firebase';
import { INITIAL_SETTINGS, DEFAULT_LOGO_URL } from './utils/helpers';

// --- COMPONENTS ---
import LoginPage from './components/auth/LoginPage';
import SidebarContent from './components/layout/SidebarContent';

// === PERHATIAN: KOMPONEN ADMIN ===
import AdminDashboard from './components/admin/AdminDashboard';
import AdminInputAbsensi from './components/admin/AdminInputAbsensi';
import AdminLaporanHarian from './components/admin/AdminLaporanHarian';
import AdminRekapanBulanan from './components/admin/AdminRekapanBulanan';
import AdminTerimaAbsensi from './components/admin/AdminTerimaAbsensi';
import AdminDataPegawai from './components/admin/AdminDataPegawai';
import AdminSettings from './components/admin/AdminSettings';
import AdminCetakAbsensiManual from './components/admin/AdminCetakAbsensiManual';
import AdminManajemenSurat from './components/admin/AdminManajemenSurat'; // Pastikan Import Ini Ada

// === KOMPONEN USER ===
import UserAbsensi from './components/user/UserAbsensi';
import UserLaporanStatus from './components/user/UserLaporanStatus';
import UserRekapan from './components/user/UserRekapan';

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [appUser, setAppUser] = useState(null); 
  
  // Data States
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [holidays, setHolidays] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('admin_dashboard'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  // --- FIREBASE LISTENERS (Global Data) ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Login Error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => { if (user) setFirebaseUser(user); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    const seedAdminIfEmpty = async () => {
       try {
         const usersRef = getCollectionPath('users');
         const snapshot = await getDocs(usersRef);
         if (snapshot.empty) {
            // Logic seed admin jika diperlukan
         }
       } catch (error) { console.error(error); }
    };
    seedAdminIfEmpty();
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser) return;

    const unsubEmp = onSnapshot(getCollectionPath('users'), (snap) => {
      setEmployees(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const unsubAtt = onSnapshot(getCollectionPath('attendance'), (snap) => {
      setAttendance(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubSet = onSnapshot(getCollectionPath('settings'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (data.length > 0) setSettings(data[0]);
      else addDoc(getCollectionPath('settings'), INITIAL_SETTINGS);
    });

    const unsubHol = onSnapshot(getCollectionPath('holidays'), (snap) => {
       setHolidays(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubEmp(); unsubAtt(); unsubSet(); unsubHol(); };
  }, [firebaseUser]);

  const handleLogin = (username, password) => {
    const user = employees.find(u => u.username === username && u.password === password);
    if (user) {
      setAppUser(user);
      setActiveTab('admin_dashboard'); 
    } else {
      alert('Username atau password salah!');
    }
  };

  const handleLogout = () => {
    setAppUser(null);
    setActiveTab('admin_dashboard');
    setIsMobileMenuOpen(false);
  };

  if (loading) return (
    <div className="flex flex-col h-screen items-center justify-center bg-slate-100">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 font-bold text-slate-500">Memuat Data...</p>
    </div>
  );

  if (!appUser) return <LoginPage onLogin={handleLogin} settings={settings} />;

  const isManagement = ['admin', 'operator', 'pengelola'].includes(appUser.role);
  const pendingCount = attendance.filter(l => l.statusApproval === 'pending').length;
  // Mode Landscape otomatis aktif untuk halaman cetak tabel & cetak surat
  const isLandscape = activeTab === 'cetak_manual' || activeTab === 'manajemen_surat';

  return (
    <div className="h-screen bg-gray-50 flex flex-col md:flex-row print:bg-white print:block print:h-auto text-slate-800 overflow-hidden font-sans">
      
      {/* MOBILE HEADER */}
      <div id="mobile-header" className="md:hidden bg-blue-900 text-white p-4 flex justify-between items-center print:hidden shadow-md z-50 flex-shrink-0">
         <div className="flex items-center gap-2">
            <img src={settings.logoUrl || DEFAULT_LOGO_URL} className="w-8 h-8 object-contain bg-white rounded-full p-0.5" alt="logo"/>
            <span className="font-bold text-sm">{settings.opdShort}</span>
         </div>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
         </button>
      </div>

      {/* SIDEBAR */}
      <div id="sidebar-container" className={`
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 transition-all duration-300 ease-in-out
          ${isDesktopSidebarOpen ? 'md:w-64' : 'md:w-0 md:overflow-hidden'}
          bg-slate-900 text-white flex-shrink-0 print:hidden shadow-xl z-40 absolute md:relative w-64 h-full flex flex-col
      `}>
         <button onClick={() => setIsDesktopSidebarOpen(false)} className="hidden md:flex absolute top-4 right-[-12px] z-50 bg-slate-800 text-white p-1 rounded-full border border-slate-700 shadow-md">
            <ChevronLeft size={16} />
         </button>

         <SidebarContent 
            user={appUser} 
            activeTab={activeTab} 
            setActiveTab={(tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); }} 
            onLogout={handleLogout} 
            settings={settings} 
            pendingCount={pendingCount}
         />
      </div>
      
      {/* MAIN CONTENT */}
      <main id="main-content" className="flex-1 p-4 md:p-8 overflow-y-auto print:p-0 print:overflow-visible print:h-auto print:block relative">
        {!isDesktopSidebarOpen && (
           <button onClick={() => setIsDesktopSidebarOpen(true)} className="hidden md:flex absolute top-4 left-4 z-50 bg-slate-900 text-white p-2 rounded-lg shadow-lg items-center gap-2">
              <Menu size={20} /> <span className="text-xs font-bold">MENU</span>
           </button>
        )}
        
        <style>{`
          @media print {
            @page { size: ${isLandscape ? 'landscape' : 'portrait'}; margin: 10mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; height: auto !important; overflow: visible !important; }
            #sidebar-container, #mobile-header, button { display: none !important; }
            #main-content { width: 100% !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; display: block !important; }
          }
        `}</style>

        {/* --- LOGIKA ROUTING HALAMAN --- */}
        {isManagement ? (
          <>
            {activeTab === 'admin_dashboard' && <AdminDashboard employees={employees} attendance={attendance} settings={settings} />}
            {activeTab === 'input_absensi' && <AdminInputAbsensi employees={employees} attendance={attendance} />}
            {activeTab === 'laporan_harian' && <AdminLaporanHarian employees={employees} attendance={attendance} settings={settings} holidays={holidays} />}
            {activeTab === 'laporan_bulanan' && <AdminRekapanBulanan employees={employees} attendance={attendance} settings={settings} user={appUser} />}
            {activeTab === 'cetak_manual' && <AdminCetakAbsensiManual employees={employees} settings={settings} holidays={holidays} />} 
            
            {/* === INI BAGIAN YANG SEBELUMNYA HILANG === */}
            {activeTab === 'manajemen_surat' && <AdminManajemenSurat employees={employees} settings={settings} user={appUser} />}
            {/* ========================================= */}

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
            {activeTab === 'user_rekapan' && <UserRekapan user={appUser} attendance={attendance} settings={settings} />}
            {activeTab === 'cetak_manual' && <AdminCetakAbsensiManual employees={employees} settings={settings} holidays={holidays} />}
          </>
        )}
      </main>
    </div>
  );
}