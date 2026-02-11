import React, { useState, useEffect } from 'react';
import { AlertTriangle, Lock, CheckCircle } from 'lucide-react';
import { addDoc } from 'firebase/firestore';
import { getCollectionPath } from '../../lib/firebase';
import { getTodayString, checkAbsensiTime, formatDateIndo } from '../../utils/helpers';

export default function UserAbsensi({ user, attendance, holidays }) {
  const [form, setForm] = useState({ date: getTodayString(), session: 'Pagi', status: 'Hadir' });
  const [done, setDone] = useState(false);
  const [canAbsen, setCanAbsen] = useState(false);
  const [blockMessage, setBlockMessage] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    const sess = h >= 12 ? 'Sore' : 'Pagi';
    setForm(prev => ({ ...prev, session: sess }));
  }, []);

  useEffect(() => {
    const todayDate = new Date(form.date);
    const isWeekend = todayDate.getDay() === 0 || todayDate.getDay() === 6;
    const holiday = holidays.find(h => h.date === form.date);

    if (isWeekend) {
        setCanAbsen(false);
        setBlockMessage("Absensi ditutup. Hari ini adalah hari libur akhir pekan (Sabtu/Minggu).");
        return;
    }

    if (holiday) {
        setCanAbsen(false);
        setBlockMessage(`Absensi ditutup. Hari ini adalah hari libur nasional / cuti bersama: ${holiday.desc}`);
        return;
    }

    setBlockMessage(''); 
    const check = checkAbsensiTime(form.session);
    setCanAbsen(check);
  }, [form.session, form.date, holidays]);

  useEffect(() => {
     const exists = attendance.find(l => l.userId === user.id && l.date === form.date && l.session === form.session);
     setDone(!!exists);
  }, [form.date, form.session, attendance]);

  const submit = async (e) => {
     e.preventDefault();
     await addDoc(getCollectionPath('attendance'), {
        ...form, userId: user.id, userName: user.nama, statusApproval: 'pending', timestamp: new Date().toISOString()
     });
     alert('Absensi terkirim.');
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded shadow-lg mt-10">
       <h2 className="text-2xl font-bold text-center mb-6 text-slate-800">Absensi Mandiri</h2>
       
       {blockMessage && !done && (
         <div className="mb-4 bg-red-100 text-red-700 p-4 rounded text-center border border-red-200 shadow-sm animate-pulse">
            <AlertTriangle className="mx-auto mb-2" size={32} />
            <p className="font-bold text-sm">{blockMessage}</p>
         </div>
       )}

       {!canAbsen && !done && !blockMessage && (
         <div className="mb-4 bg-yellow-100 text-yellow-800 p-3 rounded text-sm flex items-center">
           <Lock size={16} className="mr-2"/>
           Waktu absensi {form.session} belum dibuka/sudah lewat.
           <br/>(Pagi: 07.00-09.00, Sore: 16.00-17.00)
         </div>
       )}

       {done ? (
          <div className="text-center p-6 bg-green-50 border border-green-200 rounded">
             <CheckCircle size={48} className="text-green-600 mx-auto mb-2"/>
             <p className="font-bold text-green-800">Anda sudah melakukan absensi.</p>
             <p className="text-sm">Sesi {form.session}, Tanggal {formatDateIndo(form.date)}</p>
          </div>
       ) : (
          <form onSubmit={submit} className="space-y-4">
             <div><label className="font-bold block mb-1">Tanggal</label>
             <input type="date" disabled className="w-full p-2 bg-slate-100 border rounded" value={form.date}/></div>
             <div><label className="font-bold block mb-1">Sesi (Otomatis)</label>
             <input disabled className="w-full p-2 bg-slate-100 border rounded" value={form.session}/></div>
             {!blockMessage && (
                 <div><label className="font-bold block mb-1">Status Kehadiran</label>
                 <select className="w-full p-2 border rounded" value={form.status} onChange={e=>setForm({...form, status: e.target.value})}>
                    <option value="Hadir">Hadir</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Izin">Izin</option>
                    <option value="Cuti">Cuti</option>
                    <option value="Dinas Luar">Dinas Luar / Perjalanan Dinas</option>
                 </select></div>
             )}
             <button disabled={!canAbsen} className={`w-full text-white font-bold py-3 rounded ${canAbsen ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}>
                {canAbsen ? 'KIRIM ABSENSI' : 'WAKTU DITUTUP'}
             </button>
          </form>
       )}
    </div>
  );
}