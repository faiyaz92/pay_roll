/**
 * Extended HR Use Cases (Expense Claims, Exit Offboarding, Performance Appraisals, Announcements)
 * per BRD Section 4 & Checklist Tasks 13.2.40 - 13.2.48
 */

export interface ExpenseClaim {
  id: string;
  employeeId: string;
  employeeName: string;
  category: 'Travel' | 'Client Entertainment' | 'Medical' | 'Office Supplies';
  amount: number;
  currency: string;
  receiptUrl?: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected' | 'reimbursed';
  description: string;
}

export interface ExitManagementRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  resignationDate: string;
  lastWorkingDay: string;
  reason: string;
  clearanceStatus: {
    itHardware: boolean;
    financeDues: boolean;
    hrExitInterview: boolean;
    visaCancellation: boolean;
  };
  finalSettlementAmount: number;
  status: 'notice_period' | 'clearance_in_progress' | 'settled';
}

export interface PerformanceAppraisal {
  id: string;
  employeeId: string;
  employeeName: string;
  reviewPeriod: string;
  overallRating: number; // 1 to 5
  kpiScorePercentage: number;
  managerComments: string;
  status: 'draft' | 'completed';
}

export interface CompanyAnnouncement {
  id: string;
  title: string;
  category: 'Company Policy' | 'GCC Regulatory Alert' | 'Holiday Notice' | 'General';
  date: string;
  author: string;
  content: string;
  priority: 'high' | 'normal';
}

export const INITIAL_EXPENSE_CLAIMS: ExpenseClaim[] = [
  {
    id: 'EXP-901',
    employeeId: 'EMP-ALH-001',
    employeeName: 'Rashid Khan',
    category: 'Travel',
    amount: 450,
    currency: 'AED',
    date: '2026-07-25',
    status: 'approved',
    description: 'Taxi fares for client meeting at Abu Dhabi Global Market (ADGM)',
  },
  {
    id: 'EXP-902',
    employeeId: 'EMP-ALH-002',
    employeeName: 'Ayesha Siddiqui',
    category: 'Client Entertainment',
    amount: 820,
    currency: 'AED',
    date: '2026-07-28',
    status: 'pending',
    description: 'Dinner meeting with regional tech vendors at DIFC',
  },
];

export const INITIAL_EXIT_RECORDS: ExitManagementRecord[] = [
  {
    id: 'EXIT-101',
    employeeId: 'EMP-ALH-005',
    employeeName: 'Vikram Sharma',
    resignationDate: '2026-07-15',
    lastWorkingDay: '2026-08-15',
    reason: 'Relocation to home country',
    clearanceStatus: {
      itHardware: true,
      financeDues: true,
      hrExitInterview: false,
      visaCancellation: false,
    },
    finalSettlementAmount: 28400,
    status: 'clearance_in_progress',
  },
];

export const INITIAL_PERFORMANCE_REVIEWS: PerformanceAppraisal[] = [
  {
    id: 'PERF-2026-01',
    employeeId: 'EMP-ALH-001',
    employeeName: 'Rashid Khan',
    reviewPeriod: 'H1 2026',
    overallRating: 4.8,
    kpiScorePercentage: 96,
    managerComments: 'Exceptional technical delivery on payroll WPS compliance module and Mobile Web UI.',
    status: 'completed',
  },
];

export const INITIAL_ANNOUNCEMENTS: CompanyAnnouncement[] = [
  {
    id: 'ANN-01',
    title: 'UAE MOHRE Wage Protection System (WPS) Compliance Update',
    category: 'GCC Regulatory Alert',
    date: '2026-07-20',
    author: 'Corporate Compliance Team',
    content: 'All monthly salary disbursements must be executed strictly via MOHRE SIF file channels prior to the 3rd day of each calendar month to maintain 100% compliance score.',
    priority: 'high',
  },
  {
    id: 'ANN-02',
    title: 'Upcoming Public Holiday Notice - Prophet’s Birthday',
    category: 'Holiday Notice',
    date: '2026-07-28',
    author: 'HR Department',
    content: 'Please note that official statutory paid leave for Prophet Muhammad’s Birthday will be observed on 25th August 2026 across all UAE offices.',
    priority: 'normal',
  },
];
