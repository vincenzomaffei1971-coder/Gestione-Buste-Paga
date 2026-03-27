/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { 
  Plus, 
  Users, 
  FileText, 
  Calculator, 
  LogOut, 
  Trash2, 
  ChevronRight, 
  Printer,
  User as UserIcon,
  Briefcase,
  History,
  Search
} from 'lucide-react';
import { 
  GoogleAuthProvider,
  signInWithPopup,
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  getDoc,
  getDocFromServer
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { 
  Worker, 
  PayrollEntry, 
  MONTHS, 
  YEARS, 
  calculatePayroll,
  UserProfile
} from './types';
import { motion, AnimatePresence } from 'motion/react';

// --- HELPERS ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Si è verificato un errore imprevisto.";
      try {
        const parsed = JSON.parse((this.state.error as any)?.message || "");
        if (parsed.error && parsed.operationType) {
          errorMessage = `Errore durante l'operazione di ${parsed.operationType}: ${parsed.error}`;
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus className="w-8 h-8 text-red-500 rotate-45" />
            </div>
            <h2 className="text-2xl font-medium mb-4">Ops! Qualcosa è andato storto</h2>
            <p className="text-zinc-500 mb-8">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-black text-white py-4 rounded-xl font-medium hover:bg-zinc-800 transition-colors"
            >
              Ricarica l'applicazione
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

// --- COMPONENTS ---

const ADMIN_EMAILS = ['vincenzomaffei1971@gmail.com', 'vincenzo.maffei@gmail.com'];

const Login = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      setError('Errore durante l\'accesso con Google. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-sm max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Briefcase className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-light tracking-tight mb-2">Gestionale Busta Paga</h1>
          <p className="text-zinc-500">Accedi con il tuo account Google</p>
        </div>

        <div className="space-y-4">
          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-xs text-center"
            >
              {error}
            </motion.p>
          )}

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border border-zinc-200 text-black rounded-xl py-4 font-medium flex items-center justify-center gap-3 hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Accedi con Google
              </>
            )}
          </button>
        </div>

        <p className="mt-8 text-center text-[10px] text-zinc-400 uppercase tracking-widest">
          Solo utenti autorizzati
        </p>
      </motion.div>
    </div>
  );
};

const ProfileSetup = ({ user, onComplete }: { user: User, onComplete: () => void }) => {
  const [name, setName] = useState(user.displayName?.split(' ')[0] || '');
  const [surname, setSurname] = useState(user.displayName?.split(' ').slice(1).join(' ') || '');
  const [cf, setCf] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cf.length !== 16) {
      // In a real app we'd use a better UI, but for now we'll just return
      return;
    }
    
    setLoading(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        surname,
        cf: cf.toUpperCase(),
        email: user.email,
        isApproved: ADMIN_EMAILS.includes(user.email || '')
      });
      onComplete();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-3xl shadow-sm max-w-md w-full"
      >
        <h2 className="text-2xl font-light mb-6">Configura il tuo profilo</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1">Nome</label>
            <input 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-zinc-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-black outline-none"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1">Cognome</label>
            <input 
              required
              value={surname}
              onChange={e => setSurname(e.target.value)}
              className="w-full bg-zinc-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-black outline-none"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1">Codice Fiscale</label>
            <input 
              required
              maxLength={16}
              value={cf}
              onChange={e => setCf(e.target.value)}
              className="w-full bg-zinc-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-black outline-none uppercase"
              placeholder="RSSMRA80A01H501Z"
            />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-black text-white rounded-xl py-4 font-medium mt-4 disabled:opacity-50"
          >
            {loading ? "Salvataggio..." : "Completa Configurazione"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const WaitingForApproval = ({ onSignOut }: { onSignOut: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] p-4">
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-8 rounded-3xl shadow-sm max-w-md w-full text-center"
    >
      <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Users className="text-zinc-400 w-8 h-8" />
      </div>
      <h2 className="text-2xl font-light mb-4">In attesa di approvazione</h2>
      <p className="text-zinc-500 mb-8">
        Il tuo account è stato creato correttamente. Un amministratore deve approvare il tuo accesso prima che tu possa utilizzare l'applicazione.
      </p>
      <div className="flex flex-col gap-3">
        <button 
          onClick={() => window.location.reload()}
          className="w-full bg-black text-white rounded-xl py-4 font-medium hover:bg-zinc-800 transition-colors"
        >
          Controlla Stato
        </button>
        <button 
          onClick={onSignOut}
          className="w-full bg-zinc-100 text-zinc-600 rounded-xl py-4 font-medium hover:bg-zinc-200 transition-colors"
        >
          Esci
        </button>
      </div>
    </motion.div>
  </div>
);

const AdminDashboard = ({ user, onSwitch }: { user: User, onSwitch: () => void }) => {
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qPending = query(collection(db, 'users'), where('isApproved', '==', false));
    const qApproved = query(collection(db, 'users'), where('isApproved', '==', true));
    
    const unsubPending = onSnapshot(qPending, (snapshot) => {
      setPendingUsers(snapshot.docs.map(doc => doc.data() as UserProfile));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });
    
    const unsubApproved = onSnapshot(qApproved, (snapshot) => {
      setApprovedUsers(snapshot.docs.map(doc => doc.data() as UserProfile));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    return () => { unsubPending(); unsubApproved(); };
  }, []);

  const toggleApproval = async (uid: string, status: boolean) => {
    try {
      await setDoc(doc(db, 'users', uid), { isApproved: status }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-light tracking-tight mb-2">Pannello Amministratore</h1>
            <p className="text-zinc-500">Gestisci l'accesso degli utenti all'applicazione.</p>
          </div>
          <div className="flex gap-4">
            {ADMIN_EMAILS.includes(user.email || '') && (
              <button 
                onClick={onSwitch}
                className="flex items-center gap-2 text-zinc-500 text-sm font-medium hover:text-black transition-colors"
              >
                <Briefcase className="w-4 h-4" />
                Vai alla Dashboard
              </button>
            )}
            <button 
              onClick={() => signOut(auth)}
              className="flex items-center gap-2 text-red-500 text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Esci
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="space-y-12">
            <section>
              <h2 className="text-xs uppercase tracking-widest text-zinc-400 mb-6">Utenti in attesa ({pendingUsers.length})</h2>
              {pendingUsers.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-zinc-100 italic text-zinc-400 text-sm">
                  Nessun utente in attesa.
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingUsers.map(u => (
                    <div key={u.uid} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{u.name} {u.surname}</h3>
                        <p className="text-sm text-zinc-500">{u.email}</p>
                        <p className="text-xs text-zinc-400 font-mono mt-1">{u.cf}</p>
                      </div>
                      <button 
                        onClick={() => toggleApproval(u.uid, true)}
                        className="bg-black text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors"
                      >
                        Approva
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest text-zinc-400 mb-6">Utenti approvati ({approvedUsers.length})</h2>
              <div className="space-y-4">
                {approvedUsers.map(u => (
                  <div key={u.uid} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 flex justify-between items-center opacity-80">
                    <div>
                      <h3 className="font-medium">{u.name} {u.surname}</h3>
                      <p className="text-sm text-zinc-500">{u.email}</p>
                    </div>
                    {u.email !== user.email && (
                      <button 
                        onClick={() => toggleApproval(u.uid, false)}
                        className="text-red-500 text-sm font-medium hover:underline"
                      >
                        Revoca Accesso
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard = ({ user, profile, onSwitchAdmin }: { user: User, profile: UserProfile, onSwitchAdmin: () => void }) => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [payroll, setPayroll] = useState<PayrollEntry[]>([]);
  const [view, setView] = useState<'list' | 'worker' | 'add-worker' | 'print-cu' | 'print-payslip'>('list');
  const [loading, setLoading] = useState(true);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollEntry | null>(null);
  const [selectedYear, setSelectedYear] = useState(2026);

  // Form states
  const [newWorker, setNewWorker] = useState({ name: '', surname: '', cf: '', relationshipNumber: '' });
  const [newPayroll, setNewPayroll] = useState({ year: 2026, month: 'Marzo', hourlyRate: 9, hoursWorked: 0 });

  useEffect(() => {
    const q = query(collection(db, 'workers'), where('managerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker));
      setWorkers(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'workers');
    });
    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    if (!selectedWorker) return;
    const q = query(collection(db, 'payroll'), where('workerId', '==', selectedWorker.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PayrollEntry));
      setPayroll(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'payroll');
    });
    return () => unsubscribe();
  }, [selectedWorker]);

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'workers'), {
        ...newWorker,
        managerId: user.uid,
        cf: newWorker.cf.toUpperCase()
      });
      setNewWorker({ name: '', surname: '', cf: '', relationshipNumber: '' });
      setView('list');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'workers');
    }
  };

  const handleAddPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;
    const { grossPay, thirteenth, tfr } = calculatePayroll(newPayroll.hourlyRate, newPayroll.hoursWorked);
    try {
      await addDoc(collection(db, 'payroll'), {
        ...newPayroll,
        workerId: selectedWorker.id,
        managerId: user.uid,
        grossPay,
        thirteenth,
        tfr
      });
      setNewPayroll({ ...newPayroll, hoursWorked: 0 });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'payroll');
    }
  };

  const deleteWorker = async (id: string) => {
    // In a real app we'd use a custom modal. For now, we'll just proceed or use a simple state.
    // Given the iframe restriction, we'll skip the native confirm.
    try {
      await deleteDoc(doc(db, 'workers', id));
      setView('list');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `workers/${id}`);
    }
  };

  const deletePayroll = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'payroll', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `payroll/${id}`);
    }
  };

  const getAnnualTotals = (year: number) => {
    const yearData = payroll.filter(p => p.year === year);
    const totGross = yearData.reduce((acc, p) => acc + p.grossPay, 0);
    const totThirteenth = yearData.reduce((acc, p) => acc + p.thirteenth, 0);
    const totTfr = yearData.reduce((acc, p) => acc + p.tfr, 0);
    return { totGross, totThirteenth, totTfr, totalCU: totGross + totThirteenth };
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-zinc-100 flex flex-col print:hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <Briefcase className="text-white w-5 h-5" />
            </div>
            <span className="font-medium tracking-tight">Busta Paga Colf</span>
          </div>

          <nav className="space-y-1">
            <button 
              onClick={() => { setView('list'); setSelectedWorker(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${view === 'list' ? 'bg-zinc-100 text-black font-medium' : 'text-zinc-500 hover:bg-zinc-50'}`}
            >
              <Users className="w-4 h-4" />
              Lavoratori
            </button>
            <button 
              onClick={() => { setView('add-worker')} }
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${view === 'add-worker' ? 'bg-zinc-100 text-black font-medium' : 'text-zinc-500 hover:bg-zinc-50'}`}
            >
              <Plus className="w-4 h-4" />
              Nuovo Lavoratore
            </button>
            {ADMIN_EMAILS.includes(profile.email) && (
              <button 
                onClick={onSwitchAdmin}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-zinc-500 hover:bg-zinc-50 transition-colors"
              >
                <UserIcon className="w-4 h-4" />
                Pannello Admin
              </button>
            )}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-zinc-100">
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
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-3 h-3" />
            Esci
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8 print:p-0 print:bg-white">
        <AnimatePresence mode="wait">
          {view === 'list' && (
            <motion.div 
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <header className="mb-8 flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-light tracking-tight mb-2">I tuoi lavoratori</h1>
                  <p className="text-zinc-500">Gestisci i rapporti di lavoro domestico.</p>
                </div>
              </header>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                </div>
              ) : workers.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-zinc-100">
                  <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="text-zinc-300 w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Nessun lavoratore trovato</h3>
                  <p className="text-zinc-400 mb-6">Inizia aggiungendo il tuo primo lavoratore.</p>
                  <button 
                    onClick={() => setView('add-worker')}
                    className="bg-black text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors"
                  >
                    Aggiungi Lavoratore
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {workers.map(worker => (
                    <motion.div 
                      key={worker.id}
                      whileHover={{ y: -4 }}
                      className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 cursor-pointer group"
                      onClick={() => { setSelectedWorker(worker); setView('worker'); }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                          <UserIcon className="w-6 h-6" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-black transition-colors" />
                      </div>
                      <h3 className="text-xl font-medium mb-1">{worker.name} {worker.surname}</h3>
                      <p className="text-xs text-zinc-400 uppercase tracking-widest mb-4">{worker.cf}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                        <span className="text-[10px] uppercase tracking-widest text-zinc-400">Nr Rapporto</span>
                        <span className="text-sm font-mono">{worker.relationshipNumber}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {view === 'add-worker' && (
            <motion.div 
              key="add-worker"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl"
            >
              <button onClick={() => setView('list')} className="text-zinc-400 hover:text-black mb-6 flex items-center gap-2 text-sm">
                ← Torna alla lista
              </button>
              <h1 className="text-4xl font-light tracking-tight mb-8">Nuovo Lavoratore</h1>
              
              <form onSubmit={handleAddWorker} className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Nome</label>
                    <input 
                      required
                      value={newWorker.name}
                      onChange={e => setNewWorker({...newWorker, name: e.target.value})}
                      className="w-full bg-zinc-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-black outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Cognome</label>
                    <input 
                      required
                      value={newWorker.surname}
                      onChange={e => setNewWorker({...newWorker, surname: e.target.value})}
                      className="w-full bg-zinc-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-black outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Codice Fiscale</label>
                  <input 
                    required
                    maxLength={16}
                    value={newWorker.cf}
                    onChange={e => setNewWorker({...newWorker, cf: e.target.value})}
                    className="w-full bg-zinc-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-black outline-none uppercase"
                    placeholder="RSSMRA80A01H501Z"
                  />
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
            </motion.div>
          )}

          {view === 'worker' && selectedWorker && (
            <motion.div 
              key="worker"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex justify-between items-start mb-8 print:hidden">
                <div>
                  <button onClick={() => setView('list')} className="text-zinc-400 hover:text-black mb-4 flex items-center gap-2 text-sm">
                    ← Torna alla lista
                  </button>
                  <h1 className="text-4xl font-light tracking-tight">{selectedWorker.name} {selectedWorker.surname}</h1>
                  <p className="text-zinc-500 mt-1">Gestione buste paga e documenti annuali.</p>
                </div>
                <button 
                  onClick={() => deleteWorker(selectedWorker.id)}
                  className="text-red-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
                {/* Payroll Entry Form */}
                <div className="lg:col-span-1">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 sticky top-8">
                    <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      Nuovo Inserimento
                    </h3>
                    <form onSubmit={handleAddPayroll} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Anno</label>
                          <select 
                            value={newPayroll.year}
                            onChange={e => setNewPayroll({...newPayroll, year: parseInt(e.target.value)})}
                            className="w-full bg-zinc-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-black outline-none"
                          >
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Mese</label>
                          <select 
                            value={newPayroll.month}
                            onChange={e => setNewPayroll({...newPayroll, month: e.target.value})}
                            className="w-full bg-zinc-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-black outline-none"
                          >
                            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Paga Oraria (€)</label>
                        <input 
                          type="number"
                          step="0.01"
                          value={newPayroll.hourlyRate}
                          onChange={e => setNewPayroll({...newPayroll, hourlyRate: parseFloat(e.target.value)})}
                          className="w-full bg-zinc-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-black outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Ore Lavorate</label>
                        <input 
                          type="number"
                          step="0.5"
                          value={newPayroll.hoursWorked}
                          onChange={e => setNewPayroll({...newPayroll, hoursWorked: parseFloat(e.target.value)})}
                          className="w-full bg-zinc-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-black outline-none"
                        />
                      </div>
                      <button className="w-full bg-black text-white rounded-xl py-3 text-sm font-medium hover:bg-zinc-800 transition-colors">
                        Salva nel Registro
                      </button>
                    </form>
                  </div>
                </div>

                {/* History and Documents */}
                <div className="lg:col-span-2 space-y-8">
                  {/* History Table */}
                  <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
                    <div className="p-6 border-b border-zinc-50 flex justify-between items-center">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Storico Pagamenti
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="bg-zinc-50 text-[10px] uppercase tracking-widest text-zinc-400">
                            <th className="px-6 py-4 font-medium">Periodo</th>
                            <th className="px-6 py-4 font-medium">Ore</th>
                            <th className="px-6 py-4 font-medium">Lordo</th>
                            <th className="px-6 py-4 font-medium">13esima</th>
                            <th className="px-6 py-4 font-medium">TFR</th>
                            <th className="px-6 py-4 font-medium"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                          {payroll.sort((a, b) => b.year - a.year || MONTHS.indexOf(b.month) - MONTHS.indexOf(a.month)).map(entry => (
                            <tr key={entry.id} className="hover:bg-zinc-50 transition-colors">
                              <td className="px-6 py-4 font-medium flex items-center gap-2">
                                {entry.month} {entry.year}
                                <button 
                                  onClick={() => { setSelectedPayroll(entry); setView('print-payslip'); }}
                                  className="p-1 hover:bg-zinc-200 rounded transition-colors"
                                  title="Visualizza Busta Paga"
                                >
                                  <Printer className="w-3 h-3" />
                                </button>
                              </td>
                              <td className="px-6 py-4 text-zinc-500 font-mono">{entry.hoursWorked}h</td>
                              <td className="px-6 py-4 text-zinc-500 font-mono">{entry.grossPay}€</td>
                              <td className="px-6 py-4 text-zinc-500 font-mono">{entry.thirteenth}€</td>
                              <td className="px-6 py-4 text-zinc-500 font-mono">{entry.tfr}€</td>
                              <td className="px-6 py-4 text-right">
                                <button 
                                  onClick={() => deletePayroll(entry.id)}
                                  className="text-zinc-300 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {payroll.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-6 py-12 text-center text-zinc-400 italic">
                                Nessun dato registrato.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Document Generation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* CU Card */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                      <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center mb-4">
                        <FileText className="w-5 h-5 text-zinc-500" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Certificazione Unica</h3>
                      <p className="text-sm text-zinc-400 mb-6">Genera la dichiarazione sostitutiva annuale.</p>
                      <div className="flex gap-2">
                        <select 
                          value={selectedYear}
                          onChange={e => setSelectedYear(parseInt(e.target.value))}
                          className="bg-zinc-50 border-none rounded-xl px-3 text-xs outline-none"
                        >
                          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <button 
                          onClick={() => setView('print-cu')}
                          className="flex-1 bg-black text-white rounded-xl py-3 text-xs font-medium flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
                        >
                          <Printer className="w-3 h-3" />
                          Visualizza CU
                        </button>
                      </div>
                    </div>

                    {/* TFR Card */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                      <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center mb-4">
                        <History className="w-5 h-5 text-zinc-500" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Prospetto TFR</h3>
                      <p className="text-sm text-zinc-400 mb-6">Visualizza l'accantonamento totale maturato.</p>
                      <div className="p-4 bg-zinc-50 rounded-2xl">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="text-zinc-400 uppercase tracking-widest">Totale Maturato</span>
                          <span className="font-mono font-medium">{payroll.reduce((acc, p) => acc + p.tfr, 0).toFixed(2)}€</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'print-payslip' && selectedPayroll && selectedWorker && (
            <motion.div 
              key="print-payslip"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-3xl mx-auto"
            >
              <button onClick={() => setView('worker')} className="text-zinc-400 hover:text-black mb-6 flex items-center gap-2 text-sm print:hidden">
                ← Torna al lavoratore
              </button>
              
              <div className="bg-white p-12 border border-black shadow-sm font-serif text-black">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold uppercase tracking-widest">Prospetto Paga</h2>
                  <p className="text-sm mt-1">Periodo: {selectedPayroll.month} {selectedPayroll.year}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-12 mb-12 border-y border-black py-6">
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Datore di Lavoro</h4>
                    <p className="font-bold">{profile.name} {profile.surname}</p>
                    <p className="text-sm font-mono">{profile.cf}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Lavoratore</h4>
                    <p className="font-bold">{selectedWorker.name} {selectedWorker.surname}</p>
                    <p className="text-sm font-mono">{selectedWorker.cf}</p>
                    <p className="text-xs mt-1 italic">Nr Rapporto: {selectedWorker.relationshipNumber}</p>
                  </div>
                </div>

                <table className="w-full mb-12">
                  <thead>
                    <tr className="border-b border-black text-left text-xs uppercase tracking-widest">
                      <th className="py-2">Voce</th>
                      <th className="py-2 text-right">Valore</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr>
                      <td className="py-3">Ore lavorate nel mese</td>
                      <td className="py-3 text-right font-mono">{selectedPayroll.hoursWorked} h</td>
                    </tr>
                    <tr>
                      <td className="py-3">Retribuzione oraria</td>
                      <td className="py-3 text-right font-mono">{selectedPayroll.hourlyRate.toFixed(2)} €/h</td>
                    </tr>
                    <tr className="font-bold border-t border-black">
                      <td className="py-3">Totale Lordo</td>
                      <td className="py-3 text-right font-mono">{selectedPayroll.grossPay.toFixed(2)} €</td>
                    </tr>
                    <tr>
                      <td className="py-3">Rateo Tredicesima</td>
                      <td className="py-3 text-right font-mono">{selectedPayroll.thirteenth.toFixed(2)} €</td>
                    </tr>
                    <tr className="text-zinc-400 italic">
                      <td className="py-3">Accantonamento TFR (pro-quota)</td>
                      <td className="py-3 text-right font-mono">{selectedPayroll.tfr.toFixed(2)} €</td>
                    </tr>
                  </tbody>
                </table>

                <div className="flex justify-between items-end mt-24">
                  <div className="border-t border-black pt-2 w-48 text-center text-xs">
                    Firma per ricevuta
                  </div>
                  <div className="text-xs">
                    Data: ___/___/______
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-center print:hidden">
                <button 
                  onClick={() => window.print()}
                  className="bg-black text-white px-8 py-4 rounded-xl font-medium flex items-center gap-2 hover:bg-zinc-800 transition-colors"
                >
                  <Printer className="w-5 h-5" />
                  Stampa Busta Paga
                </button>
              </div>
            </motion.div>
          )}

          {view === 'print-cu' && selectedWorker && (
            <motion.div 
              key="print-cu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-3xl mx-auto"
            >
              <button onClick={() => setView('worker')} className="text-zinc-400 hover:text-black mb-6 flex items-center gap-2 text-sm print:hidden">
                ← Torna al lavoratore
              </button>
              
              {(() => {
                const totals = getAnnualTotals(selectedYear);
                return (
                  <div className="bg-white p-12 border-2 border-zinc-800 shadow-sm font-serif text-black">
                    <div className="text-center mb-12">
                      <h2 className="text-3xl font-bold uppercase">Dichiarazione Sostitutiva di Certificazione</h2>
                      <p className="text-sm mt-2 italic">Ai sensi dell'art. 4 comma 6-ter del DPR 322/1998</p>
                      <p className="text-xl mt-4 font-bold">Anno d'imposta: {selectedYear}</p>
                    </div>

                    <div className="space-y-6 text-sm leading-relaxed mb-12">
                      <p>Il sottoscritto <strong>{profile.name} {profile.surname}</strong> (CF: {profile.cf}), in qualità di datore di lavoro,</p>
                      <p>CERTIFICA che il lavoratore <strong>{selectedWorker.name} {selectedWorker.surname}</strong> (CF: {selectedWorker.cf}), rapporto nr. {selectedWorker.relationshipNumber}, ha percepito nell'anno {selectedYear} le seguenti somme:</p>
                    </div>

                    <table className="w-full border border-black mb-12">
                      <tbody className="text-sm">
                        <tr className="border-b border-black">
                          <td className="p-4">Somme erogate a titolo di retribuzione lorda</td>
                          <td className="p-4 text-right font-mono">{totals.totGross.toFixed(2)} €</td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-4">Somme erogate a titolo di 13esima mensilità</td>
                          <td className="p-4 text-right font-mono">{totals.totThirteenth.toFixed(2)} €</td>
                        </tr>
                        <tr className="bg-zinc-50 font-bold">
                          <td className="p-4">TOTALE REDDITO LORDO (CU)</td>
                          <td className="p-4 text-right font-mono">{totals.totalCU.toFixed(2)} €</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="p-4 border border-zinc-200 rounded-lg mb-12">
                      <p className="text-sm italic">Somme accantonate a titolo di T.F.R. nell'anno: <strong>{totals.totTfr.toFixed(2)} €</strong></p>
                    </div>

                    <div className="flex justify-between items-end mt-24">
                      <div className="text-sm">
                        Data: {new Date().toLocaleDateString('it-IT')}
                      </div>
                      <div className="border-t border-black pt-2 w-64 text-center text-xs">
                        Firma del Datore di Lavoro
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="mt-8 flex justify-center print:hidden">
                <button 
                  onClick={() => window.print()}
                  className="bg-black text-white px-8 py-4 rounded-xl font-medium flex items-center gap-2 hover:bg-zinc-800 transition-colors"
                >
                  <Printer className="w-5 h-5" />
                  Stampa Certificazione
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);
        unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!user) return <Login />;
  if (!profile) return <ProfileSetup user={user} onComplete={() => window.location.reload()} />;

  const isAdmin = ADMIN_EMAILS.includes(user.email || '');

  if (!profile.isApproved && !isAdmin) {
    return <WaitingForApproval onSignOut={() => signOut(auth)} />;
  }

  if (isAdmin && showAdmin) {
    return <AdminDashboard user={user} onSwitch={() => setShowAdmin(false)} />;
  }

  return <Dashboard user={user} profile={profile} onSwitchAdmin={() => setShowAdmin(true)} />;
}
