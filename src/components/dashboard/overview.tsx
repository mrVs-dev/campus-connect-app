
"use client";

import { BarChart, Users, User, Calendar as CalendarIcon, XIcon } from "lucide-react";
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
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { programs } from "@/lib/program-data";
import * as React from "react";
import { addDays, format, isWithinInterval, startOfQuarter, endOfQuarter } from "date-fns";
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
import type { Student } from "@/lib/types";


const programShortNames: Record<string, string> = {
  'English International': 'English',
  'Khmer National': 'Khmer',
  'English as Second Language (ESL)': 'ESL',
  'Chinese as Second Language (CSL)': 'CSL',
};

function DatePickerWithRange({
  className,
  onDateChange,
}: React.HTMLAttributes<HTMLDivElement> & { onDateChange: (range: DateRange | undefined) => void }) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: startOfQuarter(new Date()),
    to: endOfQuarter(new Date()),
  });

  React.useEffect(() => {
    onDateChange(date);
  }, [date, onDateChange]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[240px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
      {date && (
         <Button
            variant="ghost"
            size="icon"
            onClick={() => setDate(undefined)}
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
}

export function Overview({ students }: OverviewProps) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: startOfQuarter(new Date()),
    to: endOfQuarter(new Date()),
  });
  const [statusFilter, setStatusFilter] = React.useState<Student['status'] | 'All'>('Active');
  
  const enrollmentFilteredStudents = React.useMemo(() => {
    if (!dateRange?.from) {
      return students;
    }
    // Make sure to include the whole day for the 'to' date
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

  const enrollmentByProgram = students.reduce((acc, student) => {
    if (student.enrollments) {
      student.enrollments.forEach(enrollment => {
        const programName = programs.find(p => p.id === enrollment.programId)?.name || 'Unknown';
        const shortName = programShortNames[programName] || programName;
        acc[shortName] = (acc[shortName] || 0) + 1;
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(enrollmentByProgram).map(([name, value]) => ({
    name,
    students: value,
  }));

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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <p className="text-xs text-muted-foreground">Total students</p>
              <div className="flex items-center gap-4 text-sm">
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
      
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
            <div className="flex items-start justify-between">
                <div>
                    <CardTitle>Enrollments</CardTitle>
                    <CardDescription>Number of new enrollments in the selected date range.</CardDescription>
                </div>
                <DatePickerWithRange onDateChange={setDateRange} />
            </div>
        </CardHeader>
        <CardContent>
           <div className="grid grid-cols-2 items-center gap-4">
             <div className="flex flex-col space-y-2">
                <p className="text-3xl font-bold">{enrollmentFilteredStudents.length}</p>
                <p className="text-xs text-muted-foreground">Total enrollments in period</p>
             </div>
             <ChartContainer config={chartConfig} className="h-[150px] w-full">
                <PieChart accessibilityLayer>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#8884d8">
                     {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                     ))}
                  </Pie>
                </PieChart>
             </ChartContainer>
           </div>
        </CardContent>
      </Card>

      <Card className="col-span-1 md:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Admission by Program</CardTitle>
          <BarChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <RechartsBarChart data={chartData} accessibilityLayer layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={0}
                width={50}
              />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar dataKey="students" fill="var(--color-students)" radius={4} barSize={20} />
            </RechartsBarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
