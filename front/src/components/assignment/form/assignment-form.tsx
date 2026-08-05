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
import QueryErrorState from "@/components/admin/query-error-state";

const validationSchema = Yup.object({
  title: Yup.string().required("Título é obrigatório"),
  description: Yup.string().required("Descrição é obrigatória"),
  maxAttempts: Yup.number()
    .required("Máximo de tentativas é obrigatório")
    .min(1, "Deve ser pelo menos 1"),
  workerType: Yup.string()
    .oneOf(Object.values(WorkerType))
    .required("Tipo de worker é obrigatório"),
  boilerplate: Yup.string().required("Boilerplate é obrigatório"),
  classId: Yup.string().required("Turma é obrigatória"),
});

const STEP_CONFIG: StepDefinition = {
  id: "config",
  title: "Configuração",
  icon: Settings,
};
const STEP_TEMPLATES: StepDefinition = {
  id: "templates",
  title: "Templates",
  icon: Code,
};
const STEP_BOILERPLATE: StepDefinition = {
  id: "boilerplate",
  title: "Boilerplate",
  icon: Layers,
};
const STEP_INIT_SQL: StepDefinition = {
  id: "initSql",
  title: "Script SQL Inicial",
  icon: Database,
};
const STEP_REVIEW: StepDefinition = {
  id: "review",
  title: "Revisão",
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
  };

  const handleSubmit = (values: typeof initialValues) => {
    return upsertAssignment({
      newAssignment: {
        ...values,
        boilerplateContent: values.boilerplate,
        classId: Number(values.classId),
      } as Assignment,
      templates: selectedTemplates,
    });
  };

  if (existingAssignmentId && isAssignmentError) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <QueryErrorState
            title="Não foi possível carregar o assignment"
            description="Não conseguimos carregar os dados deste assignment para edição."
            onRetry={() => {
              void refetchAssignment();
            }}
            retryLabel="Tentar novamente"
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
            title="Não foi possível carregar as turmas"
            description="As turmas necessárias para criar ou editar o assignment não puderam ser carregadas."
            onRetry={() => {
              void refetchClasses();
            }}
            retryLabel="Tentar novamente"
            isRetrying={isFetchingClasses}
          />
        </div>
      </div>
    );
  }

  if (existingAssignmentId && isFetchingAssignment) {
    return <div>Carregando...</div>;
  }

  if (isFetchingClasses && !classes) {
    return <div>Carregando...</div>;
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
                values.workerType as WorkerType,
              ) &&
              values.boilerplate.trim() === ""
            ) {
              const safeWorkerType = values.workerType as WorkerType;
              setFieldValue(
                "boilerplate",
                WorkerDefaultTemplateMap[safeWorkerType],
              );
            }
          }, [values.workerType, setFieldValue, values.boilerplate]);

          // eslint-disable-next-line react-hooks/rules-of-hooks
          const steps = useMemo(
            () => buildSteps(values.workerType),
            [values.workerType],
          );

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
            templates: true,
            boilerplate: values.boilerplate?.trim() !== "",
            initSql: true,
            review: isValid,
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
                      className="border-slate-600 text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Anterior
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
                          Continuar
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="bg-green-600 hover:bg-green-700 transition-colors"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {existingAssignmentId
                            ? "Atualizar Atividade"
                            : "Criar Atividade"}
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
