import React, { useState, useRef } from 'react';
import { Users, FileDown, Upload, Download, Loader, Trash2, Edit, ArrowDownCircle, FileSpreadsheet } from 'lucide-react';
import { addDoc, doc, updateDoc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import { db, getCollectionPath } from '../../lib/firebase';
import * as XLSX from 'xlsx'; // Import Library Excel

export default function AdminDataPegawai({ employees, currentUser }) {
  // 1. UPDATE STATE: Menambahkan field 'nip'
  const [form, setForm] = useState({ nama: '', nip: '', jabatan: '', role: 'user', username: '', password: '', no: '' });
  
  const [isEditing, setIsEditing] = useState(null);
  const [isInserting, setIsInserting] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const formRef = useRef(null);

  const renumberAllEmployees = async () => {
     try {
        const snapshot = await getDocs(getCollectionPath('users'));
        const allDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const userEmployees = allDocs
            .filter(e => e.role === 'user')
            .sort((a,b) => (parseFloat(a.no) || 999999) - (parseFloat(b.no) || 999999));
        
        const batch = writeBatch(db);
        userEmployees.forEach((emp, index) => {
            const newNo = (index + 1).toString();
            if (emp.no !== newNo) {
               batch.update(doc(getCollectionPath('users'), emp.id), { no: newNo });
            }
        });
        await batch.commit();
     } catch (err) { console.error(err); }
  };

  // 2. UPDATE IMPORT: Menggunakan XLSX untuk membaca file Excel
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
       try {
           const data = new Uint8Array(evt.target.result);
           const workbook = XLSX.read(data, { type: 'array' });
           
           // Ambil sheet pertama
           const sheetName = workbook.SheetNames[0];
           const worksheet = workbook.Sheets[sheetName];
           
           // Konversi ke JSON
           const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
           
           const batch = writeBatch(db);
           let count = 0;

           // Loop data dari Excel
           for (const row of jsonData) {
               // Pastikan nama kolom di Excel sesuai (Case Insensitive logic optional)
               const no = row['NO'] ? row['NO'].toString() : '';
               const nama = row['NAMA'] || '';
               const nip = row['NIP'] ? row['NIP'].toString() : ''; // Pastikan NIP jadi string
               const jabatan = row['JABATAN'] || '';

               if (nama && jabatan) {
                   // Buat username otomatis dari nama (huruf kecil, tanpa spasi/simbol)
                   const username = nama.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                   
                   batch.set(doc(getCollectionPath('users')), {
                       no, 
                       nama, 
                       nip, 
                       jabatan, 
                       username, 
                       password: '123', // Default Password
                       role: 'user'
                   });
                   count++;
               }
           }

           await batch.commit();
           alert(`Berhasil mengimpor ${count} data pegawai dari Excel.`);
           setTimeout(() => renumberAllEmployees(), 2000); // Auto renumber

       } catch (error) {
           console.error(error);
           alert("Gagal membaca file Excel. Pastikan format benar.");
       }
    };
    reader.readAsArrayBuffer(file);
  };

  // 3. UPDATE TEMPLATE: Download format .xlsx
  const downloadTemplate = () => {
    // Data contoh untuk template
    const templateData = [
        { NO: 1, NIP: "'198001012022011001", NAMA: "Contoh Nama Pegawai", JABATAN: "Staf Analis" },
        { NO: 2, NIP: "'199505052024012002", NAMA: "Budi Santoso", JABATAN: "Operator" }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TemplatePegawai");
    
    // Download file
    XLSX.writeFile(wb, "Template_Import_Pegawai.xlsx");
  };

  // 4. UPDATE EXPORT: Export data ke .xlsx
  const handleExport = () => {
    const dataToExport = employees
        .filter(e => e.role === 'user')
        .sort((a,b) => (parseFloat(a.no) || 999) - (parseFloat(b.no) || 999))
        .map(e => ({
            NO: e.no || '-',
            NIP: e.nip || '-', // Tambahkan NIP
            NAMA: e.nama,
            JABATAN: e.jabatan
        }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DataPegawai");
    
    XLSX.writeFile(wb, "Data_Pegawai_BPKAD.xlsx");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) return alert('Lengkapi data username dan password.');
    if (isSaving) return;
    setIsSaving(true);

    try {
      let dataToSave = { ...form };
      if (isEditing) {
         delete dataToSave.id; 
         await updateDoc(doc(getCollectionPath('users'), isEditing), dataToSave);
      } else {
         if (!dataToSave.no) {
             const userEmployees = employees.filter(e => e.role === 'user');
             const maxNo = userEmployees.reduce((max, emp) => {
                 const n = parseFloat(emp.no);
                 return (!isNaN(n) && n > max) ? n : max;
             }, 0);
             dataToSave.no = (maxNo + 1).toString();
         }
         await addDoc(getCollectionPath('users'), dataToSave);
      }
      // Reset form termasuk NIP
      setForm({ nama: '', nip: '', jabatan: '', role: 'user', username: '', password: '', no: '' });
      setIsEditing(null);
      setIsInserting(null);
      await renumberAllEmployees();
    } catch (err) { console.error(err); alert('Gagal menyimpan.'); } 
    finally { setIsSaving(false); }
  };

  const handleInsertClick = (referenceEmp) => {
     setIsInserting(referenceEmp.id);
     setIsEditing(null);
     const currentNo = parseFloat(referenceEmp.no) || 0;
     // Set form insert
     setForm({ 
         nama: '', 
         nip: '', // Reset NIP
         jabatan: '', 
         role: 'user', 
         username: '', 
         password: '123', 
         no: (currentNo + 0.5).toString() 
     });
     if(formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  const edit = (emp) => {
    setIsEditing(emp.id);
    setIsInserting(null);
    // Isi form edit
    setForm({ ...emp, password: emp.password || '' });
    if(formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  const remove = async (id) => {
    if (confirm('Hapus permanen?')) {
       await deleteDoc(doc(getCollectionPath('users'), id));
       await renumberAllEmployees();
    }
  };

  const handleBulkDelete = async () => {
      if (!confirm(`Hapus ${selectedIds.length} pegawai?`)) return;
      const batch = writeBatch(db);
      selectedIds.forEach(id => batch.delete(doc(getCollectionPath('users'), id)));
      await batch.commit();
      setSelectedIds([]);
      await renumberAllEmployees();
  };

  const toggleSelectOne = (id) => {
      if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(sid => sid !== id));
      else setSelectedIds([...selectedIds, id]);
  };

  const isReadOnly = currentUser.role === 'pengelola';
  const sortedEmployees = employees.filter(e => e.role === 'user').sort((a, b) => (parseFloat(a.no) || 999) - (parseFloat(b.no) || 999));

  return (
     <div className="bg-white p-6 rounded shadow-sm">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-bold flex items-center"><Users className="mr-2"/> Data Pegawai (User Biasa)</h2>
           {!isReadOnly && (
             <div className="flex gap-2">
                {selectedIds.length > 0 && (
                    <button onClick={handleBulkDelete} className="bg-red-600 text-white px-3 py-1.5 rounded text-sm flex items-center shadow-sm animate-pulse font-bold">
                       <Trash2 size={14} className="mr-1"/> Hapus ({selectedIds.length})
                    </button>
                )}
                {/* Tombol Template Excel */}
                <button onClick={downloadTemplate} className="bg-green-600 text-white px-3 py-1.5 rounded text-sm flex items-center shadow-sm hover:bg-green-700">
                   <FileDown size={14} className="mr-1"/> Template Excel
                </button>
                
                {/* Input Import Excel */}
                <label className="bg-green-600 text-white px-3 py-1.5 rounded cursor-pointer text-sm flex items-center shadow-sm hover:bg-green-700">
                   <Upload size={14} className="mr-1"/> Import Excel
                   <input 
                    type="file" 
                    accept=".xlsx, .xls" // Ubah accept ke format excel
                    hidden 
                    onChange={handleImport}
                   />
                </label>
                
                {/* Tombol Export Excel */}
                <button onClick={handleExport} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm flex items-center shadow-sm hover:bg-blue-700">
                   <FileSpreadsheet size={14} className="mr-1"/> Export Excel
                </button>
             </div>
           )}
        </div>

        {!isReadOnly && (
          <div ref={formRef} className={`p-4 rounded mb-6 border-l-4 transition-colors ${isInserting ? 'bg-green-50 border-green-500' : 'bg-slate-50 border-blue-500'}`}>
            <h3 className="font-bold text-sm mb-3">{isEditing ? 'Edit Data' : isInserting ? 'Sisip Data' : 'Tambah Baru'}</h3>
            {/* 5. UPDATE FORM LAYOUT: Menambahkan Input NIP */}
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-12 gap-3">
               <div className="md:col-span-1">
                   <label className="text-[10px] uppercase font-bold text-gray-500">No</label>
                   <input className="w-full p-2 border rounded bg-gray-100" readOnly value={form.no} />
               </div>
               
               <div className="md:col-span-3">
                   <label className="text-[10px] uppercase font-bold text-gray-500">NIP</label>
                   <input placeholder="NIP Pegawai..." className="w-full p-2 border rounded" value={form.nip} onChange={e=>setForm({...form, nip: e.target.value})} />
               </div>

               <div className="md:col-span-4">
                   <label className="text-[10px] uppercase font-bold text-gray-500">Nama</label>
                   <input placeholder="Nama Lengkap" className="w-full p-2 border rounded" required value={form.nama} onChange={e=>setForm({...form, nama: e.target.value})} />
               </div>
               
               <div className="md:col-span-4">
                   <label className="text-[10px] uppercase font-bold text-gray-500">Jabatan</label>
                   <input placeholder="Jabatan" className="w-full p-2 border rounded" required value={form.jabatan} onChange={e=>setForm({...form, jabatan: e.target.value})} />
               </div>
               
               <div className="md:col-span-4">
                   <label className="text-[10px] uppercase font-bold text-gray-500">Username</label>
                   <input placeholder="Username" className="w-full p-2 border rounded bg-yellow-50" required value={form.username} onChange={e=>setForm({...form, username: e.target.value})} />
               </div>
               
               <div className="md:col-span-4">
                   <label className="text-[10px] uppercase font-bold text-gray-500">Password</label>
                   <input placeholder="Password" className="w-full p-2 border rounded bg-yellow-50" required value={form.password} onChange={e=>setForm({...form, password: e.target.value})} />
               </div>
               
               <div className="md:col-span-4 flex gap-2 items-end">
                  <button type="button" onClick={()=>{setForm({ nama: '', nip: '', jabatan: '', role: 'user', username: '', password: '', no: '' }); setIsEditing(null); setIsInserting(null);}} className="bg-gray-400 text-white py-2 px-4 rounded font-bold w-1/3 hover:bg-gray-500">Batal</button>
                  <button disabled={isSaving} className="flex-1 bg-blue-600 text-white py-2 rounded font-bold flex justify-center items-center hover:bg-blue-700">
                     {isSaving ? <Loader className="animate-spin" size={16}/> : 'Simpan'}
                  </button>
               </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
           <table className="w-full text-sm border">
              <thead className="bg-slate-100">
                 <tr>
                    {!isReadOnly && <th className="p-2 border w-8 text-center"><input type="checkbox" /></th>}
                    <th className="p-2 border w-10 text-center">No</th>
                    {/* 6. UPDATE TABLE HEAD: Tambah Header NIP */}
                    <th className="p-2 border text-left">NIP</th>
                    <th className="p-2 border text-left">Nama</th>
                    <th className="p-2 border text-left">Jabatan</th>
                    <th className="p-2 border text-left">Role</th>
                    {!isReadOnly && <th className="p-2 border w-32 text-center">Aksi</th>}
                 </tr>
              </thead>
              <tbody>
                 {sortedEmployees.map((emp) => (
                    <tr key={emp.id} className={`hover:bg-slate-50 ${selectedIds.includes(emp.id) ? 'bg-blue-50' : ''}`}>
                       {!isReadOnly && <td className="p-2 border text-center"><input type="checkbox" checked={selectedIds.includes(emp.id)} onChange={() => toggleSelectOne(emp.id)}/></td>}
                       <td className="p-2 border text-center font-bold">{emp.no}</td>
                       
                       {/* 7. UPDATE TABLE BODY: Tampilkan Data NIP */}
                       <td className="p-2 border font-mono text-slate-600">{emp.nip || '-'}</td>
                       
                       <td className="p-2 border font-medium">{emp.nama}</td>
                       <td className="p-2 border">{emp.jabatan}</td>
                       <td className="p-2 border uppercase text-xs font-bold">{emp.role}</td>
                       {!isReadOnly && (
                         <td className="p-2 border text-center flex justify-center gap-1">
                            <button onClick={()=>handleInsertClick(emp)} className="text-green-600 hover:bg-green-100 p-1 rounded" title="Sisip Data"><ArrowDownCircle size={16}/></button>
                            <button onClick={()=>edit(emp)} className="text-blue-600 hover:bg-blue-100 p-1 rounded" title="Edit"><Edit size={16}/></button>
                            <button onClick={()=>remove(emp.id)} className="text-red-600 hover:bg-red-100 p-1 rounded" title="Hapus"><Trash2 size={16}/></button>
                         </td>
                       )}
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
     </div>
  );
}