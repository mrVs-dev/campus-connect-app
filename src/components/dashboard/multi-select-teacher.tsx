
"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import type { Teacher } from "@/lib/types";

export function MultiSelectTeacher({ teachers, selected, onChange }: { teachers: Teacher[], selected: string[], onChange: (selected: string[]) => void }) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (teacherId: string) => {
    const newSelected = selected.includes(teacherId)
      ? selected.filter(id => id !== teacherId)
      : [...selected, teacherId];
    onChange(newSelected);
  };
  
  const selectedTeachers = teachers.filter(t => selected.includes(t.teacherId));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-auto">
          <div className="flex gap-1 flex-wrap">
            {selectedTeachers.length > 0 ? selectedTeachers.map(teacher => (
              <Badge key={teacher.teacherId} variant="secondary">
                {teacher.firstName} {teacher.lastName}
                <button
                  role="button"
                  tabIndex={0}
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelect(teacher.teacherId);
                    }
                  }}
                  onClick={(e) => { e.stopPropagation(); handleSelect(teacher.teacherId); }}
                  onMouseDown={(e) => e.preventDefault()} // Prevents popover from closing
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            )) : "Select teachers..."}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search teachers..." />
          <CommandList>
            <CommandEmpty>No teachers found.</CommandEmpty>
            <CommandGroup>
              {teachers.map(teacher => (
                <CommandItem
                  key={teacher.teacherId}
                  onSelect={() => handleSelect(teacher.teacherId)}
                >
                  <Checkbox className="mr-2" checked={selected.includes(teacher.teacherId)} />
                  {teacher.firstName} {teacher.lastName}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
