"use client";

import { AssignmentService } from "@/app/integration/scheduler-api/assignment";
import { InterviewResponseService } from "@/app/integration/scheduler-api/interview-response";
import { AssignmentInterviewQuestion } from "@/app/interface/scheduler-api/assignment";
import {
  InterviewPreferenceOption,
  InterviewResponsePayload,
} from "@/app/interface/scheduler-api/interview-response";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const likertFields = [
  { key: "familiaritySql", label: "Familiaridade prévia com SQL" },
  {
    key: "familiarityJsTs",
    label: "Familiaridade prévia com JavaScript/TypeScript",
  },
  { key: "familiarityOrms", label: "Familiaridade prévia com ORMs" },
  { key: "sdkClarity", label: "Clareza da solução com SDK nativo" },
  {
    key: "sdkModifiability",
    label: "Facilidade de modificação com SDK nativo",
  },
  {
    key: "sdkSqlErrorProneness",
    label: "SQL literal no SDK é mais propenso a erros",
  },
  { key: "ormClarity", label: "Clareza da solução com TeraORM" },
  { key: "ormModifiability", label: "Facilidade de modificação com TeraORM" },
  {
    key: "ormIntent",
    label: "TeraORM ajuda a identificar intenção da consulta",
  },
  { key: "ormMentalEffort", label: "TeraORM reduziu esforço mental" },
  { key: "ormSafety", label: "TeraORM aumentou segurança na composição" },
] as const;

type LikertKey = (typeof likertFields)[number]["key"];

const initialLikert: Record<LikertKey, number> = {
  familiaritySql: 3,
  familiarityJsTs: 3,
  familiarityOrms: 3,
  sdkClarity: 3,
  sdkModifiability: 3,
  sdkSqlErrorProneness: 3,
  ormClarity: 3,
  ormModifiability: 3,
  ormIntent: 3,
  ormMentalEffort: 3,
  ormSafety: 3,
};

const preferenceOptions: { value: InterviewPreferenceOption; label: string }[] =
  [
    { value: "sdk", label: "SDK nativo" },
    { value: "teraorm", label: "TeraORM" },
    { value: "no_difference", label: "Sem diferença significativa" },
    { value: "no_preference", label: "Sem preferência" },
  ];

function buildInitialExtraAnswers(
  questions: AssignmentInterviewQuestion[],
): Record<string, string | number> {
  const initial: Record<string, string | number> = {};
  for (const question of questions) {
    initial[question.key] = question.type === "likert_1_5" ? 3 : "";
  }
  return initial;
}

type LikertScaleProps = {
  id: string;
  value: number;
  onChange: (value: number) => void;
  leftLabel?: string;
  rightLabel?: string;
};

function getLikertLabels(questionKey: string) {
  if (
    questionKey.toLowerCase().includes("familiarity") ||
    questionKey.toLowerCase().includes("familiaridade")
  ) {
    return {
      leftLabel: "Nenhuma familiaridade",
      rightLabel: "Alta familiaridade",
    };
  }

  if (
    questionKey.toLowerCase().includes("error") ||
    questionKey.toLowerCase().includes("risk") ||
    questionKey.toLowerCase().includes("propensa")
  ) {
    return {
      leftLabel: "Discordo totalmente",
      rightLabel: "Concordo totalmente",
    };
  }

  return {
    leftLabel: "Discordo totalmente",
    rightLabel: "Concordo totalmente",
  };
}

function LikertScale({
  id,
  value,
  onChange,
  leftLabel = "Discordo totalmente",
  rightLabel = "Concordo totalmente",
}: LikertScaleProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((option) => {
          const selected = value === option;

          return (
            <button
              key={option}
              id={`${id}-${option}`}
              type="button"
              onClick={() => onChange(option)}
              className={[
                "rounded-md border px-3 py-2 text-sm font-medium transition",
                "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background",
              ].join(" ")}
              aria-pressed={selected}
            >
              {option}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

export default function AssignmentInterviewPage() {
  const { id } = useParams();
  const assignmentId = Number(id);
  const { back } = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [likert, setLikert] =
    useState<Record<LikertKey, number>>(initialLikert);
  const [easierToUnderstand, setEasierToUnderstand] =
    useState<InterviewPreferenceOption>("no_difference");
  const [easierToModify, setEasierToModify] =
    useState<InterviewPreferenceOption>("no_difference");
  const [futurePreference, setFuturePreference] =
    useState<InterviewPreferenceOption>("no_preference");
  const [teraormMainAdvantage, setTeraormMainAdvantage] = useState("");
  const [teraormMainDifficulty, setTeraormMainDifficulty] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [extraAnswers, setExtraAnswers] = useState<
    Record<string, string | number>
  >({});

  const { data: assignment, isFetching: isFetchingAssignment } = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: () => AssignmentService.GetAssignmentById(assignmentId),
    enabled: Number.isFinite(assignmentId),
  });

  const perExerciseQuestions = useMemo(
    () => assignment?.interviewConfig?.questions ?? [],
    [assignment],
  );

  const latestAcceptedAttempt = useMemo(() => {
    if (!assignment?.assignmentAttempts?.length) {
      return undefined;
    }

    return [...assignment.assignmentAttempts]
      .filter(
        (attempt) => attempt.isAcceptable && attempt.status === "completed",
      )
      .sort((a, b) => b.attempt - a.attempt)[0];
  }, [assignment]);

  const classId = assignment?.classId;

  const { data: classAssignments, isFetching: isFetchingClassAssignments } =
    useQuery({
      queryKey: ["class-assignments-progress", classId],
      queryFn: () =>
        classId !== undefined
          ? AssignmentService.GetAssignmentsByClassId(classId)
          : Promise.resolve([]),
      enabled: classId !== undefined,
    });

  const allClassAssignmentsAccepted = useMemo(() => {
    if (!classAssignments || classAssignments.length === 0) {
      return false;
    }
    return classAssignments.every((classAssignment) =>
      (classAssignment.assignmentAttempts ?? []).some(
        (attempt) => attempt.isAcceptable && attempt.status === "completed",
      ),
    );
  }, [classAssignments]);

  const comparativeAssignmentId = useMemo(() => {
    if (!classAssignments || classAssignments.length === 0) {
      return null;
    }

    return [...classAssignments].sort((a, b) => b.id - a.id)[0]?.id ?? null;
  }, [classAssignments]);

  const { data: existingResponse, isFetching: isFetchingResponse } = useQuery({
    queryKey: ["interview-response", assignmentId],
    queryFn: () =>
      InterviewResponseService.findMineByAssignmentId(assignmentId),
    enabled: Number.isFinite(assignmentId),
  });

  useEffect(() => {
    if (perExerciseQuestions.length === 0) {
      return;
    }
    const initial = buildInitialExtraAnswers(perExerciseQuestions);
    const merged = { ...initial };
    const existing = existingResponse?.extraAnswers;
    if (existing) {
      for (const key of Object.keys(initial)) {
        if (existing[key] !== undefined) {
          merged[key] = existing[key];
        }
      }
    }
    setExtraAnswers(merged);
  }, [perExerciseQuestions, existingResponse]);

  useEffect(() => {
    if (!existingResponse) {
      return;
    }

    setLikert((current) => ({
      ...current,
      ...Object.fromEntries(
        likertFields
          .map((field) => [field.key, existingResponse[field.key]])
          .filter(([, value]) => typeof value === "number"),
      ),
    }));

    if (existingResponse.easierToUnderstand) {
      setEasierToUnderstand(existingResponse.easierToUnderstand);
    }
    if (existingResponse.easierToModify) {
      setEasierToModify(existingResponse.easierToModify);
    }
    if (existingResponse.futurePreference) {
      setFuturePreference(existingResponse.futurePreference);
    }

    setTeraormMainAdvantage(existingResponse.teraormMainAdvantage ?? "");
    setTeraormMainDifficulty(existingResponse.teraormMainDifficulty ?? "");
    setAdditionalNotes(existingResponse.additionalNotes ?? "");
  }, [existingResponse]);

  const submitMutation = useMutation({
    mutationFn: (payload: InterviewResponsePayload) =>
      InterviewResponseService.upsert(payload),
    onSuccess: async () => {
      toast({
        title: "Respostas salvas",
        description: "Suas respostas foram registradas com sucesso.",
      });

      await queryClient.invalidateQueries({
        queryKey: ["interview-response", assignmentId],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha ao salvar respostas",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isLoading =
    isFetchingAssignment || isFetchingResponse || isFetchingClassAssignments;

  if (isLoading) {
    return <Loader />;
  }

  if (!latestAcceptedAttempt) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Button variant="outline" onClick={() => back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="rounded-md border border-warning bg-warning/10 p-4 text-warning">
          Você precisa concluir ao menos uma tentativa com sucesso para
          responder.
        </div>
      </div>
    );
  }

  const hasPerExerciseSection = perExerciseQuestions.length > 0;
  const showComparativeSection =
    allClassAssignmentsAccepted && comparativeAssignmentId === assignmentId;

  if (!hasPerExerciseSection && !showComparativeSection) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Button variant="outline" onClick={() => back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="rounded-md border border-warning bg-warning/10 p-4 text-warning">
          Conclua todos os exercícios desta turma para responder a entrevista
          final.
        </div>
      </div>
    );
  }

  const onSubmit = () => {
    const payload: InterviewResponsePayload = {
      assignmentId,
      attemptId: latestAcceptedAttempt.id,
    };

    if (hasPerExerciseSection) {
      payload.extraAnswers = extraAnswers;
    }

    if (showComparativeSection) {
      Object.assign(payload, likert);
      payload.easierToUnderstand = easierToUnderstand;
      payload.easierToModify = easierToModify;
      payload.futurePreference = futurePreference;
      payload.teraormMainAdvantage = teraormMainAdvantage || undefined;
      payload.teraormMainDifficulty = teraormMainDifficulty || undefined;
      payload.additionalNotes = additionalNotes || undefined;
    }

    submitMutation.mutate(payload);
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-3xl">
      <Button variant="outline" onClick={() => back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <div>
        <h1 className="text-3xl font-bold">Entrevista Pós-Atividade</h1>
        <p className="text-muted-foreground mt-1">
          Assignment: {assignment?.title}
        </p>
        {existingResponse && (
          <p className="text-xs text-warning mt-1">
            Você já respondeu antes. Enviar novamente irá atualizar sua
            resposta.
          </p>
        )}
      </div>

      {hasPerExerciseSection && (
        <div className="space-y-4 rounded-md border p-4">
          <h2 className="text-lg font-semibold">Sobre este exercício</h2>
          {perExerciseQuestions.map((question) => {
            const inputId = `extra-${question.key}`;
            const { leftLabel, rightLabel } = getLikertLabels(question.key);

            if (question.type === "likert_1_5") {
              const value = Number(extraAnswers[question.key] ?? 3);
              return (
                <div key={question.key} className="space-y-2">
                  <Label htmlFor={inputId}>{question.label}</Label>
                  <LikertScale
                    id={inputId}
                    value={value}
                    leftLabel={leftLabel}
                    rightLabel={rightLabel}
                    onChange={(selectedValue) =>
                      setExtraAnswers((current) => ({
                        ...current,
                        [question.key]: selectedValue,
                      }))
                    }
                  />
                </div>
              );
            }

            const textValue = String(extraAnswers[question.key] ?? "");
            return (
              <div key={question.key} className="space-y-2">
                <Label htmlFor={inputId}>{question.label}</Label>
                <Textarea
                  id={inputId}
                  value={textValue}
                  onChange={(event) =>
                    setExtraAnswers((current) => ({
                      ...current,
                      [question.key]: event.target.value,
                    }))
                  }
                  placeholder="Opcional"
                />
              </div>
            );
          })}
        </div>
      )}

      {showComparativeSection && (
        <>
          <div className="space-y-4 rounded-md border p-4">
            <h2 className="text-lg font-semibold">
              Comparativo geral (todos os exercícios concluídos)
            </h2>
            {likertFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label} (1 a 5)</Label>
                <LikertScale
                  id={field.key}
                  value={likert[field.key]}
                  onChange={(selectedValue) =>
                    setLikert((current) => ({
                      ...current,
                      [field.key]: selectedValue,
                    }))
                  }
                />
              </div>
            ))}
          </div>

          <div className="space-y-4 rounded-md border p-4">
            <div className="space-y-2">
              <Label>Qual abordagem foi mais fácil de entender?</Label>
              <Select
                value={easierToUnderstand}
                onValueChange={(value) =>
                  setEasierToUnderstand(value as InterviewPreferenceOption)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {preferenceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Qual abordagem foi mais fácil de modificar?</Label>
              <Select
                value={easierToModify}
                onValueChange={(value) =>
                  setEasierToModify(value as InterviewPreferenceOption)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {preferenceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Qual abordagem você usaria em uma atividade futura?</Label>
              <Select
                value={futurePreference}
                onValueChange={(value) =>
                  setFuturePreference(value as InterviewPreferenceOption)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {preferenceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="advantage">
                Principal vantagem percebida no TeraORM
              </Label>
              <Textarea
                id="advantage"
                value={teraormMainAdvantage}
                onChange={(event) =>
                  setTeraormMainAdvantage(event.target.value)
                }
                placeholder="Opcional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">
                Principal dificuldade percebida no TeraORM
              </Label>
              <Textarea
                id="difficulty"
                value={teraormMainDifficulty}
                onChange={(event) =>
                  setTeraormMainDifficulty(event.target.value)
                }
                placeholder="Opcional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações adicionais</Label>
              <Textarea
                id="notes"
                value={additionalNotes}
                onChange={(event) => setAdditionalNotes(event.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>
        </>
      )}

      <Button onClick={onSubmit} disabled={submitMutation.isPending}>
        {submitMutation.isPending ? "Salvando..." : "Salvar"}
      </Button>
    </div>
  );
}
