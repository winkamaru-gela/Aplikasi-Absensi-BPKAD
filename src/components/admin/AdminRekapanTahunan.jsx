import React, { useState, useEffect, useRef } from 'react';
import { Printer, FileDown, Search, X, ChevronDown } from 'lucide-react';
import { DEFAULT_LOGO_URL } from '../../utils/helpers';
import { getYearlyStats } from '../../utils/statistics';
import * as XLSX from 'xlsx';

// Tambahkan prop 'user' disini
export default function AdminRekapanTahunan({ employees, attendance, settings, user }) {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [selectedUserId, setSelectedUserId] = useState('');
  
  // State untuk Pencarian Pegawai
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // State untuk Opsi Tanda Tangan
  const [showSecretary, setShowSecretary] = useState(true);
  const [showLeader, setShowLeader] = useState(true);

  // State untuk Orientasi Cetak
  const [printOrientation, setPrintOrientation] = useState('landscape');

  // --- LOGIKA BARU: Cek apakah User Biasa atau Admin ---
  const isUserMode = user && user.role === 'user';

  // Effect: Jika User Mode, otomatis set selectedUserId ke user yang login
  useEffect(() => {
     if (isUserMode) {
        setSelectedUserId(user.id);
     }
  }, [isUserMode, user]);

  // Filter hanya pegawai (user) dan urutkan
  const sortedEmployees = employees
    .filter(e => e.role === 'user')
    .sort((a, b) => (parseInt(a.no) || 999) - (parseInt(b.no) || 999));

  // Filter list pegawai berdasarkan pencarian
  const filteredEmployees = sortedEmployees.filter(emp => 
    emp.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.nip && emp.nip.includes(searchTerm)) ||
    (emp.no && emp.no.toString().includes(searchTerm))
  );

  // Ambil data pegawai terpilih
  const selectedEmployee = sortedEmployees.find(e => e.id === selectedUserId);

  // --- LOGIKA MENCARI SEKRETARIS OTOMATIS ---
  const secretary = employees.find(e => 
    e.jabatan && e.jabatan.toLowerCase().includes('sekretaris') && !e.jabatan.toLowerCase().includes('staf')
  );

  // Ambil Statistik Tahunan jika user sudah dipilih
  const yearlyData = selectedEmployee ? getYearlyStats(year, attendance, selectedUserId) : [];

  // Effect: Menutup dropdown jika klik di luar
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        if (selectedEmployee && !isUserMode) { // Hanya update search term jika bukan user mode
            setSearchTerm(`${selectedEmployee.no}. ${selectedEmployee.nama}`);
        } else if (!selectedEmployee) {
            setSearchTerm('');
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedEmployee, isUserMode]);

  const handleSelectEmployee = (emp) => {
      setSelectedUserId(emp.id);
      setSearchTerm(`${emp.no}. ${emp.nama}`);
      setIsDropdownOpen(false);
  };

  const handleClearSelection = () => {
      setSelectedUserId('');
      setSearchTerm('');
      setIsDropdownOpen(true);
  };

  // --- EXPORT EXCEL ---
  const handleExportExcel = () => {
    if (!selectedEmployee) return alert("Pilih pegawai terlebih dahulu");

    // Definisikan Header
    const headerRows = [
      [
        "No", "Bulan", 
        "Hadir", "",  
        "Sakit", "",  
        "Izin", "",   
        "Cuti", "",   
        "DL", "",     
        "Total Hadir"
      ],
      [
        "", "",       
        "P", "S",     
        "P", "S",     
        "P", "S",     
        "P", "S",     
        "P", "S",     
        ""            
      ]
    ];

    // Data Baris
    const dataRows = yearlyData.map((data, i) => {
        const { stats } = data;
        return [
            i + 1,
            data.monthName,
            stats.Hadir.p,
            stats.Hadir.s,
            stats.Sakit.p,
            stats.Sakit.s,
            stats.Izin.p,
            stats.Izin.s,
            stats.Cuti.p,
            stats.Cuti.s,
            stats['Dinas Luar'].p,
            stats['Dinas Luar'].s,
            data.totalHadir
        ];
    });

    // Baris Total
    const totalRow = [
        "", "TOTAL TAHUNAN",
        yearlyData.reduce((acc, curr) => acc + curr.stats.Hadir.p, 0),
        yearlyData.reduce((acc, curr) => acc + curr.stats.Hadir.s, 0),
        yearlyData.reduce((acc, curr) => acc + curr.stats.Sakit.p, 0),
        yearlyData.reduce((acc, curr) => acc + curr.stats.Sakit.s, 0),
        yearlyData.reduce((acc, curr) => acc + curr.stats.Izin.p, 0),
        yearlyData.reduce((acc, curr) => acc + curr.stats.Izin.s, 0),
        yearlyData.reduce((acc, curr) => acc + curr.stats.Cuti.p, 0),
        yearlyData.reduce((acc, curr) => acc + curr.stats.Cuti.s, 0),
        yearlyData.reduce((acc, curr) => acc + curr.stats['Dinas Luar'].p, 0),
        yearlyData.reduce((acc, curr) => acc + curr.stats['Dinas Luar'].s, 0),
        yearlyData.reduce((acc, curr) => acc + curr.totalHadir, 0)
    ];

    const wsData = [...headerRows, ...dataRows, totalRow];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Merge Cells
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, 
      { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, 
      { s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }, 
      { s: { r: 0, c: 4 }, e: { r: 0, c: 5 } }, 
      { s: { r: 0, c: 6 }, e: { r: 0, c: 7 } }, 
      { s: { r: 0, c: 8 }, e: { r: 0, c: 9 } }, 
      { s: { r: 0, c: 10 }, e: { r: 0, c: 11 } }, 
      { s: { r: 0, c: 12 }, e: { r: 1, c: 12 } }, 
      { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 1 } }
    ];

    ws['!cols'] = [
        { wch: 5 }, { wch: 15 }, 
        { wch: 5 }, { wch: 5 }, { wch: 5 }, { wch: 5 }, 
        { wch: 5 }, { wch: 5 }, { wch: 5 }, { wch: 5 }, 
        { wch: 5 }, { wch: 5 }, { wch: 12 } 
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekapan Tahunan");
    XLSX.writeFile(wb, `Rekapan_Tahunan_${selectedEmployee.nama.replace(/\s+/g,'_')}_${year}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
       <style>{`
         @media print {
           @page { size: ${printOrientation}; margin: 10mm; }
           body { -webkit-print-color-adjust: exact; }
         }
       `}</style>

       {/* CONTROLS */}
       <div className="bg-white p-4 rounded shadow print:hidden flex flex-col gap-4">
          <div className="flex flex-wrap gap-4 items-end justify-between">
            <div className="flex gap-4 items-end flex-wrap">
                <div>
                    <label className="text-xs font-bold block mb-1">Pilih Tahun</label>
                    <select value={year} onChange={e=>setYear(e.target.value)} className="border p-2 rounded w-24 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    </select>
                </div>
                
                {/* SEARCHABLE DROPDOWN (HANYA MUNCUL JIKA BUKAN USER BIASA) */}
                {!isUserMode && (
                  <div className="relative" ref={dropdownRef}>
                      <label className="text-xs font-bold block mb-1">Cari & Pilih Pegawai</label>
                      <div className="relative">
                          <input 
                              type="text" 
                              className="border p-2 pl-9 pr-8 rounded w-64 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                              placeholder="Ketik Nama / NIP / No..."
                              value={searchTerm}
                              onChange={(e) => {
                                  setSearchTerm(e.target.value);
                                  setIsDropdownOpen(true);
                                  if(e.target.value === '') setSelectedUserId('');
                              }}
                              onFocus={() => setIsDropdownOpen(true)}
                          />
                          <Search size={16} className="absolute left-2.5 top-3 text-slate-400 pointer-events-none"/>
                          
                          {searchTerm ? (
                              <button 
                                  onClick={handleClearSelection}
                                  className="absolute right-2 top-2.5 text-slate-400 hover:text-red-500"
                              >
                                  <X size={16}/> 
                              </button>
                          ) : (
                              <ChevronDown size={16} className="absolute right-2 top-3 text-slate-400 pointer-events-none"/>
                          )}
                      </div>

                      {isDropdownOpen && (
                          <div className="absolute z-50 w-72 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                              {filteredEmployees.length > 0 ? (
                                  filteredEmployees.map(emp => (
                                      <div 
                                          key={emp.id}
                                          onClick={() => handleSelectEmployee(emp)}
                                          className={`p-2.5 cursor-pointer border-b border-slate-50 last:border-0 hover:bg-blue-50 transition-colors
                                              ${selectedUserId === emp.id ? 'bg-blue-100' : ''}
                                          `}
                                      >
                                          <div className="font-bold text-sm text-slate-800">{emp.no}. {emp.nama}</div>
                                          <div className="text-xs text-slate-500 flex justify-between">
                                              <span>NIP: {emp.nip || '-'}</span>
                                              <span className="italic">{emp.jabatan}</span>
                                          </div>
                                      </div>
                                  ))
                              ) : (
                                  <div className="p-4 text-center text-sm text-slate-500 italic">
                                      Pegawai tidak ditemukan.
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
                )}
                
                {/* JIKA USER MODE, TAMPILKAN INFO SINGKAT */}
                {isUserMode && selectedEmployee && (
                   <div className="px-4 py-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs font-bold text-blue-800 uppercase">Rekapan Anda</p>
                      <p className="text-sm font-bold">{selectedEmployee.nama}</p>
                   </div>
                )}

                <div>
                    <label className="text-xs font-bold block mb-1">Orientasi Cetak</label>
                    <select 
                        value={printOrientation} 
                        onChange={(e) => setPrintOrientation(e.target.value)} 
                        className="border p-2 rounded w-40 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="landscape">Landscape (Mendatar)</option>
                        <option value="portrait">Portrait (Tegak)</option>
                    </select>
                </div>
            </div>
            
            <div className="flex gap-2">
                <button onClick={handleExportExcel} disabled={!selectedUserId} className="bg-green-600 text-white px-4 py-2 rounded flex items-center hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm transition-all hover:scale-105 active:scale-95">
                    <FileDown size={16} className="mr-2"/> Export Excel
                </button>
                <button onClick={()=>window.print()} disabled={!selectedUserId} className="bg-slate-800 text-white px-4 py-2 rounded flex items-center hover:bg-black disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm transition-all hover:scale-105 active:scale-95">
                    <Printer size={16} className="mr-2"/> Cetak
                </button>
            </div>
          </div>

          <div className="flex gap-6 border-t pt-3">
             <span className="text-xs font-bold text-slate-500 flex items-center">Opsi Tanda Tangan:</span>
             <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input 
                    type="checkbox" 
                    checked={showSecretary} 
                    onChange={(e) => setShowSecretary(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                TTD Sekretaris
             </label>
             <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input 
                    type="checkbox" 
                    checked={showLeader} 
                    onChange={(e) => setShowLeader(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                TTD Pimpinan
             </label>
          </div>
       </div>

       {/* REPORT AREA */}
       {selectedEmployee ? (
           <div className="bg-white p-8 rounded shadow print:shadow-none print:w-full">
              {/* KOP SURAT */}
              <div className="flex border-b-4 border-double border-black pb-4 mb-6 items-center justify-center relative">
                <img src={settings.logoUrl || DEFAULT_LOGO_URL} className="h-20 absolute left-0" alt="logo"/>
                <div className="text-center px-20">
                   <h3 className="text-xl font-bold uppercase">{settings.parentAgency}</h3>
                   <h1 className="text-xl font-bold uppercase">{settings.opdName}</h1>
                   <p className="text-sm italic">{settings.address}</p>
                </div>
              </div>

              {/* JUDUL */}
              <div className="text-center mb-6">
                 <h2 className="text-xl font-bold uppercase underline">REKAPITULASI ABSENSI TAHUNAN</h2>
                 <p className="font-bold text-sm uppercase">PERIODE TAHUN: {year}</p>
              </div>

              {/* INFO PEGAWAI */}
              <div className="mb-6 text-sm">
                  <table className="w-full">
                      <tbody>
                          <tr>
                              <td className="font-bold w-32">Nama Pegawai</td>
                              <td>: {selectedEmployee.nama}</td>
                              <td className="font-bold w-32">Status</td>
                              <td>: {selectedEmployee.statusPegawai || '-'}</td>
                          </tr>
                          <tr>
                              <td className="font-bold">NIP</td>
                              <td>: {selectedEmployee.nip || '-'}</td>
                              <td className="font-bold">Jabatan</td>
                              <td>: {selectedEmployee.jabatan}</td>
                          </tr>
                      </tbody>
                  </table>
              </div>

              {/* TABEL DATA */}
              <table className="w-full border-collapse border border-black text-sm">
                 <thead>
                    <tr className="bg-slate-100 print:bg-transparent">
                       <th className="border border-black p-1 align-middle w-10" rowSpan="2">No</th>
                       <th className="border border-black p-1 align-middle text-left w-[1%] whitespace-nowrap" rowSpan="2">Bulan</th>
                       
                       <th className="border border-black p-1 text-center w-auto" colSpan="2">Hadir</th>
                       <th className="border border-black p-1 text-center w-auto" colSpan="2">Sakit</th>
                       <th className="border border-black p-1 text-center w-auto" colSpan="2">Izin</th>
                       <th className="border border-black p-1 text-center w-auto" colSpan="2">Cuti</th>
                       <th className="border border-black p-1 text-center w-auto" colSpan="2">DL</th>
                       <th className="border border-black p-1 text-center w-16" rowSpan="2">Total Hadir</th>
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
                    {yearlyData.map((data, i) => (
                       <tr key={i} className="hover:bg-slate-50">
                          <td className="border border-black p-1 text-center">{i+1}</td>
                          <td className="border border-black p-1 font-bold whitespace-nowrap">{data.monthName}</td>
                          
                          <td className="border border-black p-1 text-center bg-green-50 print:bg-transparent">{data.stats.Hadir.p}</td>
                          <td className="border border-black p-1 text-center bg-green-100 print:bg-transparent">{data.stats.Hadir.s}</td>

                          <td className="border border-black p-1 text-center bg-yellow-50 print:bg-transparent">{data.stats.Sakit.p}</td>
                          <td className="border border-black p-1 text-center bg-yellow-100 print:bg-transparent">{data.stats.Sakit.s}</td>

                          <td className="border border-black p-1 text-center bg-blue-50 print:bg-transparent">{data.stats.Izin.p}</td>
                          <td className="border border-black p-1 text-center bg-blue-100 print:bg-transparent">{data.stats.Izin.s}</td>

                          <td className="border border-black p-1 text-center bg-purple-50 print:bg-transparent">{data.stats.Cuti.p}</td>
                          <td className="border border-black p-1 text-center bg-purple-100 print:bg-transparent">{data.stats.Cuti.s}</td>

                          <td className="border border-black p-1 text-center bg-orange-50 print:bg-transparent">{data.stats['Dinas Luar'].p}</td>
                          <td className="border border-black p-1 text-center bg-orange-100 print:bg-transparent">{data.stats['Dinas Luar'].s}</td>

                          <td className="border border-black p-1 text-center font-bold bg-slate-100 print:bg-transparent">{data.totalHadir}</td>
                       </tr>
                    ))}
                    <tr className="bg-gray-200 print:bg-gray-100 font-bold border-t-2 border-black">
                        <td colSpan="2" className="border border-black p-1 text-right pr-4">TOTAL TAHUNAN</td>
                        <td className="border border-black p-1 text-center">{yearlyData.reduce((acc, curr) => acc + curr.stats.Hadir.p, 0)}</td>
                        <td className="border border-black p-1 text-center">{yearlyData.reduce((acc, curr) => acc + curr.stats.Hadir.s, 0)}</td>
                        
                        <td className="border border-black p-1 text-center">{yearlyData.reduce((acc, curr) => acc + curr.stats.Sakit.p, 0)}</td>
                        <td className="border border-black p-1 text-center">{yearlyData.reduce((acc, curr) => acc + curr.stats.Sakit.s, 0)}</td>

                        <td className="border border-black p-1 text-center">{yearlyData.reduce((acc, curr) => acc + curr.stats.Izin.p, 0)}</td>
                        <td className="border border-black p-1 text-center">{yearlyData.reduce((acc, curr) => acc + curr.stats.Izin.s, 0)}</td>

                        <td className="border border-black p-1 text-center">{yearlyData.reduce((acc, curr) => acc + curr.stats.Cuti.p, 0)}</td>
                        <td className="border border-black p-1 text-center">{yearlyData.reduce((acc, curr) => acc + curr.stats.Cuti.s, 0)}</td>

                        <td className="border border-black p-1 text-center">{yearlyData.reduce((acc, curr) => acc + curr.stats['Dinas Luar'].p, 0)}</td>
                        <td className="border border-black p-1 text-center">{yearlyData.reduce((acc, curr) => acc + curr.stats['Dinas Luar'].s, 0)}</td>
                        
                        <td className="border border-black p-1 text-center">{yearlyData.reduce((acc, curr) => acc + curr.totalHadir, 0)}</td>
                    </tr>
                 </tbody>
              </table>

              <div className="mt-4 flex justify-between text-center">
                {showSecretary && showLeader && (
                    <div className="min-w-[200px] w-auto px-4 mt-4">
                        <p>Mengetahui,</p>
                        <p className="mb-20 font-bold">{settings.kepalaJabatan || `Kepala ${settings.opdName}`}</p>
                        <p className="font-bold underline whitespace-nowrap">{settings.kepalaName || '_________________________'}</p>
                        <p>NIP. {settings.kepalaNip || '..............................'}</p>
                    </div>
                )}

                {!(showSecretary && showLeader) && <div></div>}

                <div className="min-w-[200px] w-auto px-4">
                   <p className="mb-4">{settings.titimangsa || 'Bobong'}, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month:'long', year:'numeric'})}</p>
                   
                   {showSecretary && showLeader && (
                       secretary ? (
                           <>
                               <p className="mb-20 font-bold">{secretary.jabatan}</p>
                               <p className="font-bold underline whitespace-nowrap">{secretary.nama}</p>
                               <p>NIP. {secretary.nip || '-'}</p>
                           </>
                       ) : (
                           <div className="mt-10 italic text-gray-400 text-sm">(Data Sekretaris tidak ditemukan)</div>
                       )
                   )}

                   {showSecretary && !showLeader && (
                       secretary ? (
                           <>
                               <p className="mb-20 font-bold">{secretary.jabatan}</p>
                               <p className="font-bold underline whitespace-nowrap">{secretary.nama}</p>
                               <p>NIP. {secretary.nip || '-'}</p>
                           </>
                       ) : (
                           <div className="mt-10 italic text-gray-400 text-sm">(Data Sekretaris tidak ditemukan)</div>
                       )
                   )}

                   {!showSecretary && showLeader && (
                       <>
                           <p className="mb-20 font-bold">{settings.kepalaJabatan || `Kepala ${settings.opdName}`}</p>
                           <p className="font-bold underline whitespace-nowrap">{settings.kepalaName || '_________________________'}</p>
                           <p>NIP. {settings.kepalaNip || '..............................'}</p>
                       </>
                   )}
                </div>
             </div>
           </div>
       ) : (
           <div className="bg-white p-12 rounded shadow text-center border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500">
               <Search size={48} className="mb-4 text-slate-300"/>
               <p className="text-lg font-medium">Belum ada pegawai yang dipilih</p>
               <p className="text-sm">Silakan gunakan kolom pencarian di atas untuk memilih pegawai dan melihat rekapan tahunan.</p>
           </div>
       )}
    </div>
  );
}