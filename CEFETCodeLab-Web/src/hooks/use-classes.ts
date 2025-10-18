import { ClassesService } from "@/app/integration/scheduler-api/classes"
import { useQuery } from "@tanstack/react-query"

const useClasses = () => {
    return useQuery({
        queryKey: ["admin-classes"],
        queryFn: async () => {
            return ClassesService.listClasses();
        },
        staleTime: 1000 * 60, // 1 minute
    })
}

export { useClasses };