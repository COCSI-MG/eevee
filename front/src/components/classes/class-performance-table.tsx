import { ClassPerformance } from "@/app/interface/scheduler-api/class-performance";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const gradeFormat = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

interface ClassPerformanceTableProps {
  performance: ClassPerformance
}

export default function ClassPerformanceTable({ performance } : ClassPerformanceTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-48">Aluno</TableHead>

          {performance.activities.map((activity) => (
            <TableHead key={activity.id} className="min-w-40">{activity.title}</TableHead>
          ))}

          <TableHead className="min-w-32">Média geral</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {!performance.data.length && (
          <TableRow>
            <TableCell
              colSpan={performance.activities.length + 2}
              className="text-center text-muted-foreground"
            >
              Nenhum aluno matriculado nesta turma.
            </TableCell>
          </TableRow>
        )}

        {performance.data.map((student) => {
          const grades = new Map(student.grades.map((entry) => [entry.activityId, entry.grade]));

          return (
            <TableRow key={student.userId}>
              <TableCell className="font-medium">{student.name}</TableCell>

              {performance.activities.map((activity) => {
                const grade = grades.get(activity.id);
                return (
                  <TableCell key={activity.id}>

                    {grade == null ? (
                      <span className="text-muted-foreground">
                        Não realizada
                      </span>
                    ) : (
                      gradeFormat.format(grade)
                    )}

                  </TableCell>
                );
              })}
              <TableCell className="font-medium">

                {student.average === null ? (
                  <span className="text-muted-foreground">Sem avaliação</span>
                ) : (
                  gradeFormat.format(student.average)
                )}

              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
