import {AiMessage, AiMessageResponse, LlmInvoke, LlmStream} from "../../types";
import Anthropic from '@anthropic-ai/sdk';
import dotenv from "dotenv";

dotenv.config();

export class AnthropicAiClient implements LlmInvoke, LlmStream {

    protected apiKey: string;
    protected baseUrl: string;


    constructor(protected client = new Anthropic(), apiKey?: string, baseUrl?: string) {
        this.apiKey = apiKey ?? process.env.ANTHROPIC_API_KEY!;
        this.baseUrl = baseUrl ?? 'https://api.anthropic.com/v1';


        if (!this.apiKey) {
            throw new Error('Anthropic API key is required. Set it in config or via ANTHROPIC_API_KEY environment variable.');
        }
    }

    async invoke(model: string, messages: AiMessage[], systemPrompt: string): Promise<AiMessageResponse> {



        const response = await this.client.messages.create({
            model: model,
            max_tokens: 4096,
            stream: false,
            messages: messages as any,
            system: systemPrompt
        });

        return {
            content: response.content[0].type === 'text' ? response.content[0].text : '',
            usage: {
                inputTokens: response.usage?.input_tokens ?? 0,
                outputTokens: response.usage?.output_tokens ?? 0,
                totalTokens: response.usage?.input_tokens + response.usage?.output_tokens
            }
        }
    }

    async *stream(model: string, messages: AiMessage[], systemPrompt: string): AsyncGenerator<AiMessageResponse, void, unknown> {
        const stream = this.client.messages.stream({
            model: model,
            messages: messages as any,
            max_tokens: 4096,
            system: systemPrompt
        })

        for await (const chunk of stream) {

            if (chunk.type === 'content_block_delta') {
                yield {
                    // @ts-expect-error - TS doesn't know about the content_block_delta type
                    content: chunk.delta.text ?? '',
                    usage: {
                        // @ts-expect-error - TS doesn't know about the content_block_delta type
                        inputTokens: chunk.usage?.prompt_tokens ?? 0,
                        // @ts-expect-error - TS doesn't know about the content_block_delta type
                        outputTokens: chunk.usage?.completion_tokens ?? 0,
                        // @ts-expect-error - TS doesn't know about the content_block_delta type
                        totalTokens: chunk.usage?.total_tokens ?? 0
                    }
                }
            }

            if (chunk.type === 'message_delta') {
                yield {
                    // @ts-expect-error - TS doesn't know about the content_block_delta type
                    content: chunk.delta.text ?? '',
                    usage: {
                        // @ts-expect-error - TS doesn't know about the content_block_delta type
                        inputTokens: chunk.usage?.prompt_tokens ?? 0,
                        outputTokens: chunk.usage?.output_tokens ?? 0,
                        // @ts-expect-error - TS doesn't know about the content_block_delta type
                        totalTokens: chunk.usage?.total_tokens ?? 0
                    }
                }
            }
        }
    }
}