import { Archive } from "lucide-react";
import {
  AssignmentAlertType,
  type AssignmentUserAlert,
} from "@/app/interface/scheduler-api/assignment-alert";
import {
  ALERT_LABELS,
  CLIPBOARD_ACTION_LABELS,
  DEVTOOLS_SIGNAL_LABELS,
} from "@/app/admin/assignments/suspensions/constants";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/utils/date";

interface AssignmentAlertHistoryTableProps {
  alerts: AssignmentUserAlert[];
  isArchiving: boolean;
  onArchive: (alert: AssignmentUserAlert) => void;
}

const NO_DETAILS = "Sem detalhes adicionais";

function formatAlertInformation(alert: AssignmentUserAlert) {
  const { details, type } = alert;

  if (!details) return NO_DETAILS;

  switch (type) {
    case AssignmentAlertType.Clipboard:
      return details.clipboardAction ? CLIPBOARD_ACTION_LABELS[details.clipboardAction] : NO_DETAILS;

    case AssignmentAlertType.DevTools:
      return details.devtoolsSignal ? DEVTOOLS_SIGNAL_LABELS[details.devtoolsSignal] : NO_DETAILS;

    case AssignmentAlertType.TypingRate:
      return details.measuredCharactersPerSecond !== undefined ? `Velocidade medida: ${details.measuredCharactersPerSecond} caracteres/s` : NO_DETAILS;

    case AssignmentAlertType.LegacySuspension:
      return details.legacyReason || NO_DETAILS;

    default:
      return NO_DETAILS;
  }
}

export function AssignmentAlertHistoryTable({
  alerts,
  isArchiving,
  onArchive,
}: AssignmentAlertHistoryTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tipo</TableHead>
          <TableHead>Ocorrido em</TableHead>
          <TableHead>Informação registrada</TableHead>
          <TableHead>Arquivado</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {alerts.map((alert) => (
          <TableRow key={alert.id}>

            <TableCell className="whitespace-nowrap">
              {ALERT_LABELS[alert.type]}
            </TableCell>

            <TableCell className="whitespace-nowrap">
              {formatDate(alert.occurredAt ?? alert.createdAt)}
            </TableCell>

            <TableCell className="min-w-56 max-w-sm break-words text-sm">
              {formatAlertInformation(alert)}
            </TableCell>

            <TableCell className="whitespace-nowrap">
              {alert.deletedAt ? formatDate(alert.deletedAt) : "—"}
            </TableCell>

            <TableCell className="text-right">
              {alert.deletedAt ? (
                <span className="text-muted-foreground">—</span>
              ) : (

                <Button
                  disabled={isArchiving}
                  onClick={() => onArchive(alert)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Archive className="mr-1 h-4 w-4" />
                  Arquivar
                </Button>

              )}
            </TableCell>

          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
