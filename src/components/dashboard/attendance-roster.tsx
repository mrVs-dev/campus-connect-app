
"use client";

import * as React from "react";
import { format, startOfDay, isEqual } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { getAttendanceForClass, saveAttendance } from "@/lib/firebase/firestore";
import type { Student, AttendanceRecord, AttendanceStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AttendanceRosterProps {
  students: Student[];
  classId: string;
  teacherId: string;
}

type AttendanceState = {
    status: AttendanceStatus;
    minutesLate?: number;
};

export function AttendanceRoster({ students, classId, teacherId }: AttendanceRosterProps) {
  const [date, setDate] = React.useState<Date>(startOfDay(new Date()));
  const [attendance, setAttendance] = React.useState<Map<string, AttendanceState>>(new Map());
  const [loading, setLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();

  const fetchAndSetAttendance = React.useCallback(async (fetchDate: Date) => {
    setLoading(true);
    try {
      const records = await getAttendanceForClass(classId, fetchDate);
      const newAttendanceMap = new Map<string, AttendanceState>();
      students.forEach(student => {
          const record = records.find(r => r.studentId === student.studentId);
          if (record) {
              newAttendanceMap.set(student.studentId, { status: record.status, minutesLate: record.minutesLate });
          } else {
              // Default to 'Present' if no record exists for the day
              newAttendanceMap.set(student.studentId, { status: 'Present', minutesLate: 0 });
          }
      });
      setAttendance(newAttendanceMap);
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
      toast({
        title: "Error",
        description: "Could not load attendance data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [classId, students, toast]);

  React.useEffect(() => {
    fetchAndSetAttendance(date);
  }, [date, fetchAndSetAttendance]);

  const handleDateChange = (newDate?: Date) => {
    if (newDate && !isEqual(startOfDay(newDate), date)) {
      setDate(startOfDay(newDate));
    }
  };

  const handleAttendanceChange = (studentId: string, newState: Partial<AttendanceState>) => {
    setAttendance(prev => {
        const newMap = new Map(prev);
        const currentState = newMap.get(studentId) || { status: 'Present' };
        
        let updatedState = { ...currentState, ...newState };

        // If status changes from 'Late', clear minutesLate
        if (newState.status && newState.status !== 'Late') {
          updatedState.minutesLate = 0;
        }

        newMap.set(studentId, updatedState);
        return newMap;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
        const recordsToSave: Omit<AttendanceRecord, 'attendanceId'>[] = [];
        attendance.forEach((state, studentId) => {
            recordsToSave.push({
                studentId,
                classId,
                date,
                status: state.status,
                minutesLate: state.status === 'Late' ? (state.minutesLate || 0) : 0,
                recordedById: teacherId,
            });
        });
        await saveAttendance(recordsToSave);
        toast({
            title: "Attendance Saved",
            description: `Attendance for ${format(date, 'PPP')} has been updated.`,
        });
    } catch (error) {
        console.error("Failed to save attendance:", error);
        toast({
            title: "Save Failed",
            description: "Could not save attendance data.",
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Daily Attendance</h3>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateChange}
              captionLayout="dropdown-buttons"
              fromYear={new Date().getFullYear() - 1}
              toYear={new Date().getFullYear()}
              disabled={(d) => d > new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {loading ? (
        <p>Loading attendance...</p>
      ) : (
        <>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[150px]">Minutes Late</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {students.map((student) => {
                        const studentAttendance = attendance.get(student.studentId) || { status: 'Present' };
                        return (
                            <TableRow key={student.studentId}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={student.avatarUrl} alt="Avatar" className="object-cover" />
                                        <AvatarFallback>{student.firstName[0]}{student.lastName[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="font-medium">{student.firstName} {student.lastName}</div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Select
                                value={studentAttendance.status}
                                onValueChange={(status: AttendanceStatus) => handleAttendanceChange(student.studentId, { status })}
                                >
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Present">Present</SelectItem>
                                    <SelectItem value="Absent">Absent</SelectItem>
                                    <SelectItem value="Late">Late</SelectItem>
                                    <SelectItem value="Excused">Excused</SelectItem>
                                </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                <Input
                                type="number"
                                value={studentAttendance.minutesLate || ''}
                                onChange={(e) => handleAttendanceChange(student.studentId, { minutesLate: parseInt(e.target.value) || 0 })}
                                disabled={studentAttendance.status !== 'Late'}
                                min={0}
                                />
                            </TableCell>
                            </TableRow>
                        );
                    })}
                    </TableBody>
                </Table>
            </div>
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Attendance"}
                </Button>
            </div>
        </>
      )}
    </div>
  );
}
