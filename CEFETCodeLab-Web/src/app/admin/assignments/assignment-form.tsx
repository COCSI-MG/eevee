'use client';

import { AssignmentService } from '@/app/integration/scheduler-api/assignment';
import { AssignmentFormProps } from './interface';
import { QueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import dynamic from 'next/dynamic';
import { Assignment } from '@/app/interface/scheduler-api/assignment';
import {
  WorkerDefaultTemplateMap,
  WorkerDefaultValidationScriptMap,
  WorkerExibitionMap,
} from './constants';
import { WorkerType } from '@/app/interface/scheduler-api/worker';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Route } from '@/app/routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';
import { useClasses } from '@/hooks/use-classes';
import { toast } from '@/hooks/use-toast';
import TemplateCard from '@/components/assignment/template-card';
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const validationSchema = Yup.object({
  title: Yup.string().required('Title is required'),
  description: Yup.string().required('Description is required'),
  maxAttempts: Yup.number()
    .required('Max attempts is required')
    .min(1, 'Must be at least 1'),
  workerType: Yup.string()
    .oneOf(Object.values(WorkerType))
    .required('Worker type is required'),
  validationScript: Yup.string().required('Validation script is required'),
  classId: Yup.string().required('Class is required'),
});

export const AssignmentForm: React.FC<AssignmentFormProps> = ({
  existingAssignmentId,
}) => {
  const { push } = useRouter();
  const [selectedTemplates, setSelectedTemplates] = useState<
    {
      templateId: number;
      params: { templateParamId: number; value: string }[];
    }[]
  >([]);

  const { data: existingAssignment } = useQuery({
    queryKey: [`currentAssignment ${existingAssignmentId}`],
    queryFn: () => AssignmentService.GetAssignmentById(existingAssignmentId!),
    enabled: !!existingAssignmentId,
    refetchOnMount: true,
  });

  const { data: classes } = useClasses();

  const {
    mutateAsync: upsertAssignment,
    isSuccess,
    data: workerResult,
  } = useMutation({
    mutationKey: ['upsertAssignment', existingAssignmentId],
    mutationFn: ({
      newAssignment,
      templates,
    }: {
      newAssignment: Assignment;
      templates: {
        templateId: number;
        params: { templateParamId: number; value: string }[];
      }[];
    }) => {
      console.log('newAssignment', newAssignment);
      if (!existingAssignmentId) {
        return AssignmentService.CreateAssignment({
          ...newAssignment,
          templates,
        });
      }
      return AssignmentService.UpdateAssignment(existingAssignmentId!, {
        ...newAssignment,
        templates,
      });
    },
  });

  const initialValues: Partial<Assignment> = {
    title: existingAssignment?.title || '',
    description: existingAssignment?.description || '',
    maxAttempts: existingAssignment?.maxAttempts || 1,
    workerType: existingAssignment?.workerType || WorkerType.NODE_DEFAULT,
    validationScript:
      WorkerDefaultValidationScriptMap[
        (existingAssignment?.workerType ||
          WorkerType.NODE_DEFAULT) as WorkerType
      ],
    classId: existingAssignment?.classId || 0,
  };

  useEffect(() => {
    if (isSuccess) {
      const queryClient = new QueryClient();
      queryClient.invalidateQueries({
        queryKey: ['adminAssignments'],
      });

      toast({
        title: 'Assignment saved successfully',
        description: 'The assignment has been created/updated successfully.',
        variant: 'default',
        duration: 5000,
      });

      push(`${Route.AdminAssignments}`);
    } else {
      if (workerResult) {
        console.error('Worker result:', workerResult);
      }
      toast({
        title: 'Ocorreu um erro ao salvar o assignment',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  }, [isSuccess, push, workerResult]);

  const handleSubmit = (values: typeof initialValues) => {
    console.log(values);

    return upsertAssignment({
      newAssignment: {
        ...values,
        classId: Number(values.classId),
      } as Assignment,
      templates: selectedTemplates,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant={'ghost'}
            onClick={() => push(`${Route.AdminAssignments}`)}
          >
            Voltar
          </Button>
          <h1 className="text-4xl font-bold text-center">
            {existingAssignment
              ? existingAssignment.title
              : 'Create Assignment'}
          </h1>
        </div>
      </div>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({
              isSubmitting,
              values: { validationScript, workerType },
              setFieldValue,
            }) => {
              // eslint-disable-next-line react-hooks/rules-of-hooks
              useEffect(() => {
                if (
                  workerType &&
                  Object.values(WorkerType).includes(workerType as WorkerType)
                ) {
                  const safeWorkerType = workerType as WorkerType;
                  setFieldValue(
                    'template',
                    WorkerDefaultTemplateMap[safeWorkerType]
                  );
                  setFieldValue(
                    'validationScript',
                    WorkerDefaultTemplateMap[safeWorkerType]
                  );
                }
              }, [workerType, setFieldValue]);

              return (
                <Form className="w-full">
                  <div className="grid lg:grid-cols-3 gap-6">
                    <Card className="bg-slate-800 border-slate-700 max-h-[700px]">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center justify-between">
                          Informações do Assignment
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="title" className="text-white">
                            Título
                          </Label>
                          <Field
                            type="text"
                            name="title"
                            className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                            placeholder="Título do Assignment"
                          />
                          <ErrorMessage
                            name="title"
                            component="div"
                            className="text-red-500 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description" className="text-white">
                            Descrição
                          </Label>
                          <Field
                            as="textarea"
                            type="text"
                            name="description"
                            className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                            placeholder="Descreva o que os alunos devem fazer"
                          />
                          <ErrorMessage
                            name="description"
                            component="div"
                            className="text-red-500 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="classId"
                            className="block text-sm font-medium"
                          >
                            Disciplina do Trabalho
                          </Label>
                          <Field
                            as="select"
                            id="classId"
                            name="classId"
                            className="mt-1 block w-full px-3 py-2 border text-gray-700 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          >
                            <option value="" disabled>
                              Selecione uma disciplina
                            </option>
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
                        <div className="space-y-2">
                          <Label
                            htmlFor="workerType"
                            className="block text-sm font-medium"
                          >
                            Tipo de Worker
                          </Label>
                          <p className="block text-sm font-medium ">
                            Selecione o tipo de worker que será utilizado para
                            corrigir os exercícios dos alunos. Ele terá que ser
                            condizente com os testes abaixo.
                          </p>
                          <Field
                            as="select"
                            id="workerType"
                            name="workerType"
                            className="mt-1 block w-full px-3 py-2 border text-gray-700  border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                        <div className="space-y-2">
                          <Label
                            htmlFor="maxAttempts"
                            className="block text-sm font-medium"
                          >
                            Máximo de Tentativas
                          </Label>
                          <Field
                            type="number"
                            name="maxAttempts"
                            className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                            placeholder="Número máximo de tentativas permitidas"
                          />
                          <ErrorMessage
                            name="maxAttempts"
                            component="div"
                            className="text-red-500 text-sm"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <TemplateCard
                      selectedTemplates={selectedTemplates}
                      setSelectedTemplates={setSelectedTemplates}
                    />

                    <Card className="bg-slate-800 border-slate-700 max-h-[700px]">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Boilerplate de Validação
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Label
                            htmlFor="validationScript"
                            className="text-slate-200 text-sm"
                          >
                            Boilerplate inicial para os alunos
                          </Label>
                          <Editor
                            height="550px"
                            defaultLanguage="typescript"
                            theme="vs-dark"
                            value={validationScript}
                            onChange={(value) =>
                              setFieldValue('validationScript', value)
                            }
                            options={{
                              minimap: { enabled: false },
                              scrollBeyondLastLine: false,
                              wordWrap: 'on',
                              automaticLayout: true,
                            }}
                          />
                          <ErrorMessage
                            name="validationScript"
                            component="div"
                            className="text-red-500 text-sm"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {existingAssignmentId
                        ? 'Update Assignment'
                        : 'Create Assignment'}
                    </button>
                  </div>
                </Form>
              );
            }}
          </Formik>
        </div>
      </div>
    </div>
  );
};
