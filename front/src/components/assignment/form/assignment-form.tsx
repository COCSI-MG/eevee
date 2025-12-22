"use client";

import { AssignmentFormProps } from "../../../app/admin/assignments/interface";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { WorkerDefaultTemplateMap } from "@/app/admin/assignments/constants";
import { WorkerType } from "@/app/interface/scheduler-api/worker";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { WorkerDefinitionEditor } from "@/components/assignment/worker-definition-editor";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useClasses } from "@/hooks/use-classes";
import TemplateCard from "@/components/assignment/template-card";
import AssignmentStepContainer from "@/components/assignment/assignment-step-container";
import { useAssignmentForm } from "@/hooks/use-assigment-form";
import AssignmentFormReview from "@/components/assignment/form/assignment-review-form";
import { AssignmentConfigForm } from "./assignment-config-form";
import { AssignmentBoilerplateForm } from "./assignment-boilerplate-form";

const validationSchema = Yup.object({
  title: Yup.string().required("Title is required"),
  description: Yup.string().required("Description is required"),
  maxAttempts: Yup.number()
    .required("Max attempts is required")
    .min(1, "Must be at least 1"),
  workerType: Yup.string()
    .oneOf(Object.values(WorkerType))
    .required("Worker type is required"),
  boilerplate: Yup.string().required("Boilerplate is required"),
  workerDefinition: Yup.object().required("Worker definition is required"),
  classId: Yup.string().required("Class is required"),
});

enum AssignmentFormSteps {
  Config = 1,
  Worker,
  Templates,
  Boilerplate,
  Review,
}

export const AssignmentForm: React.FC<AssignmentFormProps> = ({
  existingAssignmentId,
}) => {
  const [currentStep, setCurrentStep] = useState<AssignmentFormSteps>(
    AssignmentFormSteps.Config
  );

  const {
    existingAssignment,
    isFetching,
    selectedTemplates,
    setSelectedTemplates,
    upsertAssignment,
  } = useAssignmentForm(existingAssignmentId);

  const { data: classes, isFetching: isFetchingClasses } = useClasses();

  const initialValues = {
    title: existingAssignment?.title ?? "",
    description: existingAssignment?.description ?? "",
    maxAttempts: existingAssignment?.maxAttempts ?? 1,
    workerType: existingAssignment?.workerType ?? WorkerType.NODE_DEFAULT,
    boilerplate:
      existingAssignment?.boilerplate ??
      WorkerDefaultTemplateMap[
        (existingAssignment?.workerType ||
          WorkerType.NODE_DEFAULT) as WorkerType
      ],
    workerDefinition: existingAssignment?.workerDefinition ?? {
      files: null,
      startCommands: [],
      testCommands: [],
      dependencies: [],
    },
    classId: existingAssignment?.classId ?? 0,
  };

  const handleSubmit = (values: typeof initialValues) => {
    return upsertAssignment({
      newAssignment: {
        ...values,
        classId: Number(values.classId),
      } as Assignment,
      templates: selectedTemplates,
    });
  };

  if (existingAssignmentId && isFetching) {
    return <div>Loading...</div>;
  }

  if (isFetchingClasses && !classes) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 space-y-4 overflow-hidden">
      <AssignmentStepContainer currentStep={currentStep} />

      <div className="max-w-8xl mx-auto">
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
                )
              ) {
                const safeWorkerType = values.workerType as WorkerType;
                setFieldValue(
                  "boilerplate",
                  WorkerDefaultTemplateMap[safeWorkerType]
                );
              }
            }, [values.workerType, setFieldValue]);

            const stepValidations: { [key in AssignmentFormSteps]: boolean } = {
              [AssignmentFormSteps.Config]: isValid,
              [AssignmentFormSteps.Worker]: isValid,
              [AssignmentFormSteps.Templates]: true,
              [AssignmentFormSteps.Boilerplate]:
                values.boilerplate?.trim() != "",
              [AssignmentFormSteps.Review]: isValid,
            };

            const canProceedToNextStep = stepValidations[currentStep];

            return (
              <Form className="w-full">
                {currentStep === AssignmentFormSteps.Config && (
                  <AssignmentConfigForm classes={classes || []} />
                )}
                {currentStep === AssignmentFormSteps.Worker && (
                  <WorkerDefinitionEditor
                    value={values.workerDefinition}
                    onChange={(definition) =>
                      setFieldValue("workerDefinition", definition)
                    }
                  />
                )}
                {currentStep === AssignmentFormSteps.Templates && (
                  <TemplateCard
                    selectedTemplates={selectedTemplates}
                    setSelectedTemplates={setSelectedTemplates}
                    workerType={values.workerType as WorkerType}
                  />
                )}
                {currentStep === AssignmentFormSteps.Boilerplate && (
                  <AssignmentBoilerplateForm
                    values={values}
                    setFieldValue={setFieldValue}
                  />
                )}
                {currentStep === AssignmentFormSteps.Review && (
                  <AssignmentFormReview
                    values={values}
                    classes={classes!}
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
                    {AssignmentFormSteps.Review !== currentStep ? (
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
                          ? "Update Assignment"
                          : "Create Assignment"}
                      </Button>
                    )}
                  </div>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
};
