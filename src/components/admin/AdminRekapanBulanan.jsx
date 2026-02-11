import React, { useState } from 'react';
import { Printer, Trash2 } from 'lucide-react';
import { writeBatch, doc } from 'firebase/firestore';
import { db, getCollectionPath } from '../../lib/firebase';
import { DEFAULT_LOGO_URL } from '../../utils/helpers';

export default function AdminRekapanBulanan({ employees, attendance, settings, user }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const pegawaiOnly = employees
    .filter(e => e.role === 'user')
    .sort((a, b) => {
        const noA = parseInt(a.no) || 99999;
        const noB = parseInt(b.no) || 99999;
        return noA - noB;
    });

  const logs = attendance.filter(l => l.date.startsWith(month) && l.statusApproval === 'approved');

  const getStats = (userId) => {
    const userLogs = logs.filter(l => l.userId === userId);
    
    const stats = {
        Hadir: { p: 0, s: 0 },
        Sakit: { p: 0, s: 0 },
        Izin: { p: 0, s: 0 },
        Cuti: { p: 0, s: 0 },
        'Dinas Luar': { p: 0, s: 0 }
    };

    userLogs.forEach(log => {
        const status = log.status; 
        const session = log.session; 
        
        if (stats[status]) {
            if (session === 'Pagi') {
                stats[status].p += 1;
            } else if (session === 'Sore') {
                stats[status].s += 1;
            }
        }
    });

    return stats;
  };

  const handleClear = async () => {
    if (confirm(`PERINGATAN: Anda akan menghapus seluruh data absensi bulan ${month}. Lanjutkan?`)) {
       const batch = writeBatch(db);
       logs.forEach(l => {
          batch.delete(doc(getCollectionPath('attendance'), l.id));
       });
       await batch.commit();
       alert('Data bulan ini telah dikosongkan.');
    }
  };

  return (
    <div className="space-y-6">
       <div className="bg-white p-4 rounded shadow print:hidden flex items-end justify-between">
          <div>
             <label className="text-xs font-bold block mb-1">Pilih Bulan</label>
             <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="border p-2 rounded"/>
          </div>
          <div className="flex gap-2">
             {user.role === 'admin' && (
               <button onClick={handleClear} className="bg-red-600 text-white px-4 py-2 rounded flex items-center hover:bg-red-700">
                  <Trash2 size={16} className="mr-2"/> Reset/Kosongkan Data
               </button>
             )}
             <button onClick={()=>window.print()} className="bg-slate-800 text-white px-4 py-2 rounded flex items-center hover:bg-black">
                <Printer size={16} className="mr-2"/> Cetak
             </button>
          </div>
       </div>

       <div className="bg-white p-8 rounded shadow print:shadow-none print:w-full">
          <div className="flex border-b-4 border-double border-black pb-4 mb-6 items-center justify-center relative">
            <img src={settings.logoUrl || DEFAULT_LOGO_URL} className="h-20 absolute left-0" alt="logo"/>
            <div className="text-center px-20">
               <h3 className="text-xl font-bold uppercase">{settings.parentAgency}</h3>
               <h1 className="text-xl font-bold uppercase">{settings.opdName}</h1>
               <p className="text-sm italic">{settings.address}</p>
            </div>
         </div>

          <div className="text-center mb-6">
             <h2 className="text-xl font-bold uppercase underline">Rekapan Bulanan Pegawai</h2>
             <p className="font-medium">{new Date(month + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
          </div>

          <table className="w-full border-collapse border border-black text-sm">
             <thead>
                <tr className="bg-slate-100 print:bg-transparent">
                   <th className="border border-black p-1 align-middle w-10" rowSpan="2">No</th>
                   <th className="border border-black p-1 text-left align-middle w-1 whitespace-nowrap" rowSpan="2">Jabatan / Nama / NIP</th>
                   
                   <th className="border border-black p-1 text-center" colSpan="2">Hadir</th>
                   <th className="border border-black p-1 text-center" colSpan="2">Sakit</th>
                   <th className="border border-black p-1 text-center" colSpan="2">Izin</th>
                   <th className="border border-black p-1 text-center" colSpan="2">Cuti</th>
                   <th className="border border-black p-1 text-center" colSpan="2">DL</th>
                </tr>
                <tr className="bg-slate-50 print:bg-transparent text-[10px] uppercase text-center">
                   <th className="border border-black p-0.5 w-6 bg-green-50 print:bg-transparent">P</th>
                   <th className="border border-black p-0.5 w-6 bg-green-100 print:bg-transparent">S</th>
                   
                   <th className="border border-black p-0.5 w-6 bg-yellow-50 print:bg-transparent">P</th>
                   <th className="border border-black p-0.5 w-6 bg-yellow-100 print:bg-transparent">S</th>
                   
                   <th className="border border-black p-0.5 w-6 bg-blue-50 print:bg-transparent">P</th>
                   <th className="border border-black p-0.5 w-6 bg-blue-100 print:bg-transparent">S</th>
                   
                   <th className="border border-black p-0.5 w-6 bg-purple-50 print:bg-transparent">P</th>
                   <th className="border border-black p-0.5 w-6 bg-purple-100 print:bg-transparent">S</th>
                   
                   <th className="border border-black p-0.5 w-6 bg-orange-50 print:bg-transparent">P</th>
                   <th className="border border-black p-0.5 w-6 bg-orange-100 print:bg-transparent">S</th>
                </tr>
             </thead>
             <tbody>
                {pegawaiOnly.map((emp, i) => {
                   const stats = getStats(emp.id);
                   return (
                      <tr key={emp.id} className="hover:bg-slate-50">
                         <td className="border border-black p-1 text-center align-middle">{emp.no || i+1}</td>
                         
                         <td className="border border-black p-1 text-left align-top whitespace-nowrap">
                            {/* UPDATE: Line spacing menjadi normal (1.5) */}
                            
                            {/* 1. JABATAN */}
                            <div className="text-[11px] italic text-slate-700 leading-normal">
                                - {emp.jabatan}
                            </div>
                            
                            {/* 2. NAMA */}
                            <div className="font-bold text-black text-sm leading-normal">
                                {emp.nama}
                            </div>
                            
                            {/* 3. NIP */}
                            <div className="text-sm text-slate-800 leading-normal">
                                NIP. {emp.nip || '-'}
                            </div>
                         </td>

                         <td className="border border-black p-1 text-center bg-green-50 print:bg-transparent">{stats['Hadir'].p}</td>
                         <td className="border border-black p-1 text-center bg-green-100 print:bg-transparent">{stats['Hadir'].s}</td>

                         <td className="border border-black p-1 text-center bg-yellow-50 print:bg-transparent">{stats['Sakit'].p}</td>
                         <td className="border border-black p-1 text-center bg-yellow-100 print:bg-transparent">{stats['Sakit'].s}</td>

                         <td className="border border-black p-1 text-center bg-blue-50 print:bg-transparent">{stats['Izin'].p}</td>
                         <td className="border border-black p-1 text-center bg-blue-100 print:bg-transparent">{stats['Izin'].s}</td>

                         <td className="border border-black p-1 text-center bg-purple-50 print:bg-transparent">{stats['Cuti'].p}</td>
                         <td className="border border-black p-1 text-center bg-purple-100 print:bg-transparent">{stats['Cuti'].s}</td>

                         <td className="border border-black p-1 text-center bg-orange-50 print:bg-transparent">{stats['Dinas Luar'].p}</td>
                         <td className="border border-black p-1 text-center bg-orange-100 print:bg-transparent">{stats['Dinas Luar'].s}</td>
                      </tr>
                   );
                })}
             </tbody>
          </table>

          <div className="mt-16 flex justify-end text-center">
            <div className="min-w-[200px] w-auto px-4">
               <p>{settings.titimangsa || 'Bobong'}, {new Date(month + '-28').toLocaleDateString('id-ID', {month:'long', year:'numeric'})}</p>
               <p className="mb-20">{settings.kepalaJabatan || `Kepala ${settings.opdShort}`}</p>
               <p className="font-bold underline whitespace-nowrap">{settings.kepalaName || '_________________________'}</p>
               <p>NIP. {settings.kepalaNip || '..............................'}</p>
            </div>
         </div>
       </div>
    </div>
  );
}