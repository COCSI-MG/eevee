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
import QueryErrorState from "@/components/shared/query-error-state";

const classUpsertSchema = Yup.object().shape({
  id: Yup.number().optional(),
  name: Yup.string().trim().required("Nome da turma é obrigatório"),
  description: Yup.string(),
  students: Yup.array()
    .of(Yup.number())
    .min(1, "Pelo menos um aluno deve ser selecionado")
    .required("Pelo menos um aluno deve ser selecionado"),
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
        title: isNewClass ? "Turma criada" : "Turma atualizada",
        description: `Turma ${formik.values.name} ${isNewClass ? "criada" : "atualizada"} com sucesso`,
        duration: 5000,
      });
      router.push("/admin/classes");
    },
    onError: (error: AxiosError) => {
      const res = error.response?.data as { message: string } | undefined;

      toast({
        title: "Erro",
        description:
          res?.message ||
          `Falha ao ${isNewClass ? "criar" : "atualizar"} turma.`,
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
          "Pelo menos um aluno deve ser selecionado"
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
      if (!classData) {
        throw new Error("Não foi possível carregar a turma.");
      }

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

  const header = (
    <div className="flex items-center">
      <Button variant="ghost" onClick={() => router.back()} className="mr-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>
      <h1 className="text-3xl font-bold tracking-tight">
        {isNewClass ? "Criar Turma" : "Editar Turma"}
      </h1>
    </div>
  );

  if (!isNewClass && classQuery.isError) {
    return (
      <div className="space-y-6">
        {header}
        <QueryErrorState
          title="Não foi possível carregar a turma"
          description="Os dados desta turma não puderam ser carregados. Tente novamente."
          onRetry={() => {
            void classQuery.refetch();
          }}
          retryLabel="Tentar novamente"
          isRetrying={classQuery.isFetching}
        />
      </div>
    );
  }

  if (!isNewClass && classQuery.isFetching) {
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
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {isNewClass ? "Informações da Nova Turma" : "Informações da Turma"}
              </CardTitle>
              <CardDescription>
                {isNewClass
                  ? "Adicione uma nova turma ao sistema"
                  : "Atualize as informações da turma"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Turma</Label>
                <Input
                  id="name"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  placeholder="Insira o nome da turma"
                />
                {formik.errors.name && (
                  <div className="text-destructive">{formik.errors.name}</div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição da Turma</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={5}
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  placeholder="Insira a descrição da turma"
                />
                {formik.errors.description && (
                  <div className="text-destructive">
                    {formik.errors.description}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alunos</CardTitle>
              <CardDescription>
                Selecione os alunos que serão matriculados nesta turma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formik.errors.students && (
                <div className="text-destructive">Nenhum aluno selecionado.</div>
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
            Cancelar
          </Button>
          <Button type="submit" variant="default">
            <Save className="h-4 w-4 mr-2" />
            {isNewClass ? "Criar Turma" : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
}
