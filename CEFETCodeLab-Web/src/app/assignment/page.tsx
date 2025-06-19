import MyAssignmentsCard from '@/components/assignment/my-assignments-card';

export default function Assignment() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold tracking-tight">My assignments</h1>
        <p className="text-muted-foreground mt-1">
          Here you can find all your assignments.
        </p>
      </div>

      <MyAssignmentsCard />
    </div>
  );
}
