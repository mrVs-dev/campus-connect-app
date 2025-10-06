
"use client";

import { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { programs } from "@/lib/program-data";

interface AdmissionImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: { studentId: string; schoolYear: string; programId: string; level: string; }[]) => void;
}

const findValue = (row: any, keys: string[]): string | undefined => {
    for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null) return String(row[key]);
    }
    const lowerCaseKeys = keys.map(k => k.toLowerCase().replace(/[\s_]/g, ''));
    for (const rowKey in row) {
        const lowerCaseRowKey = rowKey.toLowerCase().replace(/[\s_]/g, '');
        if (lowerCaseKeys.includes(lowerCaseRowKey)) {
            const value = row[rowKey];
            if (value !== undefined && value !== null) {
                return String(value);
            }
        }
    }
    return undefined;
};

export function AdmissionImportDialog({
  open,
  onOpenChange,
  onImport,
}: AdmissionImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (results.errors.length > 0) {
            throw new Error(`CSV Parsing Error: ${results.errors[0].message}`);
          }
          
          const requiredFields = ['studentId', 'schoolYear', 'programId', 'level'];
          const missingFields = requiredFields.filter(field => !results.meta.fields?.some(header => header.toLowerCase().replace(/[\s_]/g, '') === field.toLowerCase()));

          if (missingFields.length > 0) {
              throw new Error(`CSV is missing required columns: ${missingFields.join(', ')}.`);
          }

          const parsedData = results.data.map((row: any, index: number) => {
              const studentId = findValue(row, ['studentId', 'Student ID']);
              const schoolYear = findValue(row, ['schoolYear', 'School Year']);
              const programId = findValue(row, ['programId', 'Program ID']);
              const level = findValue(row, ['level', 'Level']);

              if (!studentId || !schoolYear || !programId || !level) {
                  throw new Error(`Row ${index + 2}: Missing one or more required values (studentId, schoolYear, programId, level).`);
              }
              
              if (!programs.find(p => p.id === programId)) {
                  throw new Error(`Row ${index + 2}: Invalid programId "${programId}".`);
              }

              return { studentId, schoolYear, programId, level };
          });

          onImport(parsedData);
          onOpenChange(false);
          setFile(null);

        } catch (error: any) {
          toast({
            title: "Import Failed",
            description: error.message,
            variant: "destructive",
          });
        } finally {
          setIsImporting(false);
        }
      },
      error: (error) => {
        toast({
          title: "Import Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsImporting(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Admissions</DialogTitle>
          <DialogDescription>
            Upload a CSV file with admission data. Each row represents one program enrollment for a student.
            <a href="/admission_import_template.csv" download className="text-primary hover:underline ml-1">
              Download Template
            </a>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="csv-file" className="text-right">
              CSV File
            </Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file || isImporting}>
            {isImporting ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
