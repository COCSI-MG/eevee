import { ClassesService } from "@/app/integration/scheduler-api/classes"
import { useQuery } from "@tanstack/react-query"

const useClasses = () => {
    return useQuery({
        queryKey: ["classes"],
        initialData: [],
        queryFn: () => ClassesService.listClasses(),
    })
}

export { useClasses };