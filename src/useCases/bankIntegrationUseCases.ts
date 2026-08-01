/**
 * Bank Integration Use Cases (Mock Layer)
 * Provides mock API connectors for GCC Central Bank Disbursement Gateways
 * (Emirates NBD, ADCB, FAB, Al Rajhi, Kuwait Finance House, QNB)
 * per BRD Section 4.8 & Checklist Task 13.2.27
 */

export interface BankIntegrationConfig {
  bankId: string;
  bankName: string;
  country: string;
  swiftCode: string;
  corporateAccountId: string;
  apiEnvironment: 'sandbox' | 'production_mock';
  connectionStatus: 'connected' | 'disconnected' | 'testing';
  lastPing: Date;
}

export const MOCK_GCC_BANKS: BankIntegrationConfig[] = [
  {
    bankId: 'BANK-ENBD-UAE',
    bankName: 'Emirates NBD Corporate Direct',
    country: 'UAE',
    swiftCode: 'EBILAEADXXX',
    corporateAccountId: 'AE03-0330-0000-0012-3456-789',
    apiEnvironment: 'sandbox',
    connectionStatus: 'connected',
    lastPing: new Date(),
  },
  {
    bankId: 'BANK-ADCB-UAE',
    bankName: 'Abu Dhabi Commercial Bank (ADCB)',
    country: 'UAE',
    swiftCode: 'ADCBAB22XXX',
    corporateAccountId: 'AE15-0030-0000-0045-6789-123',
    apiEnvironment: 'sandbox',
    connectionStatus: 'connected',
    lastPing: new Date(),
  },
  {
    bankId: 'BANK-ALRAJHI-KSA',
    bankName: 'Al Rajhi Corporate Bank (KSA WPS)',
    country: 'Saudi Arabia',
    swiftCode: 'RJHIREXX',
    corporateAccountId: 'SA88-8000-0000-1122-3344-556',
    apiEnvironment: 'sandbox',
    connectionStatus: 'connected',
    lastPing: new Date(),
  },
  {
    bankId: 'BANK-FAB-UAE',
    bankName: 'First Abu Dhabi Bank (FAB Direct)',
    country: 'UAE',
    swiftCode: 'NBADAEADXXX',
    corporateAccountId: 'AE44-0400-0000-0099-8877-665',
    apiEnvironment: 'sandbox',
    connectionStatus: 'disconnected',
    lastPing: new Date(Date.now() - 86400000),
  },
];

/**
 * Mock Bank Connection Test (Simulates Direct Bank OAuth API ping)
 */
export const testBankApiConnection = async (bankId: string): Promise<boolean> => {
  // Simulate network delay for API connection ping
  await new Promise((resolve) => setTimeout(resolve, 800));
  return true;
};

/**
 * Mock Direct Bank Payroll Transfer Trigger
 */
export const triggerMockDirectBankDisbursement = async (
  bankId: string,
  batchId: string,
  totalAmount: number
): Promise<{ success: boolean; transactionRef: string; message: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const transactionRef = `TXN-BANK-${Date.now().toString(36).toUpperCase()}`;

  return {
    success: true,
    transactionRef,
    message: `Direct Bank API payment batch of ${totalAmount.toLocaleString()} AED processed successfully via ${bankId}!`,
  };
};
