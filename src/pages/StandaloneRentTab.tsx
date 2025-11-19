import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useFirebaseData, VehicleFinancialData } from '@/hooks/useFirebaseData';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestorePaths } from '@/hooks/useFirestorePaths';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, updateDoc, doc, increment, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { Vehicle, Assignment } from '@/types/user';
import { Payment } from '@/hooks/useFirebaseData';
import { RentTab } from '@/components/VehicleDetails/RentTab';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// This is a simplified version - in full implementation, you'd need to copy all the data fetching and function logic from VehicleDetails

const StandaloneRentTab: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const vehicleId = searchParams.get('vehicleId');
  const { vehicles, loading, payments: firebasePayments, getVehicleFinancialData, assignments: allAssignments } = useFirebaseData();
  const { userInfo } = useAuth();
  const { toast } = useToast();
  const [isProcessingRentPayment, setIsProcessingRentPayment] = useState<number | null>(null);
  const [cashInHand, setCashInHand] = useState(0);

  // Calculate cash in hand - same as AccountsTab.tsx
  useEffect(() => {
    const calculateCashInHand = async () => {
      if (!userInfo?.companyId || !vehicleId) return;
      
      try {
        const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleId);
        const cashDoc = await getDoc(cashRef);
        
        if (cashDoc.exists()) {
          setCashInHand(cashDoc.data().balance || 0);
        } else {
          setCashInHand(0);
        }
      } catch (error) {
        console.error('Error calculating cash in hand:', error);
        setCashInHand(0);
      }
    };
    
    calculateCashInHand();
  }, [userInfo?.companyId, vehicleId]);

  const vehicle = vehicles.find(v => v.id === vehicleId);

  // Get financial data using the same function as VehicleDetails
  const financialData = vehicle ? getVehicleFinancialData(vehicleId!) : null;

  const getCurrentAssignmentDetails = () => {
    if (!financialData?.isCurrentlyRented || !financialData.currentAssignment) {
      return null;
    }
    return financialData.currentAssignment;
  };

  const reverseRentPayment = async (weekIndex: number, assignment: Assignment, weekStartDate: Date) => {
    // Find the payment record
    const weekRentPayment = firebasePayments.find(payment => {
      if (payment.vehicleId !== vehicleId || payment.status !== 'paid') return false;
      const paymentWeekStart = new Date(payment.weekStart);
      return Math.abs(paymentWeekStart.getTime() - weekStartDate.getTime()) < (24 * 60 * 60 * 1000);
    });

    if (!weekRentPayment) {
      toast({
        title: 'Payment Not Found',
        description: `No payment record found for week ${weekIndex + 1}.`,
        variant: 'destructive'
      });
      return;
    }

    // Check 24-hour time restriction
    const paidAt = new Date(weekRentPayment.paidAt || weekRentPayment.createdAt);
    const now = new Date();
    const hoursSincePayment = (now.getTime() - paidAt.getTime()) / (1000 * 60 * 60);

    if (hoursSincePayment > 24) {
      toast({
        title: 'Cannot Reverse',
        description: `Rent payments can only be reversed within 24 hours of collection. This payment was made ${Math.floor(hoursSincePayment)} hours ago.`,
        variant: 'destructive'
      });
      return;
    }

    try {
      // Update the payment status to 'reversed' instead of deleting
      const paymentsRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo?.companyId}/payments`);
      const paymentQuery = query(
        paymentsRef,
        where('vehicleId', '==', vehicleId),
        where('weekStart', '==', weekRentPayment.weekStart),
        where('status', '==', 'paid')
      );
      const paymentSnapshot = await getDocs(paymentQuery);
      if (!paymentSnapshot.empty) {
        const paymentDocRef = paymentSnapshot.docs[0].ref;
        await updateDoc(paymentDocRef, {
          status: 'reversed',
          reversedAt: new Date().toISOString(),
          reversedBy: userInfo?.email || 'system'
        });
      }

      // Decrease cash in hand by the rent amount (reverse of markRentCollected)
      const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo?.companyId}/cashInHand`, vehicleId);
      await updateDoc(cashRef, {
        balance: increment(-weekRentPayment.amountPaid), // Negative increment = decrement
        updatedAt: new Date().toISOString()
      });

      toast({
        title: 'Rent Payment Reversed',
        description: `Rent collection for week ${weekIndex + 1} has been reversed and ₹${weekRentPayment.amountPaid.toLocaleString()} has been deducted from cash balance.`,
      });

    } catch (error) {
      console.error('Error reversing rent payment:', error);
      toast({
        title: 'Reversal Failed',
        description: 'Failed to reverse rent payment. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const markRentCollected = async (weekIndex: number, assignment: Assignment, weekStartDate: Date) => {
    // Prevent double-click processing
    if (isProcessingRentPayment === weekIndex) return;
    
    try {
      setIsProcessingRentPayment(weekIndex);
      
      if (!assignment || !vehicle?.assignedDriverId) {
        toast({
          title: 'Error',
          description: 'No active assignment found for this vehicle.',
          variant: 'destructive'
        });
        return;
      }

      // Get week start and end dates (already calculated and passed)
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);
      weekEndDate.setHours(23, 59, 59, 999);
      
      // Check if this rent payment already exists
      const existingPayment = firebasePayments.find(payment => {
        if (payment.vehicleId !== vehicleId || payment.status !== 'paid') return false;
        const paymentWeekStart = new Date(payment.weekStart);
        // More precise matching - check if payment week matches this assignment week
        return Math.abs(paymentWeekStart.getTime() - weekStartDate.getTime()) < (24 * 60 * 60 * 1000);
      });
      
      if (existingPayment) {
        toast({
          title: 'Already Collected',
          description: `Rent for week ${weekIndex + 1} has already been recorded on ${new Date(existingPayment.paidAt || existingPayment.createdAt).toLocaleDateString()}.`,
          variant: 'destructive'
        });
        return;
      }

      if (!userInfo?.companyId) {
        toast({
          title: 'Error',
          description: 'Company information not found.',
          variant: 'destructive'
        });
        return;
      }

      // Create payment record in Firebase payments collection
      const paymentData = {
        assignmentId: assignment.id || '',
        vehicleId: vehicleId!,
        driverId: vehicle.assignedDriverId,
        weekStart: weekStartDate.toISOString().split('T')[0],
        weekNumber: weekIndex + 1, // Week number within assignment
        amountDue: assignment.weeklyRent,
        amountPaid: assignment.weeklyRent,
        paidAt: new Date().toISOString(),
        collectionDate: new Date().toISOString(),
        nextDueDate: new Date(weekEndDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next week
        daysLeft: 7, // Will be recalculated on load
        status: 'paid' as const,
        companyId: userInfo.companyId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add payment record directly to payments collection using correct path
      const paymentsRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/payments`);
      await addDoc(paymentsRef, paymentData);

      // Update cash in hand - INCREASE when rent is collected
      const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleId);
      await updateDoc(cashRef, {
        balance: increment(assignment.weeklyRent),
        updatedAt: new Date().toISOString()
      });

      toast({
        title: 'Rent Collected Successfully! 🎉',
        description: `Weekly rent of ₹${assignment.weeklyRent.toLocaleString()} for assignment week ${weekIndex + 1} (${weekStartDate.toLocaleDateString('en-IN')}) has been recorded and will reflect in earnings immediately.`,
      });

    } catch (error) {
      console.error('Error recording rent payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to record rent payment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessingRentPayment(null);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!vehicle) {
    return <div className="p-6">Vehicle not found</div>;
  }

  if (!financialData) {
    return <div className="p-6">Error loading financial data</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/utility')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Utility
          </Button>
          <h1 className="text-xl font-semibold">Rent Collection - {vehicle.vehicleName}</h1>
        </div>
        
        {/* Horizontal Vehicle Selector */}
        <div className="overflow-x-auto pb-2 px-1 pt-1">
          <div className="flex gap-3 min-w-max">
            {vehicles.map((v) => (
              <div
                key={v.id}
                onClick={() => navigate(`/rent?vehicleId=${v.id}`)}
                className={`cursor-pointer transition-all duration-200 ${
                  v.id === vehicleId
                    ? 'bg-blue-500 shadow-md'
                    : 'bg-white hover:bg-gray-50 border border-gray-200 shadow-sm'
                } rounded-lg p-3 min-w-[200px]`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    v.id === vehicleId ? 'bg-blue-600' : 'bg-gray-100'
                  }`}>
                    <span className={`font-semibold ${
                      v.id === vehicleId ? 'text-white' : 'text-gray-600'
                    }`}>
                      {v.vehicleName?.charAt(0) || 'V'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium text-sm ${
                      v.id === vehicleId ? 'text-white' : 'text-gray-900'
                    }`}>
                      {v.vehicleName}
                    </h3>
                    <p className={`text-xs ${
                      v.id === vehicleId ? 'text-blue-100' : 'text-gray-500'
                    }`}>{v.make} {v.model}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="p-6">
        {/* Cash in Hand Display */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600">Cash in Hand</h3>
              <p className="text-2xl font-bold text-green-600">₹{cashInHand.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Real-time balance</p>
              <p className="text-xs text-gray-400">Updated automatically</p>
            </div>
          </div>
        </div>

        <RentTab
          vehicle={vehicle}
          vehicleId={vehicleId || ''}
          firebasePayments={firebasePayments}
          financialData={financialData}
          getCurrentAssignmentDetails={getCurrentAssignmentDetails}
          markRentCollected={markRentCollected}
          reverseRentPayment={reverseRentPayment}
          isProcessingRentPayment={isProcessingRentPayment}
        />
      </div>
    </div>
  );
};

export default StandaloneRentTab;