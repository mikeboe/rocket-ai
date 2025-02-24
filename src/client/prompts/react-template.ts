/**
 * The ReActTemplate class is responsible for managing the template used by the ReAct Agent.
 * It provides methods to add various sections to the template and retrieve the final template.
 */
export class ReActTemplate {
    private template: string;
    private originalRequestTemplate: string = '## Original Request\n\n';
    private toolTemplate: string = '## Tools\n\n';
    private instructionTemplate: string = '## Instructions\n\n';
    private iterationTemplate: string = '## Iterations\n\n';

    /**
     * Constructs a ReActTemplate instance.
     * @param {string} name - The name of the agent.
     */
    constructor(name: string) {
        this.template = "# ReAct Agent\n\n";
    }

    /**
     * Adds the default instructions to the instruction template.
     */
    public useDefaultInstructions(): void {
        this.addInstruction("You run in a loop of Thought, Action, PAUSE, Observation.\n" +
            "At the end of the loop you output an Answer\n" +
            "Strictly follow the provided response format.\n" +
            "Use Thought to describe your thoughts about the question you have been asked.\n" +
            "Use Action to run one of the actions available to you\n" +
            "Observation will be the result of running those actions.\n"
        );
    }

    /**
     * Adds the original request to the original request template.
     * @param {string} request - The original request to add.
     */
    public addOriginalRequest(request: string): void {
        this.originalRequestTemplate += `${request}\n\n`;
    }

    /**
     * Adds an instruction to the instruction template.
     * @param {string} instruction - The instruction to add.
     */
    public addInstruction(instruction: string): void {
        this.instructionTemplate += `${instruction}\n\n`;
    }

    /**
     * Adds a tool to the tool template.
     * @param {string} tool - The tool to add.
     */
    public addTool(tool: string): void {
        this.toolTemplate += `${tool}\n\n`;
    }

    /**
     * Adds an iteration to the iteration template.
     * @param {number} iteration - The iteration number.
     * @param {string} content - The content of the iteration.
     */
    public addIteration(iteration: number, content: string): void {
        this.iterationTemplate += `### Iteration ${iteration}\n\n${content}\n\n`;
    }

    /**
     * Retrieves the complete template including all sections.
     * @returns {string} The complete template.
     */
    public getTemplate(): string {
        return this.template + this.originalRequestTemplate + this.instructionTemplate + this.toolTemplate + this.iterationTemplate;
    }

    /**
     * Retrieves the template with instructions, original request, and tools.
     * @returns {string} The template with instructions.
     */
    public getInstructions(): string {
        return this.template + this.originalRequestTemplate + this.instructionTemplate + this.toolTemplate;
    }
}