"use client";

import { AssignmentService } from "@/app/integration/scheduler-api/assignment";
import { InterviewResponseService } from "@/app/integration/scheduler-api/interview-response";
import {
  InterviewPreferenceOption,
  InterviewResponsePayload,
} from "@/app/interface/scheduler-api/interview-response";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const likertFields = [
  { key: "familiaritySql", label: "Familiaridade prévia com SQL" },
  { key: "familiarityJsTs", label: "Familiaridade prévia com JavaScript/TypeScript" },
  { key: "familiarityOrms", label: "Familiaridade prévia com ORMs" },
  { key: "sdkClarity", label: "Clareza da solução com SDK nativo" },
  { key: "sdkModifiability", label: "Facilidade de modificação com SDK nativo" },
  { key: "sdkSqlErrorProneness", label: "SQL literal no SDK é mais propenso a erros" },
  { key: "ormClarity", label: "Clareza da solução com TeraORM" },
  { key: "ormModifiability", label: "Facilidade de modificação com TeraORM" },
  { key: "ormIntent", label: "TeraORM ajuda a identificar intenção da consulta" },
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

const preferenceOptions: { value: InterviewPreferenceOption; label: string }[] = [
  { value: "sdk", label: "SDK nativo" },
  { value: "teraorm", label: "TeraORM" },
  { value: "no_difference", label: "Sem diferença significativa" },
  { value: "no_preference", label: "Sem preferência" },
];

export default function AssignmentInterviewPage() {
  const { id } = useParams();
  const assignmentId = Number(id);
  const { back } = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [likert, setLikert] = useState<Record<LikertKey, number>>(initialLikert);
  const [easierToUnderstand, setEasierToUnderstand] =
    useState<InterviewPreferenceOption>("no_difference");
  const [easierToModify, setEasierToModify] =
    useState<InterviewPreferenceOption>("no_difference");
  const [futurePreference, setFuturePreference] =
    useState<InterviewPreferenceOption>("no_preference");
  const [teraormMainAdvantage, setTeraormMainAdvantage] = useState("");
  const [teraormMainDifficulty, setTeraormMainDifficulty] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const { data: assignment, isFetching: isFetchingAssignment } = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: () => AssignmentService.GetAssignmentById(assignmentId),
    enabled: Number.isFinite(assignmentId),
  });

  const latestAcceptedAttempt = useMemo(() => {
    if (!assignment?.assignmentAttempts?.length) {
      return undefined;
    }

    return [...assignment.assignmentAttempts]
      .filter((attempt) => attempt.isAcceptable && attempt.status === "completed")
      .sort((a, b) => b.attempt - a.attempt)[0];
  }, [assignment]);

  const { data: existingResponse, isFetching: isFetchingResponse } = useQuery({
    queryKey: ["interview-response", assignmentId],
    queryFn: () => InterviewResponseService.findMineByAssignmentId(assignmentId),
    enabled: Number.isFinite(assignmentId),
  });

  const submitMutation = useMutation({
    mutationFn: (payload: InterviewResponsePayload) =>
      InterviewResponseService.upsert(payload),
    onSuccess: async () => {
      toast({
        title: "Entrevista salva",
        description: "Sua resposta pós-atividade foi registrada com sucesso.",
      });

      await queryClient.invalidateQueries({
        queryKey: ["interview-response", assignmentId],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha ao salvar entrevista",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isLoading = isFetchingAssignment || isFetchingResponse;

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
        <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-300">
          Você precisa concluir ao menos uma tentativa com sucesso para responder a entrevista.
        </div>
      </div>
    );
  }

  const onSubmit = () => {
    const payload: InterviewResponsePayload = {
      assignmentId,
      attemptId: latestAcceptedAttempt.id,
      ...likert,
      easierToUnderstand,
      easierToModify,
      futurePreference,
      teraormMainAdvantage: teraormMainAdvantage || undefined,
      teraormMainDifficulty: teraormMainDifficulty || undefined,
      additionalNotes: additionalNotes || undefined,
    };

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
          <p className="text-xs text-yellow-300 mt-1">
            Você já respondeu antes. Enviar novamente irá atualizar sua resposta.
          </p>
        )}
      </div>

      <div className="space-y-4 rounded-md border p-4">
        {likertFields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label} (1 a 5)</Label>
            <Input
              id={field.key}
              type="number"
              min={1}
              max={5}
              value={likert[field.key]}
              onChange={(event) => {
                const parsed = Number(event.target.value);
                const clamped = Number.isFinite(parsed)
                  ? Math.min(5, Math.max(1, parsed))
                  : 3;
                setLikert((current) => ({
                  ...current,
                  [field.key]: clamped,
                }));
              }}
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
          <Label htmlFor="advantage">Principal vantagem percebida no TeraORM</Label>
          <Textarea
            id="advantage"
            value={teraormMainAdvantage}
            onChange={(event) => setTeraormMainAdvantage(event.target.value)}
            placeholder="Opcional"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="difficulty">Principal dificuldade percebida no TeraORM</Label>
          <Textarea
            id="difficulty"
            value={teraormMainDifficulty}
            onChange={(event) => setTeraormMainDifficulty(event.target.value)}
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

      <Button onClick={onSubmit} disabled={submitMutation.isPending}>
        {submitMutation.isPending ? "Salvando..." : "Salvar Entrevista"}
      </Button>
    </div>
  );
}
