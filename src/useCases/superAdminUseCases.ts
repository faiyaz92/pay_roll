/**
 * Super Admin Use Cases (Business Logic Layer)
 * Manages Multi-Tenant Company Creation, Status, and Global Tenant Metrics
 * per BRD Section 4.1 & Technical-Doc-v1.md Section 2
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { FIREBASE_COLLECTIONS } from '../config/firebaseCollections';

export interface TenantCompanyInput {
  name: string;
  email: string;
  country: string; // 'UAE' | 'Saudi Arabia' | 'Kuwait' | 'Oman' | 'Qatar' | 'Bahrain'
  currency: string;
  registrationNumber: string;
  taxId: string;
  industry: string;
  adminEmail: string;
  adminName: string;
}

export interface TenantCompanyRecord {
  companyId: string;
  name: string;
  email: string;
  country: string;
  currency: string;
  registrationNumber: string;
  taxId: string;
  industry: string;
  employeeCount: number;
  status: 'active' | 'inactive';
  adminEmail: string;
  createdAt: Date;
}

/**
 * Create New Tenant Company (Super Admin)
 */
export const createTenantCompany = async (
  input: TenantCompanyInput,
  createdBy: string
): Promise<string> => {
  const companyId = `COMP-${Date.now().toString(36).toUpperCase()}`;
  const companyRef = doc(db, 'companies', companyId);

  const companyRecord = {
    companyId,
    name: input.name,
    email: input.email,
    country: input.country,
    currency: input.currency,
    registrationNumber: input.registrationNumber,
    taxId: input.taxId,
    industry: input.industry,
    employeeCount: 5,
    status: 'active',
    adminEmail: input.adminEmail,
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(companyRef, companyRecord);
  return companyId;
};

/**
 * Get All Registered Tenant Companies
 */
export const getAllTenantCompanies = async (): Promise<TenantCompanyRecord[]> => {
  try {
    const snap = await getDocs(collection(db, 'companies'));
    const companies: TenantCompanyRecord[] = [];

    snap.forEach((d) => {
      const data = d.data();
      companies.push({
        companyId: data.companyId || d.id,
        name: data.name || 'Tenant Company',
        email: data.email || 'contact@company.com',
        country: data.country || 'UAE',
        currency: data.currency || 'AED',
        registrationNumber: data.registrationNumber || 'TRN-100293',
        taxId: data.taxId || 'TAX-99120',
        industry: data.industry || 'General Business',
        employeeCount: data.employeeCount || 5,
        status: data.status || 'active',
        adminEmail: data.adminEmail || 'admin@company.com',
        createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
      });
    });

    return companies;
  } catch (err) {
    console.warn('Error fetching tenant companies:', err);
    return [];
  }
};

/**
 * Toggle Tenant Company Status (Activate / Suspend)
 */
export const toggleCompanyStatus = async (
  companyId: string,
  newStatus: 'active' | 'inactive'
): Promise<void> => {
  const companyRef = doc(db, 'companies', companyId);
  await updateDoc(companyRef, {
    status: newStatus,
    updatedAt: serverTimestamp(),
  });
};
