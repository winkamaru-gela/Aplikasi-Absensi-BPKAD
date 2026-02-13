import React, { useState } from 'react';
import { Printer, Trash2, FileDown } from 'lucide-react'; 
import { writeBatch, doc } from 'firebase/firestore';
import { db, getCollectionPath } from '../../lib/firebase';
import { DEFAULT_LOGO_URL } from '../../utils/helpers';
import { getMonthlyStats } from '../../utils/statistics'; 
import * as XLSX from 'xlsx'; 

export default function AdminRekapanBulanan({ employees, attendance, settings, user }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const pegawaiOnly = employees
    .filter(e => e.role === 'user')
    .sort((a, b) => {
        const noA = parseInt(a.no) || 99999;
        const noB = parseInt(b.no) || 99999;
        return noA - noB;
    });

  // GUNAKAN LOGIC TERPUSAT
  const { monthlyLogs, calculateUserStats } = getMonthlyStats(month, attendance);

  // --- FITUR BARU: EXPORT EXCEL ---
  const handleExportExcel = () => {
    const dataToExport = pegawaiOnly.map((emp, i) => {
        const stats = calculateUserStats(emp.id);
        return {
            'No': i + 1,
            'Nama Pegawai': emp.nama,
            'NIP': emp.nip || '-',
            'Jabatan': emp.jabatan,
            'Hadir (Pagi)': stats.Hadir.p,
            'Hadir (Sore)': stats.Hadir.s,
            'Sakit (P)': stats.Sakit.p,
            'Sakit (S)': stats.Sakit.s,
            'Izin (P)': stats.Izin.p,
            'Izin (S)': stats.Izin.s,
            'Cuti (P)': stats.Cuti.p,
            'Cuti (S)': stats.Cuti.s,
            'DL (P)': stats['Dinas Luar'].p,
            'DL (S)': stats['Dinas Luar'].s,
        };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekapan Bulanan");
    XLSX.writeFile(wb, `Rekapan_Absensi_${settings.opdShort}_${month}.xlsx`);
  };

  const handleClear = async () => {
    if (confirm(`PERINGATAN: Anda akan menghapus seluruh data absensi bulan ${month}. Lanjutkan?`)) {
       const batch = writeBatch(db);
       monthlyLogs.forEach(l => {
          batch.delete(doc(getCollectionPath('attendance'), l.id));
       });
       await batch.commit();
       alert('Data bulan ini telah dikosongkan.');
    }
  };

  return (
    <div className="space-y-6">
       <div className="bg-white p-4 rounded shadow print:hidden flex flex-wrap gap-4 items-end justify-between">
          <div>
             <label className="text-xs font-bold block mb-1">Pilih Bulan</label>
             <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="border p-2 rounded"/>
          </div>
          <div className="flex gap-2 flex-wrap">
             {/* TOMBOL EXPORT EXCEL */}
             <button onClick={handleExportExcel} className="bg-green-600 text-white px-4 py-2 rounded flex items-center hover:bg-green-700 shadow-sm transition-transform hover:scale-105">
                <FileDown size={16} className="mr-2"/> Export Excel
             </button>

             <button onClick={()=>window.print()} className="bg-slate-800 text-white px-4 py-2 rounded flex items-center hover:bg-black shadow-sm transition-transform hover:scale-105">
                <Printer size={16} className="mr-2"/> Cetak
             </button>
             
             {user.role === 'admin' && (
               <button onClick={handleClear} className="bg-red-600 text-white px-4 py-2 rounded flex items-center hover:bg-red-700 shadow-sm ml-2">
                  <Trash2 size={16} className="mr-2"/> Reset Data
               </button>
             )}
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
                   {/* UPDATE: Kolom No w-[1%] whitespace-nowrap agar rapat */}
                   <th className="border border-black p-1 align-middle w-[1%] whitespace-nowrap" rowSpan="2">No</th>
                   
                   {/* UPDATE: Kolom Nama/NIP w-[1%] whitespace-nowrap agar rapat sesuai teks */}
                   <th className="border border-black p-1 text-left align-middle w-[1%] whitespace-nowrap" rowSpan="2">Nama / NIP</th>

                   {/* UPDATE: Kolom Jabatan w-[1%] whitespace-nowrap agar rapat (menyusut ke kiri) */}
                   <th className="border border-black p-1 text-center align-middle w-[1%] whitespace-nowrap" rowSpan="2">Jabatan</th>
                   
                   {/* UPDATE: Kolom Statistik w-auto agar otomatis membagi sisa ruang */}
                   <th className="border border-black p-1 text-center w-auto" colSpan="2">Hadir</th>
                   <th className="border border-black p-1 text-center w-auto" colSpan="2">Sakit</th>
                   <th className="border border-black p-1 text-center w-auto" colSpan="2">Izin</th>
                   <th className="border border-black p-1 text-center w-auto" colSpan="2">Cuti</th>
                   <th className="border border-black p-1 text-center w-auto" colSpan="2">DL</th>
                </tr>
                <tr className="bg-slate-50 print:bg-transparent text-[10px] uppercase text-center">
                   <th className="border border-black p-0.5 w-auto bg-green-50 print:bg-transparent">P</th>
                   <th className="border border-black p-0.5 w-auto bg-green-100 print:bg-transparent">S</th>
                   
                   <th className="border border-black p-0.5 w-auto bg-yellow-50 print:bg-transparent">P</th>
                   <th className="border border-black p-0.5 w-auto bg-yellow-100 print:bg-transparent">S</th>
                   
                   <th className="border border-black p-0.5 w-auto bg-blue-50 print:bg-transparent">P</th>
                   <th className="border border-black p-0.5 w-auto bg-blue-100 print:bg-transparent">S</th>
                   
                   <th className="border border-black p-0.5 w-auto bg-purple-50 print:bg-transparent">P</th>
                   <th className="border border-black p-0.5 w-auto bg-purple-100 print:bg-transparent">S</th>
                   
                   <th className="border border-black p-0.5 w-auto bg-orange-50 print:bg-transparent">P</th>
                   <th className="border border-black p-0.5 w-auto bg-orange-100 print:bg-transparent">S</th>
                </tr>
             </thead>
             <tbody>
                {pegawaiOnly.map((emp, i) => {
                   const stats = calculateUserStats(emp.id); 
                   return (
                      <tr key={emp.id} className="hover:bg-slate-50">
                         {/* UPDATE: No Rapat */}
                         <td className="border border-black p-1 text-center align-middle whitespace-nowrap">{emp.no || i+1}</td>
                         
                         {/* UPDATE: Nama/NIP Rapat (Whitespace Nowrap) */}
                         <td className="border border-black p-1 text-left align-top whitespace-nowrap">
                            <div className="font-bold text-black text-sm leading-normal">
                                {emp.nama}
                            </div>
                            <div className="text-sm text-slate-800 leading-normal">
                                NIP. {emp.nip || '-'}
                            </div>
                         </td>

                         {/* UPDATE: Jabatan Rapat, Text Left, Text SM */}
                         <td className="border border-black p-1 text-left align-top text-sm w-[1%] whitespace-nowrap leading-normal">
                             {emp.jabatan}
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