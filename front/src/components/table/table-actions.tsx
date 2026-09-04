import { MoreHorizontal, Pencil, Trash, Unlink } from "lucide-react";
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
  onDelete?: () => void | Promise<void>;
  onUnlink?: () => void | Promise<void>;
  unlinkTitle?: string;
  unlinkDescription?: string;
  otherActions?: JSX.Element[];
  resourceName?: string;
  itemName?: string;
  deleteTitle?: string;
  deleteDescription?: string;
}

export default function TableActions({
  href,
  onDelete,
  onUnlink,
  unlinkTitle,
  unlinkDescription,
  otherActions = [],
  resourceName = "item",
  itemName,
  deleteTitle,
  deleteDescription,
}: TableActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  const handleDeleteClick = () => {
    setDropdownOpen(false); // Close dropdown first
    setShowDeleteDialog(true);
  };

  const handleUnlinkClick = () => {
    setDropdownOpen(false);
    setShowUnlinkDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await Promise.resolve(onDelete());
      setShowDeleteDialog(false);
    } catch {
      // Caller shows error toast; keep dialog open so the user can read it or cancel.
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmUnlink = async () => {
    if (!onUnlink) return;
    setIsUnlinking(true);
    try {
      await Promise.resolve(onUnlink());
      setShowUnlinkDialog(false);
    } catch {
      // Caller shows error toast; keep dialog open so the user can read it or cancel.
    } finally {
      setIsUnlinking(false);
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
          {onUnlink && (
            <DropdownMenuItem
              className="text-warning focus:text-warning"
              onClick={handleUnlinkClick}
            >
              <Unlink className="h-4 w-4 mr-2" />
              Desvincular
            </DropdownMenuItem>
          )}
          {onDelete && (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleDeleteClick}
            >
              <Trash className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteAlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onDelete={handleConfirmDelete}
        resourceName={resourceName}
        itemName={itemName}
        isDeleting={isDeleting}
        title={deleteTitle}
        description={deleteDescription}
      />

      <DeleteAlertDialog
        open={showUnlinkDialog}
        onOpenChange={setShowUnlinkDialog}
        onDelete={handleConfirmUnlink}
        resourceName={resourceName}
        itemName={itemName}
        isDeleting={isUnlinking}
        title={unlinkTitle}
        description={unlinkDescription}
      />
    </>
  );
}
