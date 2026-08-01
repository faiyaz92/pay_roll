/**
 * Bulk Operations Store
 * Zustand store for CSV import/export operations
 */

import { create } from 'zustand';
import type { ImportResult, ExportOptions, ParsedCsvData, UploadProgress } from '@/types/bulkOperations';
import {
  importEmployeesFromCsv,
  exportEmployeesToCsv,
  validateCsvFile,
  getImportStatistics,
} from '@/useCases/bulkOperationsUseCases';

interface BulkOperationsState {
  // State
  importResult: ImportResult | null;
  exportData: string | null;
  parsedData: ParsedCsvData | null;
  uploadProgress: UploadProgress;
  statistics: any | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  importEmployees: (file: File, companyId: string) => Promise<void>;
  exportEmployees: (companyId: string, options: ExportOptions) => Promise<void>;
  validateCsv: (file: File) => Promise<void>;
  downloadCsv: (filename: string) => void;
  fetchStatistics: (companyId: string) => Promise<void>;
  clearImportResult: () => void;
  clearExportData: () => void;
  clearError: () => void;
  reset: () => void;
}

export const useBulkOperationsStore = create<BulkOperationsState>((set, get) => ({
  // Initial state
  importResult: null,
  exportData: null,
  parsedData: null,
  uploadProgress: {
    current: 0,
    total: 0,
    percentage: 0,
    status: 'idle',
  },
  statistics: null,
  loading: false,
  error: null,
  
  // Import employees from CSV
  importEmployees: async (file: File, companyId: string) => {
    try {
      set({ 
        loading: true, 
        error: null, 
        importResult: null,
        uploadProgress: { current: 0, total: 0, percentage: 0, status: 'parsing' }
      });
      
      const result = await importEmployeesFromCsv(file, companyId);
      
      set({ 
        importResult: result, 
        loading: false,
        uploadProgress: { 
          current: result.successful, 
          total: result.total, 
          percentage: 100, 
          status: 'complete' 
        }
      });
    } catch (error: any) {
      set({ 
        error: error.message, 
        loading: false,
        uploadProgress: { current: 0, total: 0, percentage: 0, status: 'error' }
      });
    }
  },
  
  // Export employees to CSV
  exportEmployees: async (companyId: string, options: ExportOptions) => {
    try {
      set({ loading: true, error: null, exportData: null });
      
      const csv = await exportEmployeesToCsv(companyId, options);
      
      set({ exportData: csv, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  // Validate CSV file
  validateCsv: async (file: File) => {
    try {
      set({ 
        loading: true, 
        error: null, 
        parsedData: null,
        uploadProgress: { current: 0, total: 0, percentage: 0, status: 'validating' }
      });
      
      const data = await validateCsvFile(file);
      
      set({ 
        parsedData: data, 
        loading: false,
        uploadProgress: { 
          current: data.rows.length, 
          total: data.rows.length, 
          percentage: 100, 
          status: 'complete' 
        }
      });
    } catch (error: any) {
      set({ 
        error: error.message, 
        loading: false,
        uploadProgress: { current: 0, total: 0, percentage: 0, status: 'error' }
      });
    }
  },
  
  // Download CSV data
  downloadCsv: (filename: string) => {
    const { exportData } = get();
    if (!exportData) return;
    
    const blob = new Blob([exportData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  },
  
  // Fetch import statistics
  fetchStatistics: async (companyId: string) => {
    try {
      set({ loading: true, error: null });
      
      const stats = await getImportStatistics(companyId);
      
      set({ statistics: stats, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  // Clear import result
  clearImportResult: () => set({ importResult: null }),
  
  // Clear export data
  clearExportData: () => set({ exportData: null }),
  
  // Clear error
  clearError: () => set({ error: null }),
  
  // Reset store
  reset: () => set({
    importResult: null,
    exportData: null,
    parsedData: null,
    uploadProgress: { current: 0, total: 0, percentage: 0, status: 'idle' },
    statistics: null,
    loading: false,
    error: null,
  }),
}));
