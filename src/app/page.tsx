'use client'

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";

interface WorkEntry {
  id: number;
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

export default function Home() {
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [newEntry, setNewEntry] = useState<Omit<WorkEntry, 'id' | 'hoursWorked' | 'quarterHoursWorked'>>({
    date: '',
    startTime: '',
    endTime: '',
    breakHours: '',
  });
  const [editingEntry, setEditingEntry] = useState<WorkEntry | null>(null);

  const calculateHours = (start: string, end: string, breakHours: string): number => {
    const startDate = new Date(`2000-01-01T${start}`);
    const endDate = new Date(`2000-01-01T${end}`);
    const breakMinutes = convertTimeToMinutes(breakHours);
    const diff = (endDate.getTime() - startDate.getTime()) / 60000 - breakMinutes; // Convert to minutes
    return Math.max(0, diff / 60); // Convert back to hours
  };

  const calculateQuarterHours = (hours: number): number => {
    return Math.ceil(hours * 4);
  };

  const convertTimeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const convertMinutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const addEntry = (): void => {
    const hoursWorked = calculateHours(newEntry.startTime, newEntry.endTime, newEntry.breakHours);
    const quarterHoursWorked = calculateQuarterHours(hoursWorked);
    const newId = entries.length > 0 ? Math.max(...entries.map(e => e.id)) + 1 : 1;
    setEntries([...entries, { ...newEntry, id: newId, hoursWorked, quarterHoursWorked }]);
    setNewEntry({ date: '', startTime: '', endTime: '', breakHours: '' });
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

  return (
      <div className="p-4 max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Work Hours Calculator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <Input
                  type="number"
                  placeholder="Date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
              />
              <Input
                  type="time"
                  placeholder="Start Time"
                  value={newEntry.startTime}
                  onChange={(e) => setNewEntry({ ...newEntry, startTime: e.target.value })}
              />
              <Input
                  type="time"
                  placeholder="End Time"
                  value={newEntry.endTime}
                  onChange={(e) => setNewEntry({ ...newEntry, endTime: e.target.value })}
              />
              <Input
                  type="time"
                  placeholder="Break Hours"
                  value={newEntry.breakHours}
                  onChange={(e) => setNewEntry({ ...newEntry, breakHours: e.target.value })}
              />
              <Button onClick={addEntry} className="w-full">Add Entry</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Work Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Break Hours</TableHead>
                  <TableHead>Hours Worked</TableHead>
                  <TableHead>Quarter Hours Worked</TableHead>
                  <TableHead>Edit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.startTime}</TableCell>
                      <TableCell>{entry.endTime}</TableCell>
                      <TableCell>{entry.breakHours}</TableCell>
                      <TableCell>{convertMinutesToTime(Math.round(entry.hoursWorked * 60))}</TableCell>
                      <TableCell>{entry.quarterHoursWorked}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => setEditingEntry(entry)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Edit Entry</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <Input
                                  type="number"
                                  placeholder="Date"
                                  value={editingEntry?.date}
                                  onChange={(e) => setEditingEntry(prev => prev ? {...prev, date: e.target.value} : null)}
                              />
                              <Input
                                  type="time"
                                  placeholder="Start Time"
                                  value={editingEntry?.startTime}
                                  onChange={(e) => setEditingEntry(prev => prev ? {...prev, startTime: e.target.value} : null)}
                              />
                              <Input
                                  type="time"
                                  placeholder="End Time"
                                  value={editingEntry?.endTime}
                                  onChange={(e) => setEditingEntry(prev => prev ? {...prev, endTime: e.target.value} : null)}
                              />
                              <Input
                                  type="time"
                                  placeholder="Break Hours"
                                  value={editingEntry?.breakHours}
                                  onChange={(e) => setEditingEntry(prev => prev ? {...prev, breakHours: e.target.value} : null)}
                              />
                            </div>
                            <div className="flex justify-between">
                              <Button onClick={updateEntry}>Save Changes</Button>
                              <Button variant="destructive" onClick={deleteEntry}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Total Hours Worked</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{convertMinutesToTime(Math.round(totalHoursWorked * 60))}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Quarter Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{Math.round(totalQuarterHoursWorked)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Pause Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{convertMinutesToTime(totalPauseTime)}</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}