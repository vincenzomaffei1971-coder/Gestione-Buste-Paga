import React from 'react';
import { 
  Users, 
  Plus, 
  UserPlus, 
  History, 
  LogOut, 
  User as UserIcon,
  Download
} from 'lucide-react';
import { User } from 'firebase/auth';
import { UserProfile } from '../../types';

interface SidebarProps {
  view: string;
  setView: (view: any) => void;
  setSelectedWorker: (worker: any) => void;
  profile: UserProfile;
  isAdmin: boolean;
  actualIsAdmin: boolean;
  isTestMode: boolean;
  setIsTestMode: (mode: boolean) => void;
  onSignOut: () => void;
  logo: string;
  canInstall?: boolean;
  onInstall?: () => void;
}

export const Sidebar = React.memo(({ 
  view, 
  setView, 
  setSelectedWorker, 
  profile, 
  isAdmin, 
  actualIsAdmin, 
  isTestMode, 
  setIsTestMode, 
  onSignOut,
  logo,
  canInstall,
  onInstall
}: SidebarProps) => {
  return (
    <aside className="w-64 bg-white border-r border-zinc-100 flex flex-col print:hidden">
      <div className="p-6">
        <button 
          onClick={() => { setView('list'); setSelectedWorker(null); }}
          className="flex items-center gap-3 mb-8 hover:opacity-80 transition-opacity group"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center">
            <img src={logo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
          <span className="font-medium tracking-tight group-hover:text-zinc-600 transition-colors">Busta Paga Colf</span>
        </button>

        <nav className="space-y-1">
          {canInstall && onInstall && (
            <button 
              onClick={onInstall}
              className="w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-xl text-sm bg-black text-white hover:bg-zinc-800 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Installa App
            </button>
          )}
          <button 
            onClick={() => { setView('list'); setSelectedWorker(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${view === 'list' ? 'bg-zinc-100 text-black font-medium' : 'text-zinc-500 hover:bg-zinc-50'}`}
          >
            <Users className="w-4 h-4" />
            Lavoratori
          </button>
          {(profile.role === 'user' || actualIsAdmin) && (
            <button 
              onClick={() => { setView('add-worker')} }
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${view === 'add-worker' ? 'bg-zinc-100 text-black font-medium' : 'text-zinc-500 hover:bg-zinc-50'}`}
            >
              <Plus className="w-4 h-4" />
              Nuovo Lavoratore
            </button>
          )}
          {isAdmin && (
            <>
              <button 
                onClick={() => setView('admin-users')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${view === 'admin-users' ? 'bg-zinc-100 text-black font-medium' : 'text-zinc-500 hover:bg-zinc-50'}`}
              >
                <Users className="w-4 h-4" />
                Utenti Profilati
              </button>
              <button 
                onClick={() => setView('admin-add')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${view === 'admin-add' ? 'bg-zinc-100 text-black font-medium' : 'text-zinc-500 hover:bg-zinc-50'}`}
              >
                <UserPlus className="w-4 h-4" />
                Aggiungi Utente
              </button>
              <button 
                onClick={() => setView('admin-preapproved')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${view === 'admin-preapproved' ? 'bg-zinc-100 text-black font-medium' : 'text-zinc-500 hover:bg-zinc-50'}`}
              >
                <History className="w-4 h-4" />
                Pre-autorizzati
              </button>
            </>
          )}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-zinc-100">
        {actualIsAdmin && (
          <button
            onClick={() => {
              setIsTestMode(!isTestMode);
              if (!isTestMode && (view === 'admin-users' || view === 'admin-add')) {
                setView('list');
              }
            }}
            className={`w-full flex items-center gap-3 px-4 py-2 mb-4 rounded-xl text-xs transition-colors ${isTestMode ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'text-zinc-500 hover:bg-zinc-50'}`}
          >
            <div className={`w-2 h-2 rounded-full ${isTestMode ? 'bg-amber-500' : 'bg-zinc-300'}`} />
            {isTestMode ? 'Esci da Modalità Test' : 'Modalità Test (Vista Utente)'}
          </button>
        )}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center">
            <UserIcon className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-medium truncate">{profile.name} {profile.surname}</p>
            <p className="text-[10px] text-zinc-400 truncate">{profile.cf}</p>
          </div>
        </div>
        <button 
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-3 h-3" />
          Esci
        </button>
      </div>
    </aside>
  );
});
