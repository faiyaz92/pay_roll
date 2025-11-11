import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, CheckCircle, AlertCircle } from 'lucide-react';
import { SectionNumberBadge } from '../VehicleDetails/SectionNumberBadge';

interface BulkPaymentItem {
  vehicleId: string;
  vehicleName: string;
  amount: number;
  monthBreakdown?: { month: string; amount: number }[];
  overdueEMIs?: { monthIndex: number; emiAmount: number; dueDate: string }[];
  overdueWeeks?: { weekIndex: number; weekStartDate: string; rentAmount: number }[];
  checked: boolean;
}

interface BulkPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  paymentType: 'gst' | 'service_charge' | 'partner_share' | 'owner_share' | 'emi' | 'rent';
  items: BulkPaymentItem[];
  onConfirm: (selectedItems: BulkPaymentItem[], emiPenalties?: Record<string, Record<number, string>>) => void;
  isLoading?: boolean;
}

const BulkPaymentDialog: React.FC<BulkPaymentDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  paymentType,
  items,
  onConfirm,
  isLoading = false
}) => {
  const [selectedItems, setSelectedItems] = useState<BulkPaymentItem[]>(items);
  const [emiPenalties, setEmiPenalties] = useState<Record<string, Record<number, string>>>({});
  const [emiSelections, setEmiSelections] = useState<Record<string, number[]>>({});
  const [rentSelections, setRentSelections] = useState<Record<string, number[]>>({});
  const isEmi = paymentType === 'emi';
  const isRent = paymentType === 'rent';

  // Update selected items when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Sort items by oldest overdue due date for smart selection
      let sortedItems = [...items];
      if (isEmi || isRent) {
        sortedItems.sort((a, b) => {
          let aDate: Date | null = null;
          let bDate: Date | null = null;

          if (isEmi) {
            if (a.overdueEMIs && a.overdueEMIs.length > 0) {
              aDate = new Date(a.overdueEMIs[0].dueDate);
            }
            if (b.overdueEMIs && b.overdueEMIs.length > 0) {
              bDate = new Date(b.overdueEMIs[0].dueDate);
            }
          } else if (isRent) {
            if (a.overdueWeeks && a.overdueWeeks.length > 0) {
              aDate = new Date(a.overdueWeeks[0].weekStartDate);
            }
            if (b.overdueWeeks && b.overdueWeeks.length > 0) {
              bDate = new Date(b.overdueWeeks[0].weekStartDate);
            }
          }

          // Sort by oldest overdue date first (null dates go to end)
          if (!aDate && !bDate) return 0;
          if (!aDate) return 1;
          if (!bDate) return -1;
          return aDate.getTime() - bDate.getTime();
        });
      }

      setSelectedItems(sortedItems);
      // Initialize EMI penalties for each vehicle
      if (isEmi) {
        const initialPenalties: Record<string, Record<number, string>> = {};
        const initialSelections: Record<string, number[]> = {};
        sortedItems.forEach(item => {
          if (item.overdueEMIs && item.overdueEMIs.length > 0) {
            initialPenalties[item.vehicleId] = {};
            const orderedIndices = [...item.overdueEMIs]
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              .map(emi => emi.monthIndex);

            orderedIndices.forEach(index => {
              initialPenalties[item.vehicleId][index] = '0';
            });

            initialSelections[item.vehicleId] = orderedIndices;
          }
        });
        setEmiPenalties(initialPenalties);
        setEmiSelections(initialSelections);
        setRentSelections({});
      } else if (isRent) {
        const initialRentSelections: Record<string, number[]> = {};
        sortedItems.forEach(item => {
          if (item.overdueWeeks && item.overdueWeeks.length > 0) {
            const orderedIndices = [...item.overdueWeeks]
              .sort((a, b) => a.weekIndex - b.weekIndex)
              .map(week => week.weekIndex);

            if (orderedIndices.length > 0) {
              initialRentSelections[item.vehicleId] = orderedIndices;
            }
          }
        });
        setRentSelections(initialRentSelections);
        setEmiPenalties({});
        setEmiSelections({});
      } else {
        setEmiPenalties({});
        setEmiSelections({});
        setRentSelections({});
      }
    }
  }, [isOpen, items, paymentType]);

  const handleItemToggle = (vehicleId: string) => {
    const currentItem = selectedItems.find(item => item.vehicleId === vehicleId);
    if (!currentItem) {
      return;
    }

    const newChecked = !currentItem.checked;

    setSelectedItems(prev =>
      prev.map(item =>
        item.vehicleId === vehicleId
          ? { ...item, checked: newChecked }
          : item
      )
    );

    if (isEmi) {
      const orderedIndices = currentItem.overdueEMIs
        ? [...currentItem.overdueEMIs]
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .map(emi => emi.monthIndex)
        : [];

      if (newChecked) {
        setEmiSelections(prev => ({
          ...prev,
          [vehicleId]: prev[vehicleId] && prev[vehicleId].length > 0 ? prev[vehicleId] : orderedIndices
        }));
        setEmiPenalties(prev => {
          const existing = prev[vehicleId] || {};
          const updatedVehicle: Record<number, string> = { ...existing };
          orderedIndices.forEach(index => {
            if (updatedVehicle[index] === undefined) {
              updatedVehicle[index] = '0';
            }
          });
          return {
            ...prev,
            [vehicleId]: updatedVehicle
          };
        });
      } else {
        setEmiSelections(prev => {
          if (!prev[vehicleId]) return prev;
          const updated = { ...prev };
          delete updated[vehicleId];
          return updated;
        });
        setEmiPenalties(prev => {
          if (!prev[vehicleId]) return prev;
          const updated = { ...prev };
          delete updated[vehicleId];
          return updated;
        });
      }
    } else if (isRent) {
      const orderedIndices = currentItem.overdueWeeks
        ? [...currentItem.overdueWeeks]
            .sort((a, b) => a.weekIndex - b.weekIndex)
            .map(week => week.weekIndex)
        : [];

      if (newChecked) {
        setRentSelections(prev => ({
          ...prev,
          [vehicleId]: prev[vehicleId] && prev[vehicleId].length > 0 ? prev[vehicleId] : orderedIndices
        }));
      } else {
        setRentSelections(prev => {
          if (!prev[vehicleId]) return prev;
          const updated = { ...prev };
          delete updated[vehicleId];
          return updated;
        });
      }
    }
  };

  const deriveSequentialSelection = (
    targetIndex: number,
    orderedIndices: number[],
    currentSelection: number[]
  ) => {
    const position = orderedIndices.indexOf(targetIndex);
    if (position === -1) {
      return currentSelection;
    }

    const isSelected = currentSelection.includes(targetIndex);
    const nextSelection = isSelected
      ? orderedIndices.slice(0, position)
      : orderedIndices.slice(0, position + 1);

    if (
      nextSelection.length === currentSelection.length &&
      nextSelection.every((value, index) => value === currentSelection[index])
    ) {
      return currentSelection;
    }

    return nextSelection;
  };

  const getOrderedEmiIndices = (item: BulkPaymentItem) => {
    if (!item.overdueEMIs || item.overdueEMIs.length === 0) {
      return [];
    }

    return [...item.overdueEMIs]
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .map(emi => emi.monthIndex);
  };

  const getOrderedRentIndices = (item: BulkPaymentItem) => {
    if (!item.overdueWeeks || item.overdueWeeks.length === 0) {
      return [];
    }

    return [...item.overdueWeeks]
      .sort((a, b) => a.weekIndex - b.weekIndex)
      .map(week => week.weekIndex);
  };

  const handleToggleVehicleEmi = (vehicleId: string, targetIndex: number, orderedIndices: number[]) => {
    let computedSelection: number[] = [];

    setEmiSelections(prev => {
      const currentSelection = prev[vehicleId] || [];
      const position = orderedIndices.indexOf(targetIndex);

      if (position === -1) {
        computedSelection = currentSelection;
        return prev;
      }

      const isSelected = currentSelection.includes(targetIndex);
      computedSelection = isSelected
        ? orderedIndices.slice(0, position)
        : orderedIndices.slice(0, position + 1);

      const selectionUnchanged = computedSelection.length === currentSelection.length && computedSelection.every((value, idx) => value === currentSelection[idx]);
      if (selectionUnchanged) {
        return prev;
      }

      const updated = { ...prev };
      if (computedSelection.length === 0) {
        delete updated[vehicleId];
      } else {
        updated[vehicleId] = computedSelection;
      }
      return updated;
    });

    setEmiPenalties(prev => {
      if (computedSelection.length === 0) {
        if (!prev[vehicleId]) return prev;
        const updated = { ...prev };
        delete updated[vehicleId];
        return updated;
      }

      const existing = prev[vehicleId] || {};
      const updatedVehicle: Record<number, string> = {};
      computedSelection.forEach(index => {
        updatedVehicle[index] = existing[index] ?? '0';
      });

      return {
        ...prev,
        [vehicleId]: updatedVehicle
      };
    });

    if (computedSelection.length === 0) {
      setSelectedItems(prev =>
        prev.map(item =>
          item.vehicleId === vehicleId
            ? { ...item, checked: false }
            : item
        )
      );
    } else {
      setSelectedItems(prev =>
        prev.map(item =>
          item.vehicleId === vehicleId
            ? { ...item, checked: true }
            : item
        )
      );
    }
  };

  const handleSelectAllEmisForVehicle = (vehicleId: string, orderedIndices: number[]) => {
    if (orderedIndices.length === 0) {
      return;
    }

    setEmiSelections(prev => ({
      ...prev,
      [vehicleId]: [...orderedIndices]
    }));

    setEmiPenalties(prev => {
      const existing = prev[vehicleId] || {};
      const updatedVehicle: Record<number, string> = { ...existing };
      orderedIndices.forEach(index => {
        if (updatedVehicle[index] === undefined) {
          updatedVehicle[index] = '0';
        }
      });
      return {
        ...prev,
        [vehicleId]: updatedVehicle
      };
    });

    setSelectedItems(prev =>
      prev.map(item =>
        item.vehicleId === vehicleId
          ? { ...item, checked: true }
          : item
      )
    );
  };

  const handleToggleVehicleRent = (vehicleId: string, targetIndex: number, orderedIndices: number[]) => {
    let computedSelection: number[] = [];

    setRentSelections(prev => {
      const currentSelection = prev[vehicleId] || [];
      const nextSelection = deriveSequentialSelection(targetIndex, orderedIndices, currentSelection);
      computedSelection = nextSelection;

      if (nextSelection === currentSelection) {
        return prev;
      }

      const updated = { ...prev };
      if (nextSelection.length === 0) {
        delete updated[vehicleId];
      } else {
        updated[vehicleId] = nextSelection;
      }
      return updated;
    });

    if (computedSelection.length === 0) {
      setSelectedItems(prev =>
        prev.map(item =>
          item.vehicleId === vehicleId
            ? { ...item, checked: false }
            : item
        )
      );
    } else {
      setSelectedItems(prev =>
        prev.map(item =>
          item.vehicleId === vehicleId
            ? { ...item, checked: true }
            : item
        )
      );
    }
  };

  const handleSelectAllRentWeeksForVehicle = (vehicleId: string, orderedIndices: number[]) => {
    if (orderedIndices.length === 0) {
      return;
    }

    setRentSelections(prev => ({
      ...prev,
      [vehicleId]: [...orderedIndices]
    }));

    setSelectedItems(prev =>
      prev.map(item =>
        item.vehicleId === vehicleId
          ? { ...item, checked: true }
          : item
      )
    );
  };

  const handleSelectAll = () => {
    const areAllVehiclesFullySelected = selectedItems.every(item => {
      if (!item.checked) {
        return false;
      }
      if (isEmi) {
        const orderedIndices = getOrderedEmiIndices(item);
        const selection = emiSelections[item.vehicleId] || [];
        return orderedIndices.length > 0 ? selection.length === orderedIndices.length : true;
      }
      if (isRent) {
        const orderedIndices = getOrderedRentIndices(item);
        const selection = rentSelections[item.vehicleId] || [];
        return orderedIndices.length > 0 ? selection.length === orderedIndices.length : true;
      }
      return true;
    });

    if (areAllVehiclesFullySelected) {
      setSelectedItems(prev => prev.map(item => ({ ...item, checked: false })));
      if (isEmi) {
        setEmiSelections({});
        setEmiPenalties({});
      }
      if (isRent) {
        setRentSelections({});
      }
      return;
    }

    setSelectedItems(prev => prev.map(item => ({ ...item, checked: true })));

    if (isEmi) {
      const updatedSelections: Record<string, number[]> = {};
      const updatedPenalties: Record<string, Record<number, string>> = {};

      selectedItems.forEach(item => {
        const orderedIndices = getOrderedEmiIndices(item);
        if (orderedIndices.length > 0) {
          updatedSelections[item.vehicleId] = orderedIndices;
          const existing = emiPenalties[item.vehicleId] || {};
          const vehiclePenalties: Record<number, string> = {};
          orderedIndices.forEach(index => {
            vehiclePenalties[index] = existing[index] ?? '0';
          });
          updatedPenalties[item.vehicleId] = vehiclePenalties;
        }
      });

      setEmiSelections(updatedSelections);
      setEmiPenalties(updatedPenalties);
    } else if (isRent) {
      const updatedSelections: Record<string, number[]> = {};

      selectedItems.forEach(item => {
        const orderedIndices = getOrderedRentIndices(item);
        if (orderedIndices.length > 0) {
          updatedSelections[item.vehicleId] = orderedIndices;
        }
      });

      setRentSelections(updatedSelections);
    }
  };

  const handleEmiPenaltyChange = (vehicleId: string, monthIndex: number, penalty: string) => {
    setEmiPenalties(prev => ({
      ...prev,
      [vehicleId]: {
        ...prev[vehicleId],
        [monthIndex]: penalty
      }
    }));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const selectedVehicleCount = selectedItems.reduce((count, item) => {
    if (!item.checked) {
      return count;
    }
    if (isEmi) {
      const selection = emiSelections[item.vehicleId] || [];
      return selection.length > 0 ? count + 1 : count;
    }
    if (isRent) {
      const selection = rentSelections[item.vehicleId] || [];
      return selection.length > 0 ? count + 1 : count;
    }
    return count + 1;
  }, 0);

  const selectedTotal = selectedItems.reduce((sum, item) => {
    if (!item.checked) {
      return sum;
    }

    if (isEmi && item.overdueEMIs) {
      const selection = new Set(emiSelections[item.vehicleId] || []);
      if (selection.size === 0) {
        return sum;
      }

      const emiBase = item.overdueEMIs.reduce((emiSum, emi) => {
        return selection.has(emi.monthIndex) ? emiSum + emi.emiAmount : emiSum;
      }, 0);

      const penaltySum = item.overdueEMIs.reduce((penSum, emi) => {
        if (!selection.has(emi.monthIndex)) {
          return penSum;
        }
        const penaltyValue = parseFloat(emiPenalties[item.vehicleId]?.[emi.monthIndex] || '0') || 0;
        return penSum + penaltyValue;
      }, 0);

      return sum + emiBase + penaltySum;
    }

    if (isRent && item.overdueWeeks) {
      const selection = new Set(rentSelections[item.vehicleId] || []);
      if (selection.size === 0) {
        return sum;
      }

      const rentSum = item.overdueWeeks.reduce((weekSum, week) => (
        selection.has(week.weekIndex) ? weekSum + week.rentAmount : weekSum
      ), 0);

      return sum + rentSum;
    }

    return sum + item.amount;
  }, 0);

  const handleConfirm = () => {
    const confirmedItems = selectedItems
      .filter(item => item.checked)
      .map(item => {
        if (isEmi && item.overdueEMIs) {
          const selectionSet = new Set(emiSelections[item.vehicleId] || []);
          const filteredEmis = item.overdueEMIs.filter(emi => selectionSet.has(emi.monthIndex));
          const recalculatedAmount = filteredEmis.reduce((sum, emi) => sum + emi.emiAmount, 0);

          return {
            ...item,
            amount: recalculatedAmount,
            overdueEMIs: filteredEmis
          };
        }

        if (isRent && item.overdueWeeks) {
          const selectionSet = new Set(rentSelections[item.vehicleId] || []);
          const filteredWeeks = item.overdueWeeks.filter(week => selectionSet.has(week.weekIndex));
          const recalculatedAmount = filteredWeeks.reduce((sum, week) => sum + week.rentAmount, 0);

          return {
            ...item,
            amount: recalculatedAmount,
            overdueWeeks: filteredWeeks
          };
        }

        return item;
      })
      .filter(item => {
        if (isEmi) {
          return !!item.overdueEMIs && item.overdueEMIs.length > 0;
        }
        if (isRent) {
          return !!item.overdueWeeks && item.overdueWeeks.length > 0;
        }
        return true;
      });

    if (confirmedItems.length === 0) {
      return;
    }

    let filteredPenalties: Record<string, Record<number, string>> | undefined;

    if (isEmi) {
      filteredPenalties = {};

      confirmedItems.forEach(item => {
        if (!item.overdueEMIs) {
          return;
        }

        const selectionSet = new Set(emiSelections[item.vehicleId] || []);
        if (selectionSet.size === 0) {
          return;
        }

        const vehiclePenalties = emiPenalties[item.vehicleId] || {};
        const filteredVehiclePenalties: Record<number, string> = {};

        selectionSet.forEach(index => {
          filteredVehiclePenalties[index] = vehiclePenalties[index] ?? '0';
        });

        if (Object.keys(filteredVehiclePenalties).length > 0) {
          filteredPenalties![item.vehicleId] = filteredVehiclePenalties;
        }
      });

      if (filteredPenalties && Object.keys(filteredPenalties).length === 0) {
        filteredPenalties = undefined;
      }
    }

    onConfirm(confirmedItems, filteredPenalties);
  };

  const getPaymentTypeLabel = () => {
    switch (paymentType) {
      case 'rent': return 'Rent';
      case 'gst': return 'GST';
      case 'service_charge': return 'Service Charge';
      case 'partner_share': return 'Partner Share';
      case 'owner_share': return 'Owner Share';
      case 'emi': return 'EMI';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <SectionNumberBadge id="1" label="Bulk Payment Overview" className="mb-2" />
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Alert for EMI/Rent oldest-first settlement */}
          {(isEmi || isRent) && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <div className="text-sm text-orange-800">
                    <strong>Important:</strong> {isEmi
                      ? 'EMI payments always settle the oldest unpaid installment first for each vehicle. You can select or deselect any vehicle, but inside a vehicle later EMIs automatically include every older due EMI.'
                      : 'Rent payments settle overdue weeks oldest-first for each vehicle. Feel free to select or deselect any vehicle before confirming the collection.'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <Card>
            <CardHeader className="pb-3">
              <SectionNumberBadge id="2" label="Payment Summary" className="mb-2" />
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Payment Summary</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  {selectedItems.every(item => item.checked) ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedVehicleCount}/{items.length}
                  </div>
                  <div className="text-sm text-gray-600">Selected Vehicles</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{selectedTotal.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Selected Amount</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    ₹{totalAmount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Amount</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Breakdown */}
          <div className="space-y-3">
            <SectionNumberBadge id="3" label="Vehicle Breakdown" className="mb-2" />
            <h3 className="text-lg font-semibold">Vehicle Breakdown</h3>
            {selectedItems.map(item => (
              <Card key={item.vehicleId} className={`transition-all ${item.checked ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={() => handleItemToggle(item.vehicleId)}
                      />
                      <div>
                        <h4 className="font-medium">{item.vehicleName}</h4>
                        <p className="text-sm text-gray-600">
                          {getPaymentTypeLabel()}: ₹{item.amount.toLocaleString()}
                          {isEmi && item.overdueEMIs && item.overdueEMIs.length > 0 && (
                            <span className="ml-2 text-red-600 font-medium">
                              ({item.overdueEMIs.length} overdue EMI{item.overdueEMIs.length > 1 ? 's' : ''})
                            </span>
                          )}
                          {isRent && item.overdueWeeks && item.overdueWeeks.length > 0 && (
                            <span className="ml-2 text-red-600 font-medium">
                              ({item.overdueWeeks.length} overdue week{item.overdueWeeks.length > 1 ? 's' : ''})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        ₹{item.amount.toLocaleString()}
                      </div>
                      {item.checked && (
                        <Badge variant="default" className="mt-1">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Selected
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Monthly Breakdown for Quarterly */}
                  {item.monthBreakdown && item.monthBreakdown.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-medium text-gray-700 mb-2">Monthly Breakdown:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {item.monthBreakdown.map((month, index) => (
                          <div key={index} className="text-center p-2 bg-gray-50 rounded">
                            <div className="text-xs text-gray-600">{month.month}</div>
                            <div className="text-sm font-medium">₹{month.amount.toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* EMI Details with Sequential Selection */}
                  {isEmi && item.overdueEMIs && item.overdueEMIs.length > 0 && (() => {
                    const sortedEmis = [...item.overdueEMIs].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
                    const orderedIndices = sortedEmis.map(emi => emi.monthIndex);
                    const selectedIndices = new Set(emiSelections[item.vehicleId] || []);
                    const vehicleSelectedCount = selectedIndices.size;
                    const vehicleTotalSelectedAmount = sortedEmis.reduce((emiSum, emi) => {
                      return selectedIndices.has(emi.monthIndex) ? emiSum + emi.emiAmount : emiSum;
                    }, 0);
                    const vehicleTotalPenalty = sortedEmis.reduce((penSum, emi) => {
                      if (!selectedIndices.has(emi.monthIndex)) {
                        return penSum;
                      }
                      return penSum + (parseFloat(emiPenalties[item.vehicleId]?.[emi.monthIndex] || '0') || 0);
                    }, 0);

                    return (
                      <div className="mt-3 pt-3 border-t space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Overdue EMIs</p>
                            <p className="text-xs text-gray-500">
                              {vehicleSelectedCount} of {orderedIndices.length} EMI{orderedIndices.length > 1 ? 's' : ''} selected
                            </p>
                          </div>
                          {vehicleSelectedCount < orderedIndices.length && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectAllEmisForVehicle(item.vehicleId, orderedIndices)}
                            >
                              Select Oldest Sequence
                            </Button>
                          )}
                        </div>

                        <div className="rounded border border-dashed border-orange-200 bg-orange-50 p-3 text-xs text-orange-700">
                          Selecting a later EMI automatically includes every older unpaid EMI for this vehicle. Deselecting one clears newer selections to keep payments in order.
                        </div>

                        <div className="space-y-2">
                          {sortedEmis.map(emi => {
                            const isSelected = selectedIndices.has(emi.monthIndex);
                            const dueDate = new Date(emi.dueDate);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                            let statusText = '';
                            let statusColor = 'text-gray-500';

                            if (daysDiff < 0) {
                              statusText = `${Math.abs(daysDiff)} day${Math.abs(daysDiff) === 1 ? '' : 's'} overdue`;
                              statusColor = 'text-red-600';
                            } else if (daysDiff === 0) {
                              statusText = 'Due Today';
                              statusColor = 'text-yellow-600';
                            } else if (daysDiff <= 3) {
                              statusText = `${daysDiff} day${daysDiff === 1 ? '' : 's'} left`;
                              statusColor = 'text-yellow-600';
                            } else {
                              statusText = `Due ${dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
                            }

                            return (
                              <div
                                key={`${item.vehicleId}-${emi.monthIndex}`}
                                className={`flex items-center gap-3 rounded border p-3 ${isSelected ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleToggleVehicleEmi(item.vehicleId, emi.monthIndex, orderedIndices)}
                                />
                                <div className="flex-1">
                                  <div className="font-medium">EMI {emi.monthIndex + 1}</div>
                                  <div className={`text-xs ${statusColor}`}>{statusText}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <div className="text-sm font-medium">₹{emi.emiAmount.toLocaleString()}</div>
                                    <div className="text-xs text-gray-600">EMI Amount</div>
                                  </div>
                                  <div className="w-20">
                                    <Label htmlFor={`penalty-${item.vehicleId}-${emi.monthIndex}`} className="text-xs">Penalty</Label>
                                    <Input
                                      id={`penalty-${item.vehicleId}-${emi.monthIndex}`}
                                      type="number"
                                      placeholder="0"
                                      value={emiPenalties[item.vehicleId]?.[emi.monthIndex] || '0'}
                                      onChange={(e) => handleEmiPenaltyChange(item.vehicleId, emi.monthIndex, e.target.value)}
                                      className="h-8 text-xs"
                                      min="0"
                                      step="0.01"
                                      disabled={!isSelected}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-between border-t pt-2 text-sm font-medium text-gray-700">
                          <span>Selected Total</span>
                          <span>
                            ₹{(vehicleSelectedCount === 0 ? 0 : vehicleTotalSelectedAmount + vehicleTotalPenalty).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Rent Week Details */}
                  {isRent && item.overdueWeeks && item.overdueWeeks.length > 0 && (() => {
                    const orderedWeeks = [...item.overdueWeeks].sort((a, b) => a.weekIndex - b.weekIndex);
                    const orderedIndices = orderedWeeks.map(week => week.weekIndex);
                    const selectedIndices = new Set(rentSelections[item.vehicleId] || []);
                    const vehicleSelectedCount = selectedIndices.size;
                    const vehicleSelectedTotal = orderedWeeks.reduce((weekSum, week) => (
                      selectedIndices.has(week.weekIndex) ? weekSum + week.rentAmount : weekSum
                    ), 0);

                    return (
                      <div className="mt-3 pt-3 border-t space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Due Rent Weeks</p>
                            <p className="text-xs text-gray-500">
                              {vehicleSelectedCount} of {orderedIndices.length} week{orderedIndices.length > 1 ? 's' : ''} selected
                            </p>
                          </div>
                          {vehicleSelectedCount < orderedIndices.length && orderedIndices.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectAllRentWeeksForVehicle(item.vehicleId, orderedIndices)}
                            >
                              Select Oldest Sequence
                            </Button>
                          )}
                        </div>

                        <div className="rounded border border-dashed border-orange-200 bg-orange-50 p-3 text-xs text-orange-700">
                          Selecting a later week automatically includes every older unpaid week for this vehicle. Deselecting one clears newer selections to keep collections in order.
                        </div>

                        <div className="space-y-2">
                          {orderedWeeks.map(week => {
                            const isSelected = selectedIndices.has(week.weekIndex);
                            const startDate = new Date(week.weekStartDate);
                            startDate.setHours(0, 0, 0, 0);
                            const endDate = new Date(startDate);
                            endDate.setDate(endDate.getDate() + 6);

                            const today = new Date();
                            today.setHours(0, 0, 0, 0);

                            const isPastWeek = endDate < today;
                            const isCurrentWeek = startDate <= today && today <= endDate;

                            let badgeLabel = 'Upcoming';
                            let badgeClasses = 'border-gray-200 bg-gray-100 text-gray-600';
                            let statusText = startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

                            if (isPastWeek) {
                              const daysOverdue = Math.max(1, Math.ceil((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)));
                              badgeLabel = 'Overdue';
                              badgeClasses = 'border-red-200 bg-red-100 text-red-700';
                              statusText = `${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue`;
                            } else if (isCurrentWeek) {
                              const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
                              badgeLabel = 'Due Now';
                              badgeClasses = 'border-amber-200 bg-amber-100 text-amber-700';
                              statusText = daysLeft === 0 ? 'Due today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
                            }

                            return (
                              <div
                                key={week.weekIndex}
                                className={`flex items-start gap-3 rounded border p-3 transition-all ${
                                  isSelected ? 'border-orange-300 bg-orange-50 ring-1 ring-orange-200' : 'border-gray-200 bg-white'
                                }`}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleToggleVehicleRent(item.vehicleId, week.weekIndex, orderedIndices)}
                                  className="mt-1 rounded-full border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                                />
                                <div className="flex-1 space-y-1">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-semibold text-gray-900">Week {week.weekIndex + 1}</span>
                                    <span className="text-sm font-semibold text-gray-700">
                                      ₹{week.rentAmount.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                                    <span>
                                      {startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} –
                                      {' '}
                                      {endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </span>
                                    <Badge variant="outline" className={`border ${badgeClasses}`}>
                                      {badgeLabel}
                                    </Badge>
                                    <span className="text-gray-500">{statusText}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-between border-t pt-2 text-sm font-medium text-gray-700">
                          <span>Selected Total</span>
                          <span>₹{(vehicleSelectedCount === 0 ? 0 : vehicleSelectedTotal).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Warning for unselected items */}
          {selectedVehicleCount < items.length && (
            <>
              <SectionNumberBadge id="4" label="Unselected Vehicles Warning" className="mb-2" />
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      {items.length - selectedVehicleCount} vehicle(s) will not be processed. Only selected vehicles will have their {getPaymentTypeLabel().toLowerCase()} payments recorded.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedVehicleCount === 0 || isLoading}
            className="min-w-32"
          >
            {isLoading ? 'Processing...' : `Pay ₹${selectedTotal.toLocaleString()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkPaymentDialog;