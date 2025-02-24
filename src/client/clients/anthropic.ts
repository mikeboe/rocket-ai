import {AiMessage, AiMessageResponse, LlmInvoke, LlmStream} from "../../types";
import Anthropic from '@anthropic-ai/sdk';
import dotenv from "dotenv";

dotenv.config();


/**
 * The AnthropicAiClient class provides methods to interact with the Anthropic AI API.
 * It supports both synchronous invocation and streaming of AI responses.
 */
export class AnthropicAiClient implements LlmInvoke, LlmStream {

    protected apiKey: string;
    protected baseUrl: string;


    /**
     * Constructs an AnthropicAiClient instance.
     * @param {Anthropic} client - An instance of the Anthropic client.
     * @param {string} [apiKey] - The API key for authenticating with the Anthropic API.
     * @param {string} [baseUrl] - The base URL for the Anthropic API.
     * @throws Will throw an error if the API key is not provided.
     */
    constructor(protected client = new Anthropic(), apiKey?: string, baseUrl?: string) {
        this.apiKey = apiKey ?? process.env.ANTHROPIC_API_KEY!;
        this.baseUrl = baseUrl ?? 'https://api.anthropic.com/v1';


        if (!this.apiKey) {
            throw new Error('Anthropic API key is required. Set it in config or via ANTHROPIC_API_KEY environment variable.');
        }
    }

    /**
     * Invokes the AI model with the provided messages and system prompt.
     * @param {string} model - The model to use for the invocation.
     * @param {AiMessage[]} messages - An array of messages to send to the model.
     * @param {string} systemPrompt - The system prompt to use for the invocation.
     * @returns {Promise<AiMessageResponse>} - The response from the AI model.
     */
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

    /**
     * Streams the AI model responses for the provided messages and system prompt.
     * @param {string} model - The model to use for the streaming.
     * @param {AiMessage[]} messages - An array of messages to send to the model.
     * @param {string} systemPrompt - The system prompt to use for the streaming.
     * @returns {AsyncGenerator<AiMessageResponse, void, unknown>} - An async generator yielding AI model responses.
     */
    async* stream(model: string, messages: AiMessage[], systemPrompt: string): AsyncGenerator<AiMessageResponse, void, unknown> {
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