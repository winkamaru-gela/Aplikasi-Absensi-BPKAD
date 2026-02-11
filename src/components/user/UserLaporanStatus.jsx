import React from 'react';
import { formatDateIndo } from '../../utils/helpers';

export default function UserLaporanStatus({ user, attendance }) {
   const myLogs = attendance.filter(l => l.userId === user.id).sort((a,b) => b.timestamp?.localeCompare(a.timestamp));
   return (
      <div className="bg-white p-6 rounded shadow">
         <h2 className="text-xl font-bold mb-4">Status Laporan Absensi</h2>
         {myLogs.length === 0 ? <p className="text-slate-500">Belum ada riwayat.</p> : (
            <div className="space-y-3">
               {myLogs.map(l => (
                  <div key={l.id} className="border p-4 rounded flex justify-between items-center bg-slate-50">
                     <div>
                        <div className="font-bold">{formatDateIndo(l.date)} ({l.session})</div>
                        <div className="text-sm">Status: {l.status}</div>
                     </div>
                     <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                        ${l.statusApproval === 'approved' ? 'bg-green-100 text-green-700' : 
                          l.statusApproval === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {l.statusApproval}
                     </span>
                  </div>
               ))}
            </div>
         )}
      </div>
   );
}