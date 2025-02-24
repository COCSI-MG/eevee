import { AssignmentService } from "@/app/integration/scheduler-api/assignment";
import { AssignmentFormProps } from "./interface";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import dynamic from "next/dynamic";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import {
  WorkerDefaultTemplateMap,
  WorkerDefaultValidationScriptMap,
  WorkerExibitionMap,
} from "./constants";
import { WorkerType } from "@/app/interface/scheduler-api/worker";
import { ClassesService } from "@/app/integration/scheduler-api/classes";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Route } from "@/app/routes";
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const validationSchema = Yup.object({
  title: Yup.string().required("Title is required"),
  description: Yup.string().required("Description is required"),
  maxAttempts: Yup.number()
    .required("Max attempts is required")
    .min(1, "Must be at least 1"),
  workerType: Yup.string()
    .oneOf(Object.values(WorkerType))
    .required("Worker type is required"),
  template: Yup.string().required("Template is required"),
  validationScript: Yup.string().required("Validation script is required"),
  classId: Yup.string().required("Class is required"),
});

export const AssignmentForm: React.FC<AssignmentFormProps> = ({
  existingAssignmentId,
}) => {
  const { push } = useRouter();

  const { data: existingAssignment } = useQuery({
    queryKey: [`currentAssignment ${existingAssignmentId}`],
    queryFn: () => AssignmentService.GetAssignmentById(existingAssignmentId!),
    enabled: !!existingAssignmentId,
    refetchOnMount: true,
  });

  console.log("existingAssignment", existingAssignment);

  const { data: classes } = useQuery({
    queryKey: ["getClasses"],
    queryFn: ClassesService.listClasses,
  });
  const {
    mutateAsync: upsertAssignment,
    isSuccess,
    data: workerResult,
  } = useMutation({
    mutationKey: ["upsertAssignment", existingAssignmentId],
    mutationFn: (newAssignment: Assignment) => {
      console.log("newAssignment", newAssignment);
      if (!existingAssignmentId) {
        return AssignmentService.CreateAssignment(newAssignment);
      }
      return AssignmentService.UpdateAssignment(
        existingAssignmentId!,
        newAssignment
      );
    },
  });

  const initialValues: Partial<Assignment> = {
    title: existingAssignment?.title || "",
    description: existingAssignment?.description || "",
    maxAttempts: existingAssignment?.maxAttempts || 1,
    workerType: existingAssignment?.workerType || WorkerType.NODE_DEFAULT,
    template:
      existingAssignment?.template ||
      WorkerDefaultTemplateMap[
        (existingAssignment?.workerType ||
          WorkerType.NODE_DEFAULT) as WorkerType
      ],
    validationScript:
      existingAssignment?.template ||
      WorkerDefaultValidationScriptMap[
        (existingAssignment?.workerType ||
          WorkerType.NODE_DEFAULT) as WorkerType
      ],
    classId: existingAssignment?.classId,
  };

  useEffect(() => {
    if (isSuccess) {
      push(`/${Route.AdminAssignments}`);
    }
  }, [isSuccess, push, workerResult]);

  const handleSubmit = (values: typeof initialValues) => {
    console.log(values);

    return upsertAssignment({
      ...values,
      classId: Number(values.classId),
    } as Assignment);
  };

  return (
    <main className="w-full justify-center flex flex-col gap-8 row-start-2 items-center">
      <h1 className="text-4xl font-bold text-center">
        {existingAssignment ? existingAssignment.title : "Create Assignment"}
      </h1>
      <div className="w-full 2xl:w-1/2">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({
            isSubmitting,
            values: { template, validationScript, workerType },
            setFieldValue,
          }) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            useEffect(() => {
              if (
                workerType &&
                Object.values(WorkerType).includes(workerType as WorkerType)
              ) {
                const safeWorkerType = workerType as WorkerType;
                console.log("setting template");
                setFieldValue(
                  "template",
                  WorkerDefaultTemplateMap[safeWorkerType]
                );
                setFieldValue(
                  "validationScript",
                  WorkerDefaultTemplateMap[safeWorkerType]
                );
              }
            }, [workerType, setFieldValue]);

            return (
              <Form className="w-full">
                <div className="w-full grid bg-gray-100 p-6 rounded-lg shadow-md grid-cols-1 gap-4 xxl:grid-cols-2">
                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Title
                    </label>
                    <Field
                      type="text"
                      id="title"
                      name="title"
                      className="mt-1 text-gray-700 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <ErrorMessage
                      name="title"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Description
                    </label>
                    <Field
                      as="textarea"
                      id="description"
                      name="description"
                      className="mt-1 text-gray-700 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <ErrorMessage
                      name="description"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Disciplina do Trabalho
                    </label>
                    <Field
                      as="select"
                      id="classId"
                      name="classId"
                      className="mt-1 block w-full px-3 py-2 border text-gray-700 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      {(classes ?? []).map((classe) => (
                        <option
                          key={Number(classe.id)}
                          value={Number(classe.id)}
                        >
                          {classe.name}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage
                      name="classId"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Tipo de Worker
                    </label>
                    <p className="block text-sm font-medium text-gray-700">
                      Selecione o tipo de worker que será utilizado para
                      corrigir os exercícios dos alunos. Ele terá quer ser
                      condizente com os testes abaixo.
                    </p>
                    <Field
                      as="select"
                      id="workerType"
                      name="workerType"
                      className="mt-1 block w-full px-3 py-2 border text-gray-700 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                      className="text-red-500 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="maxAttempts"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Max Attempts
                    </label>
                    <Field
                      type="number"
                      id="maxAttempts"
                      name="maxAttempts"
                      className="mt-1 text-gray-700 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <ErrorMessage
                      name="maxAttempts"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-xl font-bold text-start mb-3">
                    Template
                  </h4>
                  <Editor
                    height="700px"
                    defaultLanguage="typescript"
                    theme="vs-dark"
                    value={template}
                    onChange={(value) => setFieldValue("template", value ?? "")}
                  />
                </div>

                <div className="mt-4">
                  <h4 className="text-xl font-bold text-start mb-2">
                    Teste de resultados
                  </h4>
                  <p className="mb-3">
                    Escreva um teste para validar o resultado do código do
                    aluno. O teste precisa utilizar o padrão de testes do{" "}
                    <a
                      className="underline"
                      href={"https://jestjs.io/pt-BR/docs/getting-started"}
                    >
                      Jest
                    </a>
                    .
                  </p>
                  <Editor
                    height="700px"
                    defaultLanguage="typescript"
                    theme="vs-dark"
                    value={validationScript}
                    onChange={(value) =>
                      setFieldValue("validationScript", value ?? "")
                    }
                  />
                </div>

                <div className="mt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {existingAssignmentId
                      ? "Update Assignment"
                      : "Create Assignment"}
                  </button>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </main>
  );
};
// return (
//   <form onSubmit={handleSubmit} className="w-full">
//     <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//       <div>
//         <label htmlFor="title" className="block text-sm font-medium text-gray-700">
//           Title
//         </label>
//         <input
//           type="text"
//           id="title"
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//           required
//           className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm
