
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function TeacherDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Teacher Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Your Portal</CardTitle>
          <CardDescription>
            This area is under construction. Soon, you will be able to manage your class roster, enter grades, and track student behavior right from this dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="font-semibold">Upcoming Features:</h3>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>
                <strong>Class Roster & Attendance:</strong> View your assigned students and take daily attendance.
              </li>
              <li>
                <strong>Gradebook:</strong> Enter scores for assessments and view overall student performance in your subjects.
              </li>
              <li>
                <strong>Behavior Management:</strong> Log and track student incidents and positive behavior.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
