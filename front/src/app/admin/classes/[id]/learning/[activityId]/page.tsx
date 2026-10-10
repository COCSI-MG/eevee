"use client";
import { useParams } from "next/navigation";
import { ActivityEditor } from "@/components/learning/activity-editor";
export default function LearningEditorPage() {
  const { id, activityId } = useParams<{ id: string; activityId: string }>();
  return (
    <ActivityEditor
      classId={Number(id)}
      activityId={activityId === "new" ? undefined : Number(activityId)}
    />
  );
}
