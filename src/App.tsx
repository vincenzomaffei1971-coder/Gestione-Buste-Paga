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
  TrendingUp,
  Menu
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
  ThirteenthYearlyData,
  HolidayYearlyData,
  MONTHS, 
  YEARS, 
  calculatePayroll,
  UserProfile
} from './types';
import { motion, AnimatePresence } from 'motion/react';
const logo = '/logo.png';

// Import refactored components
import { Sidebar } from './components/Dashboard/Sidebar';
import { WorkerList } from './components/Dashboard/WorkerList';
import { AddWorkerForm } from './components/Dashboard/AddWorkerForm';
import { AdminUsers } from './components/Dashboard/AdminUsers';
import { AdminAddUser } from './components/Dashboard/AdminAddUser';
import { AdminPreapproved } from './components/Dashboard/AdminPreapproved';
import { WorkerDetail } from './components/Dashboard/WorkerDetail';
import { PrintPayslip } from './components/Dashboard/PrintPayslip';
import { PrintCU } from './components/Dashboard/PrintCU';
import { PrintThirteenth } from './components/Dashboard/PrintThirteenth';

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
    console.log("Firebase connection successful.");
  } catch (error) {
    console.error("Firebase connection test failed:", error);
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. This error usually means the client cannot reach the Firestore backend.");
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

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    // Basic network check
    try {
      const authDomain = (auth.app.options as any).authDomain;
      const response = await fetch(`https://${authDomain}/__/__/auth/handler`, { mode: 'no-cors' });
      console.log("Auth domain check:", response.type);
    } catch (e) {
      console.error("Auth domain check failed:", e);
      setError('Impossibile raggiungere i server di autenticazione Firebase. Verifica la tua connessione o le impostazioni del firewall.');
      setLoading(false);
      return;
    }

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
        } else if (err.code === 'auth/network-request-failed') {
          setError('Errore di rete. Verifica la tua connessione o assicurati che il dominio sia autorizzato nella console Firebase (Authentication > Settings > Authorized domains).');
        } else {
          setError(`Errore durante l'accesso: ${err.message || 'Riprova.'}`);
        }
        setLoading(false);
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
          <button 
            onClick={() => window.location.reload()}
            className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center mx-auto mb-6 hover:opacity-80 transition-opacity"
          >
            <img src={logo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </button>
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
              {(error.includes('popup') || error.includes('rete')) && (
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => window.open(window.location.href, '_blank')}
                    className="text-red-700 font-bold underline"
                  >
                    Apri in una nuova scheda
                  </button>
                  <button 
                    onClick={() => handleGoogleLogin()}
                    className="text-red-700 font-bold underline"
                  >
                    Riprova
                  </button>
                  <a 
                    href="https://status.firebase.google.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-red-700 font-bold underline"
                  >
                    Controlla lo stato di Firebase
                  </a>
                  <p className="mt-2 text-[10px] text-red-500">
                    Se il problema persiste, assicurati che il dominio sia autorizzato nella console Firebase (Authentication &gt; Settings &gt; Authorized domains).
                  </p>
                </div>
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

const Dashboard = ({ 
  user, 
  profile, 
  deferredPrompt, 
  handleInstall,
  isInstalled
}: { 
  user: User, 
  profile: UserProfile, 
  deferredPrompt: any, 
  handleInstall: () => void,
  isInstalled: boolean
}) => {
  const [isTestMode, setIsTestMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const actualIsAdmin = isProtectedEmail(user.email) || profile.role === 'admin';
  const isAdmin = actualIsAdmin && !isTestMode;

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [payroll, setPayroll] = useState<PayrollEntry[]>([]);
  const [tfrYearlyData, setTfrYearlyData] = useState<TfrYearlyData[]>([]);
  const [thirteenthYearlyData, setThirteenthYearlyData] = useState<ThirteenthYearlyData[]>([]);
  const [holidayYearlyData, setHolidayYearlyData] = useState<HolidayYearlyData[]>([]);
  const [view, setView] = useState<'list' | 'worker' | 'add-worker' | 'print-cu' | 'print-payslip' | 'print-thirteenth' | 'admin-users' | 'admin-add' | 'admin-preapproved'>('list');
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
    level: 'A' as 'A' | 'B' | 'C' | 'D',
    isSuper: false,
    contractHoursPerWeek: 40,
    employerName: profile.name || '',
    employerSurname: profile.surname || '',
    employerCf: profile.cf || ''
  });
  const [newPayroll, setNewPayroll] = useState({ 
    year: 2026, 
    month: 'Marzo', 
    hourlyRate: 10, 
    hoursWorked: 0, 
    weeksWorked: 4, 
    holidayTaken: 0, 
    isThirteenthPayment: false,
    includeWorkerContributionsInPayslip: false
  });
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

  useEffect(() => {
    if (!selectedWorker) return;
    const q = query(collection(db, 'holiday_yearly'), where('workerId', '==', selectedWorker.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHolidayYearlyData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HolidayYearlyData)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'holiday_yearly');
    });
    return () => unsubscribe();
  }, [selectedWorker]);

  useEffect(() => {
    if (!selectedWorker) return;
    const q = query(collection(db, 'thirteenth_yearly'), where('workerId', '==', selectedWorker.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setThirteenthYearlyData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ThirteenthYearlyData)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'thirteenth_yearly');
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

    const workerCf = newWorker.cf.trim().toUpperCase();
    const employerCf = newWorker.employerCf.trim().toUpperCase();

    if (workerCf.length !== 16) {
      setFormError("Il Codice Fiscale del lavoratore deve essere di 16 caratteri.");
      return;
    }

    if (employerCf.length !== 16) {
      setFormError("Il Codice Fiscale del datore deve essere di 16 caratteri.");
      return;
    }

    try {
      await addDoc(collection(db, 'workers'), {
        ...newWorker,
        managerId: user.uid,
        cf: workerCf,
        employerCf: employerCf
      });
      setNewWorker({ 
        name: '', 
        surname: '', 
        cf: '', 
        relationshipNumber: '', 
        title: '',
        level: 'A',
        isSuper: false,
        contractHoursPerWeek: 40,
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
    
    // Get previous holiday balance
    const workerPayroll = payroll.filter(p => p.workerId === selectedWorker.id);
    const sortedPayroll = [...workerPayroll].sort((a, b) => {
      const yearDiff = b.year - a.year;
      if (yearDiff !== 0) return yearDiff;
      return MONTHS.indexOf(b.month) - MONTHS.indexOf(a.month);
    });
    const lastEntry = sortedPayroll[0];
    const previousBalance = lastEntry ? lastEntry.holidayBalance : 0;

    const { grossPay, thirteenth, tfr, holidayAccrued, holidayBalance, contributions } = calculatePayroll(
      newPayroll.hourlyRate, 
      newPayroll.hoursWorked,
      newPayroll.weeksWorked,
      selectedWorker.contractHoursPerWeek || 0,
      previousBalance,
      newPayroll.holidayTaken,
      newPayroll.includeWorkerContributionsInPayslip
    );

    try {
      await addDoc(collection(db, 'payroll'), {
        ...newPayroll,
        workerId: selectedWorker.id,
        managerId: user.uid,
        grossPay,
        thirteenth,
        tfr,
        holidayAccrued,
        holidayBalance,
        totalContributions: contributions.total,
        workerContributions: contributions.worker,
        employerContributions: contributions.employer
      });
      
      // Update holiday yearly summary
      const year = newPayroll.year;
      const yearPayroll = [...workerPayroll, { ...newPayroll, holidayAccrued, holidayTaken: newPayroll.holidayTaken }].filter(p => p.year === year);
      const accrued = yearPayroll.reduce((acc, p) => acc + (p.holidayAccrued || 0), 0);
      const taken = yearPayroll.reduce((acc, p) => acc + (p.holidayTaken || 0), 0);
      const balance = accrued - taken;
      
      const holidayId = `${selectedWorker.id}_${year}`;
      await setDoc(doc(db, 'holiday_yearly', holidayId), {
        workerId: selectedWorker.id,
        year,
        accrued,
        taken,
        balance
      }, { merge: true });

      setNewPayroll({ ...newPayroll, hoursWorked: 0, holidayTaken: 0, isThirteenthPayment: false });
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

  const updateThirteenthYearly = async (year: number, amount: number, isPaid: boolean) => {
    if (!selectedWorker) return;
    const id = `${selectedWorker.id}_${year}`;
    try {
      await setDoc(doc(db, 'thirteenth_yearly', id), {
        workerId: selectedWorker.id,
        year,
        amount,
        isPaid
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `thirteenth_yearly/${id}`);
    }
  };

  const updateWorkerLevel = async (level: 'A' | 'B' | 'C' | 'D', isSuper: boolean) => {
    if (!selectedWorker) return;
    const safeLevel = level || 'A';
    const safeIsSuper = isSuper || false;
    try {
      await setDoc(doc(db, 'workers', selectedWorker.id), { level: safeLevel, isSuper: safeIsSuper }, { merge: true });
      setSelectedWorker({ ...selectedWorker, level: safeLevel, isSuper: safeIsSuper });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `workers/${selectedWorker.id}`);
    }
  };

  const updateWorkerContract = async (hours: number) => {
    if (!selectedWorker) return;
    try {
      await setDoc(doc(db, 'workers', selectedWorker.id), { contractHoursPerWeek: hours }, { merge: true });
      setSelectedWorker({ ...selectedWorker, contractHoursPerWeek: hours });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `workers/${selectedWorker.id}`);
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
      <Sidebar 
        view={view}
        setView={setView}
        setSelectedWorker={setSelectedWorker}
        profile={profile}
        isAdmin={isAdmin}
        actualIsAdmin={actualIsAdmin}
        isTestMode={isTestMode}
        setIsTestMode={setIsTestMode}
        onSignOut={() => signOut(auth)}
        logo={logo}
        canInstall={!!deferredPrompt}
        onInstall={handleInstall}
        isInstalled={isInstalled}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8 print:p-0 print:bg-white relative">
        {/* Mobile Toggle */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-sm border border-zinc-100"
        >
          <Menu className="w-5 h-5" />
        </button>
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

              <WorkerList 
                workers={workers}
                loading={loading}
                setView={setView}
                setSelectedWorker={setSelectedWorker}
              />
            </motion.div>
          )}

          {view === 'add-worker' && (
            <motion.div 
              key="add-worker"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AddWorkerForm 
                profile={profile}
                onAdd={handleAddWorker}
                onCancel={() => setView('list')}
                formError={formError}
                setFormError={setFormError}
              />
            </motion.div>
          )}

          {view === 'worker' && selectedWorker && (
            <motion.div 
              key="worker"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <WorkerDetail 
                selectedWorker={selectedWorker}
                payroll={payroll}
                tfrYearlyData={tfrYearlyData}
                holidayYearlyData={holidayYearlyData}
                thirteenthYearlyData={thirteenthYearlyData}
                setView={setView}
                setSelectedPayroll={setSelectedPayroll}
                updateWorkerLevel={updateWorkerLevel}
                updateWorkerContract={updateWorkerContract}
                deleteWorker={deleteWorker}
                deletePayroll={deletePayroll}
                updateTfrYearly={updateTfrYearly}
                updateThirteenthYearly={updateThirteenthYearly}
                handleAddPayroll={handleAddPayroll}
                showDeleteConfirm={showDeleteConfirm}
                setShowDeleteConfirm={setShowDeleteConfirm}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                newPayroll={newPayroll}
                setNewPayroll={setNewPayroll}
              />
            </motion.div>
          )}

          {view === 'print-payslip' && selectedPayroll && selectedWorker && (
            <motion.div 
              key="print-payslip"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-3xl mx-auto"
            >
              <PrintPayslip 
                selectedWorker={selectedWorker}
                selectedPayroll={selectedPayroll}
                profile={profile}
                setView={setView}
                logo={logo}
              />
            </motion.div>
          )}

          {view === 'print-thirteenth' && selectedWorker && (
            <motion.div 
              key="print-thirteenth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-3xl mx-auto"
            >
              <PrintThirteenth 
                selectedWorker={selectedWorker}
                payroll={payroll}
                selectedYear={selectedYear}
                profile={profile}
                setView={setView}
                logo={logo}
              />
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
              <AdminAddUser 
                onAdd={handleManualAdd}
                onQuickAdd={handleQuickAdd}
                adminError={adminError}
                adminSuccess={adminSuccess}
                quickEmail={quickEmail}
                setQuickEmail={setQuickEmail}
                adminUserForm={adminUserForm}
                setAdminUserForm={setAdminUserForm}
              />
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
              <AdminPreapproved 
                preapprovedList={preapprovedList}
                deletePreApproved={deletePreApproved}
              />
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
              <AdminUsers 
                pendingUsers={pendingUsers}
                approvedUsers={approvedUsers}
                adminLoading={adminLoading}
                toggleApproval={toggleApproval}
                toggleRole={toggleRole}
                confirmDeleteUser={confirmDeleteUser}
                adminError={adminError}
                adminSuccess={adminSuccess}
                userToDelete={userToDelete}
                setUserToDelete={setUserToDelete}
                executeDeleteUser={executeDeleteUser}
                isProtectedEmail={isProtectedEmail}
              />
            </motion.div>
          )}

          {view === 'print-cu' && selectedWorker && (
            <motion.div 
              key="print-cu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-3xl mx-auto"
            >
              <PrintCU 
                selectedWorker={selectedWorker}
                payroll={payroll}
                selectedYear={selectedYear}
                profile={profile}
                setView={setView}
                logo={logo}
                getAnnualTotals={getAnnualTotals}
              />
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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

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

  return <Dashboard 
    user={user} 
    profile={profile} 
    deferredPrompt={deferredPrompt}
    handleInstall={handleInstall}
    isInstalled={isInstalled}
  />;
}
