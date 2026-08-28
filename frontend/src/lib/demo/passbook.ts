export type PassbookTransactionType =
  | "EMPLOYEE_CONTRIBUTION"
  | "EMPLOYER_CONTRIBUTION"
  | "INTEREST"
  | "TRANSFER"
  | "WITHDRAWAL"
  | "ADJUSTMENT";

export type PassbookRange = "LAST_3_MONTHS" | "LAST_6_MONTHS" | "CURRENT_FY" | "PREVIOUS_FY" | "CUSTOM";

export interface PassbookTransaction {
  id: string;
  date: string;
  description: string;
  type: PassbookTransactionType;
  employeeContribution: number;
  employerContribution: number;
  interest: number;
  amount: number;
  balance: number;
  employer: string;
  memberId: string;
}

export interface PassbookAccount {
  personaId: string;
  displayName: string;
  currentEmployer: string;
  memberId: string;
  lastContribution: string;
  transactions: readonly PassbookTransaction[];
}

export interface PassbookFilters {
  range: PassbookRange;
  startDate: string;
  endDate: string;
  type: PassbookTransactionType | "ALL";
  employer: string;
  memberId: string;
}

export interface PassbookSummary {
  openingBalance: number;
  contributions: number;
  interest: number;
  withdrawals: number;
  transfers: number;
  closingBalance: number;
}

export const DEMO_AS_OF_DATE = "2026-08-28";
export const DEFAULT_PASSBOOK_FILTERS: PassbookFilters = {
  range: "CURRENT_FY",
  startDate: "2025-04-01",
  endDate: DEMO_AS_OF_DATE,
  type: "ALL",
  employer: "ALL",
  memberId: "ALL",
};

const RAVI_TRANSACTIONS: readonly PassbookTransaction[] = [
  { id: "SYNTH-RAVI-TXN-001", date: "2025-04-30", description: "Monthly contribution", type: "EMPLOYEE_CONTRIBUTION", employeeContribution: 1800, employerContribution: 0, interest: 0, amount: 1800, balance: 1800, employer: "Synthetic Textiles Pvt. Ltd.", memberId: "SYNTH-MEMBER-RAVI-001" },
  { id: "SYNTH-RAVI-TXN-002", date: "2025-04-30", description: "Employer contribution", type: "EMPLOYER_CONTRIBUTION", employeeContribution: 0, employerContribution: 550, interest: 0, amount: 550, balance: 2350, employer: "Synthetic Textiles Pvt. Ltd.", memberId: "SYNTH-MEMBER-RAVI-001" },
  { id: "SYNTH-RAVI-TXN-003", date: "2025-07-31", description: "Monthly contribution", type: "EMPLOYEE_CONTRIBUTION", employeeContribution: 1800, employerContribution: 0, interest: 0, amount: 1800, balance: 4150, employer: "Synthetic Textiles Pvt. Ltd.", memberId: "SYNTH-MEMBER-RAVI-001" },
  { id: "SYNTH-RAVI-TXN-004", date: "2025-07-31", description: "Employer contribution", type: "EMPLOYER_CONTRIBUTION", employeeContribution: 0, employerContribution: 550, interest: 0, amount: 550, balance: 4700, employer: "Synthetic Textiles Pvt. Ltd.", memberId: "SYNTH-MEMBER-RAVI-001" },
  { id: "SYNTH-RAVI-TXN-005", date: "2025-08-15", description: "Annual interest", type: "INTEREST", employeeContribution: 0, employerContribution: 0, interest: 312, amount: 312, balance: 5012, employer: "Synthetic Textiles Pvt. Ltd.", memberId: "SYNTH-MEMBER-RAVI-001" },
  { id: "SYNTH-RAVI-TXN-006", date: "2026-01-10", description: "Synthetic adjustment", type: "ADJUSTMENT", employeeContribution: 0, employerContribution: 0, interest: 0, amount: 18, balance: 5030, employer: "Synthetic Textiles Pvt. Ltd.", memberId: "SYNTH-MEMBER-RAVI-001" },
  { id: "SYNTH-RAVI-TXN-007", date: "2026-05-31", description: "Monthly contribution", type: "EMPLOYEE_CONTRIBUTION", employeeContribution: 1800, employerContribution: 0, interest: 0, amount: 1800, balance: 6830, employer: "Synthetic Textiles Pvt. Ltd.", memberId: "SYNTH-MEMBER-RAVI-001" },
  { id: "SYNTH-RAVI-TXN-008", date: "2026-05-31", description: "Employer contribution", type: "EMPLOYER_CONTRIBUTION", employeeContribution: 0, employerContribution: 550, interest: 0, amount: 550, balance: 7380, employer: "Synthetic Textiles Pvt. Ltd.", memberId: "SYNTH-MEMBER-RAVI-001" },
];

const PRIYA_TRANSACTIONS: readonly PassbookTransaction[] = [
  { id: "SYNTH-PRIYA-TXN-001", date: "2025-03-31", description: "Previous employer transfer", type: "TRANSFER", employeeContribution: 0, employerContribution: 0, interest: 0, amount: 4200, balance: 4200, employer: "Synthetic Retail Co.", memberId: "SYNTH-MEMBER-PRIYA-PREVIOUS-001" },
  { id: "SYNTH-PRIYA-TXN-002", date: "2025-04-30", description: "Monthly contribution", type: "EMPLOYEE_CONTRIBUTION", employeeContribution: 1600, employerContribution: 0, interest: 0, amount: 1600, balance: 5800, employer: "Synthetic Retail Co.", memberId: "SYNTH-MEMBER-PRIYA-CURRENT-002" },
  { id: "SYNTH-PRIYA-TXN-003", date: "2025-04-30", description: "Employer contribution", type: "EMPLOYER_CONTRIBUTION", employeeContribution: 0, employerContribution: 500, interest: 0, amount: 500, balance: 6300, employer: "Synthetic Retail Co.", memberId: "SYNTH-MEMBER-PRIYA-CURRENT-002" },
  { id: "SYNTH-PRIYA-TXN-004", date: "2025-11-30", description: "Monthly contribution", type: "EMPLOYEE_CONTRIBUTION", employeeContribution: 1600, employerContribution: 0, interest: 0, amount: 1600, balance: 7900, employer: "Synthetic Retail Co.", memberId: "SYNTH-MEMBER-PRIYA-CURRENT-002" },
  { id: "SYNTH-PRIYA-TXN-005", date: "2025-11-30", description: "Employer contribution", type: "EMPLOYER_CONTRIBUTION", employeeContribution: 0, employerContribution: 500, interest: 0, amount: 500, balance: 8400, employer: "Synthetic Retail Co.", memberId: "SYNTH-MEMBER-PRIYA-CURRENT-002" },
];

const ARJUN_TRANSACTIONS: readonly PassbookTransaction[] = [
  { id: "SYNTH-ARJUN-TXN-001", date: "2024-12-31", description: "Monthly contribution", type: "EMPLOYEE_CONTRIBUTION", employeeContribution: 1400, employerContribution: 0, interest: 0, amount: 1400, balance: 1400, employer: "Synthetic Manufacturing Ltd.", memberId: "SYNTH-MEMBER-ARJUN-001" },
  { id: "SYNTH-ARJUN-TXN-002", date: "2024-12-31", description: "Employer contribution", type: "EMPLOYER_CONTRIBUTION", employeeContribution: 0, employerContribution: 450, interest: 0, amount: 450, balance: 1850, employer: "Synthetic Manufacturing Ltd.", memberId: "SYNTH-MEMBER-ARJUN-001" },
  { id: "SYNTH-ARJUN-TXN-003", date: "2025-06-30", description: "Synthetic withdrawal", type: "WITHDRAWAL", employeeContribution: 0, employerContribution: 0, interest: 0, amount: -700, balance: 1150, employer: "Synthetic Manufacturing Ltd.", memberId: "SYNTH-MEMBER-ARJUN-001" },
];

export const DEMO_PASSBOOK_ACCOUNTS: readonly PassbookAccount[] = [
  { personaId: "RAVI_PARTIAL_READY", displayName: "Ravi", currentEmployer: "Synthetic Textiles Pvt. Ltd.", memberId: "SYNTH-MEMBER-RAVI-001", lastContribution: "2026-05-31", transactions: RAVI_TRANSACTIONS },
  { personaId: "PRIYA_TRANSFER_MISSING_EXIT", displayName: "Priya", currentEmployer: "Synthetic Retail Co.", memberId: "SYNTH-MEMBER-PRIYA-CURRENT-002", lastContribution: "2025-11-30", transactions: PRIYA_TRANSACTIONS },
  { personaId: "ARJUN_FINAL_SETTLEMENT", displayName: "Arjun", currentEmployer: "Synthetic Manufacturing Ltd.", memberId: "SYNTH-MEMBER-ARJUN-001", lastContribution: "2024-12-31", transactions: ARJUN_TRANSACTIONS },
];

export function getPassbookAccount(personaId: string | null): PassbookAccount {
  return DEMO_PASSBOOK_ACCOUNTS.find((account) => account.personaId === personaId) ?? DEMO_PASSBOOK_ACCOUNTS[0];
}

function rangeBounds(filters: PassbookFilters): { start: string; end: string } {
  if (filters.range === "CUSTOM") return { start: filters.startDate, end: filters.endDate };
  if (filters.range === "LAST_3_MONTHS") return { start: "2026-05-28", end: DEMO_AS_OF_DATE };
  if (filters.range === "LAST_6_MONTHS") return { start: "2026-02-28", end: DEMO_AS_OF_DATE };
  if (filters.range === "PREVIOUS_FY") return { start: "2024-04-01", end: "2025-03-31" };
  return { start: "2025-04-01", end: DEMO_AS_OF_DATE };
}

export function filterPassbookTransactions(account: PassbookAccount, filters: PassbookFilters): PassbookTransaction[] {
  const bounds = rangeBounds(filters);
  return account.transactions.filter((transaction) =>
    transaction.date >= bounds.start && transaction.date <= bounds.end &&
    (filters.type === "ALL" || transaction.type === filters.type) &&
    (filters.employer === "ALL" || transaction.employer === filters.employer) &&
    (filters.memberId === "ALL" || transaction.memberId === filters.memberId),
  );
}

export function summarizePassbook(account: PassbookAccount, transactions: readonly PassbookTransaction[]): PassbookSummary {
  const firstDate = transactions[0]?.date;
  const openingTransaction = firstDate ? [...account.transactions].reverse().find((transaction) => transaction.date < firstDate) : undefined;
  const openingBalance = openingTransaction?.balance ?? 0;
  const contributions = transactions.reduce((sum, transaction) => sum + transaction.employeeContribution + transaction.employerContribution, 0);
  const interest = transactions.reduce((sum, transaction) => sum + transaction.interest, 0);
  const withdrawals = transactions.reduce((sum, transaction) => sum + (transaction.type === "WITHDRAWAL" ? Math.abs(transaction.amount) : 0), 0);
  const transfers = transactions.reduce((sum, transaction) => sum + (transaction.type === "TRANSFER" ? transaction.amount : 0), 0);
  return { openingBalance, contributions, interest, withdrawals, transfers, closingBalance: transactions.at(-1)?.balance ?? openingBalance };
}
