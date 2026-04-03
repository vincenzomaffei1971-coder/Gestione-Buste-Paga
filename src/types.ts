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
  level: 'A' | 'B' | 'C' | 'D';
  isSuper: boolean;
  employerName: string;
  employerSurname: string;
  employerCf: string;
  contractHoursPerWeek: number;
}

export interface PayrollEntry {
  id: string;
  workerId: string;
  managerId: string;
  year: number;
  month: string;
  hourlyRate: number;
  hoursWorked: number;
  weeksWorked: number;
  grossPay: number;
  thirteenth: number;
  tfr: number;
  holidayAccrued: number;
  holidayTaken: number;
  holidayBalance: number;
  isThirteenthPayment: boolean;
  totalContributions: number;
  workerContributions: number;
  employerContributions: number;
  includeWorkerContributionsInPayslip: boolean;
}

export interface TfrYearlyData {
  id: string;
  workerId: string;
  year: number;
  revaluationRate: number; // e.g. 1.5
  isPaid: boolean;
}

export interface HolidayYearlyData {
  id: string;
  workerId: string;
  year: number;
  accrued: number;
  taken: number;
  balance: number;
}

export const MONTHS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

export const YEARS = ["2024", "2025", "2026"];

/**
 * Simplified INPS contribution calculation for domestic work (2024/2025 estimates)
 * Rates depend on hourly wage and weekly hours.
 */
export function calculateContributions(hourlyRate: number, hoursWorked: number, weeksWorked: number) {
  const weeklyHours = weeksWorked > 0 ? hoursWorked / weeksWorked : 0;
  
  let totalRate = 0;
  let workerRate = 0;

  if (weeklyHours > 24) {
    // Fixed rate for over 24 hours/week
    totalRate = 1.16;
    workerRate = 0.29;
  } else {
    // Wage brackets for up to 24 hours/week
    if (hourlyRate <= 9.05) {
      totalRate = 1.66;
      workerRate = 0.41;
    } else if (hourlyRate <= 11.01) {
      totalRate = 1.88;
      workerRate = 0.47;
    } else {
      totalRate = 2.29;
      workerRate = 0.57;
    }
  }

  const total = totalRate * hoursWorked;
  const worker = workerRate * hoursWorked;
  const employer = total - worker;

  return {
    total: Number(total.toFixed(2)),
    worker: Number(worker.toFixed(2)),
    employer: Number(employer.toFixed(2))
  };
}

export function calculatePayroll(
  hourlyRate: number, 
  hoursWorked: number, 
  weeksWorked: number, 
  contractHoursPerWeek: number,
  previousHolidayBalance: number = 0, 
  holidayTaken: number = 0,
  includeWorkerContributions: boolean = false
) {
  const grossPay = hoursWorked * hourlyRate;
  const thirteenth = grossPay / 12;
  // TFR is calculated on (gross + thirteenth) / 13.5
  const tfr = (grossPay + thirteenth) / 13.5;
  
  // Holiday accrual in hours: (weeksWorked * contractHoursPerWeek) / 12
  const holidayAccrued = (weeksWorked * contractHoursPerWeek) / 12;
  const holidayBalance = previousHolidayBalance + holidayAccrued - holidayTaken;

  const contributions = calculateContributions(hourlyRate, hoursWorked, weeksWorked);

  return {
    grossPay: Number(grossPay.toFixed(2)),
    thirteenth: Number(thirteenth.toFixed(2)),
    tfr: Number(tfr.toFixed(2)),
    holidayAccrued: Number(holidayAccrued.toFixed(3)),
    holidayBalance: Number(holidayBalance.toFixed(3)),
    contributions
  };
}
