import React, { useState, useEffect } from 'react';
import { UserCheck, Search, Save } from 'lucide-react';
import { writeBatch, doc } from 'firebase/firestore';
import { db, getCollectionPath } from '../../lib/firebase';
import { getTodayString } from '../../utils/helpers';

export default function AdminInputAbsensi({ employees, attendance }) {
  const [date, setDate] = useState(getTodayString());
  const [session, setSession] = useState('Pagi');
  const [inputs, setInputs] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const pegawaiList = employees.filter(e => e.role === 'user');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 12) setSession('Sore');
  }, []);

  useEffect(() => {
    const map = {};
    attendance.forEach(l => {
      if (l.date === date && l.session === session) {
        map[l.userId] = l.status;
      }
    });
    setInputs(map);
  }, [date, session, attendance]);

  const handleSave = async () => {
    const batch = writeBatch(db);
    let count = 0;

    for (const emp of pegawaiList) {
       const status = inputs[emp.id];
       const existingLog = attendance.find(l => l.date === date && l.session === session && l.userId === emp.id);
       
       if (status) {
         const logData = {
           date, session, userId: emp.id, userName: emp.nama, status,
           statusApproval: 'approved', timestamp: new Date().toISOString()
         };
         if (existingLog) {
            batch.update(doc(getCollectionPath('attendance'), existingLog.id), logData);
         } else {
            batch.set(doc(getCollectionPath('attendance'), `${date}_${session}_${emp.id}`), logData);
         }
         count++;
       } else {
         if (existingLog) {
           batch.delete(doc(getCollectionPath('attendance'), existingLog.id));
         }
       }
    }
    await batch.commit();
    alert('Data absensi berhasil disimpan!');
  };

  const statusOptions = ['Hadir','Izin','Sakit','Cuti','Dinas Luar'];

  const filteredPegawaiList = pegawaiList
    .filter(emp =>
      emp.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
      emp.jabatan.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.nama.localeCompare(b.nama));

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4 flex items-center text-slate-800"><UserCheck className="mr-2"/> Input Absensi Pegawai</h2>
      
      <div className="flex flex-wrap gap-4 mb-6 bg-slate-100 p-4 rounded-lg items-end sticky top-0 z-10 shadow-sm">
        <div>
          <label className="block text-xs font-bold uppercase mb-1">Tanggal</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="border p-2 rounded w-40"/>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase mb-1">Sesi</label>
          <select value={session} onChange={e=>setSession(e.target.value)} className="border p-2 rounded w-40">
            <option>Pagi</option>
            <option>Sore</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
             <label className="block text-xs font-bold uppercase mb-1">Cari Pegawai</label>
             <div className="relative">
                <Search className="absolute left-2 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Ketik nama pegawai..."
                  className="border p-2 pl-8 rounded w-full"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
        </div>
        <div className="flex ml-auto gap-2">
           <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 flex items-center font-bold text-sm">
             <Save size={16} className="mr-2"/> Simpan Absensi
           </button>
        </div>
      </div>

      <div className="overflow-x-auto border-2 border-slate-300 rounded-lg">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-200 text-slate-700 uppercase text-xs">
             <tr>
               <th className="p-3 text-left border border-slate-300">Nama Pegawai / Jabatan</th>
               <th className="p-3 text-center border border-slate-300">Status Kehadiran</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
             {filteredPegawaiList.map(emp => (
               <tr key={emp.id} className="hover:bg-slate-50">
                 <td className="p-3 border border-slate-300 bg-slate-50 font-medium">
                   <div className="font-bold text-slate-800">{emp.nama}</div>
                   <div className="text-xs text-slate-500">{emp.jabatan}</div>
                 </td>
                 <td className="p-3 border border-slate-300">
                   <div className="flex justify-center gap-4 flex-wrap">
                     {statusOptions.map(st => (
                       <label key={st} className="flex items-center cursor-pointer space-x-2">
                         <div className="relative flex items-center">
                           <input 
                             type="radio" 
                             name={`status-${emp.id}`}
                             checked={inputs[emp.id] === st}
                             onChange={()=>setInputs({...inputs, [emp.id]: st})}
                             className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                           />
                         </div>
                         <span className={`text-xs font-bold ${inputs[emp.id] === st ? 'text-blue-700' : 'text-slate-600'}`}>
                           {st.toUpperCase()}
                         </span>
                       </label>
                     ))}
                     
                     <label className="flex items-center cursor-pointer space-x-2 border-l pl-4 ml-2 border-slate-300">
                        <div className="relative flex items-center">
                           <input 
                             type="radio" 
                             name={`status-${emp.id}`}
                             checked={!inputs[emp.id]}
                             onChange={()=>{
                               const next = {...inputs};
                               delete next[emp.id];
                               setInputs(next);
                             }}
                             className="w-5 h-5 text-red-600 border-gray-300 focus:ring-red-500 cursor-pointer accent-red-600"
                           />
                        </div>
                        <span className={`text-xs font-bold ${!inputs[emp.id] ? 'text-red-600' : 'text-slate-400'}`}>
                           ALPA
                        </span>
                     </label>
                   </div>
                 </td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
         <button onClick={handleSave} className="bg-blue-600 text-white px-8 py-3 rounded shadow-lg hover:bg-blue-700 flex items-center font-bold text-base transition-transform transform hover:scale-105">
             <Save size={20} className="mr-2"/> Simpan Absensi
         </button>
      </div>
    </div>
  );
}