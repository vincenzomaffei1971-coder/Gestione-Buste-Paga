import React, { useState } from 'react';
import { 
  Trash2, 
  Briefcase, 
  FileText, 
  History, 
  Printer, 
  TrendingUp, 
  Calendar, 
  ChevronRight 
} from 'lucide-react';
import { 
  Worker, 
  PayrollEntry, 
  TfrYearlyData, 
  HolidayYearlyData, 
  ThirteenthYearlyData, 
  YEARS, 
  MONTHS 
} from '../../types';
import { PayrollForm } from './PayrollForm';

interface WorkerDetailProps {
  selectedWorker: Worker;
  payroll: PayrollEntry[];
  tfrYearlyData: TfrYearlyData[];
  holidayYearlyData: HolidayYearlyData[];
  thirteenthYearlyData: ThirteenthYearlyData[];
  setView: (view: any) => void;
  setSelectedPayroll: (payroll: PayrollEntry) => void;
  updateWorkerLevel: (level: 'A' | 'B' | 'C' | 'D', isSuper: boolean) => Promise<void>;
  updateWorkerContract: (hours: number) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;
  deletePayroll: (id: string) => Promise<void>;
  updateTfrYearly: (year: number, rate: number, isPaid: boolean) => Promise<void>;
  updateThirteenthYearly: (year: number, amount: number, isPaid: boolean) => Promise<void>;
  handleAddPayroll: (e: React.FormEvent) => Promise<void>;
  showDeleteConfirm: string | null;
  setShowDeleteConfirm: (id: string | null) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  newPayroll: any;
  setNewPayroll: (data: any) => void;
  setShowPrintOptionsModal: (show: boolean) => void;
}

export const WorkerDetail = ({ 
  selectedWorker, 
  payroll, 
  tfrYearlyData, 
  holidayYearlyData, 
  thirteenthYearlyData,
  setView,
  setSelectedPayroll,
  updateWorkerLevel,
  updateWorkerContract,
  deleteWorker,
  deletePayroll,
  updateTfrYearly,
  updateThirteenthYearly,
  handleAddPayroll,
  showDeleteConfirm,
  setShowDeleteConfirm,
  selectedYear,
  setSelectedYear,
  newPayroll,
  setNewPayroll,
  setShowPrintOptionsModal
}: WorkerDetailProps) => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start mb-8 print:hidden">
        <div>
          <button onClick={() => setView('list')} className="text-zinc-400 hover:text-black mb-4 flex items-center gap-2 text-sm">
            ← Torna alla lista
          </button>
          <h1 className="text-4xl font-light tracking-tight">{selectedWorker.title}</h1>
          <p className="text-zinc-500 mt-1">{selectedWorker.name} {selectedWorker.surname} — Nr. Rapporto: {selectedWorker.relationshipNumber}</p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-400">Livello:</label>
              <select 
                value={selectedWorker.level || 'A'}
                onChange={(e) => updateWorkerLevel(e.target.value as any, selectedWorker.isSuper || false)}
                className="bg-zinc-100 border-none rounded-lg px-2 py-1 text-xs font-bold focus:ring-1 focus:ring-black outline-none"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox"
                checked={selectedWorker.isSuper || false}
                onChange={(e) => updateWorkerLevel(selectedWorker.level || 'A', e.target.checked)}
                className="rounded border-zinc-300 text-black focus:ring-black"
              />
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 group-hover:text-black transition-colors">Super</span>
            </label>
          </div>
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
        <div className="lg:col-span-1 space-y-6">
          {/* Contract Details Card */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-zinc-400" />
                Dati Contrattuali
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Ore settimanali da contratto</label>
                <div className="flex gap-2">
                  <input 
                    type="number"
                    value={selectedWorker.contractHoursPerWeek || 0}
                    onChange={(e) => updateWorkerContract(parseFloat(e.target.value) || 0)}
                    className="flex-1 bg-zinc-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-black outline-none"
                  />
                  <div className="bg-zinc-100 px-4 flex items-center rounded-xl text-xs font-medium text-zinc-500">
                    h/sett
                  </div>
                </div>
              </div>
            </div>
          </div>

          <PayrollForm 
            selectedWorker={selectedWorker} 
            onAdd={handleAddPayroll} 
            newPayroll={newPayroll}
            setNewPayroll={setNewPayroll}
          />
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
                  onChange={e => setSelectedYear(parseInt(e.target.value) || 2026)}
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
              <h3 className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-zinc-400" />
                Rivalutazione TFR Annuale
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {Array.from(new Set(payroll.map(p => p.year))).sort((a: number, b: number) => b - a).map((year: number) => {
                  const yearlyTfr = payroll.filter(p => p.year === year).reduce((acc, p) => acc + p.tfr, 0);
                  const tfrData = (tfrYearlyData.find(d => d.year === year) || { id: '', workerId: '', year, revaluationRate: 1.5, isPaid: false }) as TfrYearlyData;
                  
                  return (
                    <div key={year} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-bold w-12">{year}</div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase text-zinc-400">Maturato</span>
                          <span className="text-xs font-medium">{yearlyTfr.toFixed(2)}€</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase text-zinc-400">Tasso Riv.</span>
                          <input 
                            type="number"
                            step="0.01"
                            value={tfrData.revaluationRate}
                            onChange={(e) => updateTfrYearly(year, parseFloat(e.target.value) || 0, tfrData.isPaid)}
                            className="bg-white border border-zinc-200 rounded px-2 py-0.5 text-[10px] w-16 outline-none focus:ring-1 focus:ring-black"
                          />
                        </div>
                      </div>
                      <button 
                        onClick={() => updateTfrYearly(year, Number(tfrData.revaluationRate) || 0, !tfrData.isPaid)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors ${tfrData.isPaid ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-zinc-200 text-zinc-500 hover:bg-zinc-300'}`}
                      >
                        {tfrData.isPaid ? 'Liquidato' : 'Da Liquidare'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Payroll History */}
          <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
            <div className="p-6 border-b border-zinc-50 flex justify-between items-center">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-400" />
                Registro Buste Paga
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 border-b border-zinc-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-400 font-medium">Periodo</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-400 font-medium">Ore</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-400 font-medium">Lordo</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-400 font-medium">TFR</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-400 font-medium">Ferie</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-400 font-medium text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {payroll.sort((a, b) => b.year - a.year || MONTHS.indexOf(b.month) - MONTHS.indexOf(a.month)).map(entry => (
                    <tr key={entry.id} className="hover:bg-zinc-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-zinc-400" />
                          </div>
                          <span className="text-sm font-medium">{entry.month} {entry.year}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">{entry.hoursWorked}h</td>
                      <td className="px-6 py-4 text-xs font-medium">{entry.grossPay.toFixed(2)}€</td>
                      <td className="px-6 py-4 text-xs text-zinc-500">{entry.tfr.toFixed(2)}€</td>
                      <td className="px-6 py-4 text-xs text-zinc-500">{entry.holidayBalance.toFixed(1)}h</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => { setSelectedPayroll(entry); setShowPrintOptionsModal(true); }}
                            className="p-2 text-zinc-300 hover:text-black transition-colors"
                            title="Stampa Busta Paga"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deletePayroll(entry.id)}
                            className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
                            title="Elimina"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Holiday and Thirteenth Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Holiday Summary */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                  Riepilogo Ferie
                </h3>
                <select 
                  value={selectedYear}
                  onChange={e => setSelectedYear(parseInt(e.target.value) || 2026)}
                  className="bg-zinc-50 border-none rounded-lg px-2 py-1 text-[10px] outline-none"
                >
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-zinc-400">Matura</span>
                  <span className="text-sm font-bold">
                    {(holidayYearlyData.find(h => h.year === selectedYear)?.accrued || 0).toFixed(2)} h
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-zinc-400">Godute</span>
                  <span className="text-sm font-bold text-red-500">
                    {(holidayYearlyData.find(h => h.year === selectedYear)?.taken || 0).toFixed(1)} h
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-zinc-400">Residuo</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {(holidayYearlyData.find(h => h.year === selectedYear)?.balance || 0).toFixed(2)} h
                  </span>
                </div>
              </div>
            </div>

            {/* Thirteenth Summary */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-zinc-400" />
                  Tredicesima
                </h3>
                <select 
                  value={selectedYear}
                  onChange={e => setSelectedYear(parseInt(e.target.value) || 2026)}
                  className="bg-zinc-50 border-none rounded-lg px-2 py-1 text-[10px] outline-none"
                >
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              {(() => {
                const yearAccrued = payroll.filter(p => p.year === selectedYear).reduce((acc, p) => acc + p.thirteenth, 0);
                const yearPaidInPayroll = payroll.filter(p => p.year === selectedYear && p.isThirteenthPayment).reduce((acc, p) => acc + p.grossPay, 0);
                const thirteenthData = thirteenthYearlyData.find(d => d.year === selectedYear);
                const isSaldato = thirteenthData?.isPaid || false;

                return (
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-zinc-400">Maturata</span>
                      <span className="text-sm font-bold">{yearAccrued.toFixed(2)}€</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateThirteenthYearly(selectedYear, yearAccrued, !isSaldato)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors ${isSaldato ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-zinc-200 text-zinc-500 hover:bg-zinc-300'}`}
                      >
                        {isSaldato ? 'Saldata' : 'Da Saldare'}
                      </button>
                      <button 
                        onClick={() => setView('print-thirteenth')}
                        className="p-2 bg-zinc-100 text-zinc-400 hover:text-black rounded-xl transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
