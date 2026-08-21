import { Loader2Icon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";

interface DeleteAlertDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  resourceName: string;
  itemName?: string;
  isDeleting?: boolean;
  title?: string;
  description?: string;
  onDelete: () => void | Promise<void>;
}

export default function DeleteAlertDialog({
  open,
  onOpenChange,
  resourceName,
  itemName,
  isDeleting = false,
  title,
  description,
  onDelete,
}: DeleteAlertDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {title ??
              `Tem certeza que deseja excluir este ${resourceName}${
                itemName ? ` '${itemName}'` : ""
              }?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description ??
              `Esta ação não pode ser desfeita. Todos os dados relacionados a este ${resourceName} serão permanentemente excluídos.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <Button
            variant={"destructive"}
            disabled={isDeleting}
            onClick={() => void Promise.resolve(onDelete())}
          >
            {isDeleting && (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isDeleting ? "Excluindo…" : "Excluir"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
