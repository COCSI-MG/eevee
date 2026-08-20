import { Suspense } from "react";
import ClassViewTabs from "@/components/classes/class-view-tabs";
import Loader from "@/components/loader";

export default function ClassPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Suspense fallback={<Loader />}>
        <ClassViewTabs />
      </Suspense>
    </div>
  );
}
