"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ClassesService } from "@/app/integration/scheduler-api/classes";
import { ADMIN_LIST_PAGE_SIZE } from "@/app/interface/scheduler-api/pagination";
import { UserRole } from "@/app/interface/scheduler-api/user";
import { useAuthContext } from "@/hooks/use-auth-context";
import { Button } from "@/components/ui/button";
import Loader from "@/components/loader";
import PageHeader from "@/components/shared/page-header";
import QueryErrorState from "@/components/shared/query-error-state";
import Pagination from "@/components/shared/pagination";
import ClassActivitiesSelect from "@/components/classes/class-activities-select";
import ClassPerformanceTable from "@/components/classes/class-performance-table";

export default function ClassInfosPage() {
  const { id } = useParams<{ id: string }>();
  return <ClassInfosContent key={id} id={Number(id)} />;
}

function ClassInfosContent({ id }: { id: number }) {
  const { user } = useAuthContext();

  const allowed = user?.role === UserRole.ADMIN || user?.role === UserRole.TEACHER;
  const validId = id > 0;
  const [page, setPage] = useState(1);
  const [activityIds, setActivityIds] = useState<number[] | undefined>();

  const infos = useQuery({
    queryKey: ["class-infos", user?.userId, user?.role, id],
    queryFn: ({ signal }) => ClassesService.getInfos(id, signal),
    enabled: allowed && validId
  });

  const performance = useQuery({
    queryKey: [
      "class-performance",
      user?.userId,
      user?.role,
      id,
      page,
      ADMIN_LIST_PAGE_SIZE,
      activityIds ?? "all"
    ],
    queryFn: ({ signal }) =>
      ClassesService.getPerformance(
        id,
        {
          page,
          pageSize: ADMIN_LIST_PAGE_SIZE,
          activityIds
        },
        signal
      ),
    enabled: allowed && validId && infos.isSuccess,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (performance.data && page > performance.data.meta.totalPages) {
      setPage(performance.data.meta.totalPages);
    }
  }, [performance.data, page]);

  const title = infos.isSuccess ? infos.data.name : "Detalhes da turma"

  const pageHeaderProps = {
    href: "/admin/classes",
    title
  }

  if (!allowed) {
    return user ? (
      <p>Você não tem permissão para acessar esta página.</p>
    ) : (
      <Loader />
    );
  }

  if (!validId) {
    return (
      <div className="space-y-6">
        <PageHeader
          {...pageHeaderProps}
        />
        <p>Turma não encontrada.</p>
      </div>
    );
  }

  if (infos.isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          {...pageHeaderProps}
        />

        <QueryErrorState
          title="Turma indisponível"
          description="A turma não foi encontrada, você não tem acesso ou houve uma falha na consulta."
          onRetry={() => {
            void infos.refetch();
          }}
          isRetrying={infos.isFetching}
        />
      </div>
    );
  }

  if (!infos.data) return <Loader />;

  const RenderPerformance = () => {
    if (performance.isError) {
      return (
        <QueryErrorState
          title="Não foi possível carregar o desempenho"
          description="Tente consultar as notas novamente."
          onRetry={() => {
            void performance.refetch();
            void infos.refetch();
          }}
          isRetrying={performance.isFetching}
        />
      );
    }

    if (!performance.data) {
      return <Loader fullScreen={false} />;
    }

    return (
      <div className="space-y-4" aria-busy={performance.isFetching}>
        {performance.isFetching && (
          <p role="status" className="text-sm text-muted-foreground">
            Atualizando desempenho...
          </p>
        )}

        <div className="rounded-md border">
          <ClassPerformanceTable performance={performance.data} />
        </div>

        <Pagination
          {...performance.data.meta}
          onPageChange={setPage}
          itemLabel={{ singular: "aluno", plural: "alunos" }}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        {...pageHeaderProps}
      />

      {infos.data.deletedAt && (
        <p className="text-sm text-muted-foreground">Turma arquivada</p>
      )}

      {infos.data.description && (
        <p className="text-muted-foreground">{infos.data.description}</p>
      )}


      <div
        role="tablist"
        aria-label="Detalhes da turma"
        className="border-b border-border/50 pb-4"
      >
        <Button
          id="activities-tab"
          role="tab"
          aria-selected="true"
          aria-controls="activities-panel"
        >
          Atividades
        </Button>
      </div>

      <section
        id="activities-panel"
        role="tabpanel"
        aria-labelledby="activities-tab"
        className="space-y-4"
      >
        <ClassActivitiesSelect
          activities={infos.data.activities}
          selectedIds={activityIds}
          onChange={(ids) => {
            setActivityIds(ids);
            setPage(1);
          }}
        />

        <p className="text-sm text-muted-foreground">
          Notas de 0 a 10, considerando a última tentativa concluída. A média
          considera apenas as atividades exibidas, atividades não realizadas
          contam como zero.
        </p>

        {!infos.data.activities.length && (
          <p className="text-sm text-muted-foreground">
            Nenhuma atividade avaliativa cadastrada nesta turma.
          </p>
        )}

        <RenderPerformance />
      </section>
    </div>
  );
}
