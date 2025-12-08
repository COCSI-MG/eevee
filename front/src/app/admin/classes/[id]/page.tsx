"use client";

import React from "react";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClassesService } from "@/app/integration/scheduler-api/classes";
import { Class, UpsertClass } from "@/app/interface/scheduler-api/class";
import { Textarea } from "@/components/ui/textarea";
import UsersCard from "@/components/classes/users-card";
import { useFormik } from "formik";
import { SelectedUser } from "@/types/shared";
import { AxiosError } from "axios";
import * as Yup from "yup";

const classUpsertSchema = Yup.object().shape({
  id: Yup.number().optional(),
  name: Yup.string().required("Class name is required"),
  description: Yup.string(),
  students: Yup.array()
    .of(Yup.number())
    .required("At least one student must be selected"),
});

export default function ClassEditPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { id } = useParams<{
    id: string;
  }>();

  const isNewClass = id === "new";

  const { mutateAsync: upsertClasses } = useMutation({
    mutationKey: ["upsertClasses", id],
    onMutate: async (newClassData: UpsertClass) => {
      await queryClient.cancelQueries({ queryKey: ["admin-classes"] });

      const previousClasses: Class[] | undefined = queryClient.getQueryData([
        "admin-classes",
      ]);
      if (!previousClasses) {
        return { previousClasses: [] };
      }

      queryClient.setQueryData(["admin-classes"], (oldClasses: Class[]) => {
        if (isNewClass) {
          return [...(oldClasses || []), newClassData];
        } else {
          return (oldClasses || []).map((cls: Class) =>
            cls.id === Number(id) ? { ...cls, ...newClassData } : cls
          );
        }
      });

      return { previousClasses };
    },
    mutationFn: (classData: UpsertClass) => {
      if (!classData.id) {
        return ClassesService.create(classData);
      }
      return ClassesService.update(classData);
    },
    onSuccess: () => {
      toast({
        title: isNewClass ? "Class created" : "Class updated",
        description: `Successfully ${
          isNewClass ? "created" : "updated"
        } class ${formik.values.name}`,
        duration: 5000,
      });
      router.push("/admin/classes");
    },
    onError: (error: AxiosError) => {
      const res = error.response?.data as { message: string } | undefined;

      toast({
        title: "Error",
        description:
          res?.message ||
          `Failed to ${isNewClass ? "create" : "update"} class.`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
    },
  });

  const formik = useFormik<UpsertClass>({
    initialValues: {
      id: undefined,
      name: "",
      description: "",
      students: [] as number[],
    },
    validationSchema: classUpsertSchema,
    onSubmit: (values) => {
      if (values.students.length === 0) {
        formik.setFieldError(
          "students",
          "At least one student must be selected"
        );
        return;
      }

      upsertClasses(values);
    },
  });

  const [selectedUsers, setSelectedUsers] = useState<Array<SelectedUser>>([]);

  const classQuery = useQuery({
    queryKey: ["class", id],
    queryFn: async ({ queryKey }) => {
      const classData = await ClassesService.getOne(Number(queryKey[1]));
      if (classData) {
        const studentsSelected = classData.userClasses.map(
          (userClass) => userClass.userId
        );

        formik.setValues({
          id: classData.id,
          name: classData.name,
          description: classData.description || "",
          students: studentsSelected,
        });

        setSelectedUsers(
          classData.userClasses.map((userClass) => ({
            id: userClass.userId,
            name: userClass.user.name,
            email: userClass.user.email,
          }))
        );
      }
      return classData;
    },
    enabled: !isNewClass,
  });

  const onUsersSelectionChange = (students: Array<SelectedUser>) => {
    formik.setFieldValue(
      "students",
      students.map((student) => student.id)
    );
  };

  if (!isNewClass && classQuery.isFetching) {
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
          {isNewClass ? "Create Class" : "Edit Class"}
        </h1>
      </div>

      <form onSubmit={formik.handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {isNewClass ? "New Class Information" : "Class Information"}
              </CardTitle>
              <CardDescription>
                {isNewClass
                  ? "Add a new class to the system"
                  : "Update the class information"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Class Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  placeholder="Enter class name"
                  required
                />
                {formik.errors.name && (
                  <div className="text-red-500">{formik.errors.name}</div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Class Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  placeholder="Enter class description"
                />
                {formik.errors.description && (
                  <div className="text-red-500">
                    {formik.errors.description}
                  </div>
                )}
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
              {formik.errors.students && (
                <div className="text-red-500">No students selected.</div>
              )}

              <UsersCard
                selectedUsers={selectedUsers}
                setSelectedUsers={setSelectedUsers}
                onUsersSelectionChange={onUsersSelectionChange}
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
            {isNewClass ? "Create Class" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
