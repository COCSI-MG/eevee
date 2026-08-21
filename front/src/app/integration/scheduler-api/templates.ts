import {
  CreateTemplateRequest,
  Template,
  TestTemplateRequest,
  TestTemplateResponse,
} from "@/app/interface/scheduler-api/template";
import { PaginatedResponse } from "@/app/interface/scheduler-api/pagination";
import { axiosClientWithAuth } from "./client";
import { WorkerType } from "@/app/interface/scheduler-api/worker";

interface ListPaginatedTemplatesParams {
    page?: number;
    pageSize?: number;
    search?: string;
    workerType?: string;
}

export class TemplatesService {
    static async create(data: CreateTemplateRequest) {
        const response = await axiosClientWithAuth.post("/template", data);
        return <Template>response.data;
    }

    static async getTemplate(id: string) {
        const response = await axiosClientWithAuth.get(`/template/${id}`);
        return <Template>response.data;
    }

    static async listTemplates(workerType?: WorkerType) {
        const response = await axiosClientWithAuth.get("/template", {
            params: workerType ? { workerType } : undefined,
        });
        return <Template[]>response.data;
    }

    static async deleteTemplate(id: number) {
        const response = await axiosClientWithAuth.delete(`/template/${id}`);
        return response.data;
    }

    static async update(id: number | string, data: CreateTemplateRequest) {
        const response = await axiosClientWithAuth.patch(`/template/${id}`, data);
        return <Template>response.data;
    }

    static async listPaginated(params: ListPaginatedTemplatesParams) {
        const response = await axiosClientWithAuth.get<PaginatedResponse<Template>>(
            "/template/paginated",
            { params },
        );
        return response.data;
    }

    static async testTemplatePreview(body: TestTemplateRequest) {
        const response = await axiosClientWithAuth.post<TestTemplateResponse>(
            "/template/preview",
            body,
            { timeout: 180_000 },
        );
        return response.data;
    }
}
