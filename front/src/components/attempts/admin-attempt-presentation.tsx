import { Badge, type BadgeProps } from "@/components/ui/badge";

type AdminAttemptStatusBadgeConfig = {
  label: string;
  variant?: BadgeProps["variant"];
  className?: string;
};

const ADMIN_ATTEMPT_STATUS_BADGES: Record<
  string,
  AdminAttemptStatusBadgeConfig
> = {
  completed: {
    label: "Sucesso",
    variant: "outline",
    className: "border-success text-success",
  },
  failed: {
    label: "Falha",
    variant: "destructive",
    className: "bg-destructive text-destructive-foreground",
  },
  running: {
    label: "Executando",
    className: "animate-pulse bg-warning text-warning-foreground",
  },
  pending: {
    label: "Pendente",
    className: "bg-primary/30 text-foreground",
  },
  enqueded: {
    label: "Na fila",
    variant: "secondary",
  },
};

export function getAdminAttemptStatusBadge(status: string) {
  const config = ADMIN_ATTEMPT_STATUS_BADGES[status] ?? {
    label: status,
    variant: "secondary" as const,
  };

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}

export function formatAdminAttemptScore(score: number) {
  const normalized = score <= 1 ? score * 100 : score;
  return `${Math.round(normalized)}/100`;
}
