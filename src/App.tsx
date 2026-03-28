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
  Search,
  UserPlus,
  TrendingUp
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
  getDocFromServer,
  getDocs,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { 
  Worker, 
  PayrollEntry, 
  TfrYearlyData,
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

const ADMIN_EMAILS = [
  'vincenzomaffei1971@gmail.com', 
  'vincenzo.maffei@gmail.com', 
  'vincenzo.maffei-1971@gmail.com'
];

const isProtectedEmail = (email: string | null | undefined) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
};

const Login = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    signInWithPopup(auth, provider)
      .catch((err: any) => {
        if (err.code === 'auth/popup-closed-by-user') {
          setLoading(false);
          return;
        }
        console.error("Login error:", err);
        if (err.code === 'auth/popup-blocked') {
          setError('Il popup di accesso è stato bloccato dal browser. Clicca sul link qui sotto per aprire l\'app in una nuova scheda e riprovare.');
          setLoading(false);
        } else {
          setError('Errore durante l\'accesso con Google. Riprova.');
          setLoading(false);
        }
      });
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
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 text-red-600 p-4 rounded-xl text-xs text-center border border-red-100 flex flex-col gap-2"
            >
              <p>{error}</p>
              {error.includes('popup') && (
                <button 
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="text-red-700 font-bold underline"
                >
                  Apri in una nuova scheda
                </button>
              )}
            </motion.div>
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



const NotAuthorized = ({ onSignOut }: { onSignOut: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] p-4">
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-8 rounded-3xl shadow-sm max-w-md w-full text-center"
    >
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <LogOut className="text-red-400 w-8 h-8" />
      </div>
      <h2 className="text-2xl font-light mb-4">Accesso non autorizzato</h2>
      <p className="text-zinc-500 mb-8">
        Spiacenti, il tuo account non è stato ancora censito nel sistema. Contatta un amministratore per richiedere l'accesso.
      </p>
      <button 
        onClick={onSignOut}
        className="w-full bg-zinc-100 text-zinc-600 rounded-xl py-4 font-medium hover:bg-zinc-200 transition-colors"
      >
        Esci
      </button>
    </motion.div>
  </div>
);

const Dashboard = ({ user, profile }: { user: User, profile: UserProfile }) => {
  const [isTestMode, setIsTestMode] = useState(false);
  const actualIsAdmin = isProtectedEmail(user.email) || profile.role === 'admin';
  const isAdmin = actualIsAdmin && !isTestMode;

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [payroll, setPayroll] = useState<PayrollEntry[]>([]);
  const [tfrYearlyData, setTfrYearlyData] = useState<TfrYearlyData[]>([]);
  const [view, setView] = useState<'list' | 'worker' | 'add-worker' | 'print-cu' | 'print-payslip' | 'admin-users' | 'admin-add' | 'admin-preapproved'>('list');
  const [loading, setLoading] = useState(true);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollEntry | null>(null);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Admin states
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<UserProfile[]>([]);
  const [preapprovedList, setPreapprovedList] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(true);
  const [adminUserForm, setAdminUserForm] = useState({ name: '', surname: '', email: '', cf: '' });
  const [quickEmail, setQuickEmail] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminSuccess, setAdminSuccess] = useState<string | null>(null);

  // Form states
  const [newWorker, setNewWorker] = useState({ 
    name: '', 
    surname: '', 
    cf: '', 
    relationshipNumber: '', 
    title: '',
    employerName: profile.name || '',
    employerSurname: profile.surname || '',
    employerCf: profile.cf || ''
  });
  const [newPayroll, setNewPayroll] = useState({ year: 2026, month: 'Marzo', hourlyRate: 10, hoursWorked: 0 });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setNewWorker(prev => ({
      ...prev,
      employerName: profile.name || '',
      employerSurname: profile.surname || '',
      employerCf: profile.cf || ''
    }));
  }, [profile]);

  useEffect(() => {
    const q = actualIsAdmin 
      ? collection(db, 'workers')
      : query(collection(db, 'workers'), where('managerId', '==', user.uid));
      
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
    const q = actualIsAdmin
      ? query(collection(db, 'payroll'), where('workerId', '==', selectedWorker.id))
      : query(collection(db, 'payroll'), where('workerId', '==', selectedWorker.id), where('managerId', '==', user.uid));
      
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PayrollEntry));
      setPayroll(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'payroll');
    });
    return () => unsubscribe();
  }, [selectedWorker]);

  useEffect(() => {
    if (!selectedWorker) return;
    const q = query(collection(db, 'tfr_yearly'), where('workerId', '==', selectedWorker.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTfrYearlyData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TfrYearlyData)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tfr_yearly');
    });
    return () => unsubscribe();
  }, [selectedWorker]);

  // Admin Effects
  useEffect(() => {
    if (!actualIsAdmin) return;

    const qPending = query(collection(db, 'users'), where('isApproved', '==', false));
    const qApproved = query(collection(db, 'users'), where('isApproved', '==', true));
    
    const unsubPending = onSnapshot(qPending, (snapshot) => {
      setPendingUsers(snapshot.docs.map(doc => doc.data() as UserProfile));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });
    
    const unsubApproved = onSnapshot(qApproved, (snapshot) => {
      setApprovedUsers(snapshot.docs.map(doc => doc.data() as UserProfile));
      setAdminLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    const qPre = query(collection(db, 'preapproved_emails'));
    const unsubPre = onSnapshot(qPre, (snapshot) => {
      setPreapprovedList(snapshot.docs.map(doc => doc.data()));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'preapproved_emails');
    });

    return () => { unsubPending(); unsubApproved(); unsubPre(); };
  }, [user.email, profile.role]);

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Uniqueness check for relationshipNumber
    const isDuplicate = workers.some(w => w.relationshipNumber === newWorker.relationshipNumber);
    if (isDuplicate) {
      setFormError("Il numero rapporto deve essere univoco. Esiste già un lavoratore con questo numero.");
      return;
    }

    try {
      await addDoc(collection(db, 'workers'), {
        ...newWorker,
        managerId: user.uid,
        cf: newWorker.cf.toUpperCase(),
        employerCf: newWorker.employerCf.toUpperCase()
      });
      setNewWorker({ 
        name: '', 
        surname: '', 
        cf: '', 
        relationshipNumber: '', 
        title: '',
        employerName: profile.name || '',
        employerSurname: profile.surname || '',
        employerCf: profile.cf || ''
      });
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
    if (showDeleteConfirm !== id) {
      setShowDeleteConfirm(id);
      return;
    }
    try {
      await deleteDoc(doc(db, 'workers', id));
      setShowDeleteConfirm(null);
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

  const updateTfrYearly = async (year: number, rate: number, isPaid: boolean) => {
    if (!selectedWorker) return;
    const id = `${selectedWorker.id}_${year}`;
    try {
      await setDoc(doc(db, 'tfr_yearly', id), {
        workerId: selectedWorker.id,
        year,
        revaluationRate: rate,
        isPaid
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `tfr_yearly/${id}`);
    }
  };

  const getAnnualTotals = (year: number) => {
    const yearData = payroll.filter(p => p.year === year);
    const totGross = yearData.reduce((acc, p) => acc + p.grossPay, 0);
    const totThirteenth = yearData.reduce((acc, p) => acc + p.thirteenth, 0);
    const totTfr = yearData.reduce((acc, p) => acc + p.tfr, 0);
    return { totGross, totThirteenth, totTfr, totalCU: totGross + totThirteenth };
  };

  // Admin Handlers
  const [userToDelete, setUserToDelete] = useState<{uid: string, email: string} | null>(null);

  const toggleApproval = async (uid: string, email: string, status: boolean) => {
    if (isProtectedEmail(email)) return;
    try {
      await setDoc(doc(db, 'users', uid), { isApproved: status }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    }
  };

  const toggleRole = async (uid: string, email: string, currentRole: 'admin' | 'user' | undefined) => {
    if (isProtectedEmail(email)) return;
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await setDoc(doc(db, 'users', uid), { role: newRole }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    }
  };

  const confirmDeleteUser = (uid: string, email: string) => {
    if (isProtectedEmail(email)) {
      setAdminError("Questo utente è un amministratore di sistema e non può essere rimosso.");
      setTimeout(() => setAdminError(null), 3000);
      return;
    }
    setUserToDelete({ uid, email });
  };

  const executeDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteDoc(doc(db, 'users', userToDelete.uid));
      setUserToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userToDelete.uid}`);
    }
  };

  const deletePreApproved = async (email: string) => {
    try {
      await deleteDoc(doc(db, 'preapproved_emails', email));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `preapproved_emails/${email}`);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminSuccess(null);
    try {
      const q = query(collection(db, 'users'), where('email', '==', adminUserForm.email));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setAdminError("Un utente con questa email esiste già.");
        return;
      }
      
      await setDoc(doc(db, 'preapproved_emails', adminUserForm.email), {
        email: adminUserForm.email,
        name: adminUserForm.name,
        surname: adminUserForm.surname,
        cf: adminUserForm.cf.toUpperCase(),
        addedAt: new Date().toISOString(),
        addedBy: user.uid
      });
      
      setAdminUserForm({ name: '', surname: '', email: '', cf: '' });
      setAdminSuccess("Utente aggiunto con successo!");
      setTimeout(() => setView('admin-users'), 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'preapproved_emails');
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminSuccess(null);
    if (!quickEmail) return;
    try {
      const q = query(collection(db, 'users'), where('email', '==', quickEmail));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setAdminError("Un utente con questa email esiste già.");
        return;
      }
      
      await setDoc(doc(db, 'preapproved_emails', quickEmail), {
        email: quickEmail,
        addedAt: new Date().toISOString(),
        addedBy: user.uid
      });
      setQuickEmail('');
      setAdminSuccess("Email pre-approvata con successo!");
      setTimeout(() => setView('admin-users'), 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'preapproved_emails');
    }
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
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors shrink-0">
                            <UserIcon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium tracking-tight text-zinc-900 leading-tight">{worker.title}</h3>
                            <p className="text-xs text-zinc-500">{worker.name} {worker.surname}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-black transition-colors" />
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-widest text-zinc-400">Codice Fiscale</span>
                          <span className="text-xs font-mono">{worker.cf}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] uppercase tracking-widest text-zinc-400">Nr Rapporto</span>
                          <span className="text-sm font-mono">{worker.relationshipNumber}</span>
                        </div>
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
                {formError && (
                  <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm">
                    {formError}
                  </div>
                )}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Titolo Rapporto (es. Colf, Badante, Giardiniere)</label>
                  <input 
                    required
                    value={newWorker.title}
                    onChange={e => setNewWorker({...newWorker, title: e.target.value})}
                    className="w-full bg-zinc-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-black outline-none"
                    placeholder="Es. Colf Part-time"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
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
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Codice Fiscale Lavoratore</label>
                  <input 
                    required
                    maxLength={16}
                    value={newWorker.cf}
                    onChange={e => setNewWorker({...newWorker, cf: e.target.value})}
                    className="w-full bg-zinc-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-black outline-none uppercase"
                    placeholder="RSSMRA80A01H501Z"
                  />
                </div>

                <div className="pt-6 border-t border-zinc-100">
                  <h3 className="text-sm font-medium mb-4">Dati Datore di Lavoro</h3>
                  <div className="grid grid-cols-2 gap-6 mb-6">
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
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Codice Fiscale Datore</label>
                    <input 
                      required
                      maxLength={16}
                      value={newWorker.employerCf}
                      onChange={e => setNewWorker({...newWorker, employerCf: e.target.value})}
                      className="w-full bg-zinc-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-black outline-none uppercase"
                    />
                  </div>
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
                  <h1 className="text-4xl font-light tracking-tight">{selectedWorker.title}</h1>
                  <p className="text-zinc-500 mt-1">{selectedWorker.name} {selectedWorker.surname} — Nr. Rapporto: {selectedWorker.relationshipNumber}</p>
                </div>
                <div className="flex items-center gap-2">
                  {showDeleteConfirm === selectedWorker.id ? (
                    <div className="flex items-center gap-2 bg-red-50 p-1 rounded-xl">
                      <span className="text-[10px] text-red-500 font-medium px-2 uppercase tracking-widest">Confermi?</span>
                      <button 
                        onClick={() => deleteWorker(selectedWorker.id)}
                        className="bg-red-500 text-white px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 transition-colors"
                      >
                        Sì, elimina
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(null)}
                        className="bg-zinc-200 text-zinc-600 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-300 transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowDeleteConfirm(selectedWorker.id)}
                      className="text-red-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
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

                    {/* TFR Summary Card */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium flex items-center gap-2">
                          <History className="w-4 h-4 text-zinc-400" />
                          Prospetto TFR Totale
                        </h3>
                        <span className="text-xs font-mono font-bold bg-zinc-100 px-2 py-1 rounded-lg">
                          {payroll.reduce((acc, p) => acc + p.tfr, 0).toFixed(2)}€
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">
                        Accantonamento totale maturato calcolato sulla base dei periodi inseriti.
                      </p>
                    </div>
                  </div>

                  {/* TFR Yearly Revaluation Section */}
                  <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
                    <div className="p-6 border-b border-zinc-50">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Rivalutazione TFR Annuale
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="bg-zinc-50 text-[10px] uppercase tracking-widest text-zinc-400">
                            <th className="px-6 py-4 font-medium">Anno</th>
                            <th className="px-6 py-4 font-medium">TFR Maturato</th>
                            <th className="px-6 py-4 font-medium">Tasso Riv. (%)</th>
                            <th className="px-6 py-4 font-medium">TFR Rivalutato</th>
                            <th className="px-6 py-4 font-medium">Saldato</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                          {Array.from(new Set(payroll.map(p => p.year))).sort((a: number, b: number) => b - a).map((year: number) => {
                            const yearlyTfr = payroll.filter(p => p.year === year).reduce((acc, p) => acc + p.tfr, 0);
                            const tfrData = (tfrYearlyData.find(d => d.year === year) || { id: '', workerId: '', year, revaluationRate: 1.5, isPaid: false }) as TfrYearlyData;
                            const revaluedTfr = yearlyTfr * (1 + (Number(tfrData.revaluationRate) || 0) / 100);
                            
                            return (
                              <tr key={year} className="hover:bg-zinc-50 transition-colors">
                                <td className="px-6 py-4 font-medium">{year}</td>
                                <td className="px-6 py-4 font-mono">{yearlyTfr.toFixed(2)}€</td>
                                <td className="px-6 py-4">
                                  <input 
                                    type="number"
                                    step="0.1"
                                    value={tfrData.revaluationRate}
                                    onChange={(e) => updateTfrYearly(year, parseFloat(e.target.value), tfrData.isPaid)}
                                    className="w-16 bg-zinc-50 border-none rounded-lg p-1 text-xs focus:ring-1 focus:ring-black outline-none font-mono"
                                  />
                                </td>
                                <td className="px-6 py-4 font-mono font-bold text-black">{revaluedTfr.toFixed(2)}€</td>
                                <td className="px-6 py-4">
                                  <button 
                                    onClick={() => updateTfrYearly(year, Number(tfrData.revaluationRate) || 0, !tfrData.isPaid)}
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${
                                      tfrData.isPaid 
                                        ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                        : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'
                                    }`}
                                  >
                                    {tfrData.isPaid ? 'Saldato' : 'Da Saldare'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {payroll.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 italic">
                                Nessun dato annuale disponibile.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

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
              
              <div className="bg-white p-12 border border-zinc-200 shadow-sm font-sans text-black print:border-none print:shadow-none print:p-0">
                <div className="flex justify-between items-start mb-12">
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center print:bg-zinc-100 print:text-black">
                    <Briefcase className="text-white w-6 h-6 print:text-black" />
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-bold uppercase tracking-tighter">Prospetto Paga</h2>
                    <p className="text-sm text-zinc-500">Periodo: {selectedPayroll.month} {selectedPayroll.year}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-12 mb-12 border-y border-zinc-100 py-8 print:border-zinc-200">
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest text-zinc-400 mb-3">Datore di Lavoro</h4>
                    <p className="text-lg font-bold leading-tight">{selectedWorker.employerName} {selectedWorker.employerSurname}</p>
                    <p className="text-sm font-mono text-zinc-500 mt-1">{selectedWorker.employerCf}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest text-zinc-400 mb-3">Lavoratore</h4>
                    <p className="text-lg font-bold leading-tight">{selectedWorker.name} {selectedWorker.surname}</p>
                    <p className="text-sm font-mono text-zinc-500 mt-1">{selectedWorker.cf}</p>
                    <div className="mt-3 inline-block px-2 py-1 bg-zinc-50 rounded text-[10px] font-medium uppercase tracking-wider text-zinc-500 border border-zinc-100">
                      Nr Rapporto: {selectedWorker.relationshipNumber}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 mb-12">
                  <div className="flex justify-between py-3 border-b border-zinc-50 text-sm">
                    <span className="text-zinc-500">Ore lavorate nel mese</span>
                    <span className="font-mono font-medium">{selectedPayroll.hoursWorked} h</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-zinc-50 text-sm">
                    <span className="text-zinc-500">Retribuzione oraria</span>
                    <span className="font-mono font-medium">{selectedPayroll.hourlyRate.toFixed(2)} €/h</span>
                  </div>
                  <div className="flex justify-between py-4 border-b border-zinc-100 text-base font-bold">
                    <span>Totale Lordo</span>
                    <span className="font-mono">{selectedPayroll.grossPay.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-zinc-50 text-sm">
                    <span className="text-zinc-500">Rateo Tredicesima</span>
                    <span className="font-mono font-medium">{selectedPayroll.thirteenth.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between py-3 text-sm italic text-zinc-400">
                    <span>Accantonamento TFR (pro-quota)</span>
                    <span className="font-mono">{selectedPayroll.tfr.toFixed(2)} €</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-12 mt-24">
                  <div className="space-y-8">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-400">Data e Luogo</div>
                    <div className="border-b border-zinc-200 w-full h-8"></div>
                  </div>
                  <div className="space-y-8">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-400 text-center">Firma per ricevuta</div>
                    <div className="border-b border-zinc-200 w-full h-8"></div>
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

          {isAdmin && view === 'admin-add' && (
            <motion.div 
              key="admin-add"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl"
            >
              <h1 className="text-4xl font-light tracking-tight mb-8">Aggiungi Utente</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100">
                  <h2 className="text-xl font-medium mb-6">Pre-approva Email Google</h2>
                  <p className="text-sm text-zinc-500 mb-6">Inserisci solo l'email per permettere all'utente di accedere subito. Dovrà completare il profilo al primo accesso.</p>
                  <form onSubmit={handleQuickAdd} className="space-y-4">
                    {adminError && <div className="bg-red-50 text-red-500 p-3 rounded-xl text-xs">{adminError}</div>}
                    {adminSuccess && <div className="bg-green-50 text-green-600 p-3 rounded-xl text-xs">{adminSuccess}</div>}
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1">Email Google</label>
                      <input required type="email" value={quickEmail} onChange={e => setQuickEmail(e.target.value)} className="w-full bg-zinc-50 border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-black" placeholder="esempio@gmail.com" />
                    </div>
                    <button type="submit" className="w-full bg-black text-white rounded-xl py-3 font-medium hover:bg-zinc-800 transition-colors">Pre-approva Email</button>
                  </form>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100">
                  <h2 className="text-xl font-medium mb-6">Profilo Completo</h2>
                  <p className="text-sm text-zinc-500 mb-6">Crea un profilo completo per l'utente.</p>
                  <form onSubmit={handleManualAdd} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1">Nome</label>
                        <input required value={adminUserForm.name} onChange={e => setAdminUserForm({...adminUserForm, name: e.target.value})} className="w-full bg-zinc-50 border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-black" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1">Cognome</label>
                        <input required value={adminUserForm.surname} onChange={e => setAdminUserForm({...adminUserForm, surname: e.target.value})} className="w-full bg-zinc-50 border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-black" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1">Email</label>
                      <input required type="email" value={adminUserForm.email} onChange={e => setAdminUserForm({...adminUserForm, email: e.target.value})} className="w-full bg-zinc-50 border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-black" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1">Codice Fiscale</label>
                      <input required maxLength={16} value={adminUserForm.cf} onChange={e => setAdminUserForm({...adminUserForm, cf: e.target.value})} className="w-full bg-zinc-50 border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-black uppercase" />
                    </div>
                    <button type="submit" className="w-full bg-zinc-100 text-zinc-600 rounded-xl py-3 font-medium hover:bg-zinc-200 transition-colors">Salva Profilo</button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {isAdmin && view === 'admin-preapproved' && (
            <motion.div 
              key="admin-preapproved"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl"
            >
              <h1 className="text-4xl font-light tracking-tight mb-8">Email Pre-autorizzate</h1>
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-zinc-100">
                  <h2 className="text-xs uppercase tracking-widest text-zinc-400 mb-6">Lista Pre-autorizzazioni ({preapprovedList.length})</h2>
                  {preapprovedList.length === 0 ? (
                    <div className="text-center py-12 italic text-zinc-400 text-sm">
                      Nessuna email pre-autorizzata in lista.
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-50">
                      {preapprovedList.map((item, idx) => (
                        <div key={idx} className="py-4 flex items-center justify-between group">
                          <div>
                            <p className="font-medium">{item.email}</p>
                            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
                              {item.name ? `${item.name} ${item.surname}` : 'Solo Email'} • Aggiunto il {new Date(item.addedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button 
                            onClick={() => deletePreApproved(item.email)}
                            className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {isAdmin && view === 'admin-users' && (
            <motion.div 
              key="admin-users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl"
            >
              <h1 className="text-4xl font-light tracking-tight mb-8">Utenti Profilati</h1>
              {adminLoading ? (
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
                          <div key={u.uid || u.email} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 flex justify-between items-center">
                            <div>
                              <h3 className="font-medium">{u.name} {u.surname}</h3>
                              <p className="text-sm text-zinc-500">{u.email}</p>
                              <p className="text-xs text-zinc-400 font-mono mt-1">{u.cf}</p>
                            </div>
                            <div className="flex gap-3">
                              <button 
                                onClick={() => toggleApproval(u.uid, u.email, true)}
                                className="bg-black text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors"
                              >
                                Approva
                              </button>
                              {!isProtectedEmail(u.email) && (
                                <button 
                                  onClick={() => confirmDeleteUser(u.uid, u.email)}
                                  className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section>
                    <h2 className="text-xs uppercase tracking-widest text-zinc-400 mb-6">Utenti approvati ({approvedUsers.length})</h2>
                    <div className="space-y-4">
                      {approvedUsers.map(u => (
                        <div key={u.uid || u.email} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">{u.name} {u.surname}</h3>
                            <p className="text-sm text-zinc-500">{u.email}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            {!isProtectedEmail(u.email) && (
                              <>
                                <button 
                                  onClick={() => toggleRole(u.uid, u.email, u.role)}
                                  className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${u.role === 'admin' ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                                >
                                  {u.role === 'admin' ? 'Admin' : 'Rendi Admin'}
                                </button>
                                <button 
                                  onClick={() => toggleApproval(u.uid, u.email, false)}
                                  className="text-zinc-500 text-sm font-medium hover:underline"
                                >
                                  Revoca Accesso
                                </button>
                                <button 
                                  onClick={() => confirmDeleteUser(u.uid, u.email)}
                                  className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {isProtectedEmail(u.email) && (
                              <span className="text-xs uppercase tracking-widest text-zinc-400 font-medium">Admin di Sistema</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {/* User Deletion Confirmation Modal */}
              <AnimatePresence>
                {userToDelete && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  >
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl"
                    >
                      <h3 className="text-xl font-medium mb-4">Conferma Eliminazione</h3>
                      <p className="text-zinc-500 mb-8">
                        Sei sicuro di voler eliminare definitivamente l'utente <span className="font-medium text-black">{userToDelete.email}</span>? Tutti i suoi dati rimarranno nel database ma non potrà più accedere.
                      </p>
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => setUserToDelete(null)}
                          className="px-6 py-3 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                        >
                          Annulla
                        </button>
                        <button 
                          onClick={executeDeleteUser}
                          className="bg-red-500 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
                        >
                          Elimina Utente
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
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
                  <div className="bg-white p-12 border border-zinc-200 shadow-sm font-sans text-black print:border-none print:shadow-none print:p-0">
                    <div className="flex justify-between items-start mb-12">
                      <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center print:bg-zinc-100 print:text-black">
                        <Briefcase className="text-white w-6 h-6 print:text-black" />
                      </div>
                      <div className="text-right">
                        <h2 className="text-2xl font-bold uppercase tracking-tighter">Certificazione Unica</h2>
                        <p className="text-sm text-zinc-500">Anno d'imposta: {selectedYear}</p>
                      </div>
                    </div>

                    <div className="space-y-6 text-sm leading-relaxed mb-12 text-zinc-700">
                      <p>Il sottoscritto <strong>{selectedWorker.employerName} {selectedWorker.employerSurname}</strong> (CF: {selectedWorker.employerCf}), in qualità di datore di lavoro,</p>
                      <p>CERTIFICA che il lavoratore <strong>{selectedWorker.name} {selectedWorker.surname}</strong> (CF: {selectedWorker.cf}), rapporto nr. {selectedWorker.relationshipNumber}, ha percepito nell'anno {selectedYear} le seguenti somme:</p>
                    </div>

                    <div className="border border-zinc-100 rounded-3xl overflow-hidden mb-12">
                      <div className="flex justify-between p-6 border-b border-zinc-50 bg-zinc-50/50">
                        <span className="text-xs uppercase tracking-widest text-zinc-400">Descrizione</span>
                        <span className="text-xs uppercase tracking-widest text-zinc-400">Importo</span>
                      </div>
                      <div className="flex justify-between p-6 border-b border-zinc-50 text-sm">
                        <span>Somme erogate a titolo di retribuzione lorda</span>
                        <span className="font-mono font-medium">{totals.totGross.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between p-6 border-b border-zinc-50 text-sm">
                        <span>Somme erogate a titolo di 13esima mensilità</span>
                        <span className="font-mono font-medium">{totals.totThirteenth.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between p-6 bg-black text-white font-bold">
                        <span className="uppercase tracking-widest text-xs">Totale Reddito Lordo (CU)</span>
                        <span className="font-mono text-lg">{totals.totalCU.toFixed(2)} €</span>
                      </div>
                    </div>

                    <div className="p-6 bg-zinc-50 rounded-3xl mb-12 flex justify-between items-center">
                      <span className="text-xs uppercase tracking-widest text-zinc-400">Accantonamento T.F.R. nell'anno</span>
                      <span className="font-mono font-bold text-zinc-900">{totals.totTfr.toFixed(2)} €</span>
                    </div>

                    <div className="grid grid-cols-2 gap-12 mt-24">
                      <div className="space-y-8">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400">Data e Luogo</div>
                        <div className="border-b border-zinc-200 w-full h-8"></div>
                      </div>
                      <div className="space-y-8">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400 text-center">Firma del Datore di Lavoro</div>
                        <div className="border-b border-zinc-200 w-full h-8"></div>
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
  const [isPreApproved, setIsPreApproved] = useState<boolean | null>(null);

  useEffect(() => {
    const autoCreateProfile = async () => {
      if (user && !profile && !loading && user.email) {
        let preApprovedData: any = null;
        try {
          const preDoc = await getDoc(doc(db, 'preapproved_emails', user.email));
          if (preDoc.exists()) {
            preApprovedData = preDoc.data();
          }
        } catch (e) { console.error(e); }

        const isProtected = isProtectedEmail(user.email);

        if (preApprovedData || isProtected) {
          const newProfile = {
            uid: user.uid,
            email: user.email,
            name: preApprovedData?.name || user.displayName?.split(' ')[0] || 'Utente',
            surname: preApprovedData?.surname || user.displayName?.split(' ').slice(1).join(' ') || '',
            cf: preApprovedData?.cf || '',
            isApproved: true,
            role: preApprovedData?.role || (isProtected ? 'admin' : 'user')
          };
          
          try {
            await setDoc(doc(db, 'users', user.uid), newProfile);
            if (preApprovedData) {
              await deleteDoc(doc(db, 'preapproved_emails', user.email));
            }
          } catch (e) {
            console.error("Error auto-creating profile:", e);
          }
        } else {
          setIsPreApproved(false);
        }
      }
    };

    autoCreateProfile();
  }, [user, profile, loading]);

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
        unsubscribeProfile = onSnapshot(docRef, async (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
            setLoading(false);
          } else {
            setProfile(null);
            setLoading(false);
          }
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
  
  if (!profile && isPreApproved === false) {
    return <NotAuthorized onSignOut={() => signOut(auth)} />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  const isAdmin = isProtectedEmail(user.email) || profile.role === 'admin';

  if (!profile.isApproved && !isAdmin) {
    return <WaitingForApproval onSignOut={() => signOut(auth)} />;
  }

  return <Dashboard user={user} profile={profile} />;
}
