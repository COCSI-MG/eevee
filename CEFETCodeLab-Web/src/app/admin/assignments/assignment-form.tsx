import { AssignmentService } from '@/app/integration/scheduler-api/assignment';
import { AssignmentFormProps } from './interface';
import { useMutation, useQuery } from '@tanstack/react-query';
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
import { ClassesService } from '@/app/integration/scheduler-api/classes';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Route } from '@/app/routes';
import { TemplatesService } from '@/app/integration/scheduler-api/templates';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Check, Code, Eye, FileText, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

  console.log('existingAssignment', existingAssignment);

  const { data: classes } = useQuery({
    queryKey: ['getClasses'],
    queryFn: ClassesService.listClasses,
  });

  const {
    data: templates,
    isSuccess: isSuccessTemplates,
    isPending: isPendingTemplates,
  } = useQuery({
    queryKey: ['templates'],
    queryFn: TemplatesService.listTemplates,
  });

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
    classId: existingAssignment?.classId,
  };

  useEffect(() => {
    if (isSuccess) {
      push(`${Route.AdminAssignments}`);
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
                  console.log('setting template');
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

                    <Card className="bg-slate-800 border-slate-700 max-h-[700px]">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center justify-between">
                          Templates
                          <Button
                            size={'sm'}
                            variant={'outline'}
                            onClick={() => push(`${Route.AdminTemplate}/new`)}
                            className="hover:bg-slate-600"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {!isPendingTemplates &&
                        isSuccessTemplates &&
                        templates.length === 0 ? (
                          <div className="text-center py-8 text-slate-400">
                            Nenhum template encontrado
                            <p className="text-sm mt-2">
                              Clique em &quot;Adicionar&quot; para criar um
                              template
                            </p>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-slate-400 mb-4">
                              Selecione o template que será usado para avaliar
                              os alunos
                            </p>
                            <ScrollArea className="h-[500px] pr-4">
                              <div className="space-y-3">
                                {(templates ?? []).map((template) => (
                                  <div
                                    key={template.id}
                                    className={cn(
                                      `p-3 rounded-lg border cursor-pointer transition-all`,
                                      selectedTemplates.some(
                                        (templ) =>
                                          templ.templateId ===
                                          Number(template.id)
                                      )
                                        ? 'bg-blue-500 bg-blue-500/10'
                                        : 'bg-slate-600 bg-slate-700/10 hover:bg-slate-700'
                                    )}
                                    onClick={() => {
                                      const isSelected = selectedTemplates.some(
                                        (templ) =>
                                          templ.templateId ===
                                          Number(template.id)
                                      );

                                      if (isSelected) {
                                        setSelectedTemplates(
                                          selectedTemplates.filter(
                                            (templ) =>
                                              templ.templateId !==
                                              Number(template.id)
                                          )
                                        );
                                      } else {
                                        setSelectedTemplates([
                                          ...selectedTemplates,
                                          {
                                            templateId: Number(template.id),
                                            params: template.templateParams.map(
                                              (param) => ({
                                                templateParamId: Number(
                                                  param.id
                                                ),
                                                value: param.name,
                                              })
                                            ),
                                          },
                                        ]);
                                      }
                                    }}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h4 className="font-medium text-white">
                                            {template.title}
                                          </h4>
                                          {selectedTemplates.some(
                                            (templ) =>
                                              templ.templateId ===
                                              Number(template.id)
                                          ) && (
                                            <Check className="w-4 h-4 text-blue-400" />
                                          )}
                                        </div>
                                        <p className="text-sm text-slate-300">
                                          {template.description}
                                        </p>
                                      </div>
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button
                                            variant={'ghost'}
                                            size={'sm'}
                                            className="text-blue-400 hover:text-blue-300 hover:bg-slate-600 ml-2"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <Eye className="h-4 w-4" />
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[80hv]">
                                          <DialogHeader>
                                            <DialogHeader>
                                              <DialogTitle>
                                                <Code className="w-5 h-5" />
                                                {template.title}
                                              </DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                              <p className="text-slate-300">
                                                {template.description}
                                              </p>
                                              <div className="bg-slate-900 border-slate-600 rounded-md p-4 max-h-[50vh] overflow-y-auto">
                                                <pre className="whitespace-pre-wrap break-words text-green-400">
                                                  {template.templateContent}
                                                </pre>
                                              </div>
                                            </div>
                                          </DialogHeader>
                                        </DialogContent>
                                      </Dialog>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </>
                        )}
                      </CardContent>
                      <CardFooter>
                        <Badge className="bg-blue-600 text-white">
                          {selectedTemplates.length} Template(s) Selecionado(s)
                        </Badge>
                      </CardFooter>
                    </Card>

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
