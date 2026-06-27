"use client";

import type React from "react";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { UsersService } from "@/app/integration/scheduler-api/user";
import { UpsertUser } from "@/app/interface/scheduler-api/user";
import * as Yup from "yup";
import { useFormik } from "formik";
import QueryErrorState from "@/components/admin/query-error-state";

const usersUpsertSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters"),
  isAdmin: Yup.boolean().required(),
});

export default function UserEditPage() {
  const router = useRouter();
  const { id } = useParams<{
    id: string;
  }>();
  const isNewUser = id === "new";

  const {
    mutateAsync: upsertUser,
  } = useMutation({
    mutationKey: ["adminUsers", id],
    mutationFn: (user: UpsertUser) => {
      if (isNewUser) {
        return UsersService.upsertUser(user);
      }
      return UsersService.upsertUser({ ...user, id: Number(id) });
    },
    onSuccess: () => {
      toast({
        title: isNewUser ? "User created" : "User updated",
        description: `Successfully ${isNewUser ? "created" : "updated"} user ${
          formik.values.name
        }`,
        duration: 5000,
      });
      router.push("/admin/users");
    },
    onError: (error: unknown) => {
      const axiosError = error instanceof AxiosError ? error : null;
      const isConflict = axiosError?.response?.status === 409;
      const responseMessage = (axiosError?.response?.data as { message?: string } | undefined)?.message;
      toast({
        title: "Failed to save user",
        description: isConflict
          ? "A user with this email already exists."
          : (responseMessage ?? (error instanceof Error ? error.message : "Unable to save the user. Please try again.")),
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      isAdmin: false,
    },
    validationSchema: usersUpsertSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      if (!values.password && isNewUser) {
        formik.setFieldError("password", "Password is required");
        return;
      }

      const userData: UpsertUser = {
        ...values,
        id: isNewUser ? 0 : Number(id),
        passwordHash: values.password,
      };
      upsertUser(userData);
    },
  });

  const {
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["adminUsers", id],
    enabled: !isNewUser,
    queryFn: async ({ queryKey }) => {
      const user = await UsersService.getUserById(Number(queryKey[1]));
      if (!user) {
        throw new Error("Não foi possível carregar o usuário.");
      }

      formik.setValues({
        name: user.name,
        email: user.email,
        password: "",
        isAdmin: user.isAdmin,
      });

      return user;
    },
  });

  const header = (
    <div className="flex items-center">
      <Button variant="ghost" onClick={() => router.back()} className="mr-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      <h1 className="text-3xl font-bold tracking-tight">
        {isNewUser ? "Create User" : "Edit User"}
      </h1>
    </div>
  );

  if (!isNewUser && isError) {
    return (
      <div className="space-y-6">
        {header}
        <QueryErrorState
          title="Não foi possível carregar o usuário"
          description="Os dados deste usuário não puderam ser carregados. Tente novamente."
          onRetry={() => {
            void refetch();
          }}
          retryLabel="Tentar novamente"
          isRetrying={isFetching}
        />
      </div>
    );
  }

  if (!isNewUser && isFetching) {
    return (
      <div className="space-y-6">
        {header}
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      <form onSubmit={formik.handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>
              {isNewUser ? "New User Information" : "User Information"}
            </CardTitle>
            <CardDescription>
              {isNewUser
                ? "Add a new user to the system"
                : "Update the user's information"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...formik.getFieldProps("name")}
                placeholder="Enter user name"
              />
              {formik.errors.name && formik.touched.name && (
                <p className="text-red-500 text-sm">{formik.errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...formik.getFieldProps("email")}
                placeholder="Enter email address"
              />
              {formik.errors.email && formik.touched.email && (
                <p className="text-red-500 text-sm">{formik.errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...formik.getFieldProps("password")}
                placeholder="Enter password"
                minLength={8}
              />
              {formik.errors.password && formik.touched.password && (
                <p className="text-red-500 text-sm">{formik.errors.password}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAdmin"
                checked={formik.values.isAdmin}
                onCheckedChange={(checked) =>
                  formik.setFieldValue("isAdmin", checked)
                }
              />
              <Label htmlFor="isAdmin">Administrator</Label>
            </div>
            {formik.errors.isAdmin && formik.touched.isAdmin && (
              <p className="text-red-500 text-sm">{formik.errors.isAdmin}</p>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              {isNewUser ? "Create User" : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
