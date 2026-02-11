import React, { useState } from 'react';
import { DEFAULT_LOGO_URL } from '../../utils/helpers';

export default function LoginPage({ onLogin, settings }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const displayLogo = settings.logoUrl || DEFAULT_LOGO_URL;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-200 p-4" style={{
      backgroundImage: `url('https://www.transparenttextures.com/patterns/cubes.png')`
    }}>
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-8 border-blue-600">
        <div className="text-center mb-8">
           <div className="h-24 w-full flex items-center justify-center mb-4">
              <img src={displayLogo} alt="Logo" className="max-h-full object-contain drop-shadow-md"/>
           </div>
           <h1 className="text-xl font-bold uppercase text-blue-900 tracking-wider">Aplikasi Absensi</h1>
           <p className="text-sm font-semibold text-slate-600 uppercase">{settings.opdName}</p>
        </div>
        <form onSubmit={e => { e.preventDefault(); onLogin(u,p); }} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
            <input className="w-full p-3 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              value={u} onChange={e=>setU(e.target.value)} placeholder="Username" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
            <input type="password" className="w-full p-3 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              value={p} onChange={e=>setP(e.target.value)} placeholder="Password" />
          </div>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded shadow-lg transition-transform transform hover:scale-105 active:scale-95">
            LOGIN APLIKASI
          </button>
        </form>
        <div className="mt-6 text-center text-xs text-gray-400">
           © {new Date().getFullYear()} {settings.opdShort} Taliabu
        </div>
      </div>
    </div>
  );
}