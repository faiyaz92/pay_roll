import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, FileText, ExternalLink, Calendar, DollarSign, Tag, User, Fuel, Settings, Shield, CreditCard, Banknote, AlertCircle } from 'lucide-react';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { SectionNumberBadge } from '@/components/VehicleDetails/SectionNumberBadge';

const ExpenseDetails: React.FC = () => {
  const { expenseId } = useParams<{ expenseId: string }>();
  const navigate = useNavigate();
  const { expenses } = useFirebaseData();
  const [expense, setExpense] = useState<any>(null);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  useEffect(() => {
    if (expenseId && expenses.length > 0) {
      const foundExpense = expenses.find(exp => exp.id === expenseId);
      if (foundExpense) {
        setExpense(foundExpense);
      }
    }
  }, [expenseId, expenses]);

  if (!expense) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading expense details...</p>
          </div>
        </div>
      </div>
    );
  }

  const getExpenseIcon = (type: string, description: string) => {
    if (description.toLowerCase().includes('fuel')) {
      return <Fuel className="h-6 w-6 text-blue-600" />;
    }
    switch (type) {
      case 'maintenance':
        return <Settings className="h-6 w-6 text-orange-600" />;
      case 'insurance':
        return <Shield className="h-6 w-6 text-green-600" />;
      case 'penalties':
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      case 'emi':
        return <CreditCard className="h-6 w-6 text-indigo-600" />;
      case 'prepayment':
        return <Banknote className="h-6 w-6 text-orange-600" />;
      default:
        return <DollarSign className="h-6 w-6 text-purple-600" />;
    }
  };

  const getExpenseTypeLabel = (type: string, description: string) => {
    if (description.toLowerCase().includes('fuel')) return 'Fuel';
    switch (type) {
      case 'maintenance': return 'Maintenance';
      case 'insurance': return 'Insurance';
      case 'penalties': return 'Penalties';
      case 'emi': return 'EMI Payment';
      case 'prepayment': return 'Prepayment';
      default: return 'General Expense';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Expense Details</h1>
            <p className="text-gray-600">Comprehensive view of expense transaction</p>
          </div>
        </div>

        {/* Expense Overview */}
        <Card>
          <CardHeader>
            <SectionNumberBadge id="1" label="Expense Overview" className="mb-2" />
            <CardTitle className="flex items-center gap-3">
              {getExpenseIcon(expense.expenseType || expense.type, expense.description)}
              <span>{expense.description}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Tag className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <Badge variant="secondary" className="mt-1">
                      {getExpenseTypeLabel(expense.expenseType || expense.type, expense.description)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">
                      {new Date(expense.createdAt || expense.date).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                {expense.vehicleId && (
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Vehicle</p>
                      <p className="font-medium">{expense.vehicleId}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="text-2xl font-bold text-red-600">
                      ₹{expense.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
                {expense.paymentMethod && (
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Payment Method</p>
                      <p className="font-medium">{expense.paymentMethod}</p>
                    </div>
                  </div>
                )}
                {expense.reference && (
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Reference</p>
                      <p className="font-medium">{expense.reference}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Section */}
        {expense.expenseDocuments && Object.keys(expense.expenseDocuments).length > 0 && (
          <Card>
            <CardHeader>
              <SectionNumberBadge id="2" label="Supporting Documents" className="mb-2" />
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Expense Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Main Document */}
                {expense.expenseDocuments.mainDocument && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg gap-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-medium">Main Expense Document</p>
                        <p className="text-sm text-gray-600">Primary expense receipt/document</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedDocument(expense.expenseDocuments.mainDocument);
                          setDocumentDialogOpen(true);
                        }}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Document
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.open(expense.expenseDocuments.mainDocument, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open in New Tab
                      </Button>
                    </div>
                  </div>
                )}

                {/* Additional Documents */}
                {Object.entries(expense.expenseDocuments)
                  .filter(([key]) => key.startsWith('additional_'))
                  .map(([key, url]) => (
                    <div key={key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg gap-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="font-medium">Additional Document</p>
                          <p className="text-sm text-gray-600">Supporting document</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedDocument(url as string);
                            setDocumentDialogOpen(true);
                          }}
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Document
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open(url as string, '_blank')}
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open in New Tab
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Details */}
        {expense.notes && (
          <Card>
            <CardHeader>
              <SectionNumberBadge id="3" label="Additional Notes" className="mb-2" />
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{expense.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Document Viewing Dialog */}
        <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Expense Document - {expense.description}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              {selectedDocument && (
                <div className="flex-1 min-h-[500px]">
                  <iframe
                    src={selectedDocument}
                    className="w-full h-full min-h-[500px] border rounded-lg"
                    title="Expense Document"
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedDocument || '', '_blank')}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in New Tab
                </Button>
                <Button onClick={() => setDocumentDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ExpenseDetails;