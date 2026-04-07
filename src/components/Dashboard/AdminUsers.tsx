import React from 'react';
import { Users, Trash2, Shield, ShieldAlert } from 'lucide-react';
import { UserProfile } from '../../types';
import { motion } from 'motion/react';

interface AdminUsersProps {
  pendingUsers: UserProfile[];
  approvedUsers: UserProfile[];
  adminLoading: boolean;
  toggleApproval: (uid: string, email: string, status: boolean) => Promise<void>;
  toggleRole: (uid: string, email: string, currentRole: 'admin' | 'user' | undefined) => Promise<void>;
  confirmDeleteUser: (uid: string, email: string) => void;
  adminError: string | null;
  adminSuccess: string | null;
  userToDelete: { uid: string; email: string } | null;
  setUserToDelete: (user: { uid: string; email: string } | null) => void;
  executeDeleteUser: () => Promise<void>;
  isProtectedEmail: (email: string) => boolean;
}

export const AdminUsers = ({ 
  pendingUsers, 
  approvedUsers, 
  adminLoading, 
  toggleApproval, 
  toggleRole, 
  confirmDeleteUser,
  adminError,
  adminSuccess,
  userToDelete,
  setUserToDelete,
  executeDeleteUser,
  isProtectedEmail
}: AdminUsersProps) => {
  if (adminLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-light tracking-tight mb-2">Utenti Profilati</h1>
        <p className="text-zinc-500">Gestisci gli accessi e i ruoli dell'applicazione.</p>
      </header>

      {adminError && <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm">{adminError}</div>}
      {adminSuccess && <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-sm">{adminSuccess}</div>}

      {/* Pending Users */}
      <section>
        <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-400 mb-4">In attesa di approvazione ({pendingUsers.length})</h2>
        <div className="grid grid-cols-1 gap-4">
          {pendingUsers.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-zinc-100 text-center text-zinc-400 text-sm">
              Nessun utente in attesa.
            </div>
          ) : (
            pendingUsers.map(u => (
              <div key={u.uid} className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">{u.name} {u.surname}</h3>
                    <p className="text-xs text-zinc-400">{u.email} — {u.cf}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleApproval(u.uid, u.email, true)}
                    className="bg-black text-white px-4 py-2 rounded-xl text-xs font-medium hover:bg-zinc-800 transition-colors"
                  >
                    Approva
                  </button>
                  <button 
                    onClick={() => confirmDeleteUser(u.uid, u.email)}
                    className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Approved Users */}
      <section>
        <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-400 mb-4">Utenti Approvati ({approvedUsers.length})</h2>
        <div className="grid grid-cols-1 gap-4">
          {approvedUsers.map(u => (
            <div key={u.uid} className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${u.role === 'admin' ? 'bg-indigo-50' : 'bg-zinc-50'}`}>
                  {u.role === 'admin' ? <Shield className="w-5 h-5 text-indigo-500" /> : <Users className="w-5 h-5 text-zinc-400" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{u.name} {u.surname}</h3>
                    {u.role === 'admin' && <span className="bg-indigo-100 text-indigo-600 text-[8px] uppercase font-bold px-1.5 py-0.5 rounded">Admin</span>}
                  </div>
                  <p className="text-xs text-zinc-400">{u.email} — {u.cf}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toggleRole(u.uid, u.email, u.role)}
                  className="p-2 text-zinc-400 hover:text-indigo-500 transition-colors"
                  title={u.role === 'admin' ? "Rendi Utente" : "Rendi Admin"}
                >
                  {u.role === 'admin' ? <ShieldAlert className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => toggleApproval(u.uid, u.email, false)}
                  className="bg-zinc-100 text-zinc-600 px-4 py-2 rounded-xl text-xs font-medium hover:bg-zinc-200 transition-colors"
                >
                  Sospendi
                </button>
                <button 
                  onClick={() => confirmDeleteUser(u.uid, u.email)}
                  className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-xl font-bold mb-4 text-red-600">Elimina Utente</h3>
            <p className="text-zinc-500 mb-8 leading-relaxed">
              Sei sicuro di voler eliminare l'utente <span className="font-bold text-black">{userToDelete.email}</span>? 
              Questa azione è irreversibile e rimuoverà tutti i dati associati.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setUserToDelete(null)}
                className="flex-1 px-6 py-3 rounded-xl font-medium bg-zinc-100 hover:bg-zinc-200 transition-colors"
              >
                Annulla
              </button>
              <button 
                onClick={executeDeleteUser}
                className="flex-1 px-6 py-3 rounded-xl font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Elimina
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
