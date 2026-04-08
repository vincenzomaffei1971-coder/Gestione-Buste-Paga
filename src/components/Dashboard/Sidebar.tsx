import React from 'react';
import { 
  Users, 
  Plus, 
  UserPlus, 
  History, 
  LogOut, 
  User as UserIcon,
  Download,
  Menu,
  X,
  ChevronLeft,
  Briefcase
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
  isInstalled?: boolean;
  isSidebarCollapsed: boolean;
  onToggle: () => void;
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
  onInstall,
  isInstalled,
  isSidebarCollapsed,
  onToggle
}: SidebarProps) => {
  const [logoError, setLogoError] = React.useState(false);

  return (
    <>
      {/* Mobile Overlay */}
      {!isSidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden" 
          onClick={onToggle}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-100 flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 print:hidden
        ${isSidebarCollapsed ? '-translate-x-full lg:w-20' : 'translate-x-0'}
      `}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={() => { setView('list'); setSelectedWorker(null); }}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity group overflow-hidden"
            >
              <div className="w-10 h-10 min-w-[40px] rounded-xl overflow-hidden flex items-center justify-center bg-zinc-50">
                {!logoError ? (
                  <img 
                    src={logo} 
                    alt="Logo" 
                    className="w-full h-full object-contain" 
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <Briefcase className="w-6 h-6 text-zinc-400" />
                )}
              </div>
              {!isSidebarCollapsed && (
                <span className="font-medium tracking-tight group-hover:text-zinc-600 transition-colors truncate">Busta Paga Colf</span>
              )}
            </button>
            <button 
              onClick={onToggle}
              className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
            <button 
              onClick={onToggle}
              className="hidden lg:flex p-1.5 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 absolute -right-3 top-9 bg-white border border-zinc-100 shadow-sm"
            >
              <ChevronLeft className={`w-3 h-3 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <nav className="space-y-1 flex-1">
            {!isInstalled && onInstall && (
              <button 
                onClick={onInstall}
                title="Installa App"
                className={`w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-xl text-sm bg-black text-white hover:bg-zinc-800 transition-colors shadow-sm overflow-hidden ${isSidebarCollapsed ? 'justify-center px-0' : ''} ${!canInstall ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Download className="w-4 h-4 min-w-[16px]" />
                {!isSidebarCollapsed && <span className="truncate">Installa App</span>}
              </button>
            )}
            <button 
              onClick={() => { setView('list'); setSelectedWorker(null); }}
              title="Lavoratori"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors overflow-hidden ${isSidebarCollapsed ? 'justify-center px-0' : ''} ${view === 'list' ? 'bg-zinc-100 text-black font-medium' : 'text-zinc-500 hover:bg-zinc-50'}`}
            >
              <Users className="w-4 h-4 min-w-[16px]" />
              {!isSidebarCollapsed && <span className="truncate">Lavoratori</span>}
            </button>
            {(profile.role === 'user' || actualIsAdmin) && (
              <button 
                onClick={() => { setView('add-worker')} }
                title="Nuovo Lavoratore"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors overflow-hidden ${isSidebarCollapsed ? 'justify-center px-0' : ''} ${view === 'add-worker' ? 'bg-zinc-100 text-black font-medium' : 'text-zinc-500 hover:bg-zinc-50'}`}
              >
                <Plus className="w-4 h-4 min-w-[16px]" />
                {!isSidebarCollapsed && <span className="truncate">Nuovo Lavoratore</span>}
              </button>
            )}
            {isAdmin && (
              <>
                <button 
                  onClick={() => setView('admin-users')}
                  title="Utenti Profilati"
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors overflow-hidden ${isSidebarCollapsed ? 'justify-center px-0' : ''} ${view === 'admin-users' ? 'bg-zinc-100 text-black font-medium' : 'text-zinc-500 hover:bg-zinc-50'}`}
                >
                  <Users className="w-4 h-4 min-w-[16px]" />
                  {!isSidebarCollapsed && <span className="truncate">Utenti Profilati</span>}
                </button>
                <button 
                  onClick={() => setView('admin-add')}
                  title="Aggiungi Utente"
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors overflow-hidden ${isSidebarCollapsed ? 'justify-center px-0' : ''} ${view === 'admin-add' ? 'bg-zinc-100 text-black font-medium' : 'text-zinc-500 hover:bg-zinc-50'}`}
                >
                  <UserPlus className="w-4 h-4 min-w-[16px]" />
                  {!isSidebarCollapsed && <span className="truncate">Aggiungi Utente</span>}
                </button>
                <button 
                  onClick={() => setView('admin-preapproved')}
                  title="Pre-autorizzati"
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors overflow-hidden ${isSidebarCollapsed ? 'justify-center px-0' : ''} ${view === 'admin-preapproved' ? 'bg-zinc-100 text-black font-medium' : 'text-zinc-500 hover:bg-zinc-50'}`}
                >
                  <History className="w-4 h-4 min-w-[16px]" />
                  {!isSidebarCollapsed && <span className="truncate">Pre-autorizzati</span>}
                </button>
              </>
            )}
          </nav>

          <div className="mt-auto pt-6 border-t border-zinc-100">
            {actualIsAdmin && (
              <button
                onClick={() => {
                  setIsTestMode(!isTestMode);
                  if (!isTestMode && (view === 'admin-users' || view === 'admin-add')) {
                    setView('list');
                  }
                }}
                title={isTestMode ? 'Esci da Modalità Test' : 'Modalità Test'}
                className={`w-full flex items-center gap-3 px-4 py-2 mb-4 rounded-xl text-xs transition-colors overflow-hidden ${isSidebarCollapsed ? 'justify-center px-0' : ''} ${isTestMode ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'text-zinc-500 hover:bg-zinc-50'}`}
              >
                <div className={`w-2 h-2 min-w-[8px] rounded-full ${isTestMode ? 'bg-amber-500' : 'bg-zinc-300'}`} />
                {!isSidebarCollapsed && <span className="truncate">{isTestMode ? 'Esci da Modalità Test' : 'Modalità Test'}</span>}
              </button>
            )}
            <div className={`flex items-center gap-3 mb-4 overflow-hidden ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-8 h-8 min-w-[32px] bg-zinc-100 rounded-full flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-zinc-500" />
              </div>
              {!isSidebarCollapsed && (
                <div className="overflow-hidden">
                  <p className="text-xs font-medium truncate">{profile.name} {profile.surname}</p>
                  <p className="text-[10px] text-zinc-400 truncate">{profile.cf}</p>
                </div>
              )}
            </div>
            <button 
              onClick={onSignOut}
              title="Esci"
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs text-red-500 hover:bg-red-50 transition-colors overflow-hidden ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
            >
              <LogOut className="w-3 h-3 min-w-[12px]" />
              {!isSidebarCollapsed && <span className="truncate">Esci</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
});
