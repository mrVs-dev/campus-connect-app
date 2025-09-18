
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
import { toast } from "@/hooks/use-toast";
import type { Student } from "@/lib/types";
import { programs } from "@/lib/program-data";

interface StudentImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (students: Omit<Student, 'studentId' | 'avatarUrl'>[]) => void;
}

export function StudentImportDialog({
  open,
  onOpenChange,
  onImport,
}: StudentImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

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
          const parsedStudents = results.data.map((row: any) => {
            // Basic validation and type conversion
            const enrollments = [];
            if (row.programId && row.level) {
              enrollments.push({ programId: row.programId, level: row.level });
            }

            return {
              firstName: row.firstName || '',
              lastName: row.lastName || '',
              khmerFirstName: row.khmerFirstName || '',
              khmerLastName: row.khmerLastName || '',
              sex: ['Male', 'Female', 'Other'].includes(row.sex) ? row.sex : 'Other',
              dateOfBirth: new Date(row.dateOfBirth) || new Date(),
              placeOfBirth: row.placeOfBirth || '',
              nationality: row.nationality || '',
              nationalId: row.nationalId || undefined,
              status: ['Active', 'Inactive', 'Graduated'].includes(row.status) ? row.status : 'Active',
              address: {
                village: row['address.village'] || '',
                commune: row['address.commune'] || '',
                district: row['address.district'] || '',
              },
              // For simplicity, we'll create a single guardian from the CSV
              guardians: [
                {
                  relation: row['guardian.relation'] || 'Guardian',
                  name: row['guardian.name'] || '',
                  occupation: row['guardian.occupation'] || '',
                  workplace: row['guardian.workplace'] || '',
                  mobiles: row['guardian.mobiles'] ? row['guardian.mobiles'].split(',') : [],
                },
              ],
              mediaConsent: row.mediaConsent === 'true' || row.mediaConsent === true,
              emergencyContact: {
                name: row['emergencyContact.name'] || '',
                phone: row['emergencyContact.phone'] || '',
              },
              enrollments: enrollments.length > 0 ? enrollments : [{programId: 'khmer-national', level: 'Grade 10'}], // Default enrollment
            };
          }) as Omit<Student, 'studentId' | 'avatarUrl'>[];
          
          onImport(parsedStudents);

          toast({
            title: "Import Successful",
            description: `${results.data.length} students were imported successfully.`,
          });
          onOpenChange(false);
          setFile(null);
        } catch (error) {
           toast({
            title: "Import Failed",
            description: "Please check the CSV file format and data.",
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
          <DialogTitle>Import Students</DialogTitle>
          <DialogDescription>
            Upload a CSV file with student data. Make sure the file has a
            header row with column names matching the student fields.
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
