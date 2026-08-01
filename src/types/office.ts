/**
 * Office Types
 * Domain types for office management with GPS coordinates
 */

export interface Office {
  officeId: string;
  companyId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters, default 100m
  type: 'head_office' | 'branch' | 'remote';
  parentOfficeId?: string;
  workingHours: {
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
  status: 'active' | 'inactive';
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface OfficeInput {
  companyId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius?: number;
  type: 'head_office' | 'branch' | 'remote';
  parentOfficeId?: string;
  workingHours: {
    start: string;
    end: string;
  };
  createdBy: string;
}

export interface OfficeHierarchy {
  officeId: string;
  parentId?: string;
  level: number;
  path: string; // e.g., "root/head_office/branch1"
}

import type { Timestamp } from 'firebase/firestore';

export interface EmployeeOfficeAssignment {
  assignmentId: string;
  employeeId: string;
  officeId: string;
  assignedBy: string;
  assignedAt: Timestamp;
  isPrimary: boolean;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface OfficeListItem {
  officeId: string;
  name: string;
  address: string;
  type: 'head_office' | 'branch' | 'remote';
  status: 'active' | 'inactive';
  employeeCount: number;
  latitude: number;
  longitude: number;
}

export interface OfficeFilter {
  type?: 'head_office' | 'branch' | 'remote';
  status?: 'active' | 'inactive';
  searchTerm?: string;
}

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
}

export interface GpsValidationResult {
  isValid: boolean;
  distance: number; // in meters
  accuracy?: number; // GPS accuracy in meters
  message: string;
}
