/**
 * Employee-Office Assignment Use Cases
 * Business logic for assigning employees to offices
 */

import { db } from '@/config/firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import type { EmployeeOfficeAssignment } from '@/types/office';

/**
 * Assign employee to an office
 */
export async function assignEmployeeToOffice(
  employeeId: string,
  officeId: string,
  assignedBy: string,
  isPrimary: boolean = true
): Promise<string> {
  try {
    // Check if employee already has a primary assignment
    if (isPrimary) {
      const existingPrimaryQuery = query(
        collection(db, 'employee_office_assignments'),
        where('employeeId', '==', employeeId),
        where('isPrimary', '==', true),
        where('status', '==', 'active')
      );
      const existingPrimarySnapshot = await getDocs(existingPrimaryQuery);
      
      // Update existing primary to secondary
      for (const doc of existingPrimarySnapshot.docs) {
        await updateDoc(doc.ref, {
          isPrimary: false,
          updatedAt: Timestamp.now(),
        });
      }
    }
    
    const assignment: Omit<EmployeeOfficeAssignment, 'assignmentId'> = {
      employeeId,
      officeId,
      assignedBy,
      assignedAt: Timestamp.now(),
      isPrimary,
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const docRef = await addDoc(collection(db, 'employee_office_assignments'), assignment);
    return docRef.id;
  } catch (error: any) {
    throw new Error(`Failed to assign employee to office: ${error.message}`);
  }
}

/**
 * Get office assignment for an employee
 */
export async function getEmployeeOfficeAssignment(
  employeeId: string
): Promise<EmployeeOfficeAssignment | null> {
  try {
    const q = query(
      collection(db, 'employee_office_assignments'),
      where('employeeId', '==', employeeId),
      where('isPrimary', '==', true),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const assignmentDoc = snapshot.docs[0];
    return {
      assignmentId: assignmentDoc.id,
      ...assignmentDoc.data(),
    } as EmployeeOfficeAssignment;
  } catch (error: any) {
    throw new Error(`Failed to get employee office assignment: ${error.message}`);
  }
}

/**
 * Get all assignments for an employee (including secondary)
 */
export async function getAllEmployeeOfficeAssignments(
  employeeId: string
): Promise<EmployeeOfficeAssignment[]> {
  try {
    const q = query(
      collection(db, 'employee_office_assignments'),
      where('employeeId', '==', employeeId),
      where('status', '==', 'active'),
      orderBy('isPrimary', 'desc'),
      orderBy('assignedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      assignmentId: doc.id,
      ...doc.data(),
    } as EmployeeOfficeAssignment));
  } catch (error: any) {
    throw new Error(`Failed to get employee office assignments: ${error.message}`);
  }
}

/**
 * Get all employees assigned to an office
 */
export async function getOfficeEmployeeAssignments(
  officeId: string,
  primaryOnly: boolean = false
): Promise<EmployeeOfficeAssignment[]> {
  try {
    let q = query(
      collection(db, 'employee_office_assignments'),
      where('officeId', '==', officeId),
      where('status', '==', 'active')
    );
    
    if (primaryOnly) {
      q = query(q, where('isPrimary', '==', true));
    }
    
    const snapshot = await getDocs(query(q, orderBy('assignedAt', 'desc')));
    
    return snapshot.docs.map(doc => ({
      assignmentId: doc.id,
      ...doc.data(),
    } as EmployeeOfficeAssignment));
  } catch (error: any) {
    throw new Error(`Failed to get office employee assignments: ${error.message}`);
  }
}

/**
 * Update employee office assignment
 */
export async function updateEmployeeOfficeAssignment(
  assignmentId: string,
  updates: Partial<Pick<EmployeeOfficeAssignment, 'officeId' | 'isPrimary'>>
): Promise<void> {
  try {
    const assignmentRef = doc(db, 'employee_office_assignments', assignmentId);
    const assignmentDoc = await getDoc(assignmentRef);
    
    if (!assignmentDoc.exists()) {
      throw new Error('Assignment not found');
    }
    
    // If updating to primary, ensure no other primary exists
    if (updates.isPrimary) {
      const assignment = assignmentDoc.data() as EmployeeOfficeAssignment;
      const existingPrimaryQuery = query(
        collection(db, 'employee_office_assignments'),
        where('employeeId', '==', assignment.employeeId),
        where('isPrimary', '==', true),
        where('status', '==', 'active')
      );
      const existingPrimarySnapshot = await getDocs(existingPrimaryQuery);
      
      for (const doc of existingPrimarySnapshot.docs) {
        if (doc.id !== assignmentId) {
          await updateDoc(doc.ref, {
            isPrimary: false,
            updatedAt: Timestamp.now(),
          });
        }
      }
    }
    
    await updateDoc(assignmentRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error: any) {
    throw new Error(`Failed to update assignment: ${error.message}`);
  }
}

/**
 * Deactivate employee office assignment
 */
export async function deactivateEmployeeOfficeAssignment(
  assignmentId: string
): Promise<void> {
  try {
    const assignmentRef = doc(db, 'employee_office_assignments', assignmentId);
    
    await updateDoc(assignmentRef, {
      status: 'inactive',
      updatedAt: Timestamp.now(),
    });
  } catch (error: any) {
    throw new Error(`Failed to deactivate assignment: ${error.message}`);
  }
}

/**
 * Remove employee office assignment (hard delete)
 */
export async function removeEmployeeOfficeAssignment(
  assignmentId: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, 'employee_office_assignments', assignmentId));
  } catch (error: any) {
    throw new Error(`Failed to remove assignment: ${error.message}`);
  }
}

/**
 * Transfer employee to a new office
 */
export async function transferEmployeeToOffice(
  employeeId: string,
  newOfficeId: string,
  transferredBy: string,
  notes?: string
): Promise<string> {
  try {
    // Deactivate current primary assignment
    const currentAssignment = await getEmployeeOfficeAssignment(employeeId);
    if (currentAssignment) {
      await deactivateEmployeeOfficeAssignment(currentAssignment.employeeId + '_' + currentAssignment.officeId);
    }
    
    // Create new primary assignment
    const newAssignmentId = await assignEmployeeToOffice(
      employeeId,
      newOfficeId,
      transferredBy,
      true
    );
    
    // Add transfer note if provided
    if (notes) {
      await updateDoc(doc(db, 'employee_office_assignments', newAssignmentId), {
        notes,
      });
    }
    
    return newAssignmentId;
  } catch (error: any) {
    throw new Error(`Failed to transfer employee: ${error.message}`);
  }
}

/**
 * Get employee count by office
 */
export async function getEmployeeCountByOffice(officeId: string): Promise<number> {
  try {
    const q = query(
      collection(db, 'employee_office_assignments'),
      where('officeId', '==', officeId),
      where('isPrimary', '==', true),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error: any) {
    throw new Error(`Failed to get employee count: ${error.message}`);
  }
}

/**
 * Get unassigned employees in a company
 */
export async function getUnassignedEmployees(companyId: string): Promise<string[]> {
  try {
    // Get all active employees
    const employeesSnapshot = await getDocs(
      query(
        collection(db, 'employees'),
        where('companyId', '==', companyId),
        where('status', '==', 'active')
      )
    );
    
    const allEmployeeIds = employeesSnapshot.docs.map(doc => doc.id);
    
    // Get all assigned employees
    const assignmentsSnapshot = await getDocs(
      query(
        collection(db, 'employee_office_assignments'),
        where('isPrimary', '==', true),
        where('status', '==', 'active')
      )
    );
    
    const assignedEmployeeIds = new Set(
      assignmentsSnapshot.docs.map(doc => doc.data().employeeId)
    );
    
    // Return unassigned employees
    return allEmployeeIds.filter(id => !assignedEmployeeIds.has(id));
  } catch (error: any) {
    throw new Error(`Failed to get unassigned employees: ${error.message}`);
  }
}
