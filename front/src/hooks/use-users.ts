'use client';

import { UsersService } from "@/app/integration/platform-api/user"
import { useQuery } from "@tanstack/react-query"

const useUsers = () => {
    return useQuery({
        queryKey: ["users"],
        initialData: [],
        queryFn: () => UsersService.getAllUsers(),
    })
}

export { useUsers }