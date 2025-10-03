
"use client";

import * as React from "react";
import type { InventoryItem } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface InventoryListProps {
  inventoryItems: InventoryItem[];
}

export function InventoryList({ inventoryItems }: InventoryListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Management</CardTitle>
        <CardDescription>
          Track and manage school supplies like books, uniforms, and stationery.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          Inventory management functionality is coming soon.
        </div>
      </CardContent>
    </Card>
  );
}
