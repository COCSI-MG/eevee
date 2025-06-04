'use client';

import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '../ui/command';
import { Plus, Check, User, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { useEffect, useState } from 'react';
import { useUsers } from '@/hooks/use-users';

interface StudentsCardContentProps {
  selectedStudents: {
    id: number;
    name: string;
    email: string;
  }[];
  setSelectedStudents: React.Dispatch<
    React.SetStateAction<
      {
        id: number;
        name: string;
        email: string;
      }[]
    >
  >;
  formData: {
    name: string;
    description: string;
    students: number[];
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      description: string;
      students: number[];
    }>
  >;
}

export default function StudentsCardContent({
  selectedStudents,
  setSelectedStudents,
  formData,
  setFormData,
}: StudentsCardContentProps) {
  const { data: users, isPending: isUsersLoading, isSuccess } = useUsers();
  const [filteredUsers, setFilteredUsers] = useState<
    {
      id: number;
      name: string;
      email: string;
    }[]
  >([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isSuccess && users) {
      const filteredUsers = users.filter(
        (user) =>
          !user.isAdmin &&
          (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filteredUsers);
    }
  }, [isSuccess, searchTerm, users]);

  const handleStudentSelect = (studentId: number) => {
    if (isSuccess) {
      const selectedStudent = users.find((user) => user.id === studentId);
      if (selectedStudent) {
        setSelectedStudents((prev) => [...prev, selectedStudent]);
        setFormData((prev) => ({
          ...prev,
          students: [...prev.students, studentId],
        }));
        setOpen(false);
      }
    }
  };

  const handleRemoveStudent = (id: number) => {
    setSelectedStudents((prev) => prev.filter((student) => student.id !== id));
    setFormData((prev) => ({
      ...prev,
      students: prev.students.filter((studentId) => studentId !== id),
    }));
  };

  if (isUsersLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Loading students...</p>
      </div>
    );
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            <Plus className="mr-2 h-4 w-4" />
            Add Students
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 w-[300px]"
          align="start"
          side="bottom"
          sideOffset={8}
        >
          <Command>
            <CommandInput
              placeholder="Search students..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>No students found.</CommandEmpty>
              <CommandGroup>
                {isSuccess &&
                  filteredUsers.map((user) => (
                    <CommandItem
                      key={user.id}
                      onSelect={() => handleStudentSelect(user.id)}
                      className="flex items-center gap-2 p-2"
                    >
                      <div
                        className={
                          formData.students.includes(user.id)
                            ? 'opacity-100'
                            : 'opacity-0'
                        }
                      >
                        <Check className="h-4 w-4" />
                      </div>
                      <div className="ml-2">
                        <p className="text-sm font-medium leading-none">
                          {user.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="border rounded-md">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              Selected Students ({selectedStudents.length})
            </h3>
            {selectedStudents.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedStudents([]);
                  setFormData((prev) => ({
                    ...prev,
                    students: [],
                  }));
                }}
                className="h-8 px-2 text-xs"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-[250px]">
          {selectedStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
              <User className="h-10 w-10 text-muted-foreground mb-2 opacity-20" />
              <p className="text-sm text-muted-foreground">
                No students selected
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Use the Add Students button to enroll students in this class
              </p>
            </div>
          ) : (
            <div className="p-2">
              {selectedStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md"
                >
                  <div className="flex items-center">
                    <div className="ml-2">
                      <p className="text-sm font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRemoveStudent(student.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </>
  );
}
