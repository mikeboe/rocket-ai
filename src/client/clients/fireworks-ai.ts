import {
    AiMessage,
    AiMessageResponse,
    LlmInvoke,
    LlmStream
} from "../../types";
import dotenv from "dotenv";
import OpenAi from "openai";
import {getFwModel} from "../libs/get-fw-model";


dotenv.config();


export class FireworksAiClient implements LlmInvoke, LlmStream {

    protected apiKey: string;
    protected baseUrl: string;


    constructor(protected client = new OpenAi(), apiKey?: string, baseUrl?: string) {
        this.apiKey = apiKey ?? process.env.FIREWORKS_API_KEY!;
        this.baseUrl = baseUrl ?? 'https://api.fireworks.ai/inference/v1';


        if (!this.apiKey) {
            throw new Error('FireworksAI API key is required. Set it in config or via FIREWORKS_API_KEY environment variable.');
        }
    }

    async invoke(model: string, messages: AiMessage[], systemPrompt: string): Promise<AiMessageResponse> {

        messages.unshift({
            role: 'system',
            content: systemPrompt
        })

        const response = await this.client.chat.completions.create({
            model: getFwModel(model),
            messages: messages as any
        });

        return {
            content: response.choices[0]?.message?.content ?? '',
            usage: {
                inputTokens: response.usage?.prompt_tokens ?? 0,
                outputTokens: response.usage?.completion_tokens ?? 0,
                totalTokens: response.usage?.total_tokens ?? 0
            }
        }
    }

    async* stream(model: string, messages: AiMessage[], systemPrompt: string): AsyncGenerator<AiMessageResponse, void, unknown> {

        messages.unshift({
            role: 'system',
            content: systemPrompt
        })

        const stream = await this.client.chat.completions.create({
            model: getFwModel(model),
            messages: messages as any,
            stream: true,
            stream_options: {
                include_usage: true
            }
        })

        for await (const chunk of stream) {
            yield {
                content: chunk.choices[0]?.delta?.content ?? '',
                usage: {
                    inputTokens: chunk.usage?.prompt_tokens ?? 0,
                    outputTokens: chunk.usage?.completion_tokens ?? 0,
                    totalTokens: chunk.usage?.total_tokens ?? 0
                }
            }
        }
    }
}