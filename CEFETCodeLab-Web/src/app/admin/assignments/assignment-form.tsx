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
import { ChevronLeft, ChevronRight, ClipboardCheck, Code, FileText, Layers, Save, Settings } from 'lucide-react';
import { useClasses } from '@/hooks/use-classes';
import { toast } from '@/hooks/use-toast';
import TemplateCard from '@/components/assignment/template-card';
import { cn } from '@/lib/utils';
import AssignmentStepContainer from '@/components/assignment/assignment-step-container';
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
  const [currentStep, setCurrentStep] = useState<number>(1);

  const { data: existingAssignment, isFetching } = useQuery({
    queryKey: [`currentAssignment ${existingAssignmentId}`],
    queryFn: () => AssignmentService.GetAssignmentById(existingAssignmentId!),
    enabled: !!existingAssignmentId,
    refetchOnMount: true,
  });

  const { data: classes, isFetching: isFetchingClasses } = useClasses();

  const {
    mutateAsync: upsertAssignment,
    isSuccess,
    isError,
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
    }
    if (isError) {
      if (workerResult) {
        console.error('Worker result:', workerResult);
      }
      toast({
        title: `Ocorreu um erro ao ${existingAssignmentId === undefined ? 'criar' : 'atualizar'
          } o assignment`,
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  }, [isSuccess, push, workerResult, isError, existingAssignmentId]);

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

  if (existingAssignmentId && isFetching) {
    return <div>Loading...</div>
  }

  if (isFetchingClasses) {
    return <div>Loading...</div>
  }

  return (
    <>
      <AssignmentStepContainer currentStep={currentStep} />

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
              values,
              setFieldValue,
              isValid
            }) => {
              // eslint-disable-next-line react-hooks/rules-of-hooks
              useEffect(() => {
                if (
                  values.workerType &&
                  Object.values(WorkerType).includes(values.workerType as WorkerType)
                ) {
                  const safeWorkerType = values.workerType as WorkerType;
                  setFieldValue(
                    'template',
                    WorkerDefaultTemplateMap[safeWorkerType]
                  );
                  setFieldValue(
                    'validationScript',
                    WorkerDefaultTemplateMap[safeWorkerType]
                  );
                }
              }, [values.workerType, setFieldValue]);

              const canProceedToNextStep = () => {
                switch (currentStep) {
                  case 1:
                    return isValid;
                  case 2:
                    return selectedTemplates.length > 0;
                  case 3:
                    return values.validationScript?.trim() != '';
                  default:
                    return true;
                }
              }

              const renderStep = () => {
                switch (currentStep) {
                  case 1:
                    return (
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
                              name="classId"
                              className="mt-1 block w-full px-3 py-2 border text-gray-700 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                              <option value=''>Selecione uma turma</option>
                              {(classes).map((classRecord) => (
                                <option
                                  key={classRecord.id}
                                  value={classRecord.id}
                                >
                                  {classRecord.name}
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
                    );

                  case 2:
                    return (
                      <TemplateCard
                        selectedTemplates={selectedTemplates}
                        setSelectedTemplates={setSelectedTemplates}
                      />
                    );

                  case 3:
                    return (
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
                              value={values.validationScript}
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
                    )

                  case 4:
                    return (
                      <div className='max-w-4xl mx-auto'>
                        <Card className="bg-slate-800 border-slate-700">
                          <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                              <ClipboardCheck className="w-5 h-5" />
                              Revisão Final
                            </CardTitle>
                            <p className="text-sm text-slate-400">Revise todas as informações antes de criar o assignment</p>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            {/* Configurações */}
                            <div>
                              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                Configurações
                              </h4>
                              <div className="bg-slate-700/30 p-4 rounded-lg space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-xs text-slate-400 uppercase tracking-wide">Título</p>
                                    <p className="text-white font-medium">{values.title}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-400 uppercase tracking-wide">Turma</p>
                                    <p className="text-white font-medium">{classes.find((c) => c.id === Number(values.classId))?.name}</p>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-400 uppercase tracking-wide">Descrição</p>
                                  <p className="text-white">{values.description}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-xs text-slate-400 uppercase tracking-wide">Worker Type</p>
                                    <p className="text-white">{values.workerType}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-400 uppercase tracking-wide">Max Tentativas</p>
                                    <p className="text-white">{values.maxAttempts}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Templates */}
                            <div>
                              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                <Code className="w-4 h-4" />
                                Templates ({selectedTemplates.length})
                              </h4>
                              <div className="space-y-3">
                                {selectedTemplates.map((template, index) => (
                                  <div key={index} className="bg-slate-700/30 p-4 rounded-lg">
                                    <h5 className="text-white font-medium mb-2">{template.templateId}</h5>
                                    <div className="space-y-2">
                                      {template.params.map((param) => (
                                        <div key={param.templateParamId} className="bg-slate-800 rounded p-3">
                                          <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">{param.value}</pre>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Boilerplate */}
                            <div>
                              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                <Layers className="w-4 h-4" />
                                Código Boilerplate
                              </h4>
                              <div className="bg-slate-900 border border-slate-600 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                                <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                                  {values.validationScript}
                                </pre>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )
                }
              }

              return (
                <Form className="w-full">
                  {renderStep()}

                  <div className={cn('flex justify-between mt-8 mx-auto', currentStep === 4 ? 'max-w-4xl' : '')}>
                    <Button
                      type='button'
                      variant={"outline"}
                      onClick={() => {
                        if (currentStep > 1) {
                          setCurrentStep(currentStep - 1)
                        }
                      }}
                      disabled={currentStep === 1}
                      className='border-slate-600 text-slate-200 hover:bg-slate-700 disabled:opacity-50'
                    >
                      <ChevronLeft className='w-4 h-4 mr-2' />
                      Anterior
                    </Button>

                    <div className='flex gap-2'>
                      {
                        currentStep < 4 ? (
                          <Button
                            type='button'
                            disabled={!canProceedToNextStep()}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setCurrentStep(currentStep + 1)
                            }}
                          >
                            Continuar
                            <ChevronRight className='w-4 h-4 ml-2' />
                          </Button>
                        ) : (
                          <Button
                            type='submit'
                            disabled={isSubmitting}
                            className='bg-green-600 hover:bg-green-700 transition-colors'
                          >
                            <Save className='w-4 h-4 mr-2' />
                            {
                              existingAssignmentId ?
                                'Update Assignment'
                                : 'Create Assignment'
                            }
                          </Button>
                        )}
                    </div>
                  </div>
                </Form>
              );
            }}
          </Formik>
        </div>
      </div >
    </>
  );
};
