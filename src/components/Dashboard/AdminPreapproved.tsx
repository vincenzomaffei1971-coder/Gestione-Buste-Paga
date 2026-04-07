import React from 'react';
import { History, Trash2 } from 'lucide-react';

interface AdminPreapprovedProps {
  preapprovedList: any[];
  deletePreApproved: (email: string) => Promise<void>;
}

export const AdminPreapproved = ({ preapprovedList, deletePreApproved }: AdminPreapprovedProps) => {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-light tracking-tight mb-2">Pre-autorizzati</h1>
        <p className="text-zinc-500">Lista delle email e dei profili in attesa di primo accesso.</p>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-zinc-100">
            <tr>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-400 font-medium">Email</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-400 font-medium">Data Aggiunta</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-400 font-medium">Tipo</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-400 font-medium text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {preapprovedList.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-zinc-400 text-sm">Nessun utente pre-autorizzato.</td>
              </tr>
            ) : (
              preapprovedList.map((item, idx) => (
                <tr key={idx} className="hover:bg-zinc-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center">
                        <History className="w-4 h-4 text-zinc-400" />
                      </div>
                      <span className="text-sm font-medium">{item.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-zinc-500">
                    {item.addedAt ? new Date(item.addedAt).toLocaleDateString() : 'N/D'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-lg ${item.name ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {item.name ? 'Profilo' : 'Email'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => deletePreApproved(item.email)}
                      className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
