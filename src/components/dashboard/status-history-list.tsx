
"use client";

import * as React from "react";
import type { StudentStatusHistory } from "@/lib/types";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowUpDown } from "lucide-react";
import { Button } from "../ui/button";

type SortableKey = 'studentName' | 'changeDate' | 'newStatus';

export function StatusHistoryList({ history }: { history: StudentStatusHistory[] }) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortConfig, setSortConfig] = React.useState<{ key: SortableKey; direction: 'asc' | 'desc' } | null>(null);

  const filteredHistory = React.useMemo(() => {
    if (!searchQuery) {
      return history;
    }
    return history.filter(item =>
      item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [history, searchQuery]);
  
  const sortedHistory = React.useMemo(() => {
    let sortableItems = [...filteredHistory];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredHistory, sortConfig]);

  const requestSort = (key: SortableKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Student Status Change History</CardTitle>
                <CardDescription>
                    A log of all student status updates.
                </CardDescription>
            </div>
            <Input
                placeholder="Search by name or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
            />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                 <Button variant="ghost" onClick={() => requestSort('studentName')}>
                    Student
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
              </TableHead>
              <TableHead>Change</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Changed By</TableHead>
              <TableHead>
                  <Button variant="ghost" onClick={() => requestSort('changeDate')}>
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedHistory.map((item) => (
              <TableRow key={item.historyId}>
                <TableCell className="font-medium">{item.studentName}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{item.previousStatus}</Badge>
                    <span>→</span>
                    <Badge variant={item.newStatus === 'Active' ? 'default' : 'destructive'}>{item.newStatus}</Badge>
                  </div>
                </TableCell>
                <TableCell>{item.reason}</TableCell>
                <TableCell>{item.changedBy?.displayName || item.changedBy?.email || 'System'}</TableCell>
                <TableCell>{format(new Date(item.changeDate), "PPp")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
