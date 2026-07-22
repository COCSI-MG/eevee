import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import DeleteAlertDialog from "./delete-alert-dialog";
import Link from "next/link";
import { JSX, useState } from "react";

interface TableActionsProps {
  href?: string;
  onDelete: () => void | Promise<void>;
  otherActions?: JSX.Element[];
}

export default function TableActions({
  href,
  onDelete,
  otherActions = [],
}: TableActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  const handleDeleteClick = () => {
    setDropdownOpen(false); // Close dropdown first
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await Promise.resolve(onDelete());
      setShowDeleteDialog(false);
    } catch {
      // Caller shows error toast; keep dialog open so the user can read it or cancel.
    }
  };

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Ações</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {otherActions.length > 0 && (
            <>
              {otherActions.map((component, index) => (
                <div key={index}>{component}</div>
              ))}
            </>
          )}
          {href && (
            <DropdownMenuItem asChild>
              <Link href={href} className="flex items-center">
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={handleDeleteClick}
          >
            <Trash className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteAlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onDelete={handleConfirmDelete}
        resourceName="item"
      />
    </>
  );
}
