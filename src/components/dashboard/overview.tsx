
"use client";

import { BarChart, BookUser, Users, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { students, subjects } from "@/lib/mock-data";
import { programs } from "@/lib/program-data";
import * as React from "react";

const programShortNames: Record<string, string> = {
  'English International': 'English',
  'Khmer National': 'Khmer',
  'English as Second Language (ESL)': 'ESL',
  'Chinese as Second Language (CSL)': 'CSL',
};

export function Overview() {
  const totalStudents = students.length;
  const totalSubjects = subjects.length;

  const genderDistribution = React.useMemo(() => {
    return students.reduce((acc, student) => {
      acc[student.sex] = (acc[student.sex] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, []);

  const pieData = [
    { name: 'Male', value: genderDistribution['Male'] || 0 },
    { name: 'Female', value: genderDistribution['Female'] || 0 },
    { name: 'Other', value: genderDistribution['Other'] || 0 },
  ].filter(d => d.value > 0);

  const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted-foreground))"];

  const enrollmentByProgram = students.reduce((acc, student) => {
    student.enrollments.forEach(enrollment => {
      const programName = programs.find(p => p.id === enrollment.programId)?.name || 'Unknown';
      const shortName = programShortNames[programName] || programName;
      acc[shortName] = (acc[shortName] || 0) + 1;
    });
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
      <Card className="col-span-1 md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Student Population</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
           <div className="grid grid-cols-2 items-center gap-4">
             <div className="flex flex-col space-y-2">
                <p className="text-3xl font-bold">{totalStudents}</p>
                <p className="text-xs text-muted-foreground">Total students enrolled</p>
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
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Subjects Offered</CardTitle>
          <BookUser className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSubjects}</div>
          <p className="text-xs text-muted-foreground">
            Across all programs
          </p>
        </CardContent>
      </Card>
      <Card className="col-span-1 md:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Enrollment by Program</CardTitle>
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
