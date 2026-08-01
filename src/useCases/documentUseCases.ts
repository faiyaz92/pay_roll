/**
 * Employee Document Use Cases (Business Logic Layer)
 * Handles document upload, download, deletion, and management
 * Integrates with Firebase Storage for file storage
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '../config/firebase';
import type { EmployeeDocument } from '../types/employee';

/**
 * Upload employee document to Firebase Storage
 * @param employeeId - Employee ID
 * @param file - File to upload
 * @param documentType - Type of document
 * @param uploadedBy - User ID of uploader
 * @param expiryDate - Optional expiry date
 * @param onProgress - Progress callback
 * @returns Document ID and download URL
 */
export const uploadEmployeeDocument = async (
  employeeId: string,
  file: File,
  documentType: 'passport' | 'visa' | 'contract' | 'certificate',
  uploadedBy: string,
  expiryDate?: Date,
  onProgress?: (progress: number) => void
): Promise<{ documentId: string; fileUrl: string }> => {
  // Generate unique document ID
  const documentId = `${employeeId}_${documentType}_${Date.now()}`;
  
  // Create storage reference
  const storagePath = `employee_documents/${employeeId}/${documentId}_${file.name}`;
  const storageRef = ref(storage, storagePath);

  // Upload file with progress tracking
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        console.error('Upload error:', error);
        reject(error);
      },
      async () => {
        try {
          // Get download URL
          const fileUrl = await getDownloadURL(uploadTask.snapshot.ref);

          // Create Firestore document
          const docData: Omit<EmployeeDocument, 'uploadedAt'> = {
            employeeId,
            documentType,
            fileName: file.name,
            fileUrl,
            uploadedBy,
            expiryDate,
            status: expiryDate && expiryDate < new Date() ? 'expired' : 'valid',
          };

          await setDoc(doc(db, 'employee_documents', documentId), {
            ...docData,
            uploadedAt: serverTimestamp(),
          });

          resolve({ documentId, fileUrl });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

/**
 * Get all documents for an employee
 * @param employeeId - Employee ID
 * @returns Array of employee documents
 */
export const getEmployeeDocuments = async (
  employeeId: string
): Promise<EmployeeDocument[]> => {
  const q = query(
    collection(db, 'employee_documents'),
    where('employeeId', '==', employeeId),
    orderBy('uploadedAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const documents: EmployeeDocument[] = [];

  querySnapshot.forEach((doc) => {
    documents.push(doc.data() as EmployeeDocument);
  });

  return documents;
};

/**
 * Get documents by type for an employee
 * @param employeeId - Employee ID
 * @param documentType - Type of document
 * @returns Array of employee documents
 */
export const getEmployeeDocumentsByType = async (
  employeeId: string,
  documentType: 'passport' | 'visa' | 'contract' | 'certificate'
): Promise<EmployeeDocument[]> => {
  const q = query(
    collection(db, 'employee_documents'),
    where('employeeId', '==', employeeId),
    where('documentType', '==', documentType),
    orderBy('uploadedAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const documents: EmployeeDocument[]  = [];

  querySnapshot.forEach((doc) => {
    documents.push(doc.data() as EmployeeDocument);
  });

  return documents;
};

/**
 * Get document by ID
 * @param documentId - Document ID
 * @returns Employee document or null
 */
export const getDocumentById = async (
  documentId: string
): Promise<EmployeeDocument | null> => {
  const docSnap = await getDoc(doc(db, 'employee_documents', documentId));

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as EmployeeDocument;
};

/**
 * Delete employee document
 * @param documentId - Document ID
 * @param fileUrl - File URL to delete from storage
 */
export const deleteEmployeeDocument = async (
  documentId: string,
  fileUrl: string
): Promise<void> => {
  try {
    // Delete from Storage
    const storageRef = ref(storage, fileUrl);
    await deleteObject(storageRef);

    // Delete from Firestore
    await deleteDoc(doc(db, 'employee_documents', documentId));
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

/**
 * Get expired documents for an employee
 * @param employeeId - Employee ID
 * @returns Array of expired documents
 */
export const getExpiredDocuments = async (
  employeeId: string
): Promise<EmployeeDocument[]> => {
  const allDocs = await getEmployeeDocuments(employeeId);
  const today = new Date();

  return allDocs.filter((doc) => {
    if (!doc.expiryDate) return false;
    const expiry = doc.expiryDate instanceof Date 
      ? doc.expiryDate 
      : (doc.expiryDate as any).toDate();
    return expiry < today;
  });
};

/**
 * Get documents expiring soon (within 30 days)
 * @param employeeId - Employee ID
 * @returns Array of documents expiring soon
 */
export const getDocumentsExpiringSoon = async (
  employeeId: string
): Promise<EmployeeDocument[]> => {
  const allDocs = await getEmployeeDocuments(employeeId);
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  return allDocs.filter((doc) => {
    if (!doc.expiryDate) return false;
    const expiry = doc.expiryDate instanceof Date 
      ? doc.expiryDate 
      : (doc.expiryDate as any).toDate();
    return expiry >= today && expiry <= thirtyDaysFromNow;
  });
};

/**
 * Update document expiry date
 * @param documentId - Document ID
 * @param expiryDate - New expiry date
 */
export const updateDocumentExpiry = async (
  documentId: string,
  expiryDate: Date
): Promise<void> => {
  const docRef = doc(db, 'employee_documents', documentId);
  const status = expiryDate < new Date() ? 'expired' : 'valid';

  await setDoc(
    docRef,
    {
      expiryDate,
      status,
    },
    { merge: true }
  );
};

/**
 * Check and update document statuses
 * @param employeeId - Employee ID
 */
export const updateDocumentStatuses = async (employeeId: string): Promise<void> => {
  const documents = await getEmployeeDocuments(employeeId);
  const today = new Date();

  for (const document of documents) {
    if (document.expiryDate) {
      const expiry = document.expiryDate instanceof Date 
        ? document.expiryDate 
        : (document.expiryDate as any).toDate();
      const newStatus = expiry < today ? 'expired' : 'valid';

      if (document.status !== newStatus) {
        const docRef = doc(db, 'employee_documents', document.employeeId);
        await setDoc(docRef, { status: newStatus }, { merge: true });
      }
    }
  }
};
