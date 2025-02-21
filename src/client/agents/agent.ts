import {AiClient} from "../ai-client";
import {z, ZodSchema} from "zod";
import {ToolRegistry} from "./tools";

export class Agent {
    private client: AiClient;
    private toolRegistry: ToolRegistry;
    private systemPrompt: string;

    constructor() {
        this.client = new AiClient();
        this.toolRegistry = new ToolRegistry();

        this.systemPrompt = `You are a helpful agent that is given a task.
    You have tools at your disposal, that you can call, and that will deliver you results.
    Based on those results, you can make decisions and take actions.
    Return the tool and its necessary input based on the information provided.
    You will be penalised if you don't stick to the necessary response format.`;
    }

    // Register available tools
    registerTools(tools: Array<any>) {
        this.toolRegistry.registerTools(tools);
    }

    // Execute the task by deciding the tool based on prompt and using it
    async executeTask(input: string) {
        // Collect tool information and schemas
        const toolInfos: Array<any> = [];
        const schemas: Record<string, ZodSchema<any>> = {};
        for (const toolName in this.toolRegistry.getAllTools()) {
            const toolInfo = this.toolRegistry.getToolInfo(toolName);
            if (toolInfo) {
                toolInfos.push(toolInfo);
                schemas[toolName] = toolInfo.queryFormat; // Assuming schema is part of the tool metadata
            }
        }

        // Construct the AI prompt
        const prompt = `${this.systemPrompt}
    You have these tools at your disposal: ${JSON.stringify(toolInfos)}.
    Strictly stick to the provided response format.`;

        const messages = [
            {
                role: "user",
                content: input,
            },
        ];

        // Define a dynamic schema for the AI response
        const responseSchema = z.object({
            tool: z.string().refine((toolName) => toolName in schemas, {message: "Invalid tool"}),
            input: z.any(),
        });

        // Interact with AI client to decide the tool and input
        const response = await this.client
            .withStructuredOutput(responseSchema)
            .invoke({
                model: 'gpt-4o-mini',
                messages,
                systemPrompt: prompt,
                temperature: 0.7,
            });

        const parsedRes = JSON.parse(response.content);
        console.log("parsedRes:", parsedRes);

        // Validate input using the selected tool's schema
        const selectedSchema = schemas[parsedRes.tool];
        // console.log("selectedSchema:", selectedSchema);
        // const validation = selectedSchema.safeParse(parsedRes.input);
        // if (!validation.success) {
        //     throw new Error("Invalid input format: " + validation.error.message);
        // }

        // Call the determined tool
        const toolResponse = await this.toolRegistry.callTool(parsedRes.tool, parsedRes.input);
        console.log("toolResponse:", toolResponse);

        // Craft final input for AI response generation
        const finalInput =
            `Initial Questions: ${input}\n` +
            `Tool Response: ${JSON.stringify(toolResponse)}\n`;

        const finalInputPrompt = `You are an AI assistant.
    You are given the following returned values from an API and a question.
    Provide a conversational answer.
    Keep your answer short and focus on the most important things.`;

        // Get final conversational answer from the AI client
        return await this.client
            .invoke({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: "user",
                        content: finalInput + "\n" + finalInputPrompt,
                    },
                ],
                systemPrompt: '',
                temperature: 0.7,
            });


    }
}
