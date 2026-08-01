/**
 * Document Store - Zustand State Management
 * Manages employee document state across the application
 */

import { create } from 'zustand';
import type { EmployeeDocument } from '../../types/employee';
import {
  uploadEmployeeDocument,
  getEmployeeDocuments,
  getEmployeeDocumentsByType,
  getDocumentById,
  deleteEmployeeDocument,
  getExpiredDocuments,
  getDocumentsExpiringSoon,
  updateDocumentExpiry,
  updateDocumentStatuses,
} from '../../useCases/documentUseCases';

interface DocumentState {
  // State
  documents: EmployeeDocument[];
  selectedDocument: EmployeeDocument | null;
  loading: boolean;
  uploading: boolean;
  uploadProgress: number;
  error: string | null;
  expiredDocuments: EmployeeDocument[];
  expiringSoonDocuments: EmployeeDocument[];

  // Actions
  fetchDocuments: (employeeId: string) => Promise<void>;
  fetchDocumentsByType: (
    employeeId: string,
    documentType: 'passport' | 'visa' | 'contract' | 'certificate'
  ) => Promise<void>;
  fetchDocumentById: (documentId: string) => Promise<void>;
  uploadDocument: (
    employeeId: string,
    file: File,
    documentType: 'passport' | 'visa' | 'contract' | 'certificate',
    uploadedBy: string,
    expiryDate?: Date
  ) => Promise<{ documentId: string; fileUrl: string }>;
  removeDocument: (documentId: string, fileUrl: string) => Promise<void>;
  fetchExpiredDocuments: (employeeId: string) => Promise<void>;
  fetchExpiringSoonDocuments: (employeeId: string) => Promise<void>;
  updateExpiry: (documentId: string, expiryDate: Date) => Promise<void>;
  refreshDocumentStatuses: (employeeId: string) => Promise<void>;
  setSelectedDocument: (document: EmployeeDocument | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  documents: [],
  selectedDocument: null,
  loading: false,
  uploading: false,
  uploadProgress: 0,
  error: null,
  expiredDocuments: [],
  expiringSoonDocuments: [],
};

export const useDocumentStore = create<DocumentState>((set, get) => ({
  ...initialState,

  fetchDocuments: async (employeeId: string) => {
    set({ loading: true, error: null });
    try {
      const documents = await getEmployeeDocuments(employeeId);
      set({ documents, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch documents',
        loading: false,
      });
    }
  },

  fetchDocumentsByType: async (
    employeeId: string,
    documentType: 'passport' | 'visa' | 'contract' | 'certificate'
  ) => {
    set({ loading: true, error: null });
    try {
      const documents = await getEmployeeDocumentsByType(employeeId, documentType);
      set({ documents, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch documents',
        loading: false,
      });
    }
  },

  fetchDocumentById: async (documentId: string) => {
    set({ loading: true, error: null });
    try {
      const document = await getDocumentById(documentId);
      set({ selectedDocument: document, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch document',
        loading: false,
      });
    }
  },

  uploadDocument: async (
    employeeId: string,
    file: File,
    documentType: 'passport' | 'visa' | 'contract' | 'certificate',
    uploadedBy: string,
    expiryDate?: Date
  ): Promise<{ documentId: string; fileUrl: string }> => {
    set({ uploading: true, uploadProgress: 0, error: null });
    try {
      const result = await uploadEmployeeDocument(
        employeeId,
        file,
        documentType,
        uploadedBy,
        expiryDate,
        (progress) => {
          set({ uploadProgress: progress });
        }
      );

      // Refresh documents list
      await get().fetchDocuments(employeeId);

      set({ uploading: false, uploadProgress: 0 });
      return result;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to upload document',
        uploading: false,
        uploadProgress: 0,
      });
      throw error;
    }
  },

  removeDocument: async (documentId: string, fileUrl: string) => {
    set({ loading: true, error: null });
    try {
      await deleteEmployeeDocument(documentId, fileUrl);

      // Remove from local state
      const documents = get().documents.filter((doc) => doc.employeeId !== documentId);
      set({ documents, loading: false });

      // Clear selected document if it's the one being deleted
      const { selectedDocument } = get();
      if (selectedDocument && selectedDocument.employeeId === documentId) {
        set({ selectedDocument: null });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete document',
        loading: false,
      });
      throw error;
    }
  },

  fetchExpiredDocuments: async (employeeId: string) => {
    try {
      const expiredDocuments = await getExpiredDocuments(employeeId);
      set({ expiredDocuments });
    } catch (error) {
      console.error('Failed to fetch expired documents:', error);
    }
  },

  fetchExpiringSoonDocuments: async (employeeId: string) => {
    try {
      const expiringSoonDocuments = await getDocumentsExpiringSoon(employeeId);
      set({ expiringSoonDocuments });
    } catch (error) {
      console.error('Failed to fetch expiring soon documents:', error);
    }
  },

  updateExpiry: async (documentId: string, expiryDate: Date) => {
    set({ loading: true, error: null });
    try {
      await updateDocumentExpiry(documentId, expiryDate);

      // Update selected document if it's the one being updated
      const { selectedDocument } = get();
      if (selectedDocument && selectedDocument.employeeId === documentId) {
        await get().fetchDocumentById(documentId);
      }

      // Refresh documents list
      const documents = get().documents;
      if (documents.length > 0) {
        const employeeId = documents[0].employeeId;
        await get().fetchDocuments(employeeId);
      }

      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update expiry date',
        loading: false,
      });
      throw error;
    }
  },

  refreshDocumentStatuses: async (employeeId: string) => {
    try {
      await updateDocumentStatuses(employeeId);
      await get().fetchDocuments(employeeId);
    } catch (error) {
      console.error('Failed to refresh document statuses:', error);
    }
  },

  setSelectedDocument: (document: EmployeeDocument | null) => {
    set({ selectedDocument: document });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));
