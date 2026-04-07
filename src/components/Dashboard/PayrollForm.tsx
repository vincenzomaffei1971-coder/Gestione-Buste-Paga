import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
import { Worker, YEARS, MONTHS } from '../../types';

interface PayrollFormProps {
  selectedWorker: Worker;
  onAdd: (e: React.FormEvent) => Promise<void>;
  newPayroll: any;
  setNewPayroll: (data: any) => void;
}

export const PayrollForm = ({ selectedWorker, onAdd, newPayroll, setNewPayroll }: PayrollFormProps) => {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 sticky top-8">
      <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
        <Calculator className="w-5 h-5" />
        Nuovo Inserimento
      </h3>
      <form onSubmit={onAdd} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Anno</label>
            <select 
              value={newPayroll.year}
              onChange={e => setNewPayroll({...newPayroll, year: parseInt(e.target.value) || 2026})}
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
            onChange={e => setNewPayroll({...newPayroll, hourlyRate: parseFloat(e.target.value) || 0})}
            className="w-full bg-zinc-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-black outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Ore Lavorate</label>
            <input 
              type="number"
              step="0.5"
              readOnly
              value={newPayroll.hoursWorked}
              className="w-full bg-zinc-100 border-none rounded-xl p-3 text-sm focus:ring-0 outline-none cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Settimane Lav.</label>
            <select 
              value={newPayroll.weeksWorked}
              onChange={e => {
                const weeks = parseInt(e.target.value) || 0;
                const calculatedHours = weeks * (selectedWorker?.contractHoursPerWeek || 0);
                setNewPayroll({...newPayroll, weeksWorked: weeks, hoursWorked: calculatedHours});
              }}
              className="w-full bg-zinc-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-black outline-none"
            >
              {[0, 1, 2, 3, 4, 5].map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Ferie Godute (gg)</label>
          <input 
            type="number"
            step="0.5"
            value={newPayroll.holidayTaken}
            onChange={e => setNewPayroll({...newPayroll, holidayTaken: parseFloat(e.target.value) || 0})}
            className="w-full bg-zinc-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-black outline-none"
          />
        </div>
        
        <div className="flex flex-col gap-2 py-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox"
              checked={newPayroll.isThirteenthPayment}
              onChange={e => setNewPayroll({...newPayroll, isThirteenthPayment: e.target.checked})}
              className="rounded border-zinc-300 text-black focus:ring-black"
            />
            <span className="text-xs text-zinc-600">Pagamento Tredicesima</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox"
              checked={newPayroll.includeWorkerContributionsInPayslip}
              onChange={e => setNewPayroll({...newPayroll, includeWorkerContributionsInPayslip: e.target.checked})}
              className="rounded border-zinc-300 text-black focus:ring-black"
            />
            <span className="text-xs text-zinc-600">Quota contributi spettante al lavoratore</span>
          </label>
        </div>

        <button className="w-full bg-black text-white rounded-xl py-3 text-sm font-medium hover:bg-zinc-800 transition-colors">
          Salva nel Registro
        </button>
      </form>
    </div>
  );
};
