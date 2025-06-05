import { UsersService } from "@/app/integration/scheduler-api/user"
import { useQuery } from "@tanstack/react-query"

const useUsers = () => {
    return useQuery({
        queryKey: ["users"],
        initialData: [],
        queryFn: () => UsersService.getAllUsers(),
    })
}

export { useUsers }