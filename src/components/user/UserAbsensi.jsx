import React, { useState, useEffect } from 'react';
import { AlertTriangle, Lock, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { addDoc, serverTimestamp } from 'firebase/firestore'; 
import { getCollectionPath } from '../../lib/firebase';
import { getTodayString, formatDateIndo, fetchServerTime, adjustTimezone } from '../../utils/helpers';

export default function UserAbsensi({ user, attendance, holidays, settings }) {
  // State untuk data form
  const [form, setForm] = useState({ date: '', session: '', status: 'Hadir' });
  
  // State Logika & UI
  const [done, setDone] = useState(false);
  const [canAbsen, setCanAbsen] = useState(false);
  const [blockMessage, setBlockMessage] = useState('');
  const [loadingTime, setLoadingTime] = useState(true); 
  const [serverTime, setServerTime] = useState(null);

  // 1. Fetch Waktu Server saat komponen dimuat
  useEffect(() => {
    const initTime = async () => {
       setLoadingTime(true);
       
       // A. Ambil waktu server murni
       const rawTime = await fetchServerTime();
       
       // B. Sesuaikan dengan Zona Waktu dari Settings (WIB/WITA/WIT/Auto)
       const adjustedTime = adjustTimezone(rawTime, settings?.zonaWaktu);
       
       setServerTime(adjustedTime);
       
       const h = adjustedTime.getHours();
       // Logika Sesi: Di atas jam 12 siang dianggap persiapan sesi Sore
       const sess = h >= 12 ? 'Sore' : 'Pagi';
       
       setForm(prev => ({ 
           ...prev, 
           date: getTodayString(adjustedTime), 
           session: sess 
       }));
       setLoadingTime(false);
    };
    initTime();
  }, [settings]);

  // 2. Validasi Logika Absensi
  useEffect(() => {
    if (!serverTime || !form.date) return;

    const todayDate = new Date(form.date);
    const dayNum = todayDate.getDay();
    // 0=Minggu, 6=Sabtu
    const isWeekend = dayNum === 0 || dayNum === 6; 
    const holiday = holidays.find(h => h.date === form.date);

    // Cek 1: Hari Libur
    if (isWeekend) {
        setCanAbsen(false);
        setBlockMessage("Absensi ditutup. Hari ini adalah hari libur akhir pekan (Sabtu/Minggu).");
        return;
    }

    // Cek 2: Libur Nasional
    if (holiday) {
        setCanAbsen(false);
        setBlockMessage(`Absensi ditutup. Hari ini adalah hari libur nasional / cuti bersama: ${holiday.desc}`);
        return;
    }

    setBlockMessage(''); 
    
    // Cek 3: Validasi Jam Menggunakan SETTINGS
    const checkTimeDynamic = () => {
        // Gunakan serverTime yang SUDAH disesuaikan zonanya
        const timeStr = serverTime.toTimeString().slice(0, 5); // "HH:mm"
        
        const startPagi = settings?.jamMasukAwal || "06:00";
        const endPagi = settings?.batasAbsenPagi || "10:00";
        const startSore = settings?.jamPulangAwal || "16:00";
        const endSore = settings?.batasAbsenSore || "18:00";

        if (form.session === 'Pagi') {
            return timeStr >= startPagi && timeStr <= endPagi;
        } else if (form.session === 'Sore') {
            return timeStr >= startSore && timeStr <= endSore;
        }
        return false;
    };

    setCanAbsen(checkTimeDynamic());

  }, [form.session, form.date, holidays, serverTime, settings]);

  // 3. Cek apakah user sudah absen hari ini
  useEffect(() => {
     if (!form.date || !form.session) return;
     const exists = attendance.find(l => l.userId === user.id && l.date === form.date && l.session === form.session);
     setDone(!!exists);
  }, [form.date, form.session, attendance, user.id]);

  const submit = async (e) => {
     e.preventDefault();
     if (!confirm('Apakah data absensi sudah benar? Data tidak bisa diubah setelah dikirim.')) return;

     try {
        await addDoc(getCollectionPath('attendance'), {
            ...form, 
            userId: user.id, 
            userName: user.nama, 
            statusApproval: 'pending', 
            timestamp: new Date().toISOString(), 
            serverTimestamp: serverTimestamp()   
        });
        alert('Absensi berhasil dikirim.');
     } catch (error) {
        console.error(error);
        alert('Gagal mengirim absensi. Periksa koneksi internet.');
     }
  };

  const handleRefreshTime = async () => {
     const rawTime = await fetchServerTime();
     const adjustedTime = adjustTimezone(rawTime, settings?.zonaWaktu);
     setServerTime(adjustedTime);
     alert(`Waktu server diperbarui: ${adjustedTime.toLocaleTimeString()}`);
  };

  if (loadingTime) return (
      <div className="p-10 text-center">
          <RefreshCw className="animate-spin mx-auto text-blue-600 mb-2"/>
          <p className="text-slate-500">Sinkronisasi Waktu Server...</p>
      </div>
  );

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded shadow-lg mt-10 animate-in fade-in zoom-in duration-300">
       <div className="text-center mb-6">
           <h2 className="text-2xl font-bold text-slate-800">Absensi Mandiri</h2>
           <div className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1 cursor-pointer" onClick={handleRefreshTime} title="Klik untuk refresh waktu">
               <Clock size={12}/> 
               Waktu Server ({settings?.zonaWaktu || 'Auto'}): {serverTime?.toLocaleTimeString('id-ID')}
           </div>
       </div>
       
       {/* Block Messages (Libur/Weekend) */}
       {blockMessage && !done && (
         <div className="mb-4 bg-red-100 text-red-700 p-4 rounded text-center border border-red-200 shadow-sm">
            <AlertTriangle className="mx-auto mb-2" size={32} />
            <p className="font-bold text-sm">{blockMessage}</p>
         </div>
       )}

       {/* Warning Jam Belum Buka (Dynamic Message) */}
       {!canAbsen && !done && !blockMessage && (
         <div className="mb-4 bg-yellow-100 text-yellow-800 p-3 rounded text-sm flex items-center border border-yellow-200">
           <Lock size={16} className="mr-2 flex-shrink-0"/>
           <div>
               <span className="font-bold">Absensi {form.session} Ditutup.</span>
               <br/>
               <span className="text-xs">
                   Pagi: {settings?.jamMasukAwal || '06:00'}-{settings?.batasAbsenPagi || '10:00'} | 
                   Sore: {settings?.jamPulangAwal || '16:00'}-{settings?.batasAbsenSore || '18:00'}
               </span>
           </div>
         </div>
       )}

       {done ? (
          <div className="text-center p-6 bg-green-50 border border-green-200 rounded">
             <CheckCircle size={48} className="text-green-600 mx-auto mb-2"/>
             <p className="font-bold text-green-800">Anda sudah melakukan absensi.</p>
             <p className="text-sm">Sesi {form.session}, {formatDateIndo(form.date)}</p>
          </div>
       ) : (
          <form onSubmit={submit} className="space-y-4">
             <div>
                <label className="font-bold block mb-1 text-sm text-slate-600">Tanggal</label>
                <input type="text" disabled className="w-full p-2 bg-slate-100 border rounded text-slate-500 font-medium" value={formatDateIndo(form.date) || '-'}/>
             </div>
             
             <div>
                <label className="font-bold block mb-1 text-sm text-slate-600">Sesi (Otomatis)</label>
                <input disabled className="w-full p-2 bg-slate-100 border rounded text-slate-500 font-medium" value={form.session}/>
             </div>

             {!blockMessage && (
                 <div>
                    <label className="font-bold block mb-1 text-sm text-slate-600">Status Kehadiran</label>
                    <select className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={form.status} onChange={e=>setForm({...form, status: e.target.value})}>
                        <option value="Hadir">Hadir</option>
                        <option value="Sakit">Sakit</option>
                        <option value="Izin">Izin</option>
                        <option value="Cuti">Cuti</option>
                        <option value="Dinas Luar">Dinas Luar / Perjalanan Dinas</option>
                    </select>
                 </div>
             )}

             <button disabled={!canAbsen} className={`w-full text-white font-bold py-3 rounded shadow transition-all
                ${canAbsen ? 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.02]' : 'bg-gray-400 cursor-not-allowed'}`}>
                {canAbsen ? 'KIRIM ABSENSI SEKARANG' : 'WAKTU DITUTUP'}
             </button>
          </form>
       )}
    </div>
  );
}