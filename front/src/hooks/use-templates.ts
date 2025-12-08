import { TemplatesService } from "@/app/integration/scheduler-api/templates"
import { useQuery } from "@tanstack/react-query"

const useTemplates = () => {
    return useQuery({
        queryKey: ['templates'],
        retryOnMount: true,
        queryFn: TemplatesService.listTemplates,
    })
}

export { useTemplates };