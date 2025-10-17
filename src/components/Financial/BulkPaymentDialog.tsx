import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, CheckCircle, AlertCircle } from 'lucide-react';

interface BulkPaymentItem {
  vehicleId: string;
  vehicleName: string;
  amount: number;
  monthBreakdown?: { month: string; amount: number }[];
  overdueEMIs?: { monthIndex: number; emiAmount: number; dueDate: string }[];
  checked: boolean;
}

interface BulkPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  paymentType: 'gst' | 'service_charge' | 'partner_share' | 'owner_share' | 'emi';
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

  // Update selected items when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedItems(items);
      // Initialize EMI penalties for each vehicle
      if (paymentType === 'emi') {
        const initialPenalties: Record<string, Record<number, string>> = {};
        items.forEach(item => {
          if (item.overdueEMIs) {
            initialPenalties[item.vehicleId] = {};
            item.overdueEMIs.forEach(emi => {
              initialPenalties[item.vehicleId][emi.monthIndex] = '0';
            });
          }
        });
        setEmiPenalties(initialPenalties);
      }
    }
  }, [isOpen, items, paymentType]);

  const handleItemToggle = (vehicleId: string) => {
    setSelectedItems(prev =>
      prev.map(item =>
        item.vehicleId === vehicleId
          ? { ...item, checked: !item.checked }
          : item
      )
    );
  };

  const handleSelectAll = () => {
    const allChecked = selectedItems.every(item => item.checked);
    setSelectedItems(prev =>
      prev.map(item => ({ ...item, checked: !allChecked }))
    );
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
  const selectedCount = selectedItems.filter(item => item.checked).length;

  const selectedTotal = selectedItems
    .filter(item => item.checked)
    .reduce((sum, item) => {
      let itemTotal = item.amount;
      if (paymentType === 'emi' && item.overdueEMIs) {
        // Add penalties for EMI payments
        const vehiclePenalties = emiPenalties[item.vehicleId] || {};
        item.overdueEMIs.forEach(emi => {
          const penalty = parseFloat(vehiclePenalties[emi.monthIndex] || '0') || 0;
          itemTotal += penalty;
        });
      }
      return sum + itemTotal;
    }, 0);

  const handleConfirm = () => {
    const confirmedItems = selectedItems.filter(item => item.checked);
    onConfirm(confirmedItems, paymentType === 'emi' ? emiPenalties : undefined);
  };

  const getPaymentTypeLabel = () => {
    switch (paymentType) {
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
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <Card>
            <CardHeader className="pb-3">
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
                    {selectedCount}/{items.length}
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
            <h3 className="text-lg font-semibold">Vehicle Breakdown</h3>
            {selectedItems.map((item) => (
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

                  {/* EMI Details with Penalty Inputs */}
                  {paymentType === 'emi' && item.overdueEMIs && item.overdueEMIs.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-medium text-gray-700 mb-2">Overdue EMIs & Penalties:</p>
                      <div className="space-y-2">
                        {item.overdueEMIs.map((emi, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                            <div>
                              <div className="text-sm font-medium">Month {emi.monthIndex + 1}</div>
                              <div className="text-xs text-gray-600">Due: {new Date(emi.dueDate).toLocaleDateString()}</div>
                            </div>
                            <div className="flex items-center gap-2">
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
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Warning for unselected items */}
          {selectedCount < items.length && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    {items.length - selectedCount} vehicle(s) will not be processed. Only selected vehicles will have their {getPaymentTypeLabel().toLowerCase()} payments recorded.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedCount === 0 || isLoading}
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