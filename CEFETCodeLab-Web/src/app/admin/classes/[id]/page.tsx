'use client';

import React from 'react';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, X, User, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ClassesService } from '@/app/integration/scheduler-api/classes';
import { UpsertClass } from '@/app/interface/scheduler-api/class';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { UsersService } from '@/app/integration/scheduler-api/user';
import { Textarea } from '@/components/ui/textarea';

export default function ClassEditPage() {
  const router = useRouter();
  const { id } = useParams<{
    id: string;
  }>();
  const isNewClass = id === 'new';

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    students: number[];
  }>({
    name: '',
    description: '',
    students: [],
  });

  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<
    {
      id: number;
      name: string;
      email: string;
    }[]
  >([]);
  const [filteredUsers, setFilteredUsers] = useState<
    {
      id: number;
      name: string;
      email: string;
    }[]
  >([]);

  const classQuery = useQuery({
    queryKey: ['class', id],
    queryFn: ({ queryKey }) => ClassesService.getOne(Number(queryKey[1])),
    enabled: !isNewClass,
  });

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: UsersService.getAllUsers,
  });

  const {
    mutateAsync: upsertClasses,
    isSuccess,
    data: upsertedClass,
  } = useMutation({
    mutationKey: ['upsertClasses', id],
    mutationFn: (newClass: UpsertClass) => {
      if (typeof newClass.id === 'undefined') {
        return ClassesService.create(newClass);
      }
      return ClassesService.update(newClass);
    },
  });

  useEffect(() => {
    if (isSuccess) {
      router.push('/admin/classes');
    }
  }, [upsertedClass, isSuccess, router]);

  useEffect(() => {
    if (!isNewClass && classQuery.isSuccess && classQuery.data) {
      setFormData({
        ...classQuery.data,
        students: classQuery.data.userClasses.map((userClass) => userClass.userId),
      });
      setSelectedStudents(
        classQuery.data.userClasses.map((userClass) => ({
          id: userClass.userId,
          name: userClass.user.name,
          email: userClass.user.email,
        }))
      );
    }
  }, [isNewClass, classQuery.isSuccess, classQuery.data]);

  useEffect(() => {
    if (usersQuery.isSuccess) {
      const filteredUsers = usersQuery.data.filter(
        (user) =>
          !user.isAdmin &&
          (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filteredUsers);
    }
  }, [searchTerm, usersQuery.data, usersQuery.isSuccess]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertClasses({
      id: isNewClass ? undefined : Number(id),
      ...formData,
    });
    toast({
      title: isNewClass ? 'Class created' : 'Class updated',
      description: `Successfully ${isNewClass ? 'created' : 'updated'} class ${
        formData.name
      }`,
    });
    router.push('/admin/classes');
  };

  const handleStudentSelect = (studentId: number) => {
    if (usersQuery.isSuccess) {
      const selectedStudent = usersQuery.data.find(
        (user) => user.id === studentId
      );
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

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {isNewClass ? 'Create Class' : 'Edit Class'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {isNewClass ? 'New Class Information' : 'Class Information'}
              </CardTitle>
              <CardDescription>
                {isNewClass
                  ? 'Add a new class to the system'
                  : 'Update the class information'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Class Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter class name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Class Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }));
                  }}
                  placeholder="Enter class description"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
              <CardDescription>
                Select students who will be enrolled in this class
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        {!usersQuery.isPending &&
                          usersQuery.isSuccess &&
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
                          setFormData((prev) => ({ ...prev, students: [] }));
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
                        Use the Add Students button to enroll students in this
                        class
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
                              <p className="text-sm font-medium">
                                {student.name}
                              </p>
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
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end mt-6">
          <Button
            variant="outline"
            type="button"
            onClick={() => router.back()}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button type="submit" variant="default">
            <Save className="h-4 w-4 mr-2" />
            {isNewClass ? 'Create Class' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
