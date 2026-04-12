import React, { useState } from 'react';
import { Printer, Briefcase } from 'lucide-react';
import { Worker, PayrollEntry, UserProfile } from '../../types';

interface PrintCUProps {
  selectedWorker: Worker;
  payroll: PayrollEntry[];
  selectedYear: number;
  profile: UserProfile;
  setView: (view: any) => void;
  logo: string;
  getAnnualTotals: (year: number) => any;
}

export const PrintCU = ({ selectedWorker, payroll, selectedYear, profile, setView, logo, getAnnualTotals }: PrintCUProps) => {
  const [logoError, setLogoError] = useState(false);
  const yearData = payroll.filter(p => p.year === selectedYear);
  const totGross = yearData.reduce((acc, p) => acc + p.grossPay, 0);
  const totThirteenth = yearData.reduce((acc, p) => acc + p.thirteenth, 0);
  const totTfr = yearData.reduce((acc, p) => acc + p.tfr, 0);
  const totContributions = yearData.reduce((acc, p) => acc + p.totalContributions, 0);
  const totWorkerContributions = yearData.reduce((acc, p) => acc + p.workerContributions, 0);

  return (
    <div className="max-w-4xl mx-auto print-one-page">
      <button onClick={() => setView('worker')} className="text-zinc-400 hover:text-black mb-6 flex items-center gap-2 text-sm print:hidden">
        ← Torna al lavoratore
      </button>
      
      <div className="bg-white p-12 rounded-3xl shadow-sm border border-zinc-100 print:shadow-none print:border-none print:p-0 print-container">
        <div className="flex justify-between items-start mb-8 print:mb-6">
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
              <h2 className="text-2xl font-bold mb-2">Dichiarazione Sostitutiva</h2>
              <p className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold">Certificazione Unica — Anno {selectedYear}</p>
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

        <div className="grid grid-cols-2 gap-12 mb-8 pb-8 border-b border-zinc-100 print:mb-6 print:pb-6 print:gap-8">
          <div className="space-y-4 print:space-y-2">
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

        <div className="space-y-8 print:space-y-4">
          <div className="bg-zinc-50 rounded-3xl p-8 print:p-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4 print:mb-2">Riepilogo Competenze Annuali</h3>
            <div className="space-y-4 print:space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Retribuzione Lorda Totale</span>
                <span className="font-medium">{(totGross + totThirteenth).toFixed(2)}€</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">di cui Tredicesima</span>
                <span className="font-medium">{totThirteenth.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Contributi INPS Totali Versati</span>
                <span className="font-medium">{totContributions.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">di cui a carico Lavoratore</span>
                <span className="font-medium">{totWorkerContributions.toFixed(2)}€</span>
              </div>
              <div className="pt-4 mt-4 border-t border-zinc-200 flex justify-between items-center">
                <span className="text-lg font-bold">Netto Annuale Corrisposto</span>
                <span className="text-2xl font-bold">
                  {(totGross + totThirteenth - totWorkerContributions).toFixed(2)}€
                </span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-50 rounded-3xl p-8 print:p-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4 print:mb-2">Trattamento di Fine Rapporto (TFR)</h3>
            <div className="space-y-4 print:space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Quota TFR maturata nell'anno</span>
                <span className="font-medium">{totTfr.toFixed(2)}€</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-zinc-400 leading-relaxed italic">
            La presente dichiarazione, rilasciata ai sensi dell'art. 33, comma 4 del CCNL Lavoro Domestico, 
            attesta le somme corrisposte nell'anno solare indicato e i contributi versati all'INPS. 
            Tali somme devono essere indicate dal lavoratore nella propria dichiarazione dei redditi.
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-24 text-center print:mt-8 print:gap-12">
          <div className="border-t border-zinc-200 pt-4 print:pt-2">
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-8 print:mb-4">Firma del Datore</p>
          </div>
          <div className="border-t border-zinc-200 pt-4 print:pt-2">
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-8 print:mb-4">Firma del Lavoratore</p>
          </div>
        </div>
      </div>
    </div>
  );
};
