"use client";

import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "../ui/command";
import { Plus, Check, User, X } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import { useUsers } from "@/hooks/use-users";
import { SelectedUser } from "@/types/shared";
import { useMemo, useState } from "react";
import QueryErrorState from "@/components/shared/query-error-state";

interface UsersCardContentProps {
  selectedUsers: Array<SelectedUser>;
  setSelectedUsers: React.Dispatch<React.SetStateAction<Array<SelectedUser>>>;
  onUsersSelectionChange: (users: Array<SelectedUser>) => void;
}

export default function UsersCard({
  selectedUsers: selectedUsers,
  setSelectedUsers: setSelectedUsers,
  onUsersSelectionChange,
}: UsersCardContentProps) {
  const {
    data: users,
    isFetching: isUsersFetching,
    isError: isUsersError,
    refetch: refetchUsers,
  } = useUsers();

  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);

  const filteredUsers = useMemo(() => {
    if (!users) return [];

    return users.filter(
      (user) =>
        user.isAdmin === false &&
        (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [users, searchTerm]);

  const handleUserSelect = (UserId: number) => {
    const selectedUser = users?.find((user) => user.id === UserId);
    if (selectedUser) {
      setSelectedUsers((prev) => [...prev, selectedUser]);
      onUsersSelectionChange([...selectedUsers, selectedUser]);
      setOpen(false);
    }
  };

  const handleRemoveUser = (id: number) => {
    const updatedUsers = selectedUsers.filter((user) => user.id !== id);
    setSelectedUsers(updatedUsers);
    onUsersSelectionChange(updatedUsers);
  };

  if (isUsersFetching) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Carregando usuários...</p>
      </div>
    );
  }

  if (isUsersError) {
    return (
      <QueryErrorState
        title="Não foi possível carregar os usuários"
        description="A seleção de alunos não pôde ser carregada. Tente novamente."
        onRetry={() => {
          void refetchUsers();
        }}
        retryLabel="Tentar novamente"
        isRetrying={isUsersFetching}
      />
    );
  }

  return (
    <>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setSearchTerm("");
        }}
      >
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Usuários
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 w-[300px]"
          align="start"
          side="bottom"
          sideOffset={8}
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar usuários..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
              <CommandGroup>
                {filteredUsers.map((user) => (
                  <CommandItem
                    key={user.id}
                    onSelect={() => handleUserSelect(user.id)}
                    className="flex items-center gap-2 p-2"
                  >
                    <div
                      className={
                        selectedUsers.map((user) => user.id).includes(user.id)
                          ? "opacity-100"
                          : "opacity-0"
                      }
                    >
                      <Check className="h-4 w-4" />
                    </div>
                    <div className="ml-2">
                      <p className="text-sm font-medium leading-none">
                        {user.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="border rounded-md">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              Usuários Selecionados ({selectedUsers.length})
            </h3>
            {selectedUsers.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedUsers([]);
                }}
                className="h-8 px-2 text-xs"
              >
                Limpar Tudo
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-[250px]">
          {selectedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
              <User className="h-10 w-10 text-muted-foreground mb-2 opacity-20" />
              <p className="text-sm text-muted-foreground">Nenhum usuário selecionado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Use o botão Adicionar Usuários para matricular alunos nesta turma
              </p>
            </div>
          ) : (
            <div className="p-2">
              {selectedUsers.map((User) => (
                <div
                  key={User.id}
                  className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md"
                >
                  <div className="flex items-center">
                    <div className="ml-2">
                      <p className="text-sm font-medium">{User.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {User.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRemoveUser(User.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </>
  );
}
