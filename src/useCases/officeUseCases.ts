/**
 * Office Use Cases
 * Business logic for office management with GPS functionality
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
import type {
  Office,
  OfficeInput,
  OfficeHierarchy,
  OfficeListItem,
  GpsCoordinates,
  GpsValidationResult,
} from '@/types/office';

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  coord1: GpsCoordinates,
  coord2: GpsCoordinates
): number {
  const R = 6371000; // Earth's radius in meters
  const lat1 = (coord1.latitude * Math.PI) / 180;
  const lat2 = (coord2.latitude * Math.PI) / 180;
  const deltaLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Validate GPS coordinates against office location
 */
export function validateGpsLocation(
  userLocation: GpsCoordinates,
  officeLocation: GpsCoordinates,
  allowedRadius: number = 100,
  accuracy?: number
): GpsValidationResult {
  const distance = calculateDistance(userLocation, officeLocation);
  
  // If GPS accuracy is worse than the allowed radius, warn but don't fail
  if (accuracy && accuracy > allowedRadius) {
    return {
      isValid: false,
      distance,
      accuracy,
      message: `GPS accuracy (${accuracy.toFixed(0)}m) is too low. Please wait for better signal.`,
    };
  }
  
  if (distance <= allowedRadius) {
    return {
      isValid: true,
      distance,
      accuracy,
      message: `Within office radius (${distance.toFixed(0)}m from office)`,
    };
  }
  
  return {
    isValid: false,
    distance,
    accuracy,
    message: `Too far from office (${distance.toFixed(0)}m away, allowed: ${allowedRadius}m)`,
  };
}

/**
 * Firestore rejects fields with an `undefined` value outright (throws
 * "Unsupported field value: undefined"). Strip them before every write so
 * optional fields (e.g. parentOfficeId left unset) don't silently blow up
 * the save.
 */
function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/**
 * Create a new office
 */
export async function createOffice(officeData: OfficeInput): Promise<string> {
  try {
    const officeRef = collection(db, 'offices');

    const newOffice = stripUndefined({
      ...officeData,
      radius: officeData.radius || 100, // Default 100m radius
      status: 'active' as const,
      createdAt: Timestamp.now(),
    });

    const docRef = await addDoc(officeRef, newOffice);
    
    // Create hierarchy entry if has parent
    if (officeData.parentOfficeId) {
      await createHierarchyEntry(docRef.id, officeData.parentOfficeId);
    }
    
    return docRef.id;
  } catch (error: any) {
    throw new Error(`Failed to create office: ${error.message}`);
  }
}

/**
 * Get office by ID
 */
export async function getOfficeById(officeId: string): Promise<Office | null> {
  try {
    const officeDoc = await getDoc(doc(db, 'offices', officeId));
    
    if (!officeDoc.exists()) {
      return null;
    }
    
    return {
      officeId: officeDoc.id,
      ...officeDoc.data(),
      createdAt: officeDoc.data().createdAt?.toDate(),
      updatedAt: officeDoc.data().updatedAt?.toDate(),
    } as Office;
  } catch (error: any) {
    throw new Error(`Failed to get office: ${error.message}`);
  }
}

/**
 * Get all offices for a company
 */
export async function getOffices(companyId: string): Promise<Office[]> {
  try {
    const q = query(
      collection(db, 'offices'),
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      officeId: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Office[];
  } catch (error: any) {
    throw new Error(`Failed to get offices: ${error.message}`);
  }
}

/**
 * Get offices with employee counts
 */
export async function getOfficesWithEmployeeCount(companyId: string): Promise<OfficeListItem[]> {
  try {
    const offices = await getOffices(companyId);
    
    // Get employee counts for each office by counting real employees whose
    // employment.officeId points at it — the `employee_office_assignments`
    // collection is never populated anywhere in this app, so counting from
    // it always showed 0 regardless of actual assignments. A failure
    // counting one office must not blank out the entire office list —
    // default that office to 0 instead.
    const officeListItems = await Promise.all(
      offices.map(async (office) => {
        let employeeCount = 0;
        try {
          const employeesQuery = query(
            collection(db, 'employees'),
            where('employment.officeId', '==', office.officeId)
          );
          const employeesSnapshot = await getDocs(employeesQuery);
          employeeCount = employeesSnapshot.size;
        } catch (err) {
          console.warn(`Could not load employee count for office ${office.officeId}:`, err);
        }

        return {
          officeId: office.officeId,
          name: office.name,
          address: office.address,
          type: office.type,
          status: office.status,
          employeeCount,
          latitude: office.latitude,
          longitude: office.longitude,
        };
      })
    );
    
    return officeListItems;
  } catch (error: any) {
    throw new Error(`Failed to get offices with employee count: ${error.message}`);
  }
}

/**
 * Update an office
 */
export async function updateOffice(
  officeId: string,
  updates: Partial<OfficeInput>
): Promise<void> {
  try {
    const officeRef = doc(db, 'offices', officeId);

    await updateDoc(officeRef, stripUndefined({
      ...updates,
      updatedAt: Timestamp.now(),
    }));
    
    // Update hierarchy if parent changed
    if (updates.parentOfficeId !== undefined) {
      await updateHierarchyEntry(officeId, updates.parentOfficeId);
    }
  } catch (error: any) {
    throw new Error(`Failed to update office: ${error.message}`);
  }
}

/**
 * Delete an office (soft delete)
 */
export async function deleteOffice(officeId: string): Promise<void> {
  try {
    const officeRef = doc(db, 'offices', officeId);
    
    await updateDoc(officeRef, {
      status: 'inactive',
      updatedAt: Timestamp.now(),
    });
  } catch (error: any) {
    throw new Error(`Failed to delete office: ${error.message}`);
  }
}

/**
 * Hard delete an office
 */
export async function hardDeleteOffice(officeId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'offices', officeId));
    
    // Delete hierarchy entry
    const hierarchyQuery = query(
      collection(db, 'office_hierarchy'),
      where('officeId', '==', officeId)
    );
    const hierarchySnapshot = await getDocs(hierarchyQuery);
    
    hierarchySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });
  } catch (error: any) {
    throw new Error(`Failed to hard delete office: ${error.message}`);
  }
}

/**
 * Get active offices count
 */
export async function getActiveOfficesCount(companyId: string): Promise<number> {
  try {
    const q = query(
      collection(db, 'offices'),
      where('companyId', '==', companyId),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error: any) {
    throw new Error(`Failed to get active offices count: ${error.message}`);
  }
}

/**
 * Search offices by name or address
 */
export async function searchOffices(
  companyId: string,
  searchTerm: string
): Promise<Office[]> {
  try {
    const offices = await getOffices(companyId);
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return offices.filter(office =>
      office.name.toLowerCase().includes(lowerSearchTerm) ||
      office.address.toLowerCase().includes(lowerSearchTerm)
    );
  } catch (error: any) {
    throw new Error(`Failed to search offices: ${error.message}`);
  }
}

/**
 * Get offices by type
 */
export async function getOfficesByType(
  companyId: string,
  type: 'head_office' | 'branch' | 'remote'
): Promise<Office[]> {
  try {
    const q = query(
      collection(db, 'offices'),
      where('companyId', '==', companyId),
      where('type', '==', type)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      officeId: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Office[];
  } catch (error: any) {
    throw new Error(`Failed to get offices by type: ${error.message}`);
  }
}

// Hierarchy helper functions
async function createHierarchyEntry(
  officeId: string,
  parentId: string
): Promise<void> {
  try {
    // Get parent hierarchy to determine level and path
    const parentHierarchyQuery = query(
      collection(db, 'office_hierarchy'),
      where('officeId', '==', parentId)
    );
    
    const parentSnapshot = await getDocs(parentHierarchyQuery);
    
    let level = 1;
    let path = officeId;
    
    if (!parentSnapshot.empty) {
      const parentHierarchy = parentSnapshot.docs[0].data() as OfficeHierarchy;
      level = parentHierarchy.level + 1;
      path = `${parentHierarchy.path}/${officeId}`;
    }
    
    await addDoc(collection(db, 'office_hierarchy'), {
      officeId,
      parentId,
      level,
      path,
    });
  } catch (error: any) {
    throw new Error(`Failed to create hierarchy entry: ${error.message}`);
  }
}

async function updateHierarchyEntry(
  officeId: string,
  newParentId?: string
): Promise<void> {
  try {
    const hierarchyQuery = query(
      collection(db, 'office_hierarchy'),
      where('officeId', '==', officeId)
    );
    
    const hierarchySnapshot = await getDocs(hierarchyQuery);
    
    if (hierarchySnapshot.empty) {
      if (newParentId) {
        await createHierarchyEntry(officeId, newParentId);
      }
      return;
    }
    
    const hierarchyDoc = hierarchySnapshot.docs[0];
    
    if (!newParentId) {
      // Remove hierarchy if no parent
      await deleteDoc(hierarchyDoc.ref);
      return;
    }
    
    // Update hierarchy
    const parentHierarchyQuery = query(
      collection(db, 'office_hierarchy'),
      where('officeId', '==', newParentId)
    );
    
    const parentSnapshot = await getDocs(parentHierarchyQuery);
    
    let level = 1;
    let path = officeId;
    
    if (!parentSnapshot.empty) {
      const parentHierarchy = parentSnapshot.docs[0].data() as OfficeHierarchy;
      level = parentHierarchy.level + 1;
      path = `${parentHierarchy.path}/${officeId}`;
    }
    
    await updateDoc(hierarchyDoc.ref, {
      parentId: newParentId,
      level,
      path,
    });
    
    // Update all children recursively
    await updateChildrenHierarchy(officeId);
  } catch (error: any) {
    throw new Error(`Failed to update hierarchy entry: ${error.message}`);
  }
}

/**
 * Recursively update hierarchy for all child offices
 */
async function updateChildrenHierarchy(parentOfficeId: string): Promise<void> {
  try {
    const officesRef = collection(db, 'offices');
    const childrenQuery = query(officesRef, where('parentOfficeId', '==', parentOfficeId));
    const childrenSnapshot = await getDocs(childrenQuery);

    const updatePromises = childrenSnapshot.docs.map(async (childDoc) => {
      const childOfficeId = childDoc.id;
      await updateHierarchyEntry(childOfficeId, parentOfficeId);
    });

    await Promise.all(updatePromises);
  } catch (error: any) {
    throw new Error(`Failed to update children hierarchy: ${error.message}`);
  }
}

/**
 * Move office to a new parent in hierarchy
 */
export async function moveOfficeInHierarchy(
  officeId: string,
  newParentOfficeId: string | undefined
): Promise<void> {
  try {
    // Validate move (prevent circular references)
    if (newParentOfficeId) {
      const isCircular = await checkCircularReference(officeId, newParentOfficeId);
      if (isCircular) {
        throw new Error('Cannot move office: circular reference detected');
      }
    }

    // Update office parent
    await updateDoc(doc(db, 'offices', officeId), {
      parentOfficeId: newParentOfficeId || null,
      updatedAt: Timestamp.now(),
    });

    // Update hierarchy
    await updateHierarchyEntry(officeId, newParentOfficeId);
  } catch (error: any) {
    throw new Error(`Failed to move office: ${error.message}`);
  }
}

/**
 * Check for circular references in office hierarchy
 */
async function checkCircularReference(
  officeId: string,
  newParentOfficeId: string
): Promise<boolean> {
  if (officeId === newParentOfficeId) {
    return true;
  }

  const hierarchyRef = collection(db, 'office_hierarchy');
  const parentHierarchySnapshot = await getDocs(
    query(hierarchyRef, where('officeId', '==', newParentOfficeId))
  );

  if (parentHierarchySnapshot.empty) {
    return false;
  }

  const parentHierarchy = parentHierarchySnapshot.docs[0].data() as OfficeHierarchy;
  return parentHierarchy.path.includes(officeId);
}

/**
 * Get office hierarchy path (from root to office)
 */
export async function getOfficeHierarchyPath(officeId: string): Promise<Office[]> {
  try {
    const hierarchyRef = collection(db, 'office_hierarchy');
    const hierarchySnapshot = await getDocs(
      query(hierarchyRef, where('officeId', '==', officeId))
    );

    if (hierarchySnapshot.empty) {
      const office = await getOfficeById(officeId);
      return office ? [office] : [];
    }

    const hierarchy = hierarchySnapshot.docs[0].data() as OfficeHierarchy;
    const pathIds = hierarchy.path.split('/');
    const officesRef = collection(db, 'offices');

    const officePromises = pathIds.map(async (id) => {
      const officeDoc = await getDoc(doc(officesRef, id));
      if (officeDoc.exists()) {
        return {
          officeId: officeDoc.id,
          ...officeDoc.data(),
        } as Office;
      }
      return null;
    });

    const offices = await Promise.all(officePromises);
    return offices.filter((office): office is Office => office !== null);
  } catch (error: any) {
    throw new Error(`Failed to get hierarchy path: ${error.message}`);
  }
}

/**
 * Get all descendants of an office (children, grandchildren, etc.)
 */
export async function getOfficeDescendants(officeId: string): Promise<Office[]> {
  try {
    const hierarchyRef = collection(db, 'office_hierarchy');
    const allHierarchySnapshot = await getDocs(hierarchyRef);

    const descendants: Office[] = [];
    const officesRef = collection(db, 'offices');

    for (const hierarchyDoc of allHierarchySnapshot.docs) {
      const hierarchy = hierarchyDoc.data() as OfficeHierarchy;
      
      // Check if this office is in the hierarchy path and not the office itself
      if (hierarchy.path.includes(officeId) && hierarchy.officeId !== officeId) {
        const officeDoc = await getDoc(doc(officesRef, hierarchy.officeId));
        if (officeDoc.exists()) {
          descendants.push({
            officeId: officeDoc.id,
            ...officeDoc.data(),
          } as Office);
        }
      }
    }

    return descendants;
  } catch (error: any) {
    throw new Error(`Failed to get descendants: ${error.message}`);
  }
}
