import React, { useState } from 'react';
import { UserProfile, Worker } from '../../types';

interface AddWorkerFormProps {
  profile: UserProfile;
  onAdd: (workerData: Omit<Worker, 'id' | 'managerId'>) => Promise<void>;
  onCancel: () => void;
  formError: string | null;
  setFormError: (error: string | null) => void;
}

export const AddWorkerForm = ({ profile, onAdd, onCancel, formError, setFormError }: AddWorkerFormProps) => {
  const [newWorker, setNewWorker] = useState({ 
    name: '', 
    surname: '', 
    cf: '', 
    relationshipNumber: '', 
    title: '',
    level: 'A' as 'A' | 'B' | 'C' | 'D',
    isSuper: false,
    contractHoursPerWeek: 40,
    employerName: profile.name || '',
    employerSurname: profile.surname || '',
    employerCf: profile.cf || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAdd(newWorker);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onCancel} className="text-zinc-400 hover:text-black mb-6 flex items-center gap-2 text-sm">
        ← Annulla
      </button>
      <h1 className="text-4xl font-light tracking-tight mb-8">Nuovo Lavoratore</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 space-y-6">
        {formError && (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Titolo Rapporto (es. Colf, Badante)</label>
            <input 
              required
              value={newWorker.title}
              onChange={e => setNewWorker({...newWorker, title: e.target.value})}
              className="w-full bg-zinc-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-black outline-none"
              placeholder="Es. Collaboratrice Familiare"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Nome Lavoratore</label>
            <input 
              required
              value={newWorker.name}
              onChange={e => setNewWorker({...newWorker, name: e.target.value})}
              className="w-full bg-zinc-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-black outline-none"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Cognome Lavoratore</label>
            <input 
              required
              value={newWorker.surname}
              onChange={e => setNewWorker({...newWorker, surname: e.target.value})}
              className="w-full bg-zinc-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-black outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Codice Fiscale Lavoratore</label>
            <input 
              required
              maxLength={16}
              value={newWorker.cf}
              onChange={e => setNewWorker({...newWorker, cf: e.target.value})}
              className="w-full bg-zinc-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-black outline-none uppercase font-mono"
              placeholder="RSSMRA80A01H501Z"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-50">
          <h3 className="text-sm font-medium mb-4 text-zinc-400 uppercase tracking-widest">Dati Datore di Lavoro</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Nome Datore</label>
              <input 
                required
                value={newWorker.employerName}
                onChange={e => setNewWorker({...newWorker, employerName: e.target.value})}
                className="w-full bg-zinc-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-black outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Cognome Datore</label>
              <input 
                required
                value={newWorker.employerSurname}
                onChange={e => setNewWorker({...newWorker, employerSurname: e.target.value})}
                className="w-full bg-zinc-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-black outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Codice Fiscale Datore</label>
              <input 
                required
                maxLength={16}
                value={newWorker.employerCf}
                onChange={e => setNewWorker({...newWorker, employerCf: e.target.value})}
                className="w-full bg-zinc-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-black outline-none uppercase font-mono"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-50 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Livello Inquadramento</label>
            <select 
              value={newWorker.level}
              onChange={e => setNewWorker({...newWorker, level: e.target.value as any})}
              className="w-full bg-zinc-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-black outline-none"
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Ore Settimanali (Contratto)</label>
            <input 
              required
              type="number"
              value={newWorker.contractHoursPerWeek}
              onChange={e => setNewWorker({...newWorker, contractHoursPerWeek: parseFloat(e.target.value) || 0})}
              className="w-full bg-zinc-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-black outline-none"
            />
          </div>
        </div>

        <div className="flex items-end pb-4">
          <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox"
                  checked={newWorker.isSuper}
                  onChange={e => setNewWorker({...newWorker, isSuper: e.target.checked})}
                  className="sr-only"
                />
                <div className={`w-10 h-6 rounded-full transition-colors ${newWorker.isSuper ? 'bg-black' : 'bg-zinc-200'}`} />
                <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${newWorker.isSuper ? 'translate-x-4' : ''}`} />
              </div>
              <span className="text-sm font-medium text-zinc-600 group-hover:text-black transition-colors">Opzione Super</span>
            </label>
          </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Nr Rapporto</label>
          <input 
            required
            value={newWorker.relationshipNumber}
            onChange={e => setNewWorker({...newWorker, relationshipNumber: e.target.value})}
            className="w-full bg-zinc-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-black outline-none"
            placeholder="Es. 12345/2024"
          />
        </div>
        <button className="w-full bg-black text-white rounded-xl py-4 font-medium hover:bg-zinc-800 transition-colors">
          Salva Lavoratore
        </button>
      </form>
    </div>
  );
};
