'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, Copy } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BatchEntry {
  id: string; // Temporary ID for the list
  date: string;
  startTime: string;
  endTime: string;
  breakHours: string;
  hourlyRate?: number;
}

interface BatchAddDialogProps {
  onAddBatch: (entries: Omit<BatchEntry, 'id'>[]) => void;
}

export function BatchAddDialog({ onAddBatch }: BatchAddDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rows, setRows] = useState<BatchEntry[]>([
    { id: '1', date: '', startTime: '09:00', endTime: '17:30', breakHours: '00:30', hourlyRate: 0 }
  ]);

  const addRow = () => {
    const lastRow = rows[rows.length - 1];
    setRows([
      ...rows,
      {
        id: Math.random().toString(36).substr(2, 9),
        date: lastRow ? lastRow.date : '', // Copy date from last row for convenience
        startTime: '09:00',
        endTime: '17:30',
        breakHours: '00:30',
        hourlyRate: lastRow ? lastRow.hourlyRate : 0
      }
    ]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof BatchEntry, value: string | number) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleSave = () => {
    // Filter out empty rows
    const validRows = rows.filter(row => row.date && row.startTime && row.endTime);
    if (validRows.length > 0) {
      // Remove the temporary ID before sending back
      const entriesToAdd = validRows.map(row => ({
        date: row.date,
        startTime: row.startTime,
        endTime: row.endTime,
        breakHours: row.breakHours,
        hourlyRate: row.hourlyRate
      }));
      onAddBatch(entriesToAdd);
      setIsOpen(false);
      // Reset form
      setRows([{ id: '1', date: '', startTime: '09:00', endTime: '17:30', breakHours: '00:30', hourlyRate: 0 }]);
    }
  };

  const duplicateRow = (index: number) => {
    const rowToDuplicate = rows[index];
    const newRow = { ...rowToDuplicate, id: Math.random().toString(36).substr(2, 9) };
    const newRows = [...rows];
    newRows.splice(index + 1, 0, newRow);
    setRows(newRows);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Copy className="mr-2 h-4 w-4" />
          Batch Add
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Batch Add Entries</DialogTitle>
          <DialogDescription>
            Add multiple work entries at once. Duplicate rows to quickly add similar days.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden min-h-[300px] border rounded-md">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Break</TableHead>
                  <TableHead>Rate ($)</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Input
                        type="date"
                        value={row.date}
                        onChange={(e) => updateRow(row.id, 'date', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="time"
                        value={row.startTime}
                        onChange={(e) => updateRow(row.id, 'startTime', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="time"
                        value={row.endTime}
                        onChange={(e) => updateRow(row.id, 'endTime', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="time"
                        value={row.breakHours}
                        onChange={(e) => updateRow(row.id, 'breakHours', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Optional"
                        value={row.hourlyRate || ''}
                        onChange={(e) => updateRow(row.id, 'hourlyRate', parseFloat(e.target.value))}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => duplicateRow(index)}
                          title="Duplicate row"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRow(row.id)}
                          disabled={rows.length === 1}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        <DialogFooter className="mt-4 flex justify-between sm:justify-between">
          <Button variant="outline" onClick={addRow}>
            <Plus className="mr-2 h-4 w-4" />
            Add Row
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save {rows.filter(r => r.date && r.startTime).length} Entries</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
