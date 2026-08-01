/**
 * Office Store
 * Zustand store for office management
 */

import { create } from 'zustand';
import type { Office, OfficeInput, OfficeListItem, OfficeFilter } from '@/types/office';
import {
  createOffice,
  getOfficeById,
  getOffices,
  getOfficesWithEmployeeCount,
  updateOffice,
  deleteOffice,
  getActiveOfficesCount,
  searchOffices,
  getOfficesByType,
} from '@/useCases/officeUseCases';

interface OfficeState {
  // State
  offices: Office[];
  officeListItems: OfficeListItem[];
  selectedOffice: Office | null;
  filters: OfficeFilter;
  searchTerm: string;
  activeCount: number;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchOffices: (companyId: string) => Promise<void>;
  fetchOfficeListItems: (companyId: string) => Promise<void>;
  fetchOfficeById: (officeId: string) => Promise<void>;
  createNewOffice: (officeData: OfficeInput) => Promise<string>;
  updateOfficeData: (officeId: string, updates: Partial<OfficeInput>) => Promise<void>;
  removeOffice: (officeId: string) => Promise<void>;
  searchOfficesList: (companyId: string, searchTerm: string) => Promise<void>;
  fetchActiveCount: (companyId: string) => Promise<void>;
  fetchByType: (companyId: string, type: 'head_office' | 'branch' | 'remote') => Promise<void>;
  setFilters: (filters: OfficeFilter) => void;
  setSearchTerm: (term: string) => void;
  setSelectedOffice: (office: Office | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useOfficeStore = create<OfficeState>((set) => ({
  // Initial state
  offices: [],
  officeListItems: [],
  selectedOffice: null,
  filters: {},
  searchTerm: '',
  activeCount: 0,
  loading: false,
  error: null,
  
  // Fetch all offices
  fetchOffices: async (companyId: string) => {
    try {
      set({ loading: true, error: null });
      const offices = await getOffices(companyId);
      set({ offices, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  // Fetch offices with employee counts
  fetchOfficeListItems: async (companyId: string) => {
    try {
      set({ loading: true, error: null });
      const officeListItems = await getOfficesWithEmployeeCount(companyId);
      set({ officeListItems, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  // Fetch office by ID
  fetchOfficeById: async (officeId: string) => {
    try {
      set({ loading: true, error: null });
      const office = await getOfficeById(officeId);
      set({ selectedOffice: office, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  // Create new office
  createNewOffice: async (officeData: OfficeInput) => {
    try {
      set({ loading: true, error: null });
      const officeId = await createOffice(officeData);
      set({ loading: false });
      return officeId;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  // Update office
  updateOfficeData: async (officeId: string, updates: Partial<OfficeInput>) => {
    try {
      set({ loading: true, error: null });
      await updateOffice(officeId, updates);
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  // Delete office
  removeOffice: async (officeId: string) => {
    try {
      set({ loading: true, error: null });
      await deleteOffice(officeId);
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  // Search offices
  searchOfficesList: async (companyId: string, searchTerm: string) => {
    try {
      set({ loading: true, error: null, searchTerm });
      const offices = await searchOffices(companyId, searchTerm);
      set({ offices, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  // Fetch active count
  fetchActiveCount: async (companyId: string) => {
    try {
      const count = await getActiveOfficesCount(companyId);
      set({ activeCount: count });
    } catch (error: any) {
      set({ error: error.message });
    }
  },
  
  // Fetch by type
  fetchByType: async (companyId: string, type: 'head_office' | 'branch' | 'remote') => {
    try {
      set({ loading: true, error: null });
      const offices = await getOfficesByType(companyId, type);
      set({ offices, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  // Set filters
  setFilters: (filters: OfficeFilter) => set({ filters }),
  
  // Set search term
  setSearchTerm: (term: string) => set({ searchTerm: term }),
  
  // Set selected office
  setSelectedOffice: (office: Office | null) => set({ selectedOffice: office }),
  
  // Clear error
  clearError: () => set({ error: null }),
  
  // Reset store
  reset: () => set({
    offices: [],
    officeListItems: [],
    selectedOffice: null,
    filters: {},
    searchTerm: '',
    activeCount: 0,
    loading: false,
    error: null,
  }),
}));
