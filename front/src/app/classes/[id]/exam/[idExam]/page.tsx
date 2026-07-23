import { Suspense } from "react";
import Loader from "@/components/loader";
import StudentExamDetail from "@/components/exam/student-exam-detail";

export default function StudentExamPage() {
  return (
    <div className="container mx-auto p-4">
      <Suspense fallback={<Loader fullScreen={false} />}>
        <StudentExamDetail />
      </Suspense>
    </div>
  );
}
