export interface TemplateParams {
    id: string;
    name: string;
    templateId: string;
}

export interface Template {
    id: string;
    title: string;
    description: string;
    templateContent: string;
    templateParams: TemplateParams[]; 
}

export interface CreateTemplateRequest {
    id?: string; // Optional for new templates
    title: string;
    description: string;
    templateContent: string;
    params: string[];
};