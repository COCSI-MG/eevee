import { WorkerExibitionMap } from "@/app/admin/assignments/constants";
import { WorkerType } from "@/app/interface/scheduler-api/worker";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorMessage } from "formik";
import { FileText } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { getWorkerLanguageConfig } from "@/lib/monaco/worker-editor-config";
import { MonacoCodeEditor } from "@/components/editor/monaco-code-editor";
import { ASSIGNMENT_FORM_TEXT } from "./constants";

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
          {ASSIGNMENT_FORM_TEXT.BOILERPLATE.TITLE}{" "}
          <Tooltip message={ASSIGNMENT_FORM_TEXT.BOILERPLATE.TOOLTIP} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <span className="text-sm text-muted-foreground mb-2 block">
          {ASSIGNMENT_FORM_TEXT.BOILERPLATE.DESCRIPTION(
            WorkerExibitionMap[values.workerType as WorkerType],
          )}
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
