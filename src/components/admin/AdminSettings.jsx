import React, { useState, useEffect, useRef } from 'react';
import { UserCheck, Trash2, Plus, Shield, Users, Printer, Save, Lock, Upload, FileDown, Edit, X, CheckSquare } from 'lucide-react';
import { updateDoc, doc, addDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { db, getCollectionPath } from '../../lib/firebase';
import { formatDateIndo, DEFAULT_LOGO_URL } from '../../utils/helpers';
import * as XLSX from 'xlsx'; // Pastikan library ini sudah terinstall

// ============================================================================
// 1. MAIN COMPONENT: ADMIN SETTINGS (CONTAINER)
// ============================================================================
export default function AdminSettings({ settings, holidays, employees, user }) {
  const [activeTab, setActiveTab] = useState('setup');
  const isReadOnly = user.role === 'pengelola';

  return (
    <div className="bg-white p-6 rounded shadow-sm">
       {isReadOnly && (
         <div className="bg-yellow-100 text-yellow-800 p-2 text-sm rounded mb-4 border border-yellow-200">
            <strong>Mode Pengelola:</strong> Akses Pengaturan Dibatasi (Read Only).
         </div>
       )}

       {/* TAB NAVIGATION */}
       <div className="flex border-b mb-6 print:hidden overflow-x-auto">
          <TabButton id="setup" label="Instansi & Aplikasi" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton id="hari_libur" label="Hari Libur" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton id="user" label="Manajemen User" activeTab={activeTab} onClick={setActiveTab} />
       </div>

       {/* TAB CONTENT RENDERER */}
       <div className="min-h-[400px]">
          {activeTab === 'setup' && (
             <TabSetup settings={settings} isReadOnly={isReadOnly} />
          )}
          
          {activeTab === 'hari_libur' && (
             <TabHolidays holidays={holidays} isReadOnly={isReadOnly} />
          )}

          {activeTab === 'user' && (
             <TabUserManagement employees={employees} user={user} settings={settings} isReadOnly={isReadOnly} />
          )}
       </div>
    </div>
  );
}

// Helper: Tombol Tab Sederhana
const TabButton = ({ id, label, activeTab, onClick }) => (
  <button 
    onClick={() => onClick(id)} 
    className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap
      ${activeTab === id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-400 hover:text-slate-600'}
    `}
  >
    {label}
  </button>
);


// ============================================================================
// 2. SUB-COMPONENT: TAB SETUP (Pengaturan OPD)
// ============================================================================
function TabSetup({ settings, isReadOnly }) {
  const [form, setForm] = useState(settings);

  useEffect(() => { setForm(settings); }, [settings]);

  const handleSave = async () => {
    if(isReadOnly) return;
    try {
        await updateDoc(doc(getCollectionPath('settings'), settings.id), form);
        alert('Pengaturan Instansi berhasil disimpan.');
    } catch (error) {
        console.error(error);
        alert('Gagal menyimpan pengaturan.');
    }
  };

  const handleLogoUpload = (e) => {
    if(isReadOnly) return;
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm({...form, logoUrl: reader.result});
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-3xl space-y-5 print:hidden animate-in fade-in duration-300">
        {/* IDENTITAS INSTANSI */}
        <div className="space-y-4">
             <div>
                <label className="font-bold text-xs uppercase block mb-1 text-slate-500">Nama OPD (Lengkap)</label>
                <input disabled={isReadOnly} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100" value={form.opdName} onChange={e=>setForm({...form, opdName: e.target.value})}/>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="font-bold text-xs uppercase block mb-1 text-slate-500">Nama Pendek / Singkatan</label>
                    <input disabled={isReadOnly} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100" value={form.opdShort} onChange={e=>setForm({...form, opdShort: e.target.value})}/>
                </div>
                <div>
                    <label className="font-bold text-xs uppercase block mb-1 text-slate-500">Instansi Induk (Pemkab)</label>
                    <input disabled={isReadOnly} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100" value={form.parentAgency} onChange={e=>setForm({...form, parentAgency: e.target.value})}/>
                </div>
             </div>
             <div>
                <label className="font-bold text-xs uppercase block mb-1 text-slate-500">Alamat Kantor</label>
                <textarea disabled={isReadOnly} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100" rows={2} value={form.address} onChange={e=>setForm({...form, address: e.target.value})}/>
             </div>
        </div>
        
        {/* DATA PIMPINAN */}
        <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 shadow-sm">
             <h3 className="font-bold text-sm text-blue-800 mb-4 uppercase flex items-center border-b border-blue-200 pb-2">
                <UserCheck className="mr-2" size={18}/> Data Pimpinan (Penandatangan Laporan)
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="font-bold text-[10px] uppercase block mb-1 text-blue-900">Nama Pimpinan</label>
                    <input disabled={isReadOnly} className="w-full border p-2 rounded disabled:bg-gray-100" value={form.kepalaName || ''} onChange={e=>setForm({...form, kepalaName: e.target.value})}/>
                </div>
                <div>
                    <label className="font-bold text-[10px] uppercase block mb-1 text-blue-900">NIP</label>
                    <input disabled={isReadOnly} className="w-full border p-2 rounded disabled:bg-gray-100" value={form.kepalaNip || ''} onChange={e=>setForm({...form, kepalaNip: e.target.value})}/>
                </div>
                <div>
                    <label className="font-bold text-[10px] uppercase block mb-1 text-blue-900">Jabatan Pimpinan</label>
                    <input disabled={isReadOnly} className="w-full border p-2 rounded disabled:bg-gray-100" value={form.kepalaJabatan || ''} onChange={e=>setForm({...form, kepalaJabatan: e.target.value})}/>
                </div>
                <div>
                    <label className="font-bold text-[10px] uppercase block mb-1 text-blue-900">Titimangsa (Tempat Ttd)</label>
                    <input disabled={isReadOnly} className="w-full border p-2 rounded disabled:bg-gray-100" value={form.titimangsa || 'Bobong'} onChange={e=>setForm({...form, titimangsa: e.target.value})}/>
                </div>
             </div>
        </div>

        {/* LOGO */}
        <div className="bg-slate-50 p-4 rounded border flex items-start gap-4">
            <div className="w-20 h-20 bg-white border rounded flex items-center justify-center p-1 shadow-sm">
                <img src={form.logoUrl || DEFAULT_LOGO_URL} className="max-w-full max-h-full object-contain" alt="Logo"/>
            </div>
            <div className="flex-1">
                <label className="font-bold text-xs uppercase block mb-1">Logo Aplikasi</label>
                <input disabled={isReadOnly} type="text" placeholder="URL Gambar..." className="w-full p-2 border rounded mb-2 text-xs disabled:bg-gray-100" value={form.logoUrl} onChange={e=>setForm({...form, logoUrl: e.target.value})}/>
                {!isReadOnly && (
                    <label className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold cursor-pointer hover:bg-slate-100">
                        <Upload size={14} className="mr-2"/> Upload Logo Baru
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden"/>
                    </label>
                )}
                <p className="text-[10px] text-gray-500 mt-1">Disarankan menggunakan gambar transparan (PNG).</p>
            </div>
        </div>

        {!isReadOnly && (
            <div className="pt-4 border-t">
                <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg shadow-lg font-bold flex items-center">
                    <Save size={18} className="mr-2"/> Simpan Pengaturan
                </button>
            </div>
        )}
    </div>
  );
}


// ============================================================================
// 3. SUB-COMPONENT: TAB HOLIDAYS (Hari Libur) - UPDATE: CHECKLIST & AUTO WIDTH
// ============================================================================
function TabHolidays({ holidays, isReadOnly }) {
  const [holForm, setHolForm] = useState({ date: '', desc: '' });
  const [editingId, setEditingId] = useState(null); 
  const [selectedIds, setSelectedIds] = useState([]); // STATE UNTUK CEKLIST
  const formRef = useRef(null); 

  // --- LOGIKA SIMPAN & EDIT ---
  const saveHol = async () => {
     if(isReadOnly) return;
     if(!holForm.date || !holForm.desc) {
         alert("Mohon isi tanggal dan keterangan.");
         return;
     }

     try {
        if (editingId) {
            await updateDoc(doc(getCollectionPath('holidays'), editingId), {
                date: holForm.date,
                desc: holForm.desc
            });
            alert("Perubahan disimpan.");
        } else {
            await addDoc(getCollectionPath('holidays'), holForm);
            alert("Hari libur berhasil ditambahkan.");
        }
        setHolForm({ date: '', desc: '' });
        setEditingId(null);
     } catch (e) { 
         console.error(e);
         alert("Terjadi kesalahan saat menyimpan."); 
     }
  };

  const editHol = (holiday) => {
      setHolForm({ date: holiday.date, desc: holiday.desc });
      setEditingId(holiday.id);
      if(formRef.current) {
          formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
  };

  const cancelEdit = () => {
      setHolForm({ date: '', desc: '' });
      setEditingId(null);
  };

  const delHol = async(id) => {
     if(isReadOnly) return;
     if(confirm("Hapus hari libur ini?")) {
        await deleteDoc(doc(getCollectionPath('holidays'), id));
     }
  };

  // --- LOGIKA HAPUS MASAL (BULK DELETE) ---
  const handleBulkDelete = async () => {
      if(isReadOnly) return;
      if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} data hari libur yang dipilih? Tindakan ini tidak dapat dibatalkan.`)) return;

      try {
          const batch = writeBatch(db);
          selectedIds.forEach(id => {
              batch.delete(doc(getCollectionPath('holidays'), id));
          });
          await batch.commit();
          setSelectedIds([]); // Reset pilihan
          alert("Data terpilih berhasil dihapus.");
      } catch (error) {
          console.error(error);
          alert("Gagal menghapus data masal.");
      }
  };

  const toggleSelectAll = () => {
      if (selectedIds.length === holidays.length) {
          setSelectedIds([]); // Uncheck all
      } else {
          setSelectedIds(holidays.map(h => h.id)); // Check all
      }
  };

  const toggleSelectOne = (id) => {
      if (selectedIds.includes(id)) {
          setSelectedIds(selectedIds.filter(sid => sid !== id));
      } else {
          setSelectedIds([...selectedIds, id]);
      }
  };
  
  // EXPORT EXCEL
  const exportHol = () => {
     const data = holidays.map(h => ({ Tanggal: h.date, Keterangan: h.desc }));
     const ws = XLSX.utils.json_to_sheet(data);
     const wb = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb, ws, "Libur");
     XLSX.writeFile(wb, "Agenda_Libur.xlsx");
  };
  
  // IMPORT EXCEL
  const importHol = (e) => {
     if(isReadOnly) return;
     const file = e.target.files[0];
     if(!file) return;

     const reader = new FileReader();
     reader.onload = async (evt) => {
        try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet); 

            if (jsonData.length === 0) {
                alert("File Excel kosong atau format salah.");
                return;
            }

            const batch = writeBatch(db);
            let count = 0;
            jsonData.forEach(row => {
               const date = row['Tanggal'] || row['tanggal'] || row['DATE'];
               const desc = row['Keterangan'] || row['keterangan'] || row['DESC'];
               if(date && desc) {
                  batch.set(doc(getCollectionPath('holidays')), { 
                      date: date.toString().trim(), 
                      desc: desc.toString().trim() 
                  });
                  count++;
               }
            });
            await batch.commit();
            alert(`Berhasil mengimpor ${count} hari libur.`);
        } catch (error) {
            console.error(error);
            alert("Gagal membaca file Excel.");
        }
     };
     reader.readAsArrayBuffer(file);
  };

  return (
    <div className="print:hidden w-full animate-in fade-in duration-300">
         
         {/* FORM INPUT/EDIT */}
         <div ref={formRef} className={`mb-6 p-4 rounded-lg border transition-colors ${editingId ? 'bg-yellow-50 border-yellow-300' : 'bg-slate-50 border-slate-200'}`}>
             <h3 className={`font-bold mb-3 flex items-center ${editingId ? 'text-yellow-800' : 'text-slate-700'}`}>
                 {editingId ? <><Edit size={16} className="mr-2"/> Edit Hari Libur</> : <><Plus size={16} className="mr-2"/> Tambah Hari Libur / Cuti Bersama</>}
             </h3>
             {!isReadOnly ? (
               <div className="flex flex-col md:flex-row gap-2">
                  <input 
                    type="date" 
                    className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={holForm.date} 
                    onChange={e=>setHolForm({...holForm, date: e.target.value})}
                  />
                  <input 
                    placeholder="Keterangan (Misal: HUT RI ke-80)" 
                    className="border p-2 rounded flex-1 focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={holForm.desc} 
                    onChange={e=>setHolForm({...holForm, desc: e.target.value})}
                  />
                  
                  {editingId ? (
                      <>
                        <button onClick={saveHol} className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded font-bold flex items-center shadow">
                            <Save size={16} className="mr-1"/> Simpan
                        </button>
                        <button onClick={cancelEdit} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded font-bold flex items-center shadow">
                            <X size={16} className="mr-1"/> Batal
                        </button>
                      </>
                  ) : (
                      <button onClick={saveHol} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold flex items-center shadow">
                          <Plus size={16} className="mr-1"/> Tambah
                      </button>
                  )}
               </div>
             ) : <p className="text-sm italic text-gray-500">Mode baca saja.</p>}
         </div>

         {/* ACTION BAR: EXPORT/IMPORT & BULK DELETE */}
         <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
            <h3 className="font-bold text-lg flex items-center gap-2">
                Daftar Agenda Libur 
                <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full">{holidays.length}</span>
            </h3>
            
            <div className="flex gap-2 text-xs flex-wrap">
                {/* Tombol Hapus Masal Muncul Jika Ada Seleksi */}
                {selectedIds.length > 0 && !isReadOnly && (
                    <button onClick={handleBulkDelete} className="bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 flex items-center shadow-sm animate-pulse font-bold">
                        <Trash2 size={14} className="mr-1"/> Hapus ({selectedIds.length})
                    </button>
                )}

                <button onClick={exportHol} className="bg-white border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-50 flex items-center shadow-sm text-green-700 font-bold">
                    <FileDown size={14} className="mr-1"/> Template Excel
                </button>
                {!isReadOnly && (
                    <label className="bg-green-600 text-white px-3 py-1.5 rounded cursor-pointer hover:bg-green-700 flex items-center shadow-sm font-bold">
                        <Upload size={14} className="mr-1"/> Import Excel 
                        <input type="file" accept=".xlsx, .xls" hidden onChange={importHol}/>
                    </label>
                )}
            </div>
         </div>

         {/* TABEL DATA */}
         <div className="border rounded-lg overflow-x-auto shadow-sm">
             <table className="w-full text-sm min-w-[600px]">
                 <thead className="bg-slate-100">
                     <tr>
                         {!isReadOnly && (
                             <th className="p-3 border-b w-10 text-center">
                                 <input 
                                    type="checkbox" 
                                    className="cursor-pointer"
                                    onChange={toggleSelectAll} 
                                    checked={selectedIds.length === holidays.length && holidays.length > 0}
                                 />
                             </th>
                         )}
                         {/* UPDATE: Lebar otomatis menyesuaikan konten */}
                         <th className="p-3 text-left border-b w-auto whitespace-nowrap">Tanggal</th>
                         <th className="p-3 text-left border-b w-full">Keterangan</th>
                         <th className="p-3 border-b w-24 text-center">Aksi</th>
                     </tr>
                 </thead>
                 <tbody className="bg-white divide-y">
                    {holidays.length === 0 && <tr><td colSpan={isReadOnly ? 3 : 4} className="p-4 text-center italic text-gray-500">Belum ada data hari libur.</td></tr>}
                    
                    {holidays.sort((a,b) => a.date.localeCompare(b.date)).map(h => (
                       <tr key={h.id} className={`hover:bg-slate-50 transition-colors ${editingId === h.id ? 'bg-yellow-50' : ''} ${selectedIds.includes(h.id) ? 'bg-blue-50' : ''}`}>
                          {!isReadOnly && (
                              <td className="p-3 text-center">
                                  <input 
                                    type="checkbox" 
                                    className="cursor-pointer"
                                    checked={selectedIds.includes(h.id)} 
                                    onChange={() => toggleSelectOne(h.id)}
                                  />
                              </td>
                          )}
                          <td className="p-3 font-mono text-slate-700 whitespace-nowrap font-bold">
                              {formatDateIndo(h.date)}
                          </td>
                          <td className="p-3 font-medium text-slate-600">{h.desc}</td>
                          <td className="p-3 text-center flex justify-center gap-1">
                              {!isReadOnly && (
                                  <>
                                    <button onClick={()=>editHol(h)} className="text-blue-600 hover:bg-blue-100 p-1.5 rounded transition-colors border border-blue-200" title="Edit">
                                        <Edit size={16}/>
                                    </button>
                                    <button onClick={()=>delHol(h.id)} className="text-red-500 hover:bg-red-100 p-1.5 rounded transition-colors border border-red-200" title="Hapus">
                                        <Trash2 size={16}/>
                                    </button>
                                  </>
                              )}
                          </td>
                       </tr>
                    ))}
                 </tbody>
             </table>
         </div>
    </div>
  );
}


// ============================================================================
// 4. SUB-COMPONENT: TAB USER MANAGEMENT
// ============================================================================
function TabUserManagement({ employees, user, settings, isReadOnly }) {
  const [newUserForm, setNewUserForm] = useState({ nama: '', jabatan: 'Staf Khusus', username: '', password: '', role: 'operator' });

  const updateUserCreds = async (id, newU, newP, newRole) => {
     if(isReadOnly) return;
     const updateData = { username: newU, password: newP };
     if (newRole) updateData.role = newRole;
     try {
         await updateDoc(doc(getCollectionPath('users'), id), updateData);
         alert("Data user berhasil diperbarui.");
     } catch (e) { alert("Gagal update user."); }
  };

  const handleAddSystemUser = async (e) => {
      e.preventDefault();
      if(isReadOnly) return;
      try {
          const userData = { ...newUserForm, no: '999' };
          await addDoc(getCollectionPath('users'), userData);
          setNewUserForm({ nama: '', jabatan: 'Staf Khusus', username: '', password: '', role: 'operator' });
          alert("User manajemen berhasil ditambahkan!");
      } catch (error) { console.error(error); }
  };

  const usersToPrint = employees.filter(e => e.role === 'user').sort((a,b) => (parseInt(a.no)||999) - (parseInt(b.no)||999));

  return (
    <div className="animate-in fade-in duration-300">
         {/* SECTION 1: FORM TAMBAH USER SISTEM (Khusus Admin) */}
         <div className="print:hidden">
             {!isReadOnly && user.role === 'admin' && (
                 <div className="bg-blue-50 p-5 mb-8 rounded-lg border border-blue-200 shadow-sm">
                     <h3 className="font-bold text-sm text-blue-800 mb-4 uppercase flex items-center border-b border-blue-200 pb-2">
                         <Plus className="mr-2" size={16}/> Tambah User Sistem (Non-Pegawai)
                     </h3>
                     <form onSubmit={handleAddSystemUser} className="grid grid-cols-1 md:grid-cols-6 gap-4 text-xs">
                         <div className="col-span-2">
                             <label className="font-bold block mb-1">Nama Lengkap</label>
                             <input className="w-full border p-2 rounded focus:ring-1 focus:ring-blue-500" placeholder="Nama..." value={newUserForm.nama} onChange={e=>setNewUserForm({...newUserForm, nama: e.target.value})} />
                         </div>
                         <div className="col-span-2">
                             <label className="font-bold block mb-1">Username Login</label>
                             <input className="w-full border p-2 rounded focus:ring-1 focus:ring-blue-500" placeholder="Username..." value={newUserForm.username} onChange={e=>setNewUserForm({...newUserForm, username: e.target.value})} />
                         </div>
                         <div className="col-span-2">
                             <label className="font-bold block mb-1">Password</label>
                             <input className="w-full border p-2 rounded focus:ring-1 focus:ring-blue-500" placeholder="Password..." value={newUserForm.password} onChange={e=>setNewUserForm({...newUserForm, password: e.target.value})} />
                         </div>
                         <div className="col-span-2">
                             <label className="font-bold block mb-1">Hak Akses (Role)</label>
                             <select className="w-full border p-2 rounded bg-white" value={newUserForm.role} onChange={e=>setNewUserForm({...newUserForm, role: e.target.value})}>
                                 <option value="operator">OPERATOR (Input & Kelola)</option>
                                 <option value="pengelola">PENGELOLA (Hanya Lihat)</option>
                                 <option value="admin">ADMIN (Akses Penuh)</option>
                             </select>
                         </div>
                         <div className="col-span-1">
                             <label className="font-bold block mb-1">Jabatan</label>
                             <input className="w-full border p-2 rounded" placeholder="Jabatan..." value={newUserForm.jabatan} onChange={e=>setNewUserForm({...newUserForm, jabatan: e.target.value})} />
                         </div>
                         <div className="col-span-3 flex items-end">
                             <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-bold transition-colors shadow">TAMBAH USER BARU</button>
                         </div>
                     </form>
                 </div>
             )}

             {/* SECTION 2: TABEL USER SISTEM */}
             <div className="mb-10">
                <div className="bg-indigo-50 p-3 text-sm text-indigo-900 rounded-t-lg border-x border-t border-indigo-200 flex items-center font-bold">
                    <Shield className="mr-2" size={16}/>
                    <span>Daftar User Sistem (Admin / Operator / Pengelola)</span>
                </div>
                <div className="overflow-x-auto border-x border-b border-indigo-200 rounded-b-lg shadow-sm">
                    <table className="w-full text-sm">
                       <thead className="bg-indigo-100 text-indigo-900">
                          <tr>
                             <th className="p-3 text-left">Nama</th>
                             <th className="p-3 text-left">Role (Hak Akses)</th>
                             <th className="p-3 text-left">Username</th>
                             <th className="p-3 text-left">Password</th>
                             <th className="p-3 text-center">Simpan</th>
                          </tr>
                       </thead>
                       <tbody className="bg-white divide-y">
                          {employees.filter(e => e.role !== 'user').map(u => (
                             <UserRow key={u.id} targetUser={u} currentUser={user} onSave={updateUserCreds} isReadOnly={isReadOnly} />
                          ))}
                       </tbody>
                    </table>
                </div>
             </div>

             {/* SECTION 3: TABEL AKUN PEGAWAI */}
             <div>
                <div className="flex justify-between items-center mb-2">
                    <div className="bg-yellow-50 p-3 text-sm text-yellow-900 rounded-lg border border-yellow-200 flex items-center font-bold flex-1">
                        <Users className="mr-2" size={16}/>
                        <span>Akun Login Pegawai (Data Pegawai)</span>
                    </div>
                     {!isReadOnly && (
                         <button onClick={()=>window.print()} className="bg-slate-800 text-white px-4 py-2 rounded flex items-center hover:bg-black text-sm ml-2 shadow transition-transform hover:scale-105">
                            <Printer size={16} className="mr-2"/> Cetak Data Akun
                         </button>
                     )}
                </div>
                <div className="overflow-x-auto border rounded-lg shadow-sm">
                    <table className="w-full text-sm">
                       <thead className="bg-slate-100 text-slate-700">
                          <tr>
                             <th className="p-3 text-left">Nama</th>
                             <th className="p-3 text-left">Role</th>
                             <th className="p-3 text-left">Username</th>
                             <th className="p-3 text-left">Password</th>
                             <th className="p-3 text-center">Simpan</th>
                          </tr>
                       </thead>
                       <tbody className="bg-white divide-y">
                          {employees.filter(e => e.role === 'user').sort((a,b) => (parseInt(a.no)||999) - (parseInt(b.no)||999)).map(u => (
                             <UserRow key={u.id} targetUser={u} currentUser={user} onSave={updateUserCreds} isReadOnly={isReadOnly} />
                          ))}
                       </tbody>
                    </table>
                </div>
             </div>
         </div>

         {/* PRINT VIEW (Hanya muncul saat CTRL+P) */}
         <div className="hidden print:block">
            <div className="flex border-b-2 border-black pb-4 mb-6 items-center justify-center relative">
                <img src={settings.logoUrl || DEFAULT_LOGO_URL} className="h-20 absolute left-0" alt="Logo"/>
                <div className="text-center px-20">
                   <h3 className="text-xl font-bold uppercase">{settings.parentAgency}</h3>
                   <h1 className="text-xl font-bold uppercase">{settings.opdName}</h1>
                   <p className="text-sm italic">{settings.address}</p>
                </div>
            </div>
            <div className="text-center mb-6"><h2 className="text-lg font-bold uppercase underline">DATA AKUN PENGGUNA (PEGAWAI)</h2></div>
            <table className="w-full border-collapse border border-black text-sm">
               <thead>
                  <tr className="bg-gray-100">
                     <th className="border border-black p-2 w-12 text-center">No</th>
                     <th className="border border-black p-2 text-left">Nama Pegawai</th>
                     <th className="border border-black p-2 text-left">Jabatan</th>
                     <th className="border border-black p-2 text-left">Username</th>
                     <th className="border border-black p-2 text-left">Password</th>
                  </tr>
               </thead>
               <tbody>
                  {usersToPrint.map((u, i) => (
                     <tr key={u.id}>
                        <td className="border border-black p-2 text-center">{i + 1}</td>
                        <td className="border border-black p-2 font-bold">{u.nama}</td>
                        <td className="border border-black p-2">{u.jabatan}</td>
                        <td className="border border-black p-2 font-mono">{u.username}</td>
                        <td className="border border-black p-2 font-mono">{u.password}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
    </div>
  );
}


// ============================================================================
// 5. HELPER COMPONENT: USER ROW
// ============================================================================
function UserRow({ targetUser, currentUser, onSave, isReadOnly }) {
   const [u, setU] = useState(targetUser.username);
   const [p, setP] = useState(targetUser.password);
   const [r, setR] = useState(targetUser.role || 'user');
   const [changed, setChanged] = useState(false);

   let canEdit = !isReadOnly && (currentUser.role === 'admin' || (currentUser.role === 'operator' && targetUser.role !== 'admin'));
   const showPassword = currentUser.role === 'admin' || targetUser.role !== 'admin';
   const canEditRole = !isReadOnly && currentUser.role === 'admin';

   const handleChange = (type, val) => {
      if(type === 'u') setU(val); 
      else if(type === 'p') setP(val);
      else setR(val);
      setChanged(true);
   };

   return (
      <tr className={`hover:bg-slate-50 transition-colors ${targetUser.id === currentUser.id ? 'bg-blue-50' : ''}`}>
         <td className="p-3">
            <div className="font-bold text-slate-700">{targetUser.nama}</div>
            {targetUser.id === currentUser.id && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold inline-block mt-1">AKUN SAYA</span>}
            {targetUser.role !== 'user' && <div className="text-[10px] text-gray-500 italic mt-0.5">{targetUser.jabatan}</div>}
         </td>
         <td className="p-3">
            {canEditRole ? (
                <select className="border p-1.5 rounded w-full text-xs font-bold uppercase bg-white focus:ring-1 focus:ring-blue-500 outline-none" value={r} onChange={e=>handleChange('r', e.target.value)}>
                    <option value="user">USER (Pegawai)</option>
                    <option value="operator">OPERATOR</option>
                    <option value="pengelola">PENGELOLA</option>
                    <option value="admin">ADMIN</option>
                </select>
            ) : (
                <span className={`uppercase text-[10px] font-bold px-2 py-1 rounded border
                    ${targetUser.role === 'admin' ? 'bg-red-50 text-red-700 border-red-200' : 
                      targetUser.role === 'operator' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                      targetUser.role === 'pengelola' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                    {targetUser.role}
                </span>
            )}
         </td>
         <td className="p-3">
            <input 
               className={`border p-1.5 rounded w-full font-mono text-xs ${!canEdit ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white focus:ring-1 focus:ring-blue-500 outline-none'}`} 
               value={u} 
               onChange={e=>handleChange('u', e.target.value)}
               disabled={!canEdit}
            />
         </td>
         <td className="p-3">
            <input 
               className={`border p-1.5 rounded w-full font-mono text-xs ${!canEdit ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white focus:ring-1 focus:ring-blue-500 outline-none'}`} 
               value={showPassword ? p : '******'} 
               onChange={e=>handleChange('p', e.target.value)}
               disabled={!canEdit}
               type="text" 
            />
         </td>
         <td className="p-3 text-center align-middle">
            {changed && canEdit && (
               <button onClick={() => { onSave(targetUser.id, u, p, r); setChanged(false); }} className="text-green-600 hover:bg-green-100 p-2 rounded bg-green-50 shadow-sm border border-green-200 transition-all hover:scale-110" title="Simpan Perubahan">
                  <Save size={18}/>
               </button>
            )}
            {!canEdit && <Lock size={16} className="mx-auto text-gray-300"/>}
         </td>
      </tr>
   );
}