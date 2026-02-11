import React, { useState } from 'react';
import { Printer } from 'lucide-react';
import { getTodayString, getWeekNumber, formatDateIndo, DEFAULT_LOGO_URL } from '../../utils/helpers';

export default function UserRekapan({ user, attendance, settings }) {
   const [viewMode, setViewMode] = useState('bulanan');
   const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
   const [week, setWeek] = useState(getTodayString());

   const filteredLogs = attendance.filter(l => {
      const isUser = l.userId === user.id && l.statusApproval === 'approved';
      if(!isUser) return false;
      if(viewMode === 'bulanan') return l.date.startsWith(month);
      else {
         const logWeek = getWeekNumber(new Date(l.date));
         const selectedWeek = getWeekNumber(new Date(week));
         return logWeek === selectedWeek && l.date.substring(0,4) === week.substring(0,4);
      }
   });

   const counts = {
      Hadir: filteredLogs.filter(l => l.status === 'Hadir').length,
      Sakit: filteredLogs.filter(l => l.status === 'Sakit').length,
      Izin: filteredLogs.filter(l => l.status === 'Izin').length,
      Cuti: filteredLogs.filter(l => l.status === 'Cuti').length,
      DL: filteredLogs.filter(l => l.status === 'Dinas Luar').length,
   };

   const rangeText = viewMode === 'bulanan' 
      ? new Date(month+'-01').toLocaleDateString('id-ID', {month:'long', year:'numeric'})
      : `Minggu ke-${getWeekNumber(new Date(week))} (${new Date(week).getFullYear()})`;

   return (
      <div className="space-y-6">
         <div className="bg-white p-4 rounded shadow print:hidden flex flex-wrap gap-4 items-end justify-between">
            <div className="flex gap-4">
               <div>
                  <label className="block text-xs font-bold mb-1">Tipe Rekapan</label>
                  <select className="border p-2 rounded w-32" value={viewMode} onChange={e=>setViewMode(e.target.value)}>
                     <option value="bulanan">Bulanan</option>
                     <option value="mingguan">Mingguan</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-bold mb-1">{viewMode === 'bulanan' ? 'Pilih Bulan' : 'Pilih Tanggal (Dalam Minggu)'}</label>
                  {viewMode === 'bulanan' ? (
                     <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="border p-2 rounded"/>
                  ) : (
                     <input type="date" value={week} onChange={e=>setWeek(e.target.value)} className="border p-2 rounded"/>
                  )}
               </div>
            </div>
            <button onClick={()=>window.print()} className="bg-slate-800 text-white px-4 py-2 rounded flex items-center"><Printer size={16} className="mr-2"/> Cetak</button>
         </div>

         <div className="bg-white p-10 rounded shadow print:shadow-none print:w-full">
            <div className="flex border-b-4 border-double border-black pb-4 mb-6 items-center justify-center relative">
               <img src={settings.logoUrl || DEFAULT_LOGO_URL} className="h-16 absolute left-0" alt="logo"/>
               <div className="text-center px-16">
                  <h3 className="text-xl font-bold uppercase">{settings.parentAgency}</h3>
                  <h1 className="text-xl font-bold uppercase">{settings.opdName}</h1>
                  <p className="text-xs italic">{settings.address}</p>
               </div>
            </div>
            <div className="text-center pb-4 mb-6">
               <h3 className="text-xl font-bold underline">REKAPAN ABSENSI PEGAWAI</h3>
               <p className="uppercase font-medium">PERIODE: {rangeText}</p>
            </div>
            <div className="mb-6">
               <table className="w-full">
                  <tbody>
                     <tr><td className="w-32 font-bold">Nama</td><td>: {user.nama}</td></tr>
                     <tr><td className="font-bold">Jabatan</td><td>: {user.jabatan}</td></tr>
                     <tr><td className="font-bold">No</td><td>: {user.no || '-'}</td></tr>
                  </tbody>
               </table>
            </div>
            <div className="grid grid-cols-5 gap-2 mb-6 text-center text-sm">
               {Object.entries(counts).map(([k,v]) => (
                  <div key={k} className="bg-slate-50 border p-2 rounded">
                     <span className="block font-bold text-lg">{v}</span> {k}
                  </div>
               ))}
            </div>
            <table className="w-full border-collapse border border-black text-sm">
               <thead className="bg-slate-100">
                  <tr>
                     <th className="border border-black p-2">Tanggal</th>
                     <th className="border border-black p-2">Sesi</th>
                     <th className="border border-black p-2">Status</th>
                  </tr>
               </thead>
               <tbody>
                  {filteredLogs.length > 0 ? (
                     filteredLogs.sort((a,b) => a.date.localeCompare(b.date)).map(l => (
                        <tr key={l.id}>
                           <td className="border border-black p-2 text-center">{formatDateIndo(l.date)}</td>
                           <td className="border border-black p-2 text-center">{l.session}</td>
                           <td className="border border-black p-2 text-center">{l.status}</td>
                        </tr>
                     ))
                  ) : (
                     <tr><td colSpan="3" className="border border-black p-4 text-center italic">Tidak ada data absensi pada periode ini.</td></tr>
                  )}
               </tbody>
            </table>
            <div className="mt-16 flex justify-end text-center">
               <div className="min-w-[200px] w-auto px-4">
                  <p>{settings.titimangsa || 'Bobong'}, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month:'long', year:'numeric'})}</p>
                  <p className="mb-20">Pegawai Yang Bersangkutan</p>
                  <p className="font-bold underline whitespace-nowrap">{user.nama}</p>
               </div>
            </div>
         </div>
      </div>
   );
}