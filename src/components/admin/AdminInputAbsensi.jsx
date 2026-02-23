import React, { useState, useEffect } from 'react';
import { Save, UserPlus, Calendar, Clock, CheckSquare, Square, Search, FileText, Trash2 } from 'lucide-react';
import { writeBatch, doc } from "firebase/firestore";
import { db, getCollectionPath } from '../../lib/firebase';
import { getTodayString } from '../../utils/helpers';

export default function AdminInputAbsensi({ employees, attendance }) {
  const [date, setDate] = useState(getTodayString());
  const [session, setSession] = useState('Pagi');
  const [status, setStatus] = useState('Hadir');
  const [keterangan, setKeterangan] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uniqueKeterangan = Array.from(new Set(
    (attendance || [])
      .filter(a => a.keterangan && a.keterangan.trim() !== '')
      .map(a => a.keterangan.trim())
  )).sort();

  const userEmployees = employees
    .filter(e => e.role === 'user')
    .filter(e => {
        const keyword = searchQuery.toLowerCase();
        return e.nama.toLowerCase().includes(keyword) || (e.nip && e.nip.includes(keyword));
    })
    .sort((a, b) => a.nama.localeCompare(b.nama));

  useEffect(() => {
    if (selectedIds.length === 1) {
      const empId = selectedIds[0];
      const record = attendance?.find(a => a.userId === empId && a.date === date && a.session === session);
      if (record) {
        setStatus(record.status || 'Hadir');
        setKeterangan(record.keterangan || '');
      }
    } else if (selectedIds.length === 0) {
      setKeterangan('');
    }
  }, [selectedIds, date, session, attendance]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === userEmployees.length && userEmployees.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(userEmployees.map(e => e.id));
    }
  };

  const getEmployeeRecord = (empId) => {
    if (!attendance) return null;
    return attendance.find(a => 
      a.userId === empId && 
      a.date === date && 
      a.session === session
    );
  };

  const renderStatusCombined = (record) => {
    if (!record || !record.status) {
      return <span className="px-2 py-1 text-[11px] rounded bg-slate-100 text-slate-400 border border-slate-200 font-medium inline-block whitespace-nowrap">Belum Absen</span>;
    }
    
    const badgeClass = "px-2 py-0.5 text-[10px] rounded border font-bold inline-block text-center whitespace-nowrap";
    let statusBadge = null;

    switch(record.status) {
      case 'Hadir': statusBadge = <span className={`${badgeClass} bg-green-100 text-green-700 border-green-200`}>Hadir</span>; break;
      case 'Izin': statusBadge = <span className={`${badgeClass} bg-blue-100 text-blue-700 border-blue-200`}>Izin</span>; break;
      case 'Sakit': statusBadge = <span className={`${badgeClass} bg-yellow-100 text-yellow-700 border-yellow-200`}>Sakit</span>; break;
      case 'Cuti': statusBadge = <span className={`${badgeClass} bg-purple-100 text-purple-700 border-purple-200`}>Cuti</span>; break;
      case 'DL (Dinas Luar)': statusBadge = <span className={`${badgeClass} bg-indigo-100 text-indigo-700 border-indigo-200`}>DL</span>; break;
      case 'Alpa': statusBadge = <span className={`${badgeClass} bg-red-100 text-red-700 border-red-200`}>Alpa</span>; break;
      default: statusBadge = <span className={`${badgeClass} bg-gray-100 text-gray-700 border-gray-200`}>{record.status}</span>; break;
    }

    return (
      <div className="flex flex-col items-start gap-1">
        {statusBadge}
        {record.keterangan && (
          <div className="text-[10px] text-slate-500 italic leading-tight break-words max-w-[150px]">
            ({record.keterangan})
          </div>
        )}
      </div>
    );
  };

  const handleSimpanMassal = async () => {
    if (selectedIds.length === 0) return alert("Pilih minimal satu pegawai!");
    if (!confirm(`Simpan absensi ${status} untuk ${selectedIds.length} pegawai?`)) return;

    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(empId => {
        const emp = employees.find(e => e.id === empId);
        if (!emp) return;
        const existingRecord = getEmployeeRecord(empId);
        const docId = existingRecord ? existingRecord.id : `${empId}_${date}_${session}`;
        const docRef = doc(getCollectionPath('attendance'), docId);
        
        batch.set(docRef, {
          userId: empId,
          userName: emp.nama,
          userNip: emp.nip || '-',
          date: date,
          session: session,
          status: status,
          keterangan: keterangan.trim(),
          timestamp: existingRecord?.timestamp || new Date().toISOString(),
          statusApproval: 'approved',
          method: 'manual_admin'
        }, { merge: true }); 
      });
      await batch.commit();
      alert('Data absensi berhasil disimpan!');
      setSelectedIds([]);
      setKeterangan('');
    } catch (error) {
      alert("Gagal menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetMassal = async () => {
    if (selectedIds.length === 0) return alert("Pilih pegawai yang akan di-reset!");
    if (!confirm(`Hapus/Reset data absensi untuk ${selectedIds.length} pegawai terpilih?`)) return;

    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);
      let count = 0;
      selectedIds.forEach(empId => {
        const record = getEmployeeRecord(empId);
        if (record) {
          batch.delete(doc(getCollectionPath('attendance'), record.id));
          count++;
        }
      });
      if (count > 0) {
        await batch.commit();
        alert(`${count} data absensi berhasil di-reset.`);
      }
      setSelectedIds([]);
      setKeterangan('');
    } catch (error) {
      alert("Gagal mereset data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white p-6 rounded shadow-sm">
        <h2 className="text-xl font-bold mb-6 flex items-center text-slate-800">
          <UserPlus className="mr-2" /> Input & Reset Absensi Massal
        </h2>

        {/* Panel Kontrol */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 mb-6 p-4 bg-slate-50 rounded border items-end">
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold mb-1 text-slate-500">Tanggal</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded px-3 py-2 text-sm h-[38px] bg-white"/>
          </div>
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold mb-1 text-slate-500">Sesi</label>
            <select value={session} onChange={e => setSession(e.target.value)} className="w-full border rounded px-3 py-2 text-sm h-[38px] bg-white">
              <option value="Pagi">Pagi</option>
              <option value="Sore">Sore</option>
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold mb-1 text-slate-500">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border rounded px-3 py-2 text-sm h-[38px] bg-white font-medium">
              <option value="Hadir">Hadir</option>
              <option value="Izin">Izin</option>
              <option value="Sakit">Sakit</option>
              <option value="Cuti">Cuti</option>
              <option value="DL (Dinas Luar)">DL (Dinas Luar)</option>
              <option value="Alpa">Alpa</option>
            </select>
          </div>
          <div className="lg:col-span-4">
            <label className="block text-xs font-bold mb-1 text-slate-500">Keterangan (Opsional)</label>
            <div className="flex items-center bg-white border rounded px-3 py-2 h-[38px]">
              <FileText size={16} className="text-slate-400 mr-2 shrink-0"/>
              <input type="text" list="riwayat-ket" value={keterangan} onChange={e => setKeterangan(e.target.value)} placeholder="Alasan..." className="w-full outline-none text-sm bg-transparent"/>
              <datalist id="riwayat-ket">
                {uniqueKeterangan.map((ket, idx) => <option key={idx} value={ket} />)}
              </datalist>
            </div>
          </div>
          <div className="lg:col-span-2 flex gap-2">
            <button onClick={handleSimpanMassal} disabled={isSubmitting || selectedIds.length === 0} className="flex-1 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:bg-gray-300 h-[38px] flex items-center justify-center transition-all shadow-sm">
              {isSubmitting ? '...' : <><Save size={18} className="mr-2"/> Simpan</>}
            </button>
            <button onClick={handleResetMassal} disabled={isSubmitting || selectedIds.length === 0} className="bg-red-500 text-white px-3 rounded hover:bg-red-600 disabled:bg-gray-300 h-[38px] flex items-center justify-center transition-all shadow-sm">
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div className="border rounded overflow-hidden">
          <div className="bg-gray-100 p-3 flex flex-col md:flex-row justify-between items-center border-b gap-4">
            <button onClick={toggleSelectAll} className="flex items-center text-sm font-bold text-slate-600">
              {selectedIds.length === userEmployees.length && userEmployees.length > 0 ? <CheckSquare size={18} className="mr-2 text-blue-600"/> : <Square size={18} className="mr-2"/>}
              Pilih Semua ({userEmployees.length})
            </button>
            <div className="relative w-full md:w-72">
               <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
               <input type="text" placeholder="Cari nama/NIP..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border rounded outline-none bg-white"/>
            </div>
            <span className="text-sm font-bold text-blue-600">{selectedIds.length} Dipilih</span>
          </div>
          
          <div className="max-h-[450px] overflow-y-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-50 sticky top-0 shadow-sm z-10 text-slate-700 font-bold">
                <tr>
                  <th className="p-3 text-left w-12">#</th>
                  {/* Gunakan w-px agar kolom menyusut seminimal mungkin mengikuti konten */}
                  <th className="p-3 text-left w-px whitespace-nowrap">Pegawai / NIP</th>
                  <th className="p-3 text-left w-px whitespace-nowrap">Jabatan</th>
                  <th className="p-3 text-left">Status Saat Ini</th>
                </tr>
              </thead>
              <tbody>
                {userEmployees.map(emp => {
                  const isSelected = selectedIds.includes(emp.id);
                  const record = getEmployeeRecord(emp.id);
                  return (
                    <tr key={emp.id} onClick={() => toggleSelect(emp.id)} className={`cursor-pointer border-b last:border-0 hover:bg-blue-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}>
                      <td className="p-3 text-center align-middle">
                        {isSelected ? <CheckSquare size={18} className="text-blue-600 mx-auto"/> : <Square size={18} className="text-gray-300 mx-auto"/>}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-bold text-slate-800 leading-tight">{emp.nama}</div>
                        <div className="text-[10px] text-slate-400 font-mono uppercase">{emp.nip || '-'}</div>
                      </td>
                      <td className="p-3 text-slate-500 text-[11px] align-middle whitespace-nowrap">{emp.jabatan}</td>
                      <td className="p-3 align-middle">{renderStatusCombined(record)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}