import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Package, DollarSign, Receipt, Plus, Truck, CheckCircle, Clock } from 'lucide-react';
import { Trip, TripStop, TripCollection, useTripManagement, useRoutes, useCities, useTrips } from '@/hooks/useFirebaseData';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

interface ActiveTripManagerProps {
  trip: Trip;
}

interface StopForm {
  stopName: string;
  isFromRoute: boolean;
  loadAmount: string;
  unloadAmount: string;
  notes: string;
}

interface CollectionForm {
  amount: number;
  description: string;
  location: string;
}

interface ExpenseForm {
  amount: number;
  category: 'fuel-consumption' | 'driver-allowance' | 'cleaner-allowance' | 'toll-tax' | 'parking' | 'maintenance' | 'other';
  description: string;
  location: string;
}

interface TripCompletionForm {
  finalCollection: number;
  actualFuelConsumption: number;
  notes: string;
}

const ActiveTripManager: React.FC<ActiveTripManagerProps> = ({ trip }) => {
  const [activeTab, setActiveTab] = useState('stops');
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [isSelectingFromRoute, setIsSelectingFromRoute] = useState(false);
  const [availableRouteStops, setAvailableRouteStops] = useState<string[]>([]);
  const [currentLoad, setCurrentLoad] = useState(() => {
    const initialLoad = parseInt(trip.currentLoad?.replace(/\D/g, '') || '0');
    // Calculate current load based on completed stops
    const completedStops = trip.stops?.filter(stop => stop.status === 'reached') || [];
    const totalLoaded = completedStops.reduce((sum, stop) => sum + (stop.loadAmount || 0), 0);
    const totalUnloaded = completedStops.reduce((sum, stop) => sum + (stop.unloadAmount || 0), 0);
    return initialLoad + totalLoaded - totalUnloaded;
  });
  
  const { addTripStop, addTripCollection, addTripExpense, markStopReached } = useTripManagement();
  const { routes } = useRoutes();
  const { cities } = useCities();
  const { updateTripStatus } = useTrips();
  
  const stopForm = useForm<StopForm>({
    defaultValues: {
      stopName: '',
      isFromRoute: false,
      loadAmount: '',
      unloadAmount: '',
      notes: ''
    }
  });
  const collectionForm = useForm<CollectionForm>();
  const expenseForm = useForm<ExpenseForm>({
    defaultValues: {
      category: 'other'
    }
  });
  const completionForm = useForm<TripCompletionForm>();

  // Get route stops when component mounts
  useEffect(() => {
    if (trip.routeId && routes.length > 0) {
      const selectedRoute = routes.find(route => route.id === trip.routeId);
      if (selectedRoute && selectedRoute.waypoints) {
        setAvailableRouteStops(selectedRoute.waypoints);
      }
    }
  }, [trip.routeId, routes]);

  const getCityName = (cityId: string) => {
    const city = cities.find(c => c.id === cityId);
    return city ? city.name : cityId;
  };

  const calculateCapacityUtilization = () => {
    const capacity = parseInt(trip.totalCapacity?.replace(/\D/g, '') || '0');
    return capacity > 0 ? (currentLoad / capacity) * 100 : 0;
  };

  const updateCurrentLoad = (loadAmount: number, unloadAmount: number) => {
    const newLoad = currentLoad + loadAmount - unloadAmount;
    const maxCapacity = parseInt(trip.totalCapacity?.replace(/\D/g, '') || '0');
    setCurrentLoad(Math.max(0, Math.min(newLoad, maxCapacity)));
  };

  const onAddStop = async (data: StopForm) => {
    try {
      const loadAmount = parseInt(data.loadAmount) || 0;
      const unloadAmount = parseInt(data.unloadAmount) || 0;
      
      console.log('Adding stop:', { stopName: data.stopName, loadAmount, unloadAmount, tripId: trip.id });
      
      await addTripStop(trip.id, {
        stopName: data.stopName,
        loadAmount,
        unloadAmount,
        notes: data.notes,
        reachedAt: new Date().toISOString(),
        status: 'pending' as const
      });
      
      toast.success('Stop added successfully');
      setShowStopDialog(false);
      stopForm.reset();
    } catch (error) {
      console.error('Failed to add stop:', error);
      toast.error('Failed to add stop');
    }
  };

  const onAddCollection = async (data: CollectionForm) => {
    try {
      console.log('Adding collection:', { amount: data.amount, tripId: trip.id });
      
      await addTripCollection(trip.id, {
        amount: data.amount,
        description: data.description,
        location: data.location,
        collectedAt: new Date().toISOString()
      });
      toast.success('Collection added successfully');
      setShowCollectionDialog(false);
      collectionForm.reset();
    } catch (error) {
      console.error('Failed to add collection:', error);
      toast.error('Failed to add collection');
    }
  };

  const onAddExpense = async (data: ExpenseForm) => {
    try {
      console.log('Adding expense:', { amount: data.amount, category: data.category, tripId: trip.id });
      
      await addTripExpense(trip.id, {
        amount: data.amount,
        category: data.category,
        description: data.description,
        location: data.location,
        incurredAt: new Date().toISOString()
      });
      toast.success('Expense added successfully');
      setShowExpenseDialog(false);
      expenseForm.reset();
    } catch (error) {
      console.error('Failed to add expense:', error);
      toast.error('Failed to add expense');
    }
  };

  const handleMarkStopReached = async (stopId: string) => {
    try {
      const stop = trip.stops?.find(s => s.id === stopId);
      if (stop) {
        updateCurrentLoad(stop.loadAmount || 0, stop.unloadAmount || 0);
      }
      await markStopReached(trip.id, stopId);
      toast.success('Stop marked as reached and load updated');
    } catch (error) {
      console.error('Error marking stop reached:', error);
      toast.error('Failed to mark stop as reached');
    }
  };

  const handleCompleteTrip = async (data: TripCompletionForm) => {
    try {
      await updateTripStatus(trip.id, 'completed');
      toast.success('Trip completed successfully');
      setShowCompletionDialog(false);
    } catch (error) {
      toast.error('Failed to complete trip');
    }
  };

  const expenseCategories = [
    { value: 'fuel-consumption', label: 'Fuel Consumption' },
    { value: 'driver-allowance', label: 'Driver Allowance' },
    { value: 'cleaner-allowance', label: 'Cleaner Allowance' },
    { value: 'toll-tax', label: 'Toll Tax' },
    { value: 'parking', label: 'Parking' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'other', label: 'Other' }
  ];

  // Include initial trip costs and collections
  const initialCollection = parseFloat((trip.fare || '0').toString()) || 0;
  const initialDriverAllowance = parseFloat((trip.driverAllowance || '0').toString()) || 0;
  const initialCleanerAllowance = parseFloat((trip.cleanerAllowance || '0').toString()) || 0;
  // Calculate fuel cost from consumption - assuming fuel price needs to be calculated
  const fuelConsumptionLiters = parseFloat((trip.fuelConsumption || '0').toString()) || 0;
  const estimatedFuelCost = fuelConsumptionLiters * 100; // Placeholder rate, should come from fuel prices
  const initialExpenses = estimatedFuelCost + initialDriverAllowance + initialCleanerAllowance;
  
  const additionalCollections = trip.collections?.reduce((sum, col) => sum + col.amount, 0) || 0;
  const additionalExpenses = trip.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  
  const totalCollections = initialCollection + additionalCollections;
  const totalExpenses = initialExpenses + additionalExpenses;
  const tripProfit = totalCollections - totalExpenses;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Active Trip Management</span>
          <div className="flex items-center space-x-2">
            <Badge className="bg-blue-500">In Progress</Badge>
            <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Complete Trip
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Complete Trip</DialogTitle>
                </DialogHeader>
                <form onSubmit={completionForm.handleSubmit(handleCompleteTrip)} className="space-y-4">
                  <div>
                    <Label htmlFor="finalCollection">Final Collection (₹)</Label>
                    <Input 
                      type="number" 
                      {...completionForm.register('finalCollection', { required: true, valueAsNumber: true })} 
                      defaultValue={totalCollections}
                    />
                  </div>
                  <div>
                    <Label htmlFor="actualFuelConsumption">Actual Fuel Consumption (L/Kg)</Label>
                    <Input 
                      type="number" 
                      step="0.1"
                      {...completionForm.register('actualFuelConsumption', { required: true, valueAsNumber: true })} 
                      defaultValue={parseFloat(trip.fuelConsumption) || 0}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Completion Notes</Label>
                    <Textarea {...completionForm.register('notes')} placeholder="Any additional notes about the trip completion..." />
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <h4 className="font-medium">Trip Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>Total Collections: ₹{totalCollections}</div>
                      <div>Total Expenses: ₹{totalExpenses}</div>
                      <div className={`font-bold col-span-2 ${tripProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tripProfit >= 0 ? 'Profit' : 'Loss'}: ₹{Math.abs(tripProfit)}
                      </div>
                    </div>
                  </div>
                  <Button type="submit" className="w-full">Complete Trip</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
        <div className="text-sm text-gray-600">
          <p>{trip.pickupLocation} → {trip.dropLocation}</p>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stops">Stops</TabsTrigger>
            <TabsTrigger value="capacity">Capacity</TabsTrigger>
            <TabsTrigger value="collections">Collections</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="stops" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Trip Stops</h3>
              <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Stop
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Stop</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={stopForm.handleSubmit(onAddStop)} className="space-y-4">
                    {availableRouteStops.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="isFromRoute"
                            checked={isSelectingFromRoute}
                            onChange={(e) => {
                              setIsSelectingFromRoute(e.target.checked);
                              stopForm.setValue('isFromRoute', e.target.checked);
                              if (!e.target.checked) {
                                stopForm.setValue('stopName', '');
                              }
                            }}
                          />
                          <Label htmlFor="isFromRoute">Select from route stops</Label>
                        </div>
                        
                        {isSelectingFromRoute ? (
                          <div>
                            <Label>Route Stops</Label>
                            <Select 
                              value={stopForm.watch('stopName')} 
                              onValueChange={(value) => stopForm.setValue('stopName', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a route stop" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableRouteStops.map((cityId) => (
                                  <SelectItem key={cityId} value={getCityName(cityId)}>
                                    {getCityName(cityId)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div>
                            <Label htmlFor="stopName">Stop Name/Location</Label>
                            <Input {...stopForm.register('stopName', { required: true })} />
                          </div>
                        )}
                      </div>
                    )}
                    
                    {availableRouteStops.length === 0 && (
                      <div>
                        <Label htmlFor="stopName">Stop Name/Location</Label>
                        <Input {...stopForm.register('stopName', { required: true })} />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="loadAmount">Load Amount (kg)</Label>
                        <Input type="number" {...stopForm.register('loadAmount')} />
                      </div>
                      <div>
                        <Label htmlFor="unloadAmount">Unload Amount (kg)</Label>
                        <Input type="number" {...stopForm.register('unloadAmount')} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea {...stopForm.register('notes')} />
                    </div>
                    <Button type="submit" className="w-full">Add Stop</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              {trip.stops?.map((stop, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <h4 className="font-medium">{stop.stopName}</h4>
                        <Badge variant={stop.status === 'reached' ? 'default' : 'secondary'}>
                          {stop.status === 'reached' ? 'Reached' : 'Pending'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Load:</span> {stop.loadAmount}kg
                        </div>
                        <div>
                          <span className="text-gray-500">Unload:</span> {stop.unloadAmount}kg
                        </div>
                      </div>
                      {stop.notes && (
                        <p className="text-sm text-gray-600">{stop.notes}</p>
                      )}
                    </div>
                    {stop.status === 'pending' && (
                      <Button size="sm" onClick={() => handleMarkStopReached(stop.id)}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Reached
                      </Button>
                    )}
                  </div>
                </Card>
              )) || (
                <p className="text-center text-gray-500 py-8">No stops added yet</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="capacity" className="space-y-4">
            <h3 className="text-lg font-semibold">Capacity Utilization</h3>
            <Card className="p-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Current Utilization</span>
                  <span className="font-bold">{calculateCapacityUtilization().toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-primary h-4 rounded-full transition-all"
                    style={{ width: `${Math.min(calculateCapacityUtilization(), 100)}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Total Capacity:</span>
                    <p className="font-medium">{trip.totalCapacity}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Current Load:</span>
                    <p className="font-medium">{currentLoad}kg</p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="collections" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Collections</h3>
              <Dialog open={showCollectionDialog} onOpenChange={setShowCollectionDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Collection
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Collection</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={collectionForm.handleSubmit(onAddCollection)} className="space-y-4">
                    <div>
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input type="number" {...collectionForm.register('amount', { required: true, valueAsNumber: true })} />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input {...collectionForm.register('description', { required: true })} />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input {...collectionForm.register('location', { required: true })} />
                    </div>
                    <Button type="submit" className="w-full">Add Collection</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="p-4 bg-green-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Total Collections</span>
                </div>
                <span className="text-2xl font-bold text-green-600">₹{totalCollections}</span>
              </div>
            </Card>

            <div className="space-y-3">
              {trip.collections?.map((collection, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">₹{collection.amount}</h4>
                      <p className="text-sm text-gray-600">{collection.description}</p>
                      <p className="text-xs text-gray-500">{collection.location}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(collection.collectedAt).toLocaleString()}
                    </div>
                  </div>
                </Card>
              )) || (
                <p className="text-center text-gray-500 py-8">No collections added yet</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Expenses</h3>
              <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Expense</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={expenseForm.handleSubmit(onAddExpense)} className="space-y-4">
                    <div>
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input type="number" {...expenseForm.register('amount', { required: true, valueAsNumber: true })} />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={expenseForm.watch('category')} 
                        onValueChange={(value) => expenseForm.setValue('category', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select expense category" />
                        </SelectTrigger>
                        <SelectContent>
                          {expenseCategories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input {...expenseForm.register('description', { required: true })} />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input {...expenseForm.register('location', { required: true })} />
                    </div>
                    <Button type="submit" className="w-full">Add Expense</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 bg-red-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Receipt className="w-5 h-5 text-red-600" />
                    <span className="font-medium">Total Expenses</span>
                  </div>
                  <span className="text-2xl font-bold text-red-600">₹{totalExpenses}</span>
                </div>
              </Card>
              
              <Card className={`p-4 ${tripProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className={`w-5 h-5 ${tripProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    <span className="font-medium">{tripProfit >= 0 ? 'Trip Profit' : 'Trip Loss'}</span>
                  </div>
                  <span className={`text-2xl font-bold ${tripProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{Math.abs(tripProfit)}
                  </span>
                </div>
              </Card>
            </div>

            <div className="space-y-3">
              {trip.expenses?.map((expense, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">₹{expense.amount}</h4>
                        <Badge variant="outline">
                          {expenseCategories.find(cat => cat.value === expense.category)?.label || expense.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{expense.description}</p>
                      <p className="text-xs text-gray-500">{expense.location}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(expense.incurredAt).toLocaleString()}
                    </div>
                  </div>
                </Card>
              )) || (
                <p className="text-center text-gray-500 py-8">No expenses added yet</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Profit/Loss Summary */}
        <Card className="mt-6 p-4">
          <h3 className="text-lg font-semibold mb-4">Trip Financial Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">Collections</p>
              <p className="text-xl font-bold text-green-600">₹{totalCollections}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Expenses</p>
              <p className="text-xl font-bold text-red-600">₹{totalExpenses}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Profit/Loss</p>
              <p className={`text-xl font-bold ${tripProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{tripProfit}
              </p>
            </div>
          </div>
        </Card>
      </CardContent>
    </Card>
  );
};

export default ActiveTripManager;