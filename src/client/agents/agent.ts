import {AiClient} from "../ai-client";
import {z, ZodSchema} from "zod";
import {ToolRegistry} from "./tools";
import {PromptTemplate} from "../prompts";
import {UsageCounter} from "../libs/usage-counter";
import {ReActTemplate} from "../prompts/react-template";
import {AiMessageResponse} from "../../types";

/**
 * The Agent class is responsible for managing the interaction with the AI client,
 * handling tool registration, and executing tasks based on user input.
 */
export class Agent {
    private client: AiClient;
    private toolRegistry: ToolRegistry;
    private promptTemplate: ReActTemplate;
    private usageCounter: UsageCounter;

    /**
     * Constructs an Agent instance.
     * @param {string} name - The name of the agent.
     * @param {string} [systemPrompt] - An optional system prompt to initialize the agent with.
     */
    constructor(name: string, systemPrompt?: string) {
        this.client = new AiClient();
        this.toolRegistry = new ToolRegistry();

        this.promptTemplate = new ReActTemplate(name);
        systemPrompt ? this.promptTemplate.addInstruction(systemPrompt) : this.promptTemplate.useDefaultInstructions();
        this.usageCounter = new UsageCounter();
    }

    /**
     * Registers a list of tools with the agent.
     * @param {Array<any>} tools - An array of tools to register.
     */
    registerTools(tools: Array<any>) {
        this.toolRegistry.registerTools(tools);
    }

    /**
     * Executes a task based on the provided input.
     * @param {string} input - The input string for the task.
     * @returns {Promise<AiMessageResponse>} - The final response from the agent.
     */
    async executeTask(input: string): Promise<AiMessageResponse> {
        this.promptTemplate.addOriginalRequest(input);

        const toolInfos: Array<any> = [];
        const schemas: Record<string, ZodSchema<any>> = {};
        for (const toolName in this.toolRegistry.getAllTools()) {
            const toolInfo = this.toolRegistry.getToolInfo(toolName);
            if (toolInfo) {
                toolInfos.push(toolInfo);
                schemas[toolName] = toolInfo.queryFormat;
            }
        }

        this.promptTemplate.addTool(`You have these tools at your disposal: ${JSON.stringify(toolInfos, null, 2)}`);

        let nextPrompt = input;
        let finalResponse: any = null;
        const maxIterations = 10;
        let count = 0;

        while (count < maxIterations) {
            count++;
            const prompt = this.promptTemplate.getInstructions();

            const reActSchema = z.object({
                thought: z.string(),
                action: z.object({
                    tool: z.string().refine((toolName) => toolName in schemas, {message: "Invalid tool"}),
                    input: z.any(),
                }).optional(),
                answer: z.string(),
            });

            const response = await this.client.withStructuredOutput(
                reActSchema
            ).invoke({
                model: 'gpt-4o-mini',
                messages: [{role: "user", content: nextPrompt}],
                systemPrompt: prompt,
                temperature: 0,
            });

            this.usageCounter.addUsageTokens(response.usage);
            const parsedResponse = reActSchema.safeParse(JSON.parse(response.content));

            if (parsedResponse.success && parsedResponse.data.answer) {
                finalResponse = parsedResponse.data.answer;
                break;
            }

            if (parsedResponse.success && parsedResponse.data.action) {
                const action = parsedResponse.data.action;

                const selectedSchema = schemas[action.tool];
                const toolResponse = await this.toolRegistry.callTool(action.tool, action.input);
                nextPrompt = `Observation: ${toolResponse}`;
                this.promptTemplate.addIteration(count, nextPrompt);
            } else {
                break;  // No action or answer and to prevent infinite loop
            }
        }

        return {
            content: finalResponse ? finalResponse : "No valid answer could be provided.",
            usage: this.usageCounter.getUsage()
        };
    }
}