

"use client";

import { BarChart, Users, User, Calendar as CalendarIcon, XIcon, BookOpenCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { programs, sortLevels } from "@/lib/program-data";
import * as React from "react";
import { addDays, format, isWithinInterval, startOfMonth } from "date-fns";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Student, Admission } from "@/lib/types";


function DatePickerWithRange({
  className,
  value,
  onDateChange,
}: React.HTMLAttributes<HTMLDivElement> & { value: DateRange | undefined, onDateChange: (range: DateRange | undefined) => void }) {
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[240px] justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "LLL dd, y")} -{" "}
                  {format(value.to, "LLL dd, y")}
                </>
              ) : (
                format(value.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-card" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={onDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
      {value && (
         <Button
            variant="ghost"
            size="icon"
            onClick={() => onDateChange(undefined)}
            className="h-8 w-8"
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Clear</span>
        </Button>
      )}
    </div>
  )
}

interface OverviewProps {
  students: Student[];
  admissions: Admission[];
}

export function Overview({ students, admissions }: OverviewProps) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [statusFilter, setStatusFilter] = React.useState<Student['status'] | 'All'>('Active');
  const [admissionYearFilter, setAdmissionYearFilter] = React.useState<string>('All');

  React.useEffect(() => {
    const now = new Date();
    setDateRange({
      from: new Date("2025-07-21"),
      to: now
    });
  }, []);
  
  const enrollmentFilteredStudents = React.useMemo(() => {
    if (!dateRange?.from) {
      return [];
    }
    const toDate = dateRange.to ? addDays(dateRange.to, 1) : undefined;
    
    return students.filter(student => {
      if (!student.enrollmentDate) return false;
      const enrollmentDate = new Date(student.enrollmentDate);
      if (!toDate) {
        return enrollmentDate >= dateRange.from!;
      }
      return isWithinInterval(enrollmentDate, { start: dateRange.from!, end: toDate });
    });
  }, [dateRange, students]);

  const populationStudents = React.useMemo(() => {
    if (statusFilter === 'All') {
      return students;
    }
    return students.filter(student => student.status === statusFilter);
  }, [students, statusFilter]);

  const totalStudents = populationStudents.length;

  const genderDistribution = React.useMemo(() => {
    return populationStudents.reduce((acc, student) => {
      const sex = student.sex || 'Other';
      acc[sex] = (acc[sex] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [populationStudents]);

  const enrollmentGenderDistribution = React.useMemo(() => {
     return enrollmentFilteredStudents.reduce((acc, student) => {
      const sex = student.sex || 'Other';
      acc[sex] = (acc[sex] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [enrollmentFilteredStudents]);

  const pieData = [
    { name: 'Male', value: enrollmentGenderDistribution['Male'] || 0 },
    { name: 'Female', value: enrollmentGenderDistribution['Female'] || 0 },
    { name: 'Other', value: enrollmentGenderDistribution['Other'] || 0 },
  ].filter(d => d.value > 0);

  const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted-foreground))"];

  const enrollmentsByProgramAndLevel = React.useMemo(() => {
    const programData: Record<string, { total: number; levels: Record<string, number> }> = {};

    programs.forEach(p => {
        programData[p.name] = { total: 0, levels: {} };
    });

    const admissionsToConsider = admissionYearFilter === 'All'
      ? admissions
      : admissions.filter(a => a.schoolYear === admissionYearFilter);
    
    admissionsToConsider.forEach(admission => {
      admission.students.forEach(studentAdmission => {
        studentAdmission.enrollments.forEach(enrollment => {
            const programName = programs.find(p => p.id === enrollment.programId)?.name;
            if (programName) {
                programData[programName].total++;
                let levelName = enrollment.level;
                if (levelName === 'Starter') levelName = 'Starters'; // Consolidate typo
                programData[programName].levels[levelName] = (programData[programName].levels[levelName] || 0) + 1;
            }
        });
      });
    });
    
    return Object.entries(programData)
      .map(([name, data]) => ({
        name,
        ...data,
        levels: sortLevels(Object.entries(data.levels).map(([level, count]) => ({ level, students: count }))),
      }))
      .filter(p => p.total > 0);
  }, [admissions, admissionYearFilter]);

  const totalAdmissions = React.useMemo(() => {
    const admissionsToConsider = admissionYearFilter === 'All'
      ? admissions
      : admissions.filter(a => a.schoolYear === admissionYearFilter);
      
    return admissionsToConsider.reduce((acc, admission) => {
        return acc + admission.students.reduce((studentAcc, studentAdmission) => {
            return studentAcc + studentAdmission.enrollments.length;
        }, 0);
    }, 0);
  }, [admissions, admissionYearFilter]);

  const chartConfig = {
    students: {
      label: "Students",
      color: "hsl(var(--primary))",
    },
     male: {
      label: "Male",
      color: "hsl(var(--primary))",
    },
    female: {
      label: "Female",
      color: "hsl(var(--accent))",
    },
  };

  const admissionYears = ['All', ...[...new Set(admissions.map(a => a.schoolYear))].sort((a, b) => b.localeCompare(a))];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Student Population</CardTitle>
            <Select value={statusFilter} onValueChange={(value: Student['status'] | 'All') => setStatusFilter(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Graduated">Graduated</SelectItem>
                <SelectItem value="All">All</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
                <p className="text-3xl font-bold">{totalStudents}</p>
                <p className="text-xs text-muted-foreground">Total students (headcount)</p>
                <div className="flex items-center gap-4 text-sm pt-2">
                    <div className="flex items-center gap-1">
                        <User className="h-4 w-4 text-primary" />
                        <span>{genderDistribution['Male'] || 0} Male</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <User className="h-4 w-4 text-accent" />
                        <span>{genderDistribution['Female'] || 0} Female</span>
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Total Admissions</CardTitle>
              <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="flex flex-col space-y-2">
                <p className="text-3xl font-bold">{totalAdmissions}</p>
                <p className="text-xs text-muted-foreground">Total program enrollments</p>
                 <p className="text-xs text-muted-foreground pt-4">Filtered by <span className="font-semibold">{admissionYearFilter === 'All' ? 'All Years' : admissionYearFilter}</span></p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
              <div className="flex items-start justify-between">
                  <div>
                      <CardTitle>New Student Enrollments</CardTitle>
                      <CardDescription>Headcount of new students in a date range.</CardDescription>
                  </div>
                  <DatePickerWithRange value={dateRange} onDateChange={setDateRange} />
              </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 items-center gap-4">
              <div className="flex flex-col space-y-2">
                  <p className="text-3xl font-bold">{enrollmentFilteredStudents.length}</p>
                  <p className="text-xs text-muted-foreground">New students in period</p>
              </div>
              <ChartContainer config={chartConfig} className="h-[100px] w-full">
                  <PieChart accessibilityLayer>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={40} fill="#8884d8">
                      {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Program Admissions</CardTitle>
            <CardDescription>Total program enrollments across programs and levels.</CardDescription>
          </div>
           <Select value={admissionYearFilter} onValueChange={setAdmissionYearFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select admission year" />
              </SelectTrigger>
              <SelectContent>
                {admissionYears.map(year => (
                  <SelectItem key={year} value={year}>{year === 'All' ? 'All Years' : year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        </CardHeader>
        <CardContent className="grid gap-6">
          {enrollmentsByProgramAndLevel.length > 0 ? (
            enrollmentsByProgramAndLevel.map((program) => (
              <div key={program.name} className="grid gap-4 md:grid-cols-3 items-start">
                <div className="flex flex-col space-y-2">
                  <p className="font-semibold text-lg">{program.name}</p>
                  <p className="text-4xl font-bold">{program.total}</p>
                  <p className="text-sm text-muted-foreground">Total Admissions</p>
                </div>
                <div className="md:col-span-2">
                  <ChartContainer config={chartConfig} className="h-[200px] w-full">
                    <RechartsBarChart 
                      data={program.levels} 
                      layout="vertical"
                      margin={{ left: 20, right: 20, top: 5, bottom: 5 }}
                    >
                      <CartesianGrid horizontal={false} />
                      <YAxis
                        dataKey="level"
                        type="category"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        interval={0}
                        width={80}
                        tick={{ fontSize: 12 }}
                      />
                      <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} allowDecimals={false} />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                      />
                      <Bar dataKey="students" fill="var(--color-students)" radius={4} barSize={15} />
                    </RechartsBarChart>
                  </ChartContainer>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No admission data available for the selected year.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
