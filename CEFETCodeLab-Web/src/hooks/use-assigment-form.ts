import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { AssignmentService } from '@/app/integration/scheduler-api/assignment';
import { Assignment } from '@/app/interface/scheduler-api/assignment';
import { toast } from '@/hooks/use-toast';
import { Route } from '@/app/routes';
import { SelectedTemplate } from '@/types/shared';

export const useAssignmentForm = (existingAssignmentId?: number) => {
    const { push } = useRouter();

    const [selectedTemplates, setSelectedTemplates] = useState<SelectedTemplate[]>([]);

    const { data: existingAssignment, isFetching } = useQuery({
        queryKey: [`currentAssignment ${existingAssignmentId}`],
        queryFn: () => AssignmentService.GetAssignmentById(Number(existingAssignmentId!)),
        enabled: !!existingAssignmentId,
        refetchOnMount: true,
    });

    const { mutateAsync: upsertAssignment } = useMutation({
        mutationKey: ['upsertAssignment', existingAssignmentId],
        mutationFn: ({ newAssignment, templates }: {
            newAssignment: Assignment;
            templates: typeof selectedTemplates;
        }) => {
            if (!existingAssignmentId) {
                return AssignmentService.CreateAssignment({ ...newAssignment, templates });
            }
            return AssignmentService.UpdateAssignment(existingAssignmentId!, { ...newAssignment, templates });
        },
        onSuccess: () => {
            toast({
                title: 'Assignment saved successfully',
                description: 'The assignment has been created/updated successfully.',
            });
            push(Route.AdminAssignments);
        },
        onError: () => {
            toast({
                title: `Error ${existingAssignmentId ? 'updating' : 'creating'} assignment`,
                description: 'Please try again later.',
                variant: 'destructive',
            });
        }
    });

    return {
        existingAssignment,
        isFetching,
        selectedTemplates,
        setSelectedTemplates,
        upsertAssignment,
    };
};