import { WorkerExibitionMap } from "@/app/admin/assignments/constants";
import { Class } from "@/app/interface/scheduler-api/class";
import { WorkerType } from "@/app/interface/scheduler-api/worker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ExpandableDialog,
  ExpandableTrigger,
  useExpandable,
} from "@/components/ui/expandable";
import { Label } from "@/components/ui/label";
import { Tooltip } from "@/components/ui/tooltip";
import { ErrorMessage, Field, useField } from "formik";

export interface AssignmentConfigFormProps {
  classes: Class[];
}

const AnswerKeyVisibilityControl = () => {
  const [field, , helpers] = useField<boolean>("answerKeyVisible");
  const isVisible = Boolean(field.value);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2">
        <Label htmlFor="answerKeyVisible" className="block text-sm font-medium">
          Visibilidade do gabarito{" "}
          <Tooltip message="Deixe ativado quando desejar que os alunos visualizem o gabarito." />
        </Label>
        <Button
          id="answerKeyVisible"
          type="button"
          role="switch"
          aria-checked={isVisible}
          onClick={() => void helpers.setValue(!isVisible)}
          variant="outline"
        >
          {isVisible ? "Ativado" : "Desativado"}
        </Button>
      </div>
    </div>
  );
};

export const AssignmentConfigForm: React.FC<AssignmentConfigFormProps> = ({
  classes,
}) => {
  const descriptionExpandable = useExpandable();

  return (
    <>
      <Card className="bg-card border-border max-h-[700px]">
        <CardHeader>
          <CardTitle className="text-foreground">Informacoes da Atividade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-foreground">
              Titulo
            </Label>
            <Field
              type="text"
              name="title"
              className="w-full p-2 bg-primary/20 border border-border rounded-md text-foreground"
              placeholder="Titulo da Atividade"
            />
            <ErrorMessage
              name="title"
              component="div"
              className="text-destructive text-sm"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description" className="text-foreground">
                Descricao
              </Label>
              <ExpandableTrigger
                onClick={descriptionExpandable.open}
                label="Expandir"
              />
            </div>
            <Field
              as="textarea"
              name="description"
              className="w-full p-2 bg-primary/20 border border-border rounded-md text-foreground"
              placeholder="Descreva o que os alunos devem fazer"
            />
            <ErrorMessage
              name="description"
              component="div"
              className="text-destructive text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="classId" className="block text-sm font-medium">
              Disciplina do Trabalho
            </Label>
            <Field
              as="select"
              name="classId"
              className="mt-1 block w-full px-3 py-2 border text-muted-foreground border-border rounded-md shadow-sm sm:text-sm"
            >
              <option value="">Selecione uma turma</option>
              {classes?.map((classRecord) => (
                <option key={classRecord.id} value={classRecord.id}>
                  {classRecord.name}
                </option>
              ))}
            </Field>
            <ErrorMessage
              name="classId"
              component="div"
              className="text-destructive text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workerType" className="block text-sm font-medium">
              Tipo de Worker{" "}
              <Tooltip message="Kit de ferramentas para corrigir os exercicios." />
            </Label>
            <p className="block text-sm font-medium">
              Selecione o tipo de worker que sera utilizado para corrigir os
              exercicios dos alunos.
            </p>
            <Field
              as="select"
              id="workerType"
              name="workerType"
              className="mt-1 block w-full px-3 py-2 border text-muted-foreground border-border rounded-md shadow-sm sm:text-sm"
            >
              {Object.entries(WorkerType).map(([key, value]) => (
                <option key={key} value={value}>
                  {WorkerExibitionMap[value]}
                </option>
              ))}
            </Field>
            <ErrorMessage
              name="workerType"
              component="div"
              className="text-destructive text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxAttempts" className="block text-sm font-medium">
              Maximo de Tentativas{" "}
              <Tooltip message="Quantidade de tentativas para realizar a tarefa." />
            </Label>
            <Field
              type="number"
              name="maxAttempts"
              className="w-full p-2 bg-primary/20 border border-border rounded-md text-foreground"
              placeholder="Numero maximo de tentativas permitidas"
            />
            <ErrorMessage
              name="maxAttempts"
              component="div"
              className="text-destructive text-sm"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="block text-sm font-medium">
                Data de início
              </Label>
              <Field
                id="startDate"
                type="datetime-local"
                name="startDate"
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
              />
              <p className="text-xs text-slate-400">
                Opcional. A tarefa será exibida aos alunos a partir desta data.
              </p>
              <ErrorMessage
                name="startDate"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate" className="block text-sm font-medium">
                Data de entrega
              </Label>
              <Field
                id="dueDate"
                type="datetime-local"
                name="dueDate"
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
              />
              <p className="text-xs text-slate-400">
                Opcional. Novas entregas serão bloqueadas após esta data.
              </p>
              <ErrorMessage
                name="dueDate"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>
          </div>

          <AnswerKeyVisibilityControl />
        </CardContent>
      </Card>

      <ExpandableDialog
        open={descriptionExpandable.isOpen}
        onOpenChange={descriptionExpandable.setIsOpen}
        title="Descricao"
        minimizeLabel="Minimizar"
        contentClassName="flex flex-col"
      >
        <Field
          as="textarea"
          name="description"
          autoFocus
          className="flex-1 w-full p-3 bg-primary/20 border border-border rounded-md text-foreground resize-none"
          placeholder="Descreva o que os alunos devem fazer"
        />
        <ErrorMessage
          name="description"
          component="div"
          className="text-destructive text-sm mt-2"
        />
      </ExpandableDialog>
    </>
  );
};
