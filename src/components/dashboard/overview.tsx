
"use client";

import { BarChart, BookUser, Users } from "lucide-react";
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
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { students, subjects } from "@/lib/mock-data";
import { programs } from "@/lib/program-data";

const programShortNames: Record<string, string> = {
  'English International': 'English',
  'Khmer National': 'Khmer',
  'English as Second Language (ESL)': 'ESL',
  'Chinese as Second Language (CSL)': 'CSL',
};

export function Overview() {
  const totalStudents = students.length;
  const totalSubjects = subjects.length;

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
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalStudents}</div>
          <p className="text-xs text-muted-foreground">
            Enrolled in one or more programs
          </p>
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
      <Card className="col-span-1 md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Enrollment by Program</CardTitle>
          <BarChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <RechartsBarChart data={chartData} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={0}
              />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar dataKey="students" fill="var(--color-students)" radius={4} />
            </RechartsBarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
