import React, { useState } from 'react';
import { Printer, Briefcase } from 'lucide-react';
import { Worker, PayrollEntry, UserProfile } from '../../types';

interface PrintPayslipProps {
  selectedWorker: Worker;
  selectedPayroll: PayrollEntry;
  profile: UserProfile;
  setView: (view: any) => void;
  logo: string;
}

export const PrintPayslip = ({ selectedWorker, selectedPayroll, profile, setView, logo }: PrintPayslipProps) => {
  const [logoError, setLogoError] = useState(false);
  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => setView('worker')} className="text-zinc-400 hover:text-black mb-6 flex items-center gap-2 text-sm print:hidden">
        ← Torna al lavoratore
      </button>
      
      <div className="bg-white p-12 rounded-3xl shadow-sm border border-zinc-100 print:shadow-none print:border-none print:p-0">
        <div className="flex justify-between items-start mb-12">
          <div className="flex items-center gap-4">
            {logo && !logoError ? (
              <img 
                src={logo} 
                alt="Logo" 
                className="h-12 w-auto object-contain" 
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="h-12 w-12 bg-zinc-50 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-zinc-400" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold mb-2">Prospetto Paga</h2>
              <p className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold">{selectedPayroll.month} {selectedPayroll.year}</p>
            </div>
          </div>
          <button 
            onClick={() => window.print()}
            className="bg-black text-white px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-zinc-800 transition-colors print:hidden"
          >
            <Printer className="w-4 h-4" />
            Stampa
          </button>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-12 pb-12 border-b border-zinc-100">
          <div className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Datore di Lavoro</h3>
            <div className="text-sm">
              <p className="font-bold text-lg">{selectedWorker.employerName} {selectedWorker.employerSurname}</p>
              <p className="text-zinc-500 font-mono mt-1">{selectedWorker.employerCf}</p>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Lavoratore</h3>
            <div className="text-sm">
              <p className="font-bold text-lg">{selectedWorker.name} {selectedWorker.surname}</p>
              <p className="text-zinc-500 font-mono mt-1">{selectedWorker.cf}</p>
              <p className="text-zinc-400 mt-1">Nr. Rapporto: {selectedWorker.relationshipNumber}</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-zinc-50 rounded-2xl">
              <p className="text-[10px] uppercase text-zinc-400 mb-1">Ore Lavorate</p>
              <p className="text-lg font-bold">{selectedPayroll.hoursWorked}h</p>
            </div>
            <div className="p-4 bg-zinc-50 rounded-2xl">
              <p className="text-[10px] uppercase text-zinc-400 mb-1">Paga Oraria</p>
              <p className="text-lg font-bold">{selectedPayroll.hourlyRate.toFixed(2)}€</p>
            </div>
            <div className="p-4 bg-zinc-50 rounded-2xl">
              <p className="text-[10px] uppercase text-zinc-400 mb-1">Livello</p>
              <p className="text-lg font-bold">{selectedWorker.level}{selectedWorker.isSuper ? ' Super' : ''}</p>
            </div>
            <div className="p-4 bg-zinc-50 rounded-2xl">
              <p className="text-[10px] uppercase text-zinc-400 mb-1">Settimane</p>
              <p className="text-lg font-bold">{selectedPayroll.weeksWorked}</p>
            </div>
          </div>

          <div className="bg-zinc-50 rounded-3xl p-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Retribuzione Lorda</span>
                <span className="font-medium">{selectedPayroll.grossPay.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Rateo Tredicesima</span>
                <span className="font-medium">{selectedPayroll.thirteenth.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Accantonamento TFR</span>
                <span className="font-medium">{selectedPayroll.tfr.toFixed(2)}€</span>
              </div>
              {selectedPayroll.includeWorkerContributionsInPayslip && (
                <div className="flex justify-between items-center text-sm text-red-500">
                  <span>Contributi a carico lavoratore</span>
                  <span className="font-medium">-{selectedPayroll.workerContributions.toFixed(2)}€</span>
                </div>
              )}
              <div className="pt-4 mt-4 border-t border-zinc-200 flex justify-between items-center">
                <span className="text-lg font-bold">Netto in Busta</span>
                <span className="text-2xl font-bold">
                  {(selectedPayroll.grossPay - (selectedPayroll.includeWorkerContributionsInPayslip ? selectedPayroll.workerContributions : 0)).toFixed(2)}€
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <h4 className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Riepilogo Ferie</h4>
              <div className="flex justify-between text-xs py-2 border-b border-zinc-100">
                <span className="text-zinc-500">Maturate nel mese</span>
                <span className="font-medium">{selectedPayroll.holidayAccrued.toFixed(2)}h</span>
              </div>
              <div className="flex justify-between text-xs py-2 border-b border-zinc-100">
                <span className="text-zinc-500">Godute nel mese</span>
                <span className="font-medium text-red-500">{selectedPayroll.holidayTaken.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between text-xs py-2">
                <span className="text-zinc-500 font-bold">Residuo Totale</span>
                <span className="font-bold text-emerald-600">{selectedPayroll.holidayBalance.toFixed(2)}h</span>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Contributi INPS</h4>
              <div className="flex justify-between text-xs py-2 border-b border-zinc-100">
                <span className="text-zinc-500">Quota Lavoratore</span>
                <span className="font-medium">{selectedPayroll.workerContributions.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-xs py-2 border-b border-zinc-100">
                <span className="text-zinc-500">Quota Datore</span>
                <span className="font-medium">{selectedPayroll.employerContributions.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-xs py-2">
                <span className="text-zinc-500 font-bold">Totale Contributi</span>
                <span className="font-bold">{selectedPayroll.totalContributions.toFixed(2)}€</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-2 gap-24 text-center">
          <div className="border-t border-zinc-200 pt-4">
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-8">Firma del Datore</p>
          </div>
          <div className="border-t border-zinc-200 pt-4">
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-8">Firma per Ricevuta del Lavoratore</p>
          </div>
        </div>
      </div>
    </div>
  );
};
