"use client";

import { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Loader2Icon } from "lucide-react";
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ExamService } from "@/app/integration/scheduler-api/exam";
import {
  CreateExamRequest,
  Exam,
  UpdateExamRequest,
} from "@/app/interface/scheduler-api/exam";

const createExamSchema = Yup.object().shape({
  title: Yup.string()
    .trim()
    .required("Título é obrigatório")
    .max(100, "Título deve ter no máximo 100 caracteres"),
  description: Yup.string()
    .max(255, "Descrição deve ter no máximo 255 caracteres")
    .optional(),
  dueDate: Yup.string().optional(),
});

function isoToLocalDatetime(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface ExamFormDialogProps {
  open: boolean;
  classId: number;
  mode: "create" | "edit";
  exam?: Exam;
  onOpenChange: (open: boolean) => void;
}

export default function ExamFormDialog({
  open,
  classId,
  mode,
  exam,
  onOpenChange,
}: ExamFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = mode === "edit";

  const { mutateAsync: upsertExam, isPending } = useMutation({
    mutationFn: (data: CreateExamRequest | UpdateExamRequest) =>
      isEdit ? ExamService.update(exam!.id, data as UpdateExamRequest) : ExamService.create(data as CreateExamRequest),
    onSuccess: () => {
      toast({
        title: isEdit ? "Prova atualizada" : "Prova criada",
        description: isEdit
          ? "A prova foi atualizada com sucesso."
          : "A prova foi criada com sucesso.",
        duration: 4000,
      });
      queryClient.invalidateQueries({
        queryKey: ["paginatedExams", classId],
      });
      onOpenChange(false);
    },
    onError: (err: AxiosError) => {
      const res = err.response?.data as { message: string };
      toast({
        title: isEdit
          ? "Não foi possível atualizar a prova"
          : "Não foi possível criar a prova",
        description: res?.message || "Tente novamente mais tarde.",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const getInitialValues = () => ({
    title: isEdit && exam ? exam.title : "",
    description: isEdit && exam ? (exam.description ?? "") : "",
    dueDate: isEdit ? isoToLocalDatetime(exam?.dueDate) : "",
  });

  const formik = useFormik({
    initialValues: getInitialValues(),
    validationSchema: createExamSchema,
    onSubmit: (values) => {
      if (isEdit) {
        const payload: UpdateExamRequest = {
          title: values.title.trim(),
          description: values.description?.trim() || undefined,
          dueDate: values.dueDate
            ? new Date(values.dueDate).toISOString()
            : undefined,
        };
        void upsertExam(payload);
      } else {
        const payload: CreateExamRequest = {
          title: values.title.trim(),
          description: values.description?.trim() || undefined,
          dueDate: values.dueDate
            ? new Date(values.dueDate).toISOString()
            : undefined,
          classId,
        };
        void upsertExam(payload);
      }
    },
  });

  useEffect(() => {
    formik.resetForm({ values: getInitialValues() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, exam?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar prova" : "Nova prova"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize os dados desta prova."
              : "Crie uma nova prova para esta turma."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={formik.handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              name="title"
              value={formik.values.title}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Ex: Prova final SQL"
            />
            {formik.touched.title && formik.errors.title && (
              <p className="text-sm text-red-500">{formik.errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Ex: Capítulos 1 a 5 do livro"
            />
            {formik.touched.description && formik.errors.description && (
              <p className="text-sm text-red-500">
                {formik.errors.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Data de vencimento</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="datetime-local"
              value={formik.values.dueDate}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            <p className="text-xs text-muted-foreground">
              Opcional. Prazo final para a prova.
            </p>
            {formik.touched.dueDate && formik.errors.dueDate && (
              <p className="text-sm text-red-500">{formik.errors.dueDate}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && (
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
              )}
              {isPending
                ? isEdit
                  ? "Salvando…"
                  : "Criando…"
                : isEdit
                  ? "Salvar alterações"
                  : "Criar prova"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
