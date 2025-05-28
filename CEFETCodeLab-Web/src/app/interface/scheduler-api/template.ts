export interface Template {
    id: string;
    title: string;
    description: string;
}

export interface CreateTemplateRequest {
    id?: string; // Optional for new templates
    title: string;
    description: string;
    templateContent: string;
    params: string[];
};