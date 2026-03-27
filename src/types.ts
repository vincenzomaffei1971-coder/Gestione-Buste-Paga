export interface UserProfile {
  uid: string;
  name: string;
  surname: string;
  cf: string;
  email: string;
  isApproved: boolean;
  role?: 'admin' | 'user';
}

export interface Worker {
  id: string;
  managerId: string;
  name: string;
  surname: string;
  cf: string;
  relationshipNumber: string;
  title: string;
  employerName: string;
  employerSurname: string;
  employerCf: string;
}

export interface PayrollEntry {
  id: string;
  workerId: string;
  managerId: string;
  year: number;
  month: string;
  hourlyRate: number;
  hoursWorked: number;
  grossPay: number;
  thirteenth: number;
  tfr: number;
}

export const MONTHS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

export const YEARS = ["2024", "2025", "2026"];

export function calculatePayroll(hourlyRate: number, hoursWorked: number) {
  const grossPay = hoursWorked * hourlyRate;
  const thirteenth = grossPay / 12;
  // TFR is calculated on (gross + thirteenth) / 13.5
  const tfr = (grossPay + thirteenth) / 13.5;
  return {
    grossPay: Number(grossPay.toFixed(2)),
    thirteenth: Number(thirteenth.toFixed(2)),
    tfr: Number(tfr.toFixed(2))
  };
}
