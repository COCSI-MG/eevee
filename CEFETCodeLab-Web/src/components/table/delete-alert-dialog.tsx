import { Trash2Icon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { Button } from '../ui/button';

interface DeleteAlertDialogProps {
  resourceName: string;
  onDelete: () => void;
}

export default function DeleteAlertDialog({
  resourceName,
  onDelete,
}: DeleteAlertDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger className='flex items-center gap-2'>
        <Trash2Icon className="h-4 w-4 mr-2" />
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Tem certeza que deseja excluir este {resourceName}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Todos os dados relacionados a este{' '}
            {resourceName} serão permanentemente excluídos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button variant={'destructive'} onClick={onDelete}>Delete</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
