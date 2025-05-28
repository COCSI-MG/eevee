import { CreateTemplateRequest, Template } from "@/app/interface/scheduler-api/template";
import { axiosClientWithAuth } from "./client";

export class TemplatesService {
    static async create(data: CreateTemplateRequest) {
        const response = await axiosClientWithAuth.post("/template", data);
        return <Template>response.data;
    }

    static async getTemplate(id: string) {
        const response = await axiosClientWithAuth.get(`/template/${id}`);
        return <Template>response.data;
    }

    static async listTemplates() {
        const response = await axiosClientWithAuth.get("/template");
        return <Template[]>response.data;
    }
}
