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
import { UsersService } from "@/app/integration/scheduler-api/user";
import {
  CreateUserRequest,
  UpdateUserRequest,
} from "@/app/interface/scheduler-api/user";
import * as Yup from "yup";
import { useFormik } from "formik";
import QueryErrorState from "@/components/shared/query-error-state";
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_LENGTH_MESSAGE,
} from "@/app/admin/users/constants";

export interface UserFormValues {
  name: string;
  email: string;
  password: string;
  isAdmin: boolean;
}

const buildUsersSchema = (isNewUser: boolean) =>
  Yup.object().shape({
    name: Yup.string().required("Nome é obrigatório"),
    email: Yup.string()
      .email("E-mail inválido")
      .required("E-mail é obrigatório"),
    password: isNewUser

      ? Yup.string()
          .min(PASSWORD_MIN_LENGTH, PASSWORD_MIN_LENGTH_MESSAGE)
          .required("Senha é obrigatória")

      : Yup.string().test(
          "optional-password-length",
          PASSWORD_MIN_LENGTH_MESSAGE,
          (password) =>
            !password || password.length >= PASSWORD_MIN_LENGTH,
        ),
    isAdmin: Yup.boolean().required(),
  });

export default function UserEditPage() {
  const router = useRouter();
  const { id } = useParams<{
    id: string;
  }>();
  const isNewUser = id === "new";

  const {
    mutateAsync: saveUser,
  } = useMutation({
    mutationKey: ["adminUsers", id],
    mutationFn: (values: UserFormValues) => {
      const userData = {
        name: values.name,
        email: values.email,
        isAdmin: values.isAdmin,
      };

      if (isNewUser) {
        const createUserRequest: CreateUserRequest = {
          ...userData,
          password: values.password,
        };
        return UsersService.createUser(createUserRequest);
      }

      const updateUserRequest: UpdateUserRequest = {
        ...userData,
        ...(values.password ? { password: values.password } : {}),
      };

      return UsersService.updateUser(Number(id), updateUserRequest);
    },
    onSuccess: () => {
      toast({
        title: isNewUser ? "Usuário criado" : "Usuário atualizado",
        description: `Usuário ${formik.values.name} ${isNewUser ? "criado" : "atualizado"} com sucesso`,
        duration: 5000,
      });
      router.push("/admin/users");
    },
  });

  const formik = useFormik<UserFormValues>({
    initialValues: {
      name: "",
      email: "",
      password: "",
      isAdmin: false,
    },
    validationSchema: buildUsersSchema(isNewUser),
    enableReinitialize: true,
    onSubmit: async (values) => {
      await saveUser(values);
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
        Voltar
      </Button>
      <h1 className="text-3xl font-bold tracking-tight">
        {isNewUser ? "Criar Usuário" : "Editar Usuário"}
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
        <div>Carregando...</div>
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
              {isNewUser ? "Informações do Novo Usuário" : "Informações do Usuário"}
            </CardTitle>
            <CardDescription>
              {isNewUser
                ? "Adicione um novo usuário ao sistema"
                : "Atualize as informações do usuário"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                {...formik.getFieldProps("name")}
                placeholder="Insira o nome do usuário"
              />
              {formik.errors.name && formik.touched.name && (
                <p className="text-red-500 text-sm">{formik.errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                {...formik.getFieldProps("email")}
                placeholder="Insira o endereço de e-mail"
              />
              {formik.errors.email && formik.touched.email && (
                <p className="text-red-500 text-sm">{formik.errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                {...formik.getFieldProps("password")}
                placeholder={
                  isNewUser
                    ? "Insira a senha"
                    : "Deixe em branco para manter a senha atual"
                }
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
              <Label htmlFor="isAdmin">Administrador</Label>
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
              Cancelar
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              {isNewUser ? "Criar Usuário" : "Salvar Alterações"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
