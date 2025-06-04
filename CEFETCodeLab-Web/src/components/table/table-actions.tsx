import { MoreHorizontal, Pencil } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import DeleteAlertDialog from './delete-alert-dialog';
import Link from 'next/link';
import { JSX } from 'react';

interface TableActionsProps {
  href?: string;
  onDelete: () => void;
  otherActions?: JSX.Element[];
}

export default function TableActions({
  href,
  onDelete,
  otherActions = [],
}: TableActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {otherActions.length > 0 && (
          <>
            {otherActions.map((component) => component)}
          </>
        )}
        <Link href={href ?? '#'}>
          <DropdownMenuItem>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
        </Link>
        <DropdownMenuItem className="text-destructive focus:text-destructive">
          <DeleteAlertDialog onDelete={onDelete} resourceName="item" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
