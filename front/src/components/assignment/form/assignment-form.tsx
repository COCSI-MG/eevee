"use client";

import { AssignmentFormProps } from "../../../app/admin/assignments/interface";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { WorkerDefaultTemplateMap } from "@/app/admin/assignments/constants";
import { WorkerType } from "@/app/interface/scheduler-api/worker";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Code,
  Database,
  Layers,
  Save,
  Settings,
} from "lucide-react";
import { useClasses } from "@/hooks/use-classes";
import TemplateCard from "@/components/assignment/template-card";
import AssignmentStepContainer, {
  StepDefinition,
} from "@/components/assignment/assignment-step-container";
import { useAssignmentForm } from "@/hooks/use-assigment-form";
import AssignmentFormReview from "@/components/assignment/form/assignment-review-form";
import { AssignmentConfigForm } from "./assignment-config-form";
import { AssignmentBoilerplateForm } from "./assignment-boilerplate-form";
import { AssignmentInitSqlForm } from "./assignment-init-sql-form";
import QueryErrorState from "@/components/shared/query-error-state";
import { isoToLocalDatetime } from "@/utils/date";
import { ASSIGNMENT_FORM_TEXT } from "./constants";
import { AssignmentAlertType } from "@/app/interface/scheduler-api/assignment-alert";
import { assignmentAlertPolicyValidationSchema } from "./assignment-alert-policy-validation";

const validationSchema = Yup.object({
  title: Yup.string().required(ASSIGNMENT_FORM_TEXT.VALIDATION.TITLE_REQUIRED),
  description: Yup.string().required(ASSIGNMENT_FORM_TEXT.VALIDATION.DESCRIPTION_REQUIRED),
  maxAttempts: Yup.number()
    .required(ASSIGNMENT_FORM_TEXT.VALIDATION.MAX_ATTEMPTS_REQUIRED)
    .min(1, ASSIGNMENT_FORM_TEXT.VALIDATION.MAX_ATTEMPTS_MIN),
  workerType: Yup.string()
    .oneOf(Object.values(WorkerType))
    .required(ASSIGNMENT_FORM_TEXT.VALIDATION.WORKER_TYPE_REQUIRED),
  boilerplate: Yup.string().required(ASSIGNMENT_FORM_TEXT.VALIDATION.BOILERPLATE_REQUIRED),
  classId: Yup.string().required(ASSIGNMENT_FORM_TEXT.VALIDATION.CLASS_REQUIRED),
  startDate: Yup.string().optional(),
  dueDate: Yup.string()
    .optional()
    .test(
      "due-date-after-start-date",
      ASSIGNMENT_FORM_TEXT.VALIDATION.DUEDATECANNOTLATERTHANSTARTDATE,
      function (dueDate) {
        const startDate = this.parent.startDate as string | undefined;

        if (!startDate || !dueDate) return true;

        return new Date(startDate) <= new Date(dueDate);
      },
    ),
  alertPolicy: assignmentAlertPolicyValidationSchema.required(),
});

const STEP_CONFIG: StepDefinition = {
  id: "config",
  title: ASSIGNMENT_FORM_TEXT.STEPS.CONFIG,
  icon: Settings,
};
const STEP_TEMPLATES: StepDefinition = {
  id: "templates",
  title: ASSIGNMENT_FORM_TEXT.STEPS.TEMPLATES,
  icon: Code,
};
const STEP_BOILERPLATE: StepDefinition = {
  id: "boilerplate",
  title: ASSIGNMENT_FORM_TEXT.STEPS.BOILERPLATE,
  icon: Layers,
};
const STEP_INIT_SQL: StepDefinition = {
  id: "initSql",
  title: ASSIGNMENT_FORM_TEXT.STEPS.INIT_SQL,
  icon: Database,
};
const STEP_REVIEW: StepDefinition = {
  id: "review",
  title: ASSIGNMENT_FORM_TEXT.STEPS.REVIEW,
  icon: ClipboardCheck,
};

function buildSteps(workerType: string): StepDefinition[] {
  const steps = [STEP_CONFIG, STEP_TEMPLATES, STEP_BOILERPLATE];

  if (
    workerType === WorkerType.NODE_DEFAULT_POSTGRESQL ||
    workerType === WorkerType.NODE_NESTJS_POSTGRESQL
  ) {
    steps.push(STEP_INIT_SQL);
  }

  steps.push(STEP_REVIEW);
  return steps;
}

const alertPolicyDefault = {
  suspensionAlertLimit: 5,
  typingCharactersPerSecondLimit: 20,
  punitiveTypes: [
    AssignmentAlertType.WindowFocusLoss,
    AssignmentAlertType.DevTools,
    AssignmentAlertType.Clipboard,
    AssignmentAlertType.TypingRate
  ]
}

export const AssignmentForm: React.FC<AssignmentFormProps> = ({
  existingAssignmentId,
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  const {
    existingAssignment,
    isFetching: isFetchingAssignment,
    isError: isAssignmentError,
    refetch: refetchAssignment,
    selectedTemplates,
    setSelectedTemplates,
    upsertAssignment,
    upsertError,
    setUpsertError,
  } = useAssignmentForm(existingAssignmentId);

  const {
    data: classes,
    isFetching: isFetchingClasses,
    isError: isClassesError,
    refetch: refetchClasses,
  } = useClasses();

  const initialValues = {
    title: existingAssignment?.title ?? "",
    description: existingAssignment?.description ?? "",
    maxAttempts: existingAssignment?.maxAttempts ?? 1,
    startDate: isoToLocalDatetime(existingAssignment?.startDate),
    dueDate: isoToLocalDatetime(existingAssignment?.dueDate),
    workerType: existingAssignment?.workerType ?? WorkerType.NODE_DEFAULT,
    boilerplate:
      existingAssignment?.boilerplateContent ??
      existingAssignment?.boilerplate ??
      WorkerDefaultTemplateMap[
        (existingAssignment?.workerType ||
          WorkerType.NODE_DEFAULT) as WorkerType
      ],
    classId: existingAssignment?.classId ?? 0,
    initSqlScript: existingAssignment?.initSqlScript ?? "",
    answerKeyVisible: existingAssignment?.answerKeyVisible ?? false,
    allowCopyPaste: existingAssignment?.allowCopyPaste ?? false,
    allowProjectImport: existingAssignment?.allowProjectImport ?? false,
    alertPolicy: existingAssignment?.alertPolicy ?? alertPolicyDefault
  };

  const handleSubmit = (values: typeof initialValues) => {
    return upsertAssignment({
      newAssignment: {
        ...values,
        boilerplateContent: values.boilerplate,
        classId: Number(values.classId),
        startDate: values.startDate
          ? new Date(values.startDate).toISOString()
          : null,
        dueDate: values.dueDate
          ? new Date(values.dueDate).toISOString()
          : null,
      } as Assignment,
      templates: selectedTemplates,
    });
  };

  if (existingAssignmentId && isAssignmentError) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <QueryErrorState
            title={ASSIGNMENT_FORM_TEXT.ERRORS.ASSIGNMENT_LOAD_TITLE}
            description={ASSIGNMENT_FORM_TEXT.ERRORS.ASSIGNMENT_LOAD_DESCRIPTION}
            onRetry={() => {
              void refetchAssignment();
            }}
            retryLabel={ASSIGNMENT_FORM_TEXT.ERRORS.RETRY}
            isRetrying={isFetchingAssignment}
          />
        </div>
      </div>
    );
  }

  if (isClassesError) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <QueryErrorState
            title={ASSIGNMENT_FORM_TEXT.ERRORS.CLASSES_LOAD_TITLE}
            description={ASSIGNMENT_FORM_TEXT.ERRORS.CLASSES_LOAD_DESCRIPTION}
            onRetry={() => {
              void refetchClasses();
            }}
            retryLabel={ASSIGNMENT_FORM_TEXT.ERRORS.RETRY}
            isRetrying={isFetchingClasses}
          />
        </div>
      </div>
    );
  }

  if (existingAssignmentId && isFetchingAssignment) {
    return <div>{ASSIGNMENT_FORM_TEXT.NAVIGATION.LOADING}</div>;
  }

  if (isFetchingClasses && !classes) {
    return <div>{ASSIGNMENT_FORM_TEXT.NAVIGATION.LOADING}</div>;
  }

  return (
    <div className="p-4 space-y-4 overflow-hidden">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting, values, setFieldValue, isValid }) => {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          useEffect(() => {
            if (
              values.workerType &&
              Object.values(WorkerType).includes(
                values.workerType as WorkerType
              ) &&
              currentStepDef?.id !== STEP_BOILERPLATE.id &&
              (
                !existingAssignment?.workerType ||
                existingAssignment?.workerType !== values.workerType
              )
            ) {
              const safeWorkerType = values.workerType as WorkerType;
              setFieldValue(
                "boilerplate",
                WorkerDefaultTemplateMap[safeWorkerType],
              );
              console.log("boilerplate updated:", values.boilerplate);
            }
          }, [values.workerType, setFieldValue, values.boilerplate]);

          // eslint-disable-next-line react-hooks/rules-of-hooks
          const steps = useMemo(
            () => buildSteps(values.workerType),
            [values.workerType],
          );

          // eslint-disable-next-line react-hooks/rules-of-hooks
          const handleWeightChange = (
            templateId: number,
            weight: number | undefined,
          ) => {
            setUpsertError(null);
            setSelectedTemplates((prev) =>
              (prev ?? []).map((t) =>
                t.templateId === templateId ? { ...t, weight } : t,
              ),
            );
          };

          // eslint-disable-next-line react-hooks/rules-of-hooks
          const { weightError, hasWeightBlock } = useMemo(() => {

            const allFilled = !!selectedTemplates?.length && selectedTemplates.every((t) => t.weight !== undefined);

            const sum = allFilled
              ? Math.round(
                  selectedTemplates!.reduce((s, t) => s + (t.weight ?? 0), 0) * 100,
                ) / 100
              : null;

            const sumInvalid = (sum !== null) && (sum !== 100);

            return {
              weightError: sumInvalid
                ? ASSIGNMENT_FORM_TEXT.ERRORS.WEIGHT_SUM(sum)
                : (upsertError?.message ?? null),
              hasWeightBlock: sumInvalid,
            };
          }, [selectedTemplates, upsertError]);

          const totalSteps = steps.length;
          const currentStepDef = steps[currentStep - 1];
          const isLastStep = currentStep === totalSteps;

          // Clamp currentStep if steps changed (e.g. user switched away from postgres)
          // eslint-disable-next-line react-hooks/rules-of-hooks
          useEffect(() => {
            if (currentStep > totalSteps) {
              setCurrentStep(totalSteps);
            }
          }, [totalSteps]);

          const stepValidations: Record<string, boolean> = {
            config:
              Boolean(values.title?.trim()) &&
              Boolean(values.description?.trim()) &&
              Boolean(values.workerType) &&
              Number(values.maxAttempts) >= 1 &&
              Number(values.classId) > 0,
            templates: !hasWeightBlock,
            boilerplate: values.boilerplate?.trim() !== "",
            initSql: true,
            review: isValid && !hasWeightBlock,
          };

          const canProceedToNextStep =
            currentStepDef && stepValidations[currentStepDef.id];

          return (
            <>
              <AssignmentStepContainer
                currentStep={currentStep}
                steps={steps}
              />
              <div className="max-w-7xl mx-auto">
                <Form className="w-full">
                  {currentStepDef?.id === "config" && (
                    <AssignmentConfigForm classes={classes || []} />
                  )}
                  {currentStepDef?.id === "templates" && (
                    <TemplateCard
                      selectedTemplates={selectedTemplates}
                      setSelectedTemplates={setSelectedTemplates}
                      workerType={values.workerType as WorkerType}
                      onWeightChange={handleWeightChange}
                      weightError={weightError}
                    />
                  )}
                  {currentStepDef?.id === "boilerplate" && (
                    <AssignmentBoilerplateForm
                      values={values}
                      setFieldValue={setFieldValue}
                    />
                  )}
                  {currentStepDef?.id === "initSql" && (
                    <AssignmentInitSqlForm
                      initSqlScript={values.initSqlScript}
                      setFieldValue={setFieldValue}
                    />
                  )}
                  {currentStepDef?.id === "review" && (
                    <AssignmentFormReview
                      values={values}
                      classes={classes ?? []}
                      selectedTemplates={selectedTemplates}
                      weightError={weightError}
                    />
                  )}

                  <div className={"flex justify-between mt-8 mx-auto"}>
                    <Button
                      type="button"
                      variant={"outline"}
                      onClick={() => {
                        if (currentStep > 1) {
                          setCurrentStep(currentStep - 1);
                        }
                      }}
                      disabled={currentStep === 1}
                      className="border-border text-foreground hover:bg-primary/20 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      {ASSIGNMENT_FORM_TEXT.NAVIGATION.PREVIOUS}
                    </Button>

                    <div className="flex gap-2">
                      {!isLastStep ? (
                        <Button
                          type="button"
                          disabled={!canProceedToNextStep}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCurrentStep(currentStep + 1);
                          }}
                        >
                          {ASSIGNMENT_FORM_TEXT.NAVIGATION.CONTINUE}
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="bg-success hover:bg-success/90 transition-colors"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {existingAssignmentId
                            ? ASSIGNMENT_FORM_TEXT.NAVIGATION.UPDATE
                            : ASSIGNMENT_FORM_TEXT.NAVIGATION.CREATE}
                        </Button>
                      )}
                    </div>
                  </div>
                </Form>
              </div>
            </>
          );
        }}
      </Formik>
    </div>
  );
};
