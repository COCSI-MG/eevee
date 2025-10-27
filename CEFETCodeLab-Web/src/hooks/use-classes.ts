import { ClassesService } from "@/app/integration/scheduler-api/classes"
import { useQuery } from "@tanstack/react-query"

const useClasses = () => {
    return useQuery({
        queryKey: ["admin-classes"],
        queryFn: async () => {
            return ClassesService.listClasses();
        },
        refetchOnWindowFocus: true,
    })
}

export { useClasses };