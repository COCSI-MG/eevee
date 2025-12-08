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
  onDelete: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasTrigger?: boolean;
}

export default function DeleteAlertDialog({
  open,
  onOpenChange,
  resourceName,
  onDelete,
  open,
  onOpenChange,
  hasTrigger = true,
}: DeleteAlertDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Tem certeza que deseja excluir este {resourceName}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Todos os dados relacionados a este{" "}
            {resourceName} serão permanentemente excluídos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <Button variant={"destructive"} onClick={onDelete}>
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
