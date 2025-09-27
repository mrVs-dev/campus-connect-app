
"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getStudents, getAdmissions } from "@/lib/firebase/firestore";
import type { Student, Admission } from "@/lib/types";
import { programs } from "@/lib/program-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function RosterPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { classId } = params;

  const [roster, setRoster] = React.useState<Student[]>([]);
  const [classInfo, setClassInfo] = React.useState<{ programName: string; level: string } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  React.useEffect(() => {
    if (user && typeof classId === 'string') {
      const fetchData = async () => {
        try {
          setLoading(true);
          const [schoolYear, programId, ...levelParts] = classId.replace(/-/g, ' ').split('_');
          const level = levelParts.join('_').replace(/ /g, ' ');

          if (!schoolYear || !programId || !level) {
            setError("Invalid class information provided.");
            return;
          }

          const programName = programs.find(p => p.id === programId)?.name || "Unknown Program";
          setClassInfo({ programName, level });

          const [allStudents, admissions] = await Promise.all([getStudents(), getAdmissions()]);
          
          const admission = admissions.find(a => a.schoolYear === schoolYear);
          if (!admission) {
            setError("Could not find admission data for this school year.");
            return;
          }

          const studentIdsInClass = new Set<string>();
          admission.students.forEach(studentAdmission => {
            if (studentAdmission.enrollments.some(e => e.programId === programId && e.level === level)) {
              studentIdsInClass.add(studentAdmission.studentId);
            }
          });
          
          const classRoster = allStudents.filter(s => studentIdsInClass.has(s.studentId));
          setRoster(classRoster);

        } catch (err) {
          console.error("Failed to fetch roster data:", err);
          setError("Could not load the class roster. Please try again later.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user, classId, router]);

  const filteredRoster = React.useMemo(() => {
    if (!searchQuery) {
      return roster;
    }
    return roster.filter(student =>
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [roster, searchQuery]);

  if (authLoading || loading) {
    return <div className="flex items-center justify-center h-full">Loading class roster...</div>;
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
       <div className="mb-6">
        <Button variant="outline" size="sm" onClick={() => router.push('/teacher/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Class Roster</CardTitle>
              <CardDescription>
                {classInfo?.programName} - {classInfo?.level} ({roster.length} students)
              </CardDescription>
            </div>
             <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search students in roster..."
                  className="w-full pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Student ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoster.map(student => (
                <TableRow key={student.studentId}>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={student.avatarUrl} alt={student.firstName} className="object-cover" />
                        <AvatarFallback>
                          {(student.firstName || ' ')[0]}{(student.lastName || ' ')[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium">
                        {student.firstName} {student.lastName}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{student.studentId}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
