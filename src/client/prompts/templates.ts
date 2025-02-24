export class PromptTemplate {
    private template: string = '';
    private toolTemplate = '## Tools\n\n';
    private instructionTemplate = '## Instructions\n\n';
    private responseTemplate = '## Response\n\n';
    private originalRequest: string = '## Original Request\n\n';

    constructor(name: string) {
        this.template += `# ${name}\n\n`;
    }

    public addOriginalRequest(request: string): void {
        this.originalRequest += `${request}\n\n`;
    }

    public addInstruction(instruction: string): void {
        this.instructionTemplate += `${instruction}\n\n`;
    }

    public addResponse(response: string): void {
        this.responseTemplate += `${response}\n\n`;
    }

    public addTool(tool: string): void {
        this.toolTemplate += `${tool}\n\n`;
    }

    public addTemplateSection(name: string, content: string): void {
        this.template += `## ${name}\n\n${content}\n\n`;
    }

    public getOriginalRequest(): string {
        return this.originalRequest;
    }

    public getTemplate(): string {
        return this.template + this.instructionTemplate + this.responseTemplate + this.toolTemplate;
    }

    public getInstructionTemplate(): string {
        return this.instructionTemplate;
    }

    public getResponseTemplate(): string {
        return this.responseTemplate;
    }

    public getToolTemplate(): string {
        return this.toolTemplate;
    }

}