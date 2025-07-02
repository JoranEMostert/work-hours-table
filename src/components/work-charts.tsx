"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
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
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "next-themes";

// Use the same WorkEntry interface as in page.tsx
interface WorkEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  breakHours: string;
  hoursWorked: number;
  quarterHoursWorked: number;
}

interface WorkChartsProps {
  entries: WorkEntry[];
}

// Helper function to convert time string to minutes
const convertTimeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

// Helper function to get day name from date
const getDayName = (dateStr: string): string => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
};

export function WorkCharts({ entries }: WorkChartsProps) {
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';

  // Colors that work well in both light and dark themes
  const chartColors = {
    primary: isDarkTheme ? '#a78bfa' : '#8b5cf6', // Purple
    secondary: isDarkTheme ? '#93c5fd' : '#3b82f6', // Blue
    tertiary: isDarkTheme ? '#6ee7b7' : '#10b981', // Green
    quaternary: isDarkTheme ? '#fcd34d' : '#f59e0b', // Yellow
    background: isDarkTheme ? '#1f2937' : '#f9fafb',
    text: isDarkTheme ? '#f9fafb' : '#1f2937',
    grid: isDarkTheme ? '#374151' : '#e5e7eb',
  };

  // Process data for daily hours chart
  const dailyHoursData = useMemo(() => {
    if (!entries.length) return [];

    // Group entries by date and sum hours
    const groupedByDate = entries.reduce((acc, entry) => {
      const date = entry.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          dayName: getDayName(date),
          hoursWorked: 0,
          breakMinutes: 0,
        };
      }
      acc[date].hoursWorked += entry.hoursWorked;
      acc[date].breakMinutes += convertTimeToMinutes(entry.breakHours);
      return acc;
    }, {} as Record<string, { date: string; dayName: string; hoursWorked: number; breakMinutes: number }>);

    // Convert to array and sort by date
    return Object.values(groupedByDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(item => ({
        ...item,
        breakHours: item.breakMinutes / 60,
      }));
  }, [entries]);

  // Process data for weekly distribution chart
  const weeklyDistributionData = useMemo(() => {
    if (!entries.length) return [];

    // Group entries by day of week
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayMap = {
      'Mon': 0, 'Tue': 1, 'Wed': 2, 'Thu': 3, 'Fri': 4, 'Sat': 5, 'Sun': 6
    };

    const groupedByDay = entries.reduce((acc, entry) => {
      const dayName = getDayName(entry.date);
      if (!acc[dayName]) {
        acc[dayName] = {
          day: dayName,
          hoursWorked: 0,
          count: 0,
        };
      }
      acc[dayName].hoursWorked += entry.hoursWorked;
      acc[dayName].count += 1;
      return acc;
    }, {} as Record<string, { day: string; hoursWorked: number; count: number }>);

    // Calculate average hours per day
    Object.keys(groupedByDay).forEach(day => {
      groupedByDay[day].hoursWorked = groupedByDay[day].hoursWorked / groupedByDay[day].count;
    });

    // Ensure all days of the week are represented
    const result = daysOfWeek.map(day => {
      return groupedByDay[day] || { day, hoursWorked: 0, count: 0 };
    });

    // Sort by day of week
    return result.sort((a, b) => dayMap[a.day as keyof typeof dayMap] - dayMap[b.day as keyof typeof dayMap]);
  }, [entries]);

  // Process data for break time analysis
  const breakTimeData = useMemo(() => {
    if (!entries.length) return [];

    // Calculate total work time and break time
    const totalWorkMinutes = entries.reduce((sum, entry) => sum + entry.hoursWorked * 60, 0);
    const totalBreakMinutes = entries.reduce((sum, entry) => sum + convertTimeToMinutes(entry.breakHours), 0);

    return [
      { name: 'Work Time', value: totalWorkMinutes },
      { name: 'Break Time', value: totalBreakMinutes },
    ];
  }, [entries]);

  // If no entries, show a message
  if (!entries.length) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Work Hours Visualization</CardTitle>
        <CardDescription>Visual analysis of your work patterns</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="daily">Daily Hours</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Pattern</TabsTrigger>
            <TabsTrigger value="breaks">Break Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="mt-4">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailyHoursData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis 
                    dataKey="date" 
                    stroke={chartColors.text}
                    angle={-45}
                    textAnchor="end"
                    tick={{ fontSize: 12 }}
                    height={70}
                  />
                  <YAxis 
                    stroke={chartColors.text}
                    label={{ 
                      value: 'Hours', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fill: chartColors.text }
                    }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: chartColors.background,
                      color: chartColors.text,
                      border: `1px solid ${chartColors.grid}`
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="hoursWorked" 
                    name="Hours Worked" 
                    fill={chartColors.primary} 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="breakHours" 
                    name="Break Hours" 
                    fill={chartColors.secondary}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="weekly" className="mt-4">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={weeklyDistributionData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis 
                    dataKey="day" 
                    stroke={chartColors.text}
                  />
                  <YAxis 
                    stroke={chartColors.text}
                    label={{ 
                      value: 'Average Hours', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fill: chartColors.text }
                    }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: chartColors.background,
                      color: chartColors.text,
                      border: `1px solid ${chartColors.grid}`
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="hoursWorked" 
                    name="Avg Hours Worked" 
                    stroke={chartColors.tertiary} 
                    strokeWidth={2}
                    dot={{ fill: chartColors.tertiary, r: 6 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="breaks" className="mt-4">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakTimeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell key="work" fill={chartColors.primary} />
                    <Cell key="break" fill={chartColors.quaternary} />
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => {
                      const hours = Math.floor(value / 60);
                      const minutes = value % 60;
                      return `${hours}h ${minutes}m`;
                    }}
                    contentStyle={{ 
                      backgroundColor: chartColors.background,
                      color: chartColors.text,
                      border: `1px solid ${chartColors.grid}`
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}