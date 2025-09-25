
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

interface StudentImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (students: Omit<Student, 'studentId' | 'avatarUrl'>[]) => void;
}

// Function to find a value in a row object with case-insensitive and flexible key matching
const findValue = (row: any, keys: string[]): string | undefined => {
    for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null) return String(row[key]);
    }
    // Try case-insensitive, space-insensitive, and underscore-insensitive matching
    const lowerCaseKeys = keys.map(k => k.toLowerCase().replace(/[\s_]/g, ''));
    for (const rowKey in row) {
        if (row[rowKey] !== undefined && row[rowKey] !== null) {
            const lowerCaseRowKey = rowKey.toLowerCase().replace(/[\s_]/g, '');
            if (lowerCaseKeys.includes(lowerCaseRowKey)) {
                return String(row[rowKey]);
            }
        }
    }
    return undefined;
};

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
          if (results.errors.length > 0) {
            throw new Error(`CSV Parsing Error: ${results.errors[0].message}`);
          }

          const parsedStudents = results.data.map((row: any) => {
            const dateOfBirthStr = findValue(row, ['dateOfBirth', 'Date of Birth', 'dob']);
            const dateOfBirth = dateOfBirthStr ? new Date(dateOfBirthStr) : undefined;
            
            const enrollmentDateStr = findValue(row, ['enrollmentDate', 'Enrollment Date']);
            const enrollmentDate = enrollmentDateStr ? new Date(enrollmentDateStr) : new Date();

            const guardians = [];
            const guardian1Name = findValue(row, ['guardian1_name', 'Guardian 1 Name']);
            if (guardian1Name) {
                guardians.push({
                    relation: findValue(row, ['guardian1_relation', 'Guardian 1 Relation']) || 'Guardian',
                    name: guardian1Name,
                    mobiles: findValue(row, ['guardian1_mobiles', 'Guardian 1 Mobiles'])?.split(',') || [],
                });
            }

            const guardian2Name = findValue(row, ['guardian2_name', 'Guardian 2 Name']);
            if (guardian2Name) {
                 guardians.push({
                    relation: findValue(row, ['guardian2_relation', 'Guardian 2 Relation']) || 'Guardian',
                    name: guardian2Name,
                    mobiles: findValue(row, ['guardian2_mobiles', 'Guardian 2 Mobiles'])?.split(',') || [],
                });
            }

            const student: Omit<Student, 'studentId' | 'avatarUrl'> = {
              firstName: findValue(row, ['firstName', 'First Name']) || '',
              middleName: findValue(row, ['middleName', 'Middle Name']) || '',
              lastName: findValue(row, ['lastName', 'Last Name']) || '',
              khmerFirstName: findValue(row, ['khmerFirstName', 'Khmer First Name']) || '',
              khmerLastName: findValue(row, ['khmerLastName', 'Khmer Last Name']) || '',
              sex: findValue(row, ['sex', 'Gender']) as 'Male' | 'Female' | 'Other' || 'Other',
              dateOfBirth: dateOfBirth && !isNaN(dateOfBirth.getTime()) ? dateOfBirth : undefined,
              enrollmentDate: enrollmentDate && !isNaN(enrollmentDate.getTime()) ? enrollmentDate : new Date(),
              placeOfBirth: findValue(row, ['placeOfBirth', 'Place of Birth']) || '',
              nationality: findValue(row, ['nationality']) || '',
              nationalId: findValue(row, ['nationalId', 'National ID']),
              status: 'Active',
              previousSchool: findValue(row, ['previousSchool', 'Previous School']),
              address: {
                village: findValue(row, ['address.village', 'village', 'Village']),
                commune: findValue(row, ['address.commune', 'commune', 'Commune']),
                district: findValue(row, ['address.district', 'district', 'District']),
                street: findValue(row, ['address.street', 'street', 'Street']),
                house: findValue(row, ['address.house', 'house', 'House No']),
              },
              guardians: guardians.length > 0 ? guardians : undefined,
              mediaConsent: findValue(row, ['mediaConsent', 'Media Consent'])?.toLowerCase() === 'true',
              emergencyContact: {
                name: findValue(row, ['emergencyContact.name', 'Emergency Contact Name']),
                phone: findValue(row, ['emergencyContact.phone', 'Emergency Contact Phone']),
              },
              enrollments: [
                {
                  programId: findValue(row, ['programId', 'Program']) || 'khmer-national',
                  level: findValue(row, ['level', 'Grade', 'Level']) || 'Grade 10',
                },
              ],
            };
            return student;
          });
          
          onImport(parsedStudents);

          toast({
            title: "Import Successful",
            description: `${results.data.length} student records are being processed.`,
          });
          onOpenChange(false);
          setFile(null);
        } catch (error: any) {
           toast({
            title: "Import Failed",
            description: error.message || "Please check the CSV file format and data.",
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
            <a href="/student_import_template.csv" download className="text-primary hover:underline ml-1">
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
