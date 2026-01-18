'use client';

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Trash2, Download, Upload, Trash, Clock, Save, FileJson } from "lucide-react";
import { WorkCharts } from "@/components/work-charts";
import { ThemeToggle } from "@/components/theme-toggle";
import { BatchAddDialog } from "@/components/batch-add-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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


export default function Home() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [newEntry, setNewEntry] = useState<Omit<WorkEntry, 'id' | 'hoursWorked' | 'quarterHoursWorked' | 'hourlyRate'>>({
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:30',
    breakHours: '00:30',
  });
  const [editingEntry, setEditingEntry] = useState<WorkEntry | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [globalHourlyRate, setGlobalHourlyRate] = useState<number>(0);

  // Load from local storage on mount
  useEffect(() => {
    const savedEntries = localStorage.getItem('work-entries');
    const savedRate = localStorage.getItem('global-hourly-rate');
    
    if (savedEntries) {
      try {
        setEntries(JSON.parse(savedEntries));
      } catch (e) {
        console.error("Failed to parse saved entries", e);
      }
    }
    
    if (savedRate) {
        setGlobalHourlyRate(parseFloat(savedRate));
    }
    
    setIsLoaded(true);
  }, []);

  // Save to local storage whenever entries change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('work-entries', JSON.stringify(entries));
    }
  }, [entries, isLoaded]);

  // Save rate whenever it changes
  useEffect(() => {
      if (isLoaded) {
          localStorage.setItem('global-hourly-rate', globalHourlyRate.toString());
      }
  }, [globalHourlyRate, isLoaded]);

  const calculateHours = (start: string, end: string, breakHours: string): number => {
    if (!start || !end) return 0;
    // Use a dummy date to compare times
    const startDate = new Date(`2000-01-01T${start}`);
    const endDate = new Date(`2000-01-01T${end}`);
    
    // Handle overnight shifts if end time is before start time
    if (endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }
    
    const breakMinutes = convertTimeToMinutes(breakHours || '00:00');
    const diff = (endDate.getTime() - startDate.getTime()) / 60000 - breakMinutes; // Convert to minutes
    return Math.max(0, diff / 60); // Convert back to hours
  };

  const calculateQuarterHours = (hours: number): number => {
    return Math.ceil(hours * 4);
  };

  const convertTimeToMinutes = (time: string): number => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  };

  const convertMinutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const addEntry = (): void => {
    if (!newEntry.date || !newEntry.startTime || !newEntry.endTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in Date, Start Time, and End Time.",
        variant: "destructive"
      });
      return;
    }

    const hoursWorked = calculateHours(newEntry.startTime, newEntry.endTime, newEntry.breakHours);
    const quarterHoursWorked = calculateQuarterHours(hoursWorked);
    const newId = entries.length > 0 ? Math.max(...entries.map(e => e.id)) + 1 : 1;
    
    setEntries([...entries, { ...newEntry, id: newId, hoursWorked, quarterHoursWorked, hourlyRate: globalHourlyRate }]);
    
    // Reset form but keep date (maybe increment?) or keep today
    // For convenience, let's keep the date to allow easy adding of next day if user changes it manually, 
    // or reset to today. Let's reset to today for now.
    setNewEntry({ 
      date: newEntry.date, // Keep the date as user might be adding for a specific day
      startTime: '09:00', 
      endTime: '17:30', 
      breakHours: '00:30',
    });

    toast({
      title: "Entry Added",
      description: "Work entry has been successfully recorded.",
    });
  };

  const handleBatchAdd = (batchEntries: Omit<WorkEntry, 'id' | 'hoursWorked' | 'quarterHoursWorked'>[]) => {
    const nextIdStart = entries.length > 0 ? Math.max(...entries.map(e => e.id)) + 1 : 1;
    
    const newEntries = batchEntries.map((entry, index) => {
      const hoursWorked = calculateHours(entry.startTime, entry.endTime, entry.breakHours);
      return {
        ...entry,
        id: nextIdStart + index,
        hoursWorked,
        quarterHoursWorked: calculateQuarterHours(hoursWorked)
      };
    });

    setEntries([...entries, ...newEntries]);
    toast({
      title: "Batch Add Complete",
      description: `Successfully added ${newEntries.length} entries.`,
    });
  };

  const updateEntry = (): void => {
    if (editingEntry) {
      const updatedEntries = entries.map(entry =>
        entry.id === editingEntry.id ? {
          ...editingEntry,
          hoursWorked: calculateHours(editingEntry.startTime, editingEntry.endTime, editingEntry.breakHours),
          quarterHoursWorked: calculateQuarterHours(calculateHours(editingEntry.startTime, editingEntry.endTime, editingEntry.breakHours))
        } : entry
      );
      setEntries(updatedEntries);
      setEditingEntry(null);
      toast({ title: "Entry Updated", description: "Changes have been saved." });
    }
  };

  const deleteEntry = (id: number): void => {
    setEntries(entries.filter(entry => entry.id !== id));
    if (editingEntry?.id === id) setEditingEntry(null);
    toast({ title: "Entry Deleted", description: "The entry has been removed." });
  };

  const clearAllEntries = () => {
    if (confirm("Are you sure you want to delete ALL entries? This cannot be undone.")) {
      setEntries([]);
      toast({ title: "All Data Cleared", description: "All entries have been removed." });
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(entries, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `work-hours-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful", description: "Data downloaded as JSON file." });
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          if (Array.isArray(importedData)) {
            // Basic validation
            const valid = importedData.every(item => item.date && item.startTime && item.endTime);
            if (valid) {
              setEntries([...entries, ...importedData]); // Append or Replace? Let's append to be safe.
              toast({ title: "Import Successful", description: `Imported ${importedData.length} entries.` });
            } else {
              toast({ title: "Import Failed", description: "Invalid data format.", variant: "destructive" });
            }
          }
        } catch {
          toast({ title: "Import Failed", description: "Could not parse JSON file.", variant: "destructive" });
        }
      };
      reader.readAsText(file);
    }
  };

  const fillStandardDay = () => {
    const startTime = newEntry.startTime || '09:00';
    const breakHours = newEntry.breakHours || '00:30';
    
    const start = new Date(`2000-01-01T${startTime}`);
    const breakMins = convertTimeToMinutes(breakHours);
    // Add 8 hours + break time
    const endTimestamp = start.getTime() + (8 * 60 * 60 * 1000) + (breakMins * 60 * 1000);
    const endDate = new Date(endTimestamp);
    
    const hours = endDate.getHours().toString().padStart(2, '0');
    const minutes = endDate.getMinutes().toString().padStart(2, '0');
    
    setNewEntry({ 
      ...newEntry, 
      startTime, 
      breakHours, 
      endTime: `${hours}:${minutes}` 
    });
  };

  const { totalHoursWorked, totalQuarterHoursWorked, totalPauseTime } = entries.reduce(
    (totals, entry) => ({
      totalHoursWorked: totals.totalHoursWorked + entry.hoursWorked,
      totalQuarterHoursWorked: totals.totalQuarterHoursWorked + entry.quarterHoursWorked,
      totalPauseTime: totals.totalPauseTime + convertTimeToMinutes(entry.breakHours),
    }),
    { totalHoursWorked: 0, totalQuarterHoursWorked: 0, totalPauseTime: 0 }
  );

  return (
      <div className="p-4 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Work Hours Tracker</h1>
            <p className="text-muted-foreground">Manage your work time, breaks, and analyze your productivity.</p>
          </div>
          <div className="flex gap-2 items-center">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Actions</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Data Management</DropdownMenuLabel>
                <DropdownMenuItem onClick={exportData}>
                  <Download className="mr-2 h-4 w-4" /> Export JSON
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <label className="flex cursor-pointer items-center">
                    <Upload className="mr-2 h-4 w-4" /> Import JSON
                    <input type="file" accept=".json" className="hidden" onChange={importData} />
                  </label>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={clearAllEntries} className="text-destructive focus:text-destructive">
                  <Trash className="mr-2 h-4 w-4" /> Clear All Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Tabs defaultValue="log" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                <TabsTrigger value="log">Add Entries</TabsTrigger>
                <TabsTrigger value="report">Final View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="log" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Settings Card */}
                   <Card className="lg:col-span-3">
                       <CardHeader>
                           <CardTitle>Global Settings</CardTitle>
                           <CardDescription>Default values for new entries</CardDescription>
                       </CardHeader>
                       <CardContent>
                           <div className="flex items-center gap-4 max-w-sm">
                               <div className="grid gap-1.5 flex-1">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Default Hourly Rate ($)</label>
                                    <Input 
                                        type="number" 
                                        min="0"
                                        placeholder="0.00"
                                        value={globalHourlyRate || ''}
                                        onChange={(e) => setGlobalHourlyRate(parseFloat(e.target.value))}
                                    />
                                    <p className="text-[0.8rem] text-muted-foreground">Applied to all new entries automatically.</p>
                               </div>
                           </div>
                       </CardContent>
                   </Card>

                  <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                      <CardTitle>Add Entry</CardTitle>
                      <CardDescription>Record a new work session</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Date</label>
                        <Input
                            type="date"
                            value={newEntry.date}
                            onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Start Time</label>
                          <Input
                              type="time"
                              value={newEntry.startTime}
                              onChange={(e) => setNewEntry({ ...newEntry, startTime: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">End Time</label>
                          <div className="flex gap-2">
                            <Input
                                type="time"
                                value={newEntry.endTime}
                                onChange={(e) => setNewEntry({ ...newEntry, endTime: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Break Duration</label>
                        <Input
                            type="time"
                            value={newEntry.breakHours}
                            onChange={(e) => setNewEntry({ ...newEntry, breakHours: e.target.value })}
                        />
                      </div>
                      
                      <div className="pt-2 flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Button onClick={fillStandardDay} variant="outline" className="flex-1" title="Calculates end time for 8h work + break">
                            <Clock className="mr-2 h-4 w-4" /> 
                            Fill 8h Day
                          </Button>
                          <BatchAddDialog onAddBatch={handleBatchAdd} />
                        </div>
                        <Button onClick={addEntry} className="w-full">
                          <Save className="mr-2 h-4 w-4" />
                          Save Entry
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2">
                     <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Entries</CardTitle>
                            <CardDescription>Your latest work logs</CardDescription>
                        </div>
                        <Badge variant="secondary" className="text-base px-4 py-1">
                            {entries.length} Entries
                        </Badge>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[350px]">
                        {entries.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Break</TableHead>
                                <TableHead className="text-right">Rate</TableHead>
                                <TableHead className="text-right">Earnings</TableHead>
                                <TableHead className="text-right">Hours</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {entries.slice().reverse().map((entry) => (
                                <TableRow key={entry.id}>
                                  <TableCell className="font-medium">{entry.date}</TableCell>
                                  <TableCell>{entry.startTime} - {entry.endTime}</TableCell>
                                  <TableCell>{entry.breakHours}</TableCell>
                                  <TableCell className="text-right">{entry.hourlyRate ? `$${entry.hourlyRate}` : '-'}</TableCell>
                                  <TableCell className="text-right font-medium text-green-600 dark:text-green-400">
                                    {entry.hourlyRate ? `$${(entry.hoursWorked * entry.hourlyRate).toFixed(2)}` : '-'}
                                  </TableCell>
                                  <TableCell className="text-right font-mono">
                                    {entry.hoursWorked.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button variant="ghost" size="icon" onClick={() => setEditingEntry(entry)}>
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>Edit Entry</DialogTitle>
                                            <DialogDescription>Make changes to this work log.</DialogDescription>
                                          </DialogHeader>
                                          <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-2 gap-4">
                                              <div className="space-y-2">
                                                <label className="text-sm font-medium">Date</label>
                                                <Input
                                                    type="date"
                                                    value={editingEntry?.date}
                                                    onChange={(e) => setEditingEntry(prev => prev ? {...prev, date: e.target.value} : null)}
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <label className="text-sm font-medium">Break</label>
                                                <Input
                                                    type="time"
                                                    value={editingEntry?.breakHours}
                                                    onChange={(e) => setEditingEntry(prev => prev ? {...prev, breakHours: e.target.value} : null)}
                                                />
                                              </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Hourly Rate</label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={editingEntry?.hourlyRate || ''}
                                                    onChange={(e) => setEditingEntry(prev => prev ? {...prev, hourlyRate: parseFloat(e.target.value)} : null)}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                              <div className="space-y-2">
                                                <label className="text-sm font-medium">Start</label>
                                                <Input
                                                    type="time"
                                                    value={editingEntry?.startTime}
                                                    onChange={(e) => setEditingEntry(prev => prev ? {...prev, startTime: e.target.value} : null)}
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <label className="text-sm font-medium">End</label>
                                                <Input
                                                    type="time"
                                                    value={editingEntry?.endTime}
                                                    onChange={(e) => setEditingEntry(prev => prev ? {...prev, endTime: e.target.value} : null)}
                                                />
                                              </div>
                                            </div>
                                          </div>
                                          <DialogFooter className="gap-2 sm:justify-between">
                                            <Button variant="destructive" onClick={() => editingEntry && deleteEntry(editingEntry.id)}>
                                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                                            </Button>
                                            <Button onClick={updateEntry}>Save Changes</Button>
                                          </DialogFooter>
                                        </DialogContent>
                                      </Dialog>
                                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteEntry(entry.id)}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground border-2 border-dashed rounded-lg">
                            <FileJson className="h-10 w-10 mb-2 opacity-20" />
                            <p>No entries yet</p>
                            <p className="text-sm">Add an entry manually or import data</p>
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
            </TabsContent>

            <TabsContent value="report" className="space-y-6 mt-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Work Log Report</CardTitle>
                        <CardDescription>Detailed overview of all work entries.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Time Period</TableHead>
                                <TableHead>Break</TableHead>
                                <TableHead className="text-right">Rate</TableHead>
                                <TableHead className="text-right">Earnings</TableHead>
                                <TableHead className="text-right">Hours</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {entries.length > 0 ? (
                                  entries.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((entry) => (
                                    <TableRow key={entry.id}>
                                      <TableCell>{entry.date}</TableCell>
                                      <TableCell>{entry.startTime} - {entry.endTime}</TableCell>
                                      <TableCell>{entry.breakHours}</TableCell>
                                      <TableCell className="text-right">{entry.hourlyRate ? `$${entry.hourlyRate}` : '-'}</TableCell>
                                      <TableCell className="text-right font-medium">
                                        {entry.hourlyRate ? `$${(entry.hoursWorked * entry.hourlyRate).toFixed(2)}` : '-'}
                                      </TableCell>
                                      <TableCell className="text-right font-mono">{entry.hoursWorked.toFixed(2)}</TableCell>
                                    </TableRow>
                                  ))
                              ) : (
                                  <TableRow>
                                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No entries found.</TableCell>
                                  </TableRow>
                              )}
                            </TableBody>
                        </Table>
                    </CardContent>
                 </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{convertMinutesToTime(Math.round(totalHoursWorked * 60))}</div>
                      <p className="text-xs text-muted-foreground mt-1">Total time worked</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Quarter Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{Math.round(totalQuarterHoursWorked)}</div>
                      <p className="text-xs text-muted-foreground mt-1">Billable units (approx)</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Breaks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{convertMinutesToTime(totalPauseTime)}</div>
                      <p className="text-xs text-muted-foreground mt-1">Time spent on breaks</p>
                    </CardContent>
                  </Card>
                </div>

                <WorkCharts entries={entries} />
            </TabsContent>
        </Tabs>
      </div>
  );
}