export interface AssignmentFormProps {
  existingAssignmentId?: number;
}

export interface UpdateAssignmentPageProps {
  params: Promise<{
    id: string;
  }>;
}
