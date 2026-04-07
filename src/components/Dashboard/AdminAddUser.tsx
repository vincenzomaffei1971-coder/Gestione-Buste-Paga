import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';

interface AdminAddUserProps {
  onAdd: (e: React.FormEvent) => Promise<void>;
  onQuickAdd: (e: React.FormEvent) => Promise<void>;
  adminError: string | null;
  adminSuccess: string | null;
  quickEmail: string;
  setQuickEmail: (email: string) => void;
  adminUserForm: any;
  setAdminUserForm: (form: any) => void;
}

export const AdminAddUser = ({ 
  onAdd, 
  onQuickAdd, 
  adminError, 
  adminSuccess, 
  quickEmail, 
  setQuickEmail, 
  adminUserForm, 
  setAdminUserForm 
}: AdminAddUserProps) => {
  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <header>
        <h1 className="text-4xl font-light tracking-tight mb-2">Aggiungi Utente</h1>
        <p className="text-zinc-500">Pre-autorizza un nuovo utente nel sistema.</p>
      </header>

      {adminError && <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm">{adminError}</div>}
      {adminSuccess && <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-sm">{adminSuccess}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Quick Add */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100">
          <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center mb-6">
            <UserPlus className="w-6 h-6 text-zinc-400" />
          </div>
          <h2 className="text-xl font-medium mb-2">Aggiunta Rapida</h2>
          <p className="text-sm text-zinc-400 mb-6">Autorizza solo tramite email. L'utente completerà il profilo al primo accesso.</p>
          <form onSubmit={onQuickAdd} className="space-y-4">
            <input 
              required 
              type="email" 
              value={quickEmail} 
              onChange={e => setQuickEmail(e.target.value)} 
              className="w-full bg-zinc-50 border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-black" 
              placeholder="esempio@gmail.com" 
            />
            <button className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-zinc-800 transition-colors">
              Autorizza Email
            </button>
          </form>
        </section>

        {/* Manual Profile Creation */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100">
          <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center mb-6">
            <UserPlus className="w-6 h-6 text-zinc-400" />
          </div>
          <h2 className="text-xl font-medium mb-2">Profilo Completo</h2>
          <p className="text-sm text-zinc-400 mb-6">Crea un profilo pre-compilato per l'utente.</p>
          <form onSubmit={onAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input required placeholder="Nome" value={adminUserForm.name} onChange={e => setAdminUserForm({...adminUserForm, name: e.target.value})} className="w-full bg-zinc-50 border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-black" />
              <input required placeholder="Cognome" value={adminUserForm.surname} onChange={e => setAdminUserForm({...adminUserForm, surname: e.target.value})} className="w-full bg-zinc-50 border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-black" />
            </div>
            <input required type="email" placeholder="Email" value={adminUserForm.email} onChange={e => setAdminUserForm({...adminUserForm, email: e.target.value})} className="w-full bg-zinc-50 border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-black" />
            <input required maxLength={16} placeholder="Codice Fiscale" value={adminUserForm.cf} onChange={e => setAdminUserForm({...adminUserForm, cf: e.target.value})} className="w-full bg-zinc-50 border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-black uppercase" />
            <button className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-zinc-800 transition-colors">
              Crea Profilo
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
