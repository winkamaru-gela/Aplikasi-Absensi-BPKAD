import React, { useState, useEffect } from 'react';
import { Printer, AlertTriangle } from 'lucide-react';
import { getTodayString, formatDateIndo, formatDateNoWeekday, DEFAULT_LOGO_URL } from '../../utils/helpers';
import { getDailyStats } from '../../utils/statistics'; // Import Logic Baru

export default function AdminLaporanHarian({ employees, attendance, settings, holidays, isUserView = false }) {
  const [date, setDate] = useState(getTodayString());
  const [session, setSession] = useState(() => {
     const h = new Date().getHours();
     return h >= 12 ? 'Sore' : 'Pagi';
  });
  const [printTemplate, setPrintTemplate] = useState('v2');
  const [showSignature, setShowSignature] = useState(true);

  // --- LOGIKA HARI LIBUR & WEEKEND ---
  const selectedDate = new Date(date);
  const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6; // 0=Minggu, 6=Sabtu
  const holidayData = holidays.find(h => h.date === date);
  const isNonEffective = isWeekend || !!holidayData;

  // --- GUNAKAN LOGIC TERPUSAT ---
  const { grouped, counts } = getDailyStats(date, session, employees, attendance);

  // Sorting Khusus untuk Laporan (Hadir berdasarkan No, Sisanya Default/Nama)
  const hadirList = grouped.Hadir.sort((a, b) => (parseInt(a.no) || 99999) - (parseInt(b.no) || 99999));
  const sakitList = grouped.Sakit.sort((a, b) => a.nama.localeCompare(b.nama));
  const izinList = grouped.Izin.sort((a, b) => a.nama.localeCompare(b.nama));
  const cutiList = grouped.Cuti.sort((a, b) => a.nama.localeCompare(b.nama));
  const dlList = grouped['Dinas Luar'].sort((a, b) => a.nama.localeCompare(b.nama));
  const alpaList = grouped.Alpa.sort((a, b) => a.nama.localeCompare(b.nama));

  // --- FUNGSI RENDER NAMA + KETERANGAN (ITALIC & HIJAU + MERAH UNTUK ALPA) ---
  const renderNama = (emp) => {
    // Cari data absensi asli untuk mendapatkan field 'keterangan' dan 'status'
    const record = attendance.find(a => a.userId === emp.id && a.date === date && a.session === session);
    
    // Tentukan apakah statusnya Alpa (baik dari record atau default sistem)
    const isAlpa = record?.status === 'Alpa' || (!record && !isNonEffective);

    return (
      <span className={`font-medium ${isAlpa ? 'text-red-600 print:text-red-600' : 'text-black'}`}>
        {emp.nama}
        {record?.keterangan && (
          <span className="italic text-green-600 ml-1 print:text-green-600">
            ({record.keterangan})
          </span>
        )}
      </span>
    );
  };

  // Menggabungkan list tidak hadir untuk Template V1
  const listTidakHadir = [
      ...grouped.Alpa.map(e => ({...e, status: 'Alpa (Tanpa Ket.)'})),
      ...grouped['Dinas Luar'].map(e => ({...e, status: 'Dinas Luar'})),
      ...grouped.Izin.map(e => ({...e, status: 'Izin'})),
      ...grouped.Sakit.map(e => ({...e, status: 'Sakit'})),
      ...grouped.Cuti.map(e => ({...e, status: 'Cuti'}))
  ];

  const statusPriority = { 'Alpa (Tanpa Ket.)': 1, 'Dinas Luar': 2, 'Izin': 3, 'Sakit': 4, 'Cuti': 5 };
  listTidakHadir.sort((a, b) => (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99));

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded shadow print:hidden flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs font-bold block mb-1">Tanggal</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="border p-2 rounded text-black"/>
          </div>
          <div>
            <label className="text-xs font-bold block mb-1">Sesi</label>
            <select value={session} onChange={e=>setSession(e.target.value)} className="border p-2 rounded w-32 text-black">
              <option>Pagi</option>
              <option>Sore</option>
            </select>
          </div>
          {!isUserView && (
              <div className="flex gap-4">
                 <div>
                     <label className="text-xs font-bold block mb-1">Model Cetak</label>
                     <select value={printTemplate} onChange={e=>setPrintTemplate(e.target.value)} className="border p-2 rounded w-48 bg-yellow-50 border-yellow-300 text-black">
                     <option value="v2">Format BKPSDMA</option>
                     <option value="v1">Format Default</option>
                     </select>
                 </div>
                 
                 <div className="flex flex-col justify-end pb-2">
                     <label className="flex items-center space-x-2 cursor-pointer select-none text-black">
                         <input 
                             type="checkbox" 
                             checked={showSignature} 
                             onChange={(e) => setShowSignature(e.target.checked)}
                             className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                         />
                         <span className="text-sm font-bold text-slate-700">TTD Pimpinan</span>
                     </label>
                 </div>
              </div>
          )}
          <button onClick={()=>window.print()} className="bg-slate-800 text-white px-4 py-2 rounded flex items-center ml-auto hover:bg-black">
             <Printer size={18} className="mr-2"/> Cetak Laporan
          </button>
      </div>

      <div className="bg-white p-10 rounded shadow-lg print:shadow-none print:w-full print:p-0 text-black">
          {/* KOP SURAT */}
          <div className="flex border-b-4 border-double border-black pb-4 mb-6 items-center justify-center relative">
             <img src={settings.logoUrl || DEFAULT_LOGO_URL} className="h-20 absolute left-0" alt="Logo"/>
             <div className="text-center px-20 text-black">
                <h3 className="text-xl font-bold uppercase">{settings.parentAgency}</h3>
                <h1 className="text-xl font-bold uppercase">{settings.opdName}</h1>
                <p className="text-sm italic">{settings.address}</p>
             </div>
          </div>

          <div className="text-center mb-6 text-black">
             <h2 className="text-lg font-bold underline uppercase">Laporan Absensi Harian</h2>
             <p className="font-medium">Hari/Tanggal: {formatDateIndo(date)} - Sesi {session}</p>
          </div>

          {isNonEffective ? (
             <div className="border-2 border-dashed border-red-400 bg-red-50 p-12 rounded-lg text-center my-8">
                <AlertTriangle size={48} className="text-red-500 mx-auto mb-4"/>
                <h3 className="text-xl font-bold text-red-700 uppercase mb-2">
                   {holidayData ? "INFORMASI HARI LIBUR NASIONAL / CUTI BERSAMA" : "HARI NON-EFEKTIF (LIBUR AKHIR PEKAN)"}
                </h3>
                <p className="text-lg font-medium text-slate-700">
                   {holidayData ? `Keterangan: ${holidayData.desc}` : "Tidak Ada Data Absensi untuk Hari Minggu dan Hari Sabtu karena merupakan hari Non-Efektif."}
                </p>
                <p className="text-sm text-slate-500 mt-2 italic">(Sistem tidak mencatat absensi pada hari ini)</p>
             </div>
          ) : (
            <>
                {/* --- TEMPLATE v1 --- */}
                {printTemplate === 'v1' && (
                  <>
                      <div className="grid grid-cols-2 gap-8 mb-6 text-sm text-black">
                          <div className="border border-black p-4">
                            <h3 className="font-bold border-b border-black mb-2 pb-1 text-black">Statistik Kehadiran</h3>
                            <div className="flex justify-between mb-1"><span>Jumlah</span> <span className="font-bold">{counts.TotalPegawai} Orang</span></div>
                            <div className="flex justify-between mb-1"><span>Kurang</span> <span className="font-bold">{counts.TotalKurang} Orang</span></div>
                            <div className="flex justify-between mb-1"><span>Hadir</span> <span>{counts.Hadir} Orang</span></div>
                            <div className="flex justify-between mt-2 pt-2 border-t border-dotted border-black font-bold">
                                <span>Total Efektif</span> <span>{counts.Hadir} Orang</span>
                            </div>
                          </div>
                          <div className="border border-black p-4">
                            <h3 className="font-bold border-b border-black mb-2 pb-1 text-black">Keterangan</h3>
                            <div className="flex justify-between mb-1"><span>Tugas / Dinas Luar</span> <span>{counts.DL} Orang</span></div>
                            <div className="flex justify-between mb-1"><span>Izin</span> <span>{counts.Izin} Orang</span></div>
                            <div className="flex justify-between mb-1"><span>Sakit</span> <span>{counts.Sakit} Orang</span></div>
                            <div className="flex justify-between mb-1"><span>Cuti</span> <span>{counts.Cuti} Orang</span></div>
                            <div className="flex justify-between mb-1 font-bold"><span>Tanpa Keterangan</span> <span>{counts.Alpa} Orang</span></div>
                            <div className="flex justify-between mt-2 pt-2 border-t border-dotted border-black font-bold">
                                <span>Total Tidak Hadir</span> <span>{counts.TotalKurang} Orang</span>
                            </div>
                          </div>
                      </div>

                      <div>
                          <table className="w-full border-collapse border border-black text-sm text-black">
                          <thead>
                              <tr className="bg-gray-100 print:bg-transparent">
                                  <th className="border border-black p-2 w-12 text-black">No</th>
                                  <th className="border border-black p-2 text-left text-black">Nama Pegawai</th>
                                  <th className="border border-black p-2 text-left text-black">Keterangan</th>
                              </tr>
                          </thead>
                          <tbody>
                              {listTidakHadir.length > 0 ? (
                                  listTidakHadir.map((emp, i) => (
                                      <tr key={emp.id}>
                                          <td className="border border-black p-2 text-center text-black">{i+1}</td>
                                          <td className="border border-black p-2 text-black">{renderNama(emp)}</td>
                                          <td className={`border border-black p-2 ${emp.status.includes('Alpa') ? 'text-red-600 font-bold print:text-red-600' : 'text-black'}`}>{emp.status}</td>
                                      </tr>
                                  ))
                              ) : (
                                  <tr><td colSpan="3" className="border border-black p-4 text-center italic text-black">Nihil (Semua Pegawai Hadir)</td></tr>
                              )}
                          </tbody>
                          </table>
                      </div>
                  </>
                )}

                {/* --- TEMPLATE v2 (BKPSDMA) --- */}
                {printTemplate === 'v2' && (
                  <div className="text-sm text-black">
                      <table className="w-full border-collapse border border-black text-black">
                          <tbody>
                              <tr>
                                  <td className="border border-black p-2 font-bold w-1/3 align-top text-black">OPD</td>
                                  <td className="border border-black p-2 font-bold align-top uppercase text-black">{settings.opdName}</td>
                              </tr>
                              <tr>
                                  <td className="border border-black p-2 font-bold align-top text-black">JUMLAH</td>
                                  <td className="border border-black p-2 font-bold align-top text-black">{counts.TotalPegawai} Orang</td>
                              </tr>
                              <tr>
                                  <td className="border border-black p-2 font-bold align-top text-black">KURANG</td>
                                  <td className="border border-black p-2 font-bold align-top text-black">{counts.TotalKurang} Orang</td>
                              </tr>
                              <tr>
                                  <td className="border border-black p-2 font-bold align-top text-black">HADIR</td>
                                  <td className="border border-black p-2 font-bold align-top text-black">{counts.Hadir} Orang</td>
                              </tr>
                              <tr>
                                  <td className="border border-black p-2 font-bold align-top text-black">KETERANGAN</td>
                                  <td className="border border-black p-2 align-top text-black">
                                      <div className="flex flex-col gap-1 text-black">
                                          <div><b>TUGAS</b> :  {counts.DL}  ORANG</div>
                                          <div><b>IZIN</b> :  {counts.Izin}  ORANG</div>
                                          <div><b>CUTI</b> :  {counts.Cuti}  ORANG</div>
                                          <div><b>SAKIT</b> :  {counts.Sakit}  ORANG</div>
                                          <div><b>TANPA KETERANGAN</b> : {counts.Alpa}  ORANG</div>
                                      </div>
                                  </td>
                              </tr>
                              
                              <tr>
                                  <td className="border border-black p-2 font-bold align-top text-black">TANPA KETERANGAN</td>
                                  <td className="border border-black p-2 align-top text-black">
                                      {alpaList.length > 0 ? (
                                          <ol className="list-decimal list-inside pl-1 m-0 text-black">
                                              {alpaList.map(emp => (
                                                  <li key={emp.id}>
                                                      {renderNama(emp)}
                                                  </li>
                                              ))}
                                          </ol>
                                      ) : <span className="italic text-gray-500">- Nihil -</span>}
                                  </td>
                              </tr>

                              <tr>
                                  <td colSpan="2" className="border border-black p-2 font-bold text-center uppercase bg-gray-50 print:bg-transparent text-black">
                                    JUMLAH PEGAWAI EFEKTIF HARI INI: HADIR APEL {session}
                                  </td>
                              </tr>

                              <tr>
                                  <td colSpan="2" className="border border-black p-2 align-top text-black">
                                      {hadirList.length > 0 ? (
                                          (() => {
                                              const total = hadirList.length;
                                              const partSize = Math.ceil(total / 3);
                                              const col1 = hadirList.slice(0, partSize);
                                              const col2 = hadirList.slice(partSize, partSize * 2);
                                              const col3 = hadirList.slice(partSize * 2);
                                              return (
                                                <div className="grid grid-cols-3 gap-x-4 text-black">
                                                    <ol className="list-decimal list-inside pl-1 m-0" start={1}>
                                                        {col1.map(emp => <li key={emp.id} className="font-medium">{emp.nama}</li>)}
                                                    </ol>
                                                    <ol className="list-decimal list-inside pl-1 m-0" start={partSize + 1}>
                                                        {col2.map(emp => <li key={emp.id} className="font-medium">{emp.nama}</li>)}
                                                    </ol>
                                                    <ol className="list-decimal list-inside pl-1 m-0" start={(partSize * 2) + 1}>
                                                        {col3.map(emp => <li key={emp.id} className="font-medium">{emp.nama}</li>)}
                                                    </ol>
                                                </div>
                                              );
                                          })()
                                      ) : <div className="text-center italic text-gray-500">- Nihil -</div>}
                                  </td>
                              </tr>

                              <tr>
                                  <td className="border border-black p-2 font-bold align-top text-black">TUGAS / DINAS LUAR</td>
                                  <td className="border border-black p-2 align-top text-black">
                                      {dlList.length > 0 ? (
                                          <ol className="list-decimal list-inside pl-1 m-0 text-black">
                                              {dlList.map(emp => <li key={emp.id} className="font-medium">{renderNama(emp)}</li>)}
                                          </ol>
                                      ) : <span className="italic text-gray-500">- Nihil -</span>}
                                  </td>
                              </tr>

                              <tr>
                                  <td className="border border-black p-2 font-bold align-top text-black">IZIN</td>
                                  <td className="border border-black p-2 align-top text-black">
                                      {izinList.length > 0 ? (
                                          <ol className="list-decimal list-inside pl-1 m-0 text-black">
                                              {izinList.map(emp => <li key={emp.id} className="font-medium">{renderNama(emp)}</li>)}
                                          </ol>
                                      ) : <span className="italic text-gray-500">- Nihil -</span>}
                                  </td>
                              </tr>

                              <tr>
                                  <td className="border border-black p-2 font-bold align-top text-black">SAKIT</td>
                                  <td className="border border-black p-2 align-top text-black">
                                      {sakitList.length > 0 ? (
                                          <ol className="list-decimal list-inside pl-1 m-0 text-black">
                                              {sakitList.map(emp => <li key={emp.id} className="font-medium">{renderNama(emp)}</li>)}
                                          </ol>
                                      ) : <span className="italic text-gray-500">- Nihil -</span>}
                                  </td>
                              </tr>

                              <tr>
                                  <td className="border border-black p-2 font-bold align-top text-black">CUTI</td>
                                  <td className="border border-black p-2 align-top text-black">
                                      {cutiList.length > 0 ? (
                                          <ol className="list-decimal list-inside pl-1 m-0 text-black">
                                              {cutiList.map(emp => <li key={emp.id} className="font-medium">{renderNama(emp)}</li>)}
                                          </ol>
                                      ) : <span className="italic text-gray-500">- Nihil -</span>}
                                  </td>
                              </tr>
                          </tbody>
                      </table>
                  </div>
                )}
            </>
          )}

          {/* TANDA TANGAN */}
          {showSignature && (
            <div className="mt-4 flex justify-end text-center text-black">
                <div className="min-w-[200px] w-auto px-4 text-black">
                    <p className="mb-4">{settings.titimangsa || 'Bobong'}, {formatDateNoWeekday(date)}</p>
                    <p>Mengetahui,</p>
                    <p>{settings.kepalaJabatan || `Kepala ${settings.opdName}`}</p>
                    <br/><br/><br/><br/>
                    <p className="font-bold underline whitespace-nowrap uppercase">{settings.kepalaName || '_________________________'}</p>
                    <p>NIP. {settings.kepalaNip || '..............................'}</p>
                </div>
            </div>
          )}
      </div>
    </div>
  );
}