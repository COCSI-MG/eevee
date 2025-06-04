'use client';

import React from 'react';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import StudentsCardContent from '@/components/classes/students-card-content';

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
  const [selectedStudents, setSelectedStudents] = useState<
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
      toast({
        title: isNewClass ? 'Class created' : 'Class updated',
        description: `Successfully ${
          isNewClass ? 'created' : 'updated'
        } class ${formData.name}`,
      });
      router.push('/admin/classes');
    }
  }, [upsertedClass, isSuccess, router, isNewClass, formData.name]);

  useEffect(() => {
    if (!isNewClass && classQuery.isSuccess && classQuery.data) {
      setFormData({
        ...classQuery.data,
        students: classQuery.data.userClasses.map(
          (userClass) => userClass.userId
        ),
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
  };

  if (!isNewClass && classQuery.isPending) {
    return <div>Loading...</div>;
  }

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
              <StudentsCardContent
                selectedStudents={selectedStudents}
                setSelectedStudents={setSelectedStudents}
                formData={formData}
                setFormData={setFormData}
              />
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
