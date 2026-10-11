import { WorkerExibitionMap } from "@/app/admin/assignments/constants";
import type { AssignmentAlertPolicy } from "@/app/interface/scheduler-api/assignment-alert";
import { Class } from "@/app/interface/scheduler-api/class";
import { WorkerType } from "@/app/interface/scheduler-api/worker";
import { FormikToggle } from "@/components/shared/formik-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ExpandableDialog,
  ExpandableTrigger,
  useExpandable,
} from "@/components/ui/expandable";
import { Label } from "@/components/ui/label";
import { Tooltip } from "@/components/ui/tooltip";
import { ErrorMessage, Field, useFormikContext } from "formik";
import { Settings } from "lucide-react";
import { useState } from "react";
import { AssignmentAlertPolicyDialog } from "./assignment-alert-policy-dialog";
import { ASSIGNMENT_FORM_TEXT } from "./constants";

interface AssignmentConfigFormValues {
  alertPolicy: AssignmentAlertPolicy;
}

export interface AssignmentConfigFormProps {
  classes: Class[];
}

export const AssignmentConfigForm: React.FC<AssignmentConfigFormProps> = ({
  classes,
}) => {
  const descriptionExpandable = useExpandable();
  const [isAlertPolicyDialogOpen, setIsAlertPolicyDialogOpen] = useState(false);
  const { values, setFieldValue } = useFormikContext<AssignmentConfigFormValues>();

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            {ASSIGNMENT_FORM_TEXT.CONFIG.TITLE}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-foreground">
              {ASSIGNMENT_FORM_TEXT.CONFIG.ACTIVITY_TITLE_LABEL}
            </Label>
            <Field
              type="text"
              name="title"
              className="w-full p-2 bg-primary/20 border border-border rounded-md text-foreground"
              placeholder={ASSIGNMENT_FORM_TEXT.CONFIG.ACTIVITY_TITLE_PLACEHOLDER}
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
                {ASSIGNMENT_FORM_TEXT.CONFIG.DESCRIPTION_LABEL}
              </Label>
              <ExpandableTrigger
                onClick={descriptionExpandable.open}
                label={ASSIGNMENT_FORM_TEXT.CONFIG.EXPAND_DESCRIPTION}
              />
            </div>
            <Field
              as="textarea"
              name="description"
              className="w-full p-2 bg-primary/20 border border-border rounded-md text-foreground"
              placeholder={ASSIGNMENT_FORM_TEXT.CONFIG.DESCRIPTION_PLACEHOLDER}
            />
            <ErrorMessage
              name="description"
              component="div"
              className="text-destructive text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="classId" className="block text-sm font-medium">
              {ASSIGNMENT_FORM_TEXT.CONFIG.CLASS_LABEL}
            </Label>
            <Field
              as="select"
              name="classId"
              className="mt-1 block w-full px-3 py-2 border text-muted-foreground border-border rounded-md shadow-sm sm:text-sm"
            >
              <option value="">
                {ASSIGNMENT_FORM_TEXT.CONFIG.CLASS_PLACEHOLDER}
              </option>
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
              {ASSIGNMENT_FORM_TEXT.CONFIG.WORKER_TYPE_LABEL}{" "}
              <Tooltip
                message={ASSIGNMENT_FORM_TEXT.CONFIG.WORKER_TYPE_TOOLTIP}
              />
            </Label>
            <p className="block text-sm font-medium">
              {ASSIGNMENT_FORM_TEXT.CONFIG.WORKER_TYPE_DESCRIPTION}
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
              {ASSIGNMENT_FORM_TEXT.CONFIG.MAX_ATTEMPTS_LABEL}{" "}
              <Tooltip
                message={ASSIGNMENT_FORM_TEXT.CONFIG.MAX_ATTEMPTS_TOOLTIP}
              />
            </Label>
            <Field
              type="number"
              name="maxAttempts"
              className="w-full p-2 bg-primary/20 border border-border rounded-md text-foreground"
              placeholder={
                ASSIGNMENT_FORM_TEXT.CONFIG.MAX_ATTEMPTS_PLACEHOLDER
              }
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

          <div className="flex flex-col gap-8" >
            <div className="flex gap-16">
              <FormikToggle
                name="answerKeyVisible"
                label={ASSIGNMENT_FORM_TEXT.CONFIG.ANSWER_KEY_VISIBLE_LABEL}
                tooltip={ASSIGNMENT_FORM_TEXT.CONFIG.ANSWER_KEY_VISIBLE_TOOLTIP}
              />

              <FormikToggle
                name="allowCopyPaste"
                label={ASSIGNMENT_FORM_TEXT.CONFIG.ALLOW_COPY_PASTE_LABEL}
                tooltip={ASSIGNMENT_FORM_TEXT.CONFIG.ALLOW_COPY_PASTE_TOOLTIP}
              />
            </div>

            <div>
              <FormikToggle
                name="allowProjectImport"
                label={ASSIGNMENT_FORM_TEXT.CONFIG.PROJECT_IMPORT_CONTROL_LABEL}
                tooltip={ASSIGNMENT_FORM_TEXT.CONFIG.PROJECT_IMPORT_CONTROL_TOOLTIP}
              />
            </div>

          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAlertPolicyDialogOpen(true)}
            >
              <Settings className="h-4 w-4" />
              Configurar bloqueios
            </Button>
          </div>
        </CardContent>
      </Card>

      <AssignmentAlertPolicyDialog
        open={isAlertPolicyDialogOpen}
        value={values.alertPolicy}
        onOpenChange={setIsAlertPolicyDialogOpen}
        onSave={(alertPolicy) => { setFieldValue("alertPolicy", alertPolicy, true) }}
      />

      <ExpandableDialog
        open={descriptionExpandable.isOpen}
        onOpenChange={descriptionExpandable.setIsOpen}
        title={ASSIGNMENT_FORM_TEXT.CONFIG.DESCRIPTION_LABEL}
        minimizeLabel={ASSIGNMENT_FORM_TEXT.CONFIG.MINIMIZE_DESCRIPTION}
        contentClassName="flex flex-col"
      >
        <Field
          as="textarea"
          name="description"
          autoFocus
          className="flex-1 w-full p-3 bg-primary/20 border border-border rounded-md text-foreground resize-none"
          placeholder={ASSIGNMENT_FORM_TEXT.CONFIG.DESCRIPTION_PLACEHOLDER}
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
