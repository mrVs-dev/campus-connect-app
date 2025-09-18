"use client";

import { useState, useEffect } from "react";
import { Lightbulb } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getStudentSummary } from "@/app/actions";

interface AiSummaryProps {
  studentId: string;
  grades: Record<string, number>;
}

export function AiSummary({ studentId, grades }: AiSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSummary() {
      setIsLoading(true);
      setError(null);
      const result = await getStudentSummary({ studentId, grades });
      if (result.error) {
        setError(result.error);
      } else {
        setSummary(result.summary);
      }
      setIsLoading(false);
    }

    fetchSummary();
  }, [studentId, grades]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[80%]" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex items-start space-x-3">
      <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
      <p className="text-sm text-foreground/80">{summary}</p>
    </div>
  );
}
