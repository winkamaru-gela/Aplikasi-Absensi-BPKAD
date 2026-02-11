import React from 'react';
import { CheckCircle } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { db, getCollectionPath } from '../../lib/firebase';
import { formatDateIndo } from '../../utils/helpers';

export default function AdminTerimaAbsensi({ employees, attendance }) {
  const pending = attendance.filter(l => l.statusApproval === 'pending').sort((a,b) => b.timestamp?.localeCompare(a.timestamp));

  const process = async (id, status) => {
     await updateDoc(doc(getCollectionPath('attendance'), id), { statusApproval: status });
  };

  return (
    <div className="bg-white p-6 rounded shadow-sm">
       <h2 className="text-xl font-bold mb-4 flex items-center"><CheckCircle className="mr-2"/> Terima Absensi Masuk</h2>
       
       {pending.length === 0 ? (
          <div className="text-center p-8 bg-slate-50 text-slate-500 rounded border border-dashed">
             Tidak ada absensi baru yang menunggu persetujuan.
          </div>
       ) : (
          <div className="grid gap-4">
             {pending.map(log => (
                <div key={log.id} className="border p-4 rounded bg-yellow-50 flex justify-between items-center shadow-sm">
                   <div>
                      <div className="font-bold text-lg">{log.userName}</div>
                      <div className="text-sm text-slate-600">
                         {formatDateIndo(log.date)} • Sesi {log.session} • <span className="font-bold text-blue-600">{log.status}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                         Dikirim: {new Date(log.timestamp).toLocaleString()}
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={()=>process(log.id, 'rejected')} className="bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200 font-bold text-sm transition-colors">Tolak</button>
                      <button onClick={()=>process(log.id, 'approved')} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-bold text-sm shadow transition-colors">Terima</button>
                   </div>
                </div>
             ))}
          </div>
       )}
    </div>
  );
}