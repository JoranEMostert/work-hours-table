'use client';

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Pencil, Trash2, Copy, Save, X, Download } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { WorkCharts } from "@/components/work-charts";

interface WorkEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  breakHours: string;
  hoursWorked: number;
  quarterHoursWorked: number;
}

interface Totals {
  totalHoursWorked: number;
  totalQuarterHoursWorked: number;
  totalPauseTime: number;
}

// Local storage key
const STORAGE_KEY = 'workHoursTrackerEntries';

export default function Home() {
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [newEntry, setNewEntry] = useState<Omit<WorkEntry, 'id' | 'hoursWorked' | 'quarterHoursWorked'>>({
    date: '',
    startTime: '',
    endTime: '',
    breakHours: '00:00',
  });
  const [batchEntries, setBatchEntries] = useState<Array<Omit<WorkEntry, 'id' | 'hoursWorked' | 'quarterHoursWorked'>>>([]);
  const [editingEntry, setEditingEntry] = useState<WorkEntry | null>(null);
  const [editingBatchIndex, setEditingBatchIndex] = useState<number | null>(null);

  // Load entries from localStorage on component mount
  useEffect(() => {
    const savedEntries = localStorage.getItem(STORAGE_KEY);
    if (savedEntries) {
      try {
        setEntries(JSON.parse(savedEntries));
      } catch (error) {
        console.error('Failed to parse saved entries:', error);
      }
    }
  }, []);

  // Save entries to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const calculateHours = (start: string, end: string, breakHours: string): number => {
    if (!start || !end) return 0;
    const startDate = new Date(`2000-01-01T${start}`);
    const endDate = new Date(`2000-01-01T${end}`);
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

  const resetNewEntry = () => {
    setNewEntry({ date: '', startTime: '', endTime: '', breakHours: '00:00' });
  };

  const addEntry = (): void => {
    if (!newEntry.date || !newEntry.startTime || !newEntry.endTime) return;

    const hoursWorked = calculateHours(newEntry.startTime, newEntry.endTime, newEntry.breakHours);
    const quarterHoursWorked = calculateQuarterHours(hoursWorked);
    const newId = `${Date.now()}-${Math.random()}`;

    setEntries([...entries, {
      ...newEntry,
      id: newId,
      hoursWorked,
      quarterHoursWorked,
      breakHours: newEntry.breakHours || '00:00'
    }]);

    resetNewEntry();
  };

  const addToBatch = (): void => {
    if (!newEntry.date || !newEntry.startTime || !newEntry.endTime) return;

    setBatchEntries([...batchEntries, {
      ...newEntry,
      breakHours: newEntry.breakHours || '00:00'
    }]);

    resetNewEntry();
  };

  const updateBatchEntry = (index: number): void => {
    if (editingBatchIndex !== null) {
      const updatedBatch = [...batchEntries];
      updatedBatch[index] = newEntry;
      setBatchEntries(updatedBatch);
      setEditingBatchIndex(null);
      resetNewEntry();
    }
  };

  const editBatchEntry = (index: number): void => {
    setNewEntry(batchEntries[index]);
    setEditingBatchIndex(index);
  };

  const removeBatchEntry = (index: number): void => {
    const updatedBatch = batchEntries.filter((_, i) => i !== index);
    setBatchEntries(updatedBatch);
    if (editingBatchIndex === index) {
      setEditingBatchIndex(null);
      resetNewEntry();
    }
  };

  const submitAllBatchEntries = (): void => {
    const newEntries = batchEntries.map(entry => {
      const hoursWorked = calculateHours(entry.startTime, entry.endTime, entry.breakHours);
      const quarterHoursWorked = calculateQuarterHours(hoursWorked);
      return {
        ...entry,
        id: `${Date.now()}-${Math.random()}`,
        hoursWorked,
        quarterHoursWorked
      };
    });

    setEntries([...entries, ...newEntries]);
    setBatchEntries([]);
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
    }
  };

  const deleteEntry = (): void => {
    if (editingEntry) {
      const updatedEntries = entries.filter(entry => entry.id !== editingEntry.id);
      setEntries(updatedEntries);
      setEditingEntry(null);
    }
  };

  const duplicateEntry = (entry: WorkEntry): void => {
    setNewEntry({
      date: entry.date,
      startTime: entry.startTime,
      endTime: entry.endTime,
      breakHours: entry.breakHours,
    });
  };

  const copyBatchEntryToInput = (index: number): void => {
    setNewEntry(batchEntries[index]);
    setEditingBatchIndex(null);
  };

  const duplicateBatchEntry = (index: number): void => {
    const entryToDuplicate = batchEntries[index];
    setBatchEntries([
      ...batchEntries.slice(0, index + 1),
      { ...entryToDuplicate },
      ...batchEntries.slice(index + 1),
    ]);
  };

  const calculateTotals = (): Totals => {
    return entries.reduce(
      (totals, entry) => ({
        totalHoursWorked: totals.totalHoursWorked + entry.hoursWorked,
        totalQuarterHoursWorked: totals.totalQuarterHoursWorked + entry.quarterHoursWorked,
        totalPauseTime: totals.totalPauseTime + convertTimeToMinutes(entry.breakHours),
      }),
      { totalHoursWorked: 0, totalQuarterHoursWorked: 0, totalPauseTime: 0 }
    );
  };

  const { totalHoursWorked, totalQuarterHoursWorked, totalPauseTime } = calculateTotals();

  // Function to export entries as CSV
  const exportToCSV = () => {
    if (entries.length === 0) return;

    // Create CSV header
    const headers = ['Date', 'Start Time', 'End Time', 'Break', 'Hours Worked', 'Quarter Hours'];

    // Convert entries to CSV rows
    const rows = entries.map(entry => [
      entry.date,
      entry.startTime,
      entry.endTime,
      entry.breakHours,
      convertMinutesToTime(Math.round(entry.hoursWorked * 60)),
      entry.quarterHoursWorked.toString()
    ]);

    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    // Create a download link and trigger the download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `work-hours-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Work Hours Tracker</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {entries.length > 0 && (
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="single">Single Entry</TabsTrigger>
          <TabsTrigger value="batch">Batch Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Entry</CardTitle>
              <CardDescription>Enter a single work period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Date</label>
                  <Input
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Start Time</label>
                  <Input
                    type="time"
                    value={newEntry.startTime}
                    onChange={(e) => setNewEntry({ ...newEntry, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">End Time</label>
                  <Input
                    type="time"
                    value={newEntry.endTime}
                    onChange={(e) => setNewEntry({ ...newEntry, endTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Break (HH:MM)</label>
                  <Input
                    type="time"
                    value={newEntry.breakHours}
                    onChange={(e) => setNewEntry({ ...newEntry, breakHours: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={addEntry}>
                <Plus className="h-4 w-4 mr-2" /> Add Entry
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="batch" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch Entry</CardTitle>
              <CardDescription>Add multiple work entries at once</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Date</label>
                    <Input
                      type="date"
                      value={newEntry.date}
                      onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Start Time</label>
                    <Input
                      type="time"
                      value={newEntry.startTime}
                      onChange={(e) => setNewEntry({ ...newEntry, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">End Time</label>
                    <Input
                      type="time"
                      value={newEntry.endTime}
                      onChange={(e) => setNewEntry({ ...newEntry, endTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Break (HH:MM)</label>
                    <Input
                      type="time"
                      value={newEntry.breakHours}
                      onChange={(e) => setNewEntry({ ...newEntry, breakHours: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  {editingBatchIndex !== null ? (
                    <>
                      <Button variant="outline" onClick={() => {
                        setEditingBatchIndex(null);
                        resetNewEntry();
                      }}>
                        <X className="h-4 w-4 mr-2" /> Cancel
                      </Button>
                      <Button onClick={() => updateBatchEntry(editingBatchIndex)}>
                        <Save className="h-4 w-4 mr-2" /> Update Entry
                      </Button>
                    </>
                  ) : (
                    <Button onClick={addToBatch}>
                      <Plus className="h-4 w-4 mr-2" /> Add to Batch
                    </Button>
                  )}
                </div>

                <Separator className="my-4" />

                <div>
                  <h3 className="text-lg font-medium mb-2">Current Batch ({batchEntries.length})</h3>

                  {batchEntries.length > 0 ? (
                    <ScrollArea className="h-[300px] rounded-md border">
                      <div className="p-4">
                        {batchEntries.map((entry, index) => (
                          <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div>
                              <Badge variant="outline" className="mr-2">{entry.date}</Badge>
                              <span className="text-sm">
                                {entry.startTime} - {entry.endTime}
                                {entry.breakHours !== '00:00' && ` (Break: ${entry.breakHours})`}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="icon" title="Edit" onClick={() => editBatchEntry(index)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="icon" title="Remove" onClick={() => removeBatchEntry(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="icon" title="Copy to Input" onClick={() => copyBatchEntryToInput(index)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="icon" title="Duplicate" onClick={() => duplicateBatchEntry(index)}>
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center p-8 text-muted-foreground border rounded-md">
                      No entries in batch yet. Add some entries above.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={submitAllBatchEntries}
                disabled={batchEntries.length === 0}
                className="px-6"
              >
                Submit All Entries ({batchEntries.length})
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Work Entries</CardTitle>
            <CardDescription>Your recorded work hours</CardDescription>
          </div>
          <div className="flex gap-3">
            <Badge variant="outline">{entries.length} Entries</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {entries.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time Period</TableHead>
                    <TableHead>Break</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Quarter Hours</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>
                        {entry.startTime} - {entry.endTime}
                      </TableCell>
                      <TableCell>{entry.breakHours}</TableCell>
                      <TableCell className="text-right font-medium">
                        {convertMinutesToTime(Math.round(entry.hoursWorked * 60))}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {entry.quarterHoursWorked}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="icon" onClick={() => setEditingEntry(entry)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Entry</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div>
                                  <label className="text-sm font-medium mb-1 block">Date</label>
                                  <Input
                                    type="date"
                                    value={editingEntry?.date || ''}
                                    onChange={(e) => setEditingEntry(prev =>
                                      prev ? { ...prev, date: e.target.value } : null)}
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-1 block">Start Time</label>
                                  <Input
                                    type="time"
                                    value={editingEntry?.startTime || ''}
                                    onChange={(e) => setEditingEntry(prev =>
                                      prev ? { ...prev, startTime: e.target.value } : null)}
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-1 block">End Time</label>
                                  <Input
                                    type="time"
                                    value={editingEntry?.endTime || ''}
                                    onChange={(e) => setEditingEntry(prev =>
                                      prev ? { ...prev, endTime: e.target.value } : null)}
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-1 block">Break (HH:MM)</label>
                                  <Input
                                    type="time"
                                    value={editingEntry?.breakHours || ''}
                                    onChange={(e) => setEditingEntry(prev =>
                                      prev ? { ...prev, breakHours: e.target.value } : null)}
                                  />
                                </div>
                              </div>
                              <DialogFooter className="flex justify-between">
                                <Button variant="destructive" onClick={deleteEntry}>
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </Button>
                                <Button onClick={updateEntry}>Save Changes</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Button variant="outline" size="icon" onClick={() => duplicateEntry(entry)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center p-12 text-muted-foreground border rounded-md">
              No work entries recorded yet. Add your first entry above.
            </div>
          )}

          {entries.length > 0 && (
            <>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Hours Worked</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{convertMinutesToTime(Math.round(totalHoursWorked * 60))}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Quarter Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{Math.round(totalQuarterHoursWorked)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Pause Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{convertMinutesToTime(totalPauseTime)}</p>
                  </CardContent>
                </Card>
              </div>

              <WorkCharts entries={entries} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
