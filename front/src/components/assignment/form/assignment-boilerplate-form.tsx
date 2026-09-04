import { WorkerExibitionMap } from "@/app/admin/assignments/constants";
import { WorkerType } from "@/app/interface/scheduler-api/worker";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorMessage } from "formik";
import { FileText } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { getWorkerLanguageConfig } from "@/lib/monaco/worker-editor-config";
import { MonacoCodeEditor } from "@/components/editor/monaco-code-editor";

export interface AssignmentBoilerplateFormProps {
  values: Partial<Assignment>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setFieldValue: (field: string, value: any) => void;
}

export const AssignmentBoilerplateForm: React.FC<
  AssignmentBoilerplateFormProps
> = ({ values, setFieldValue }) => {
  const langConfig = getWorkerLanguageConfig(values.workerType);

  return (
    <Card className="bg-card border-border max-h-[600px]">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Código Boilerplate <Tooltip message="Código que será fornecido ao aluno no início do trabalho para ser usado como base para o desenvolvimento dos exercícios." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <span className="text-sm text-muted-foreground mb-2 block">
          Forneça o código que será entregue ao aluno no início do trabalho.
          Certifique-se de que o código esteja alinhado com o tipo de worker
          selecionado. Segue um exemplo de código boilerplate para o tipo de
          worker &quot;
          {WorkerExibitionMap[values.workerType as WorkerType]}
          &quot;:
        </span>
        <MonacoCodeEditor
          preset="form-field"
          path={`boilerplate${langConfig.fileExtension}`}
          height={400}
          workerType={values.workerType}
          value={values.boilerplate ?? ""}
          onChange={(value) => setFieldValue("boilerplate", value)}
        />
        <ErrorMessage
          name="boilerplate"
          component="div"
          className="text-destructive text-sm"
        />
      </CardContent>
    </Card>
  );
};
