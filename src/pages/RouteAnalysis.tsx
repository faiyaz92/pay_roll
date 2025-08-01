import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRoutes, useTrips, useFuelRecords, useMaintenanceRecords } from '@/hooks/useFirebaseData';
import { TrendingDownIcon, TrendingUpIcon, DollarSignIcon, RouteIcon } from 'lucide-react';

const RouteAnalysis: React.FC = () => {
  const { routes } = useRoutes();
  const { trips } = useTrips();
  const { fuelRecords } = useFuelRecords();
  const { maintenanceRecords } = useMaintenanceRecords();
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const getRouteAnalysis = (year: string) => {
    const yearStart = new Date(`${year}-01-01`);
    const yearEnd = new Date(`${year}-12-31`);

    const yearTrips = trips.filter(trip => 
      new Date(trip.createdAt) >= yearStart &&
      new Date(trip.createdAt) <= yearEnd
    );

    const routeStats = routes.map(route => {
      const routeTrips = yearTrips.filter(trip => 
        trip.routeId === route.id || trip.route === route.name
      );

      const totalCollection = routeTrips.reduce((sum, trip) => sum + (trip.collection || 0), 0);
      const totalDriverAllowance = routeTrips.reduce((sum, trip) => sum + (trip.driverAllowance || 0), 0);
      const totalCleanerAllowance = routeTrips.reduce((sum, trip) => sum + (trip.cleanerAllowance || 0), 0);

      // Estimate fuel and maintenance costs based on trips
      const vehiclesUsed = [...new Set(routeTrips.map(trip => trip.vehicle))];
      
      // Calculate average fuel cost per km and maintenance cost per km
      const totalDistance = routeTrips.length * route.distance;
      const estimatedFuelCost = totalDistance * 8; // Rough estimate: ₹8 per km fuel cost
      const estimatedMaintenanceCost = totalDistance * 2; // Rough estimate: ₹2 per km maintenance cost

      const totalCosts = totalDriverAllowance + totalCleanerAllowance + estimatedFuelCost + estimatedMaintenanceCost;
      const profitLoss = totalCollection - totalCosts;

      // Calculate efficiency metrics
      const totalCurrentLoad = routeTrips.reduce((sum, trip) => {
        const load = parseFloat(trip.currentLoad.replace(/[^0-9.]/g, '')) || 0;
        return sum + load;
      }, 0);
      
      const totalCapacity = routeTrips.reduce((sum, trip) => {
        const capacity = parseFloat(trip.totalCapacity.replace(/[^0-9.]/g, '')) || 0;
        return sum + capacity;
      }, 0);

      const efficiency = totalCapacity > 0 ? (totalCurrentLoad / totalCapacity) * 100 : 0;
      const revenuePerKm = totalDistance > 0 ? totalCollection / totalDistance : 0;

      return {
        route,
        totalTrips: routeTrips.length,
        totalCollection,
        totalCosts,
        profitLoss,
        efficiency,
        revenuePerKm,
        totalDistance,
        estimatedFuelCost,
        estimatedMaintenanceCost,
        totalDriverAllowance,
        totalCleanerAllowance,
        vehiclesUsed: vehiclesUsed.length,
        trips: routeTrips
      };
    }).filter(stat => stat.totalTrips > 0); // Only show routes with trips

    // Sort by profitability
    routeStats.sort((a, b) => b.profitLoss - a.profitLoss);

    return routeStats;
  };

  const analysis = getRouteAnalysis(selectedYear);

  const getProfitLossColor = (amount: number) => {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getProfitLossIcon = (amount: number) => {
    if (amount > 0) return <TrendingUpIcon className="h-4 w-4" />;
    if (amount < 0) return <TrendingDownIcon className="h-4 w-4" />;
    return <DollarSignIcon className="h-4 w-4" />;
  };

  const totalCollection = analysis.reduce((sum, route) => sum + route.totalCollection, 0);
  const totalCosts = analysis.reduce((sum, route) => sum + route.totalCosts, 0);
  const overallProfitLoss = totalCollection - totalCosts;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Route Analysis</h1>
          <p className="text-muted-foreground">Analyze route profitability and performance</p>
        </div>
      </div>

      <div className="mb-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Select Year</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {analysis.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Collection</CardTitle>
                <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ₹{totalCollection.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all routes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
                <TrendingDownIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ₹{totalCosts.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  All operational costs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Profit/Loss</CardTitle>
                {getProfitLossIcon(overallProfitLoss)}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getProfitLossColor(overallProfitLoss)}`}>
                  ₹{Math.abs(overallProfitLoss).toLocaleString()}
                  {overallProfitLoss < 0 && ' Loss'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Net {overallProfitLoss >= 0 ? 'profit' : 'loss'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Route Profitability Ranking</CardTitle>
              <CardDescription>Routes ranked by profitability for {selectedYear}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Trips</TableHead>
                    <TableHead>Distance (km)</TableHead>
                    <TableHead>Collection</TableHead>
                    <TableHead>Costs</TableHead>
                    <TableHead>Profit/Loss</TableHead>
                    <TableHead>Revenue/km</TableHead>
                    <TableHead>Efficiency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.map((routeData, index) => (
                    <TableRow key={routeData.route.id}>
                      <TableCell>
                        <div className="flex items-center">
                          {index === 0 && <span className="text-yellow-500 mr-1">🥇</span>}
                          {index === 1 && <span className="text-gray-400 mr-1">🥈</span>}
                          {index === 2 && <span className="text-amber-600 mr-1">🥉</span>}
                          <span className="font-semibold">#{index + 1}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{routeData.route.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {routeData.route.distance}km
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{routeData.totalTrips}</TableCell>
                      <TableCell>{routeData.totalDistance.toLocaleString()}</TableCell>
                      <TableCell className="text-green-600 font-semibold">
                        ₹{routeData.totalCollection.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-red-600 font-semibold">
                        ₹{routeData.totalCosts.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className={`font-semibold ${getProfitLossColor(routeData.profitLoss)}`}>
                          ₹{Math.abs(routeData.profitLoss).toLocaleString()}
                          {routeData.profitLoss < 0 && ' Loss'}
                        </div>
                      </TableCell>
                      <TableCell>₹{routeData.revenuePerKm.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span>{routeData.efficiency.toFixed(1)}%</span>
                          <Badge 
                            variant={routeData.efficiency > 80 ? 'default' : routeData.efficiency > 60 ? 'secondary' : 'destructive'}
                            className="ml-2"
                          >
                            {routeData.efficiency > 80 ? 'High' : routeData.efficiency > 60 ? 'Medium' : 'Low'}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Most Profitable Routes</CardTitle>
                <CardDescription>Top 5 routes by profit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.slice(0, 5).map((routeData, index) => (
                    <div key={routeData.route.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div className="flex items-center">
                        <RouteIcon className="h-4 w-4 mr-2" />
                        <div>
                          <div className="font-medium">{routeData.route.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {routeData.totalTrips} trips
                          </div>
                        </div>
                      </div>
                      <div className={`font-semibold ${getProfitLossColor(routeData.profitLoss)}`}>
                        ₹{Math.abs(routeData.profitLoss).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
                <CardDescription>Key metrics and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="font-medium">Best Performing Route</div>
                    <div className="text-sm text-muted-foreground">
                      {analysis[0]?.route.name} with ₹{analysis[0]?.profitLoss.toLocaleString()} profit
                    </div>
                  </div>
                  
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="font-medium">Average Efficiency</div>
                    <div className="text-sm text-muted-foreground">
                      {(analysis.reduce((sum, r) => sum + r.efficiency, 0) / analysis.length).toFixed(1)}% capacity utilization
                    </div>
                  </div>
                  
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="font-medium">Total Routes Analyzed</div>
                    <div className="text-sm text-muted-foreground">
                      {analysis.length} active routes in {selectedYear}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {analysis.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No trips found for routes in {selectedYear}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RouteAnalysis;