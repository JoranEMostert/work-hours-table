"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
  ComposedChart,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "next-themes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WorkEntry {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  breakHours: string;
  hoursWorked: number;
  quarterHoursWorked: number;
  hourlyRate?: number;
}

interface WorkChartsProps {
  entries: WorkEntry[];
}

const convertTimeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

const getDayName = (dateStr: string): string => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
};

export function WorkCharts({ entries }: WorkChartsProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [standardHours, setStandardHours] = React.useState(8);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkTheme = mounted && resolvedTheme === 'dark';

  const chartColors = {
    primary: isDarkTheme ? '#a78bfa' : '#8b5cf6', // Purple
    secondary: isDarkTheme ? '#93c5fd' : '#3b82f6', // Blue
    tertiary: isDarkTheme ? '#6ee7b7' : '#10b981', // Green
    quaternary: isDarkTheme ? '#fcd34d' : '#f59e0b', // Yellow
    danger: isDarkTheme ? '#fca5a5' : '#ef4444', // Red
    background: isDarkTheme ? '#1f2937' : '#f9fafb',
    text: isDarkTheme ? '#f9fafb' : '#1f2937',
    grid: isDarkTheme ? '#374151' : '#e5e7eb',
  };

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [entries]);

  const dailyData = useMemo(() => {
    if (!sortedEntries.length) return [];

    const groupedByDate = sortedEntries.reduce((acc, entry) => {
      const date = entry.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          dayName: getDayName(date),
          hoursWorked: 0,
          breakMinutes: 0,
          overtime: 0,
          earnings: 0,
        };
      }
      acc[date].hoursWorked += entry.hoursWorked;
      acc[date].breakMinutes += convertTimeToMinutes(entry.breakHours);
      acc[date].earnings += (entry.hoursWorked * (entry.hourlyRate || 0));
      return acc;
    }, {} as Record<string, { date: string; dayName: string; hoursWorked: number; breakMinutes: number; overtime: number; earnings: number }>);

    return Object.values(groupedByDate).map(item => ({
      ...item,
      breakHours: item.breakMinutes / 60,
      overtime: item.hoursWorked - standardHours,
      isOvertime: item.hoursWorked > standardHours
    }));
  }, [sortedEntries, standardHours]);

  const cumulativeData = useMemo(() => {
    let totalHours = 0;
    let totalEarnings = 0;
    return dailyData.map(day => {
      totalHours += day.hoursWorked;
      totalEarnings += day.earnings;
      return {
        ...day,
        cumulativeHours: totalHours,
        cumulativeEarnings: totalEarnings,
      };
    });
  }, [dailyData]);

  const monthlyEarningsData = useMemo(() => {
    if (!sortedEntries.length) return [];
    
    const groupedByMonth = sortedEntries.reduce((acc, entry) => {
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, name: monthName, earnings: 0 };
      }
      acc[monthKey].earnings += (entry.hoursWorked * (entry.hourlyRate || 0));
      return acc;
    }, {} as Record<string, { month: string; name: string; earnings: number }>);

    return Object.values(groupedByMonth).sort((a, b) => a.month.localeCompare(b.month));
  }, [sortedEntries]);

  // Projected earnings (simple extrapolation)
  const projectionData = useMemo(() => {
    if (!dailyData.length) return { dailyAvg: 0, monthlyAvg: 0, yearlyProjected: 0 };
    
    const totalEarnings = dailyData.reduce((sum, day) => sum + day.earnings, 0);
    const daysWorked = dailyData.filter(d => d.earnings > 0).length || 1; // Avoid division by zero
    const dailyAvg = totalEarnings / daysWorked;
    const monthlyAvg = dailyAvg * 20; // Approx 20 work days
    const yearlyProjected = dailyAvg * 260; // Approx 260 work days

    return { dailyAvg, monthlyAvg, yearlyProjected };
  }, [dailyData]);

  const weeklyDistributionData = useMemo(() => {
    if (!sortedEntries.length) return [];
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayMap = { 'Mon': 0, 'Tue': 1, 'Wed': 2, 'Thu': 3, 'Fri': 4, 'Sat': 5, 'Sun': 6 };

    const groupedByDay = sortedEntries.reduce((acc, entry) => {
      const dayName = getDayName(entry.date);
      if (!acc[dayName]) {
        acc[dayName] = { day: dayName, hoursWorked: 0, count: 0 };
      }
      acc[dayName].hoursWorked += entry.hoursWorked;
      acc[dayName].count += 1;
      return acc;
    }, {} as Record<string, { day: string; hoursWorked: number; count: number }>);

    Object.keys(groupedByDay).forEach(day => {
      groupedByDay[day].hoursWorked = groupedByDay[day].hoursWorked / groupedByDay[day].count;
    });

    const result = daysOfWeek.map(day => groupedByDay[day] || { day, hoursWorked: 0, count: 0 });
    return result.sort((a, b) => dayMap[a.day as keyof typeof dayMap] - dayMap[b.day as keyof typeof dayMap]);
  }, [sortedEntries]);

  const breakTimeData = useMemo(() => {
    const totalWorkMinutes = sortedEntries.reduce((sum, entry) => sum + entry.hoursWorked * 60, 0);
    const totalBreakMinutes = sortedEntries.reduce((sum, entry) => sum + convertTimeToMinutes(entry.breakHours), 0);
    return [
      { name: 'Work Time', value: totalWorkMinutes },
      { name: 'Break Time', value: totalBreakMinutes },
    ];
  }, [sortedEntries]);

  if (!entries.length) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold tracking-tight">Analytics Dashboard</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Target Daily Hours:</span>
          <Select value={standardHours.toString()} onValueChange={(v) => setStandardHours(Number(v))}>
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="8" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">4h</SelectItem>
              <SelectItem value="6">6h</SelectItem>
              <SelectItem value="7">7h</SelectItem>
              <SelectItem value="8">8h</SelectItem>
              <SelectItem value="9">9h</SelectItem>
              <SelectItem value="10">10h</SelectItem>
              <SelectItem value="12">12h</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="overview">Hours Overview</TabsTrigger>
            <TabsTrigger value="financial">Financials</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Main Daily Hours Chart */}
              <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                  <CardTitle>Daily Work & Overtime</CardTitle>
                  <CardDescription>Hours worked per day vs target ({standardHours}h)</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                      <XAxis dataKey="date" stroke={chartColors.text} tickFormatter={(value) => getDayName(value)} />
                      <YAxis stroke={chartColors.text} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: chartColors.background, color: chartColors.text, borderColor: chartColors.grid }}
                      />
                      <Legend />
                      <ReferenceLine y={standardHours} label="Target" stroke={chartColors.danger} strokeDasharray="3 3" />
                      <Bar dataKey="hoursWorked" name="Total Hours" fill={chartColors.primary} barSize={20} radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="overtime" name="Overtime" stroke={chartColors.quaternary} strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Cumulative Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Cumulative Hours</CardTitle>
                  <CardDescription>Total hours accumulated over time</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cumulativeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColors.tertiary} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={chartColors.tertiary} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" hide />
                      <YAxis hide />
                      <Tooltip 
                         contentStyle={{ backgroundColor: chartColors.background, color: chartColors.text, borderColor: chartColors.grid }}
                      />
                      <Area type="monotone" dataKey="cumulativeHours" stroke={chartColors.tertiary} fillOpacity={1} fill="url(#colorTotal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Weekly Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Pattern</CardTitle>
                  <CardDescription>Average hours per day of week</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyDistributionData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                       <XAxis type="number" hide />
                       <YAxis dataKey="day" type="category" stroke={chartColors.text} width={40} />
                       <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: chartColors.background, color: chartColors.text, borderColor: chartColors.grid }} />
                       <Bar dataKey="hoursWorked" name="Avg Hours" fill={chartColors.secondary} radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              {/* Break Ratio */}
              <Card className="col-span-1 md:col-span-2">
                  <CardHeader>
                      <CardTitle>Work vs Break Distribution</CardTitle>
                      <CardDescription>Efficiency analysis</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[250px] flex justify-center">
                       <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={breakTimeData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              <Cell key="work" fill={chartColors.primary} />
                              <Cell key="break" fill={chartColors.danger} />
                            </Pie>
                            <Tooltip 
                               contentStyle={{ backgroundColor: chartColors.background, color: chartColors.text, borderColor: chartColors.grid }}
                               formatter={(value: number) => `${Math.floor(value / 60)}h ${value % 60}m`} 
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                          </PieChart>
                       </ResponsiveContainer>
                  </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6 mt-4">
             {/* Projections */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Est. Daily Earnings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${projectionData.dailyAvg.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Based on historical average</p>
                  </CardContent>
                </Card>
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Est. Monthly Earnings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${projectionData.monthlyAvg.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Projected (20 work days)</p>
                  </CardContent>
                </Card>
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Est. Yearly Earnings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${projectionData.yearlyProjected.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Projected (260 work days)</p>
                  </CardContent>
                </Card>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monthly Earnings Chart */}
                <Card className="col-span-1 md:col-span-2">
                  <CardHeader>
                    <CardTitle>Monthly Earnings</CardTitle>
                    <CardDescription>Total earnings per month</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyEarningsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                        <XAxis dataKey="name" stroke={chartColors.text} />
                        <YAxis stroke={chartColors.text} tickFormatter={(value) => `$${value}`} />
                        <Tooltip 
                          cursor={{fill: 'transparent'}}
                          contentStyle={{ backgroundColor: chartColors.background, color: chartColors.text, borderColor: chartColors.grid }}
                          formatter={(value: number) => `$${value.toFixed(2)}`}
                        />
                        <Bar dataKey="earnings" name="Earnings" fill={chartColors.tertiary} radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Cumulative Earnings */}
                <Card className="col-span-1 md:col-span-2">
                  <CardHeader>
                    <CardTitle>Cumulative Earnings Growth</CardTitle>
                    <CardDescription>Total earnings over time</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cumulativeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke={chartColors.text} tickFormatter={(value) => getDayName(value)} />
                        <YAxis stroke={chartColors.text} tickFormatter={(value) => `$${value}`} />
                        <Tooltip 
                           contentStyle={{ backgroundColor: chartColors.background, color: chartColors.text, borderColor: chartColors.grid }}
                           formatter={(value: number) => `$${value.toFixed(2)}`}
                        />
                        <Area type="monotone" dataKey="cumulativeEarnings" stroke={chartColors.primary} fillOpacity={1} fill="url(#colorEarnings)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
