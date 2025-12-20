import { WorkerExibitionMap } from "@/app/admin/assignments/constants";
import { WorkerType } from "@/app/interface/scheduler-api/worker";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorMessage } from "formik";
import { FileText } from "lucide-react";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export interface AssignmentBoilerplateFormProps {
  values: Partial<Assignment>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setFieldValue: (field: string, value: any) => void;
}

export const AssignmentBoilerplateForm: React.FC<
  AssignmentBoilerplateFormProps
> = ({ values, setFieldValue }) => {
  return (
    <Card className="bg-slate-800 border-slate-700 max-h-[600px]">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Código Boilerplate (arquivo que será fornecido ao aluno no início do
          trabalho)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <span className="text-sm text-slate-400 mb-2 block">
          Forneça o código que será entregue ao aluno no início do trabalho.
          Certifique-se de que o código esteja alinhado com o tipo de worker
          selecionado. Segue um exemplo de código boilerplate para o tipo de
          worker &quot;
          {WorkerExibitionMap[values.workerType as WorkerType]}
          &quot;:
        </span>
        <Editor
          height={400}
          defaultLanguage="typescript"
          theme="vs-dark"
          value={values.boilerplate}
          onChange={(value) => setFieldValue("boilerplate", value)}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            automaticLayout: true,
          }}
        />
        <ErrorMessage
          name="boilerplate"
          component="div"
          className="text-red-500 text-sm"
        />
      </CardContent>
    </Card>
  );
};
