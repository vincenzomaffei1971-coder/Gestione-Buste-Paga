import React from 'react';
import { motion } from 'motion/react';
import { Users, User as UserIcon, ChevronRight } from 'lucide-react';
import { Worker } from '../../types';

interface WorkerListProps {
  workers: Worker[];
  loading: boolean;
  setView: (view: any) => void;
  setSelectedWorker: (worker: Worker) => void;
}

export const WorkerList = ({ workers, loading, setView, setSelectedWorker }: WorkerListProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (workers.length === 0) {
    return (
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
    );
  }

  return (
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
  );
};
