import {OpenAiClient} from "./clients/open-ai";
import {AnthropicAiClient} from "./clients/anthropic";
import {GoogleAiClient} from "./clients/google";
import {FireworksAiClient} from "./clients/fireworks-ai";
import {z} from "zod";
import zodToJsonSchema from 'zod-to-json-schema';
import {
    InvokeOptions,
    StreamOptions,
    AiMessageResponse,
    AiMessageResponseImage,
    AiModelType,
    AiVoice,
    GenerateImageOptions
} from '../types';
import { Tool } from "./agents/tools/tool";
import { generateSchema } from "@anatine/zod-openapi";

/**
 * AiClient class provides methods to interact with various AI model providers.
 * It supports invoking models, streaming responses, generating images, and generating speech.
 */
export class AiClient {
    private structuredOutputSchema?: z.ZodSchema<any>;
    private options: Partial<InvokeOptions & StreamOptions> = {};

    /**
     * Constructs an instance of AiClient.
     * @param clients - Optional custom clients for AI providers.
     * @param modelProviderMap - Optional custom mapping of models to providers.
     */
    constructor(private clients?: any, private modelProviderMap?: any) {
        this.clients = {
            openai: new OpenAiClient(),
            anthropic: new AnthropicAiClient(),
            gemini: new GoogleAiClient(),
            fireworks: new FireworksAiClient()
        };

        this.modelProviderMap = {
            [AiModelType.Gpt4o]: 'openai',
            [AiModelType.Gpt4oMini]: 'openai',
            [AiModelType.GptTextToSpeech]: 'openai',
            [AiModelType.DallE3]: 'openai',
            [AiModelType.O1Preview]: 'openai',
            [AiModelType.O1Mini]: 'openai',
            [AiModelType.Claude35SonnetLatest]: 'anthropic',
            [AiModelType.Claude35HaikuLatest]: 'anthropic',
            [AiModelType.Gemini20FlashLatest]: 'gemini',
            [AiModelType.Gemini15FlashLatest]: 'gemini',
            [AiModelType.Gemini15ProLatest]: 'gemini',
            [AiModelType.Llama33]: 'fireworks',
            [AiModelType.DeepSeekV3]: 'fireworks',
            [AiModelType.DeepSeekR1]: 'fireworks',
        };
    }

    /**
     * Gets the provider name by model type.
     * @param model - The model type.
     * @returns The provider name.
     * @throws Will throw an error if no provider is found for the model.
     */
    _getProviderByModel(model: string) {
        const provider = this.modelProviderMap[model];
        if (!provider) {
            throw new Error(`No provider found for model: ${model}`);
        }
        return provider;
    }

    /**
     * Sets the structured output schema for the client.
     * @param schema - The Zod schema for structured output.
     * @returns The AiClient instance.
     */
    withStructuredOutput(schema: z.ZodSchema<any>): AiClient {
        this.structuredOutputSchema = schema;
        return this;
    }

    /**
     * Sets options for invoking or streaming.
     * @param options - The options to set.
     * @returns The AiClient instance.
     */
    setOptions(options: Partial<InvokeOptions & StreamOptions>): AiClient {
        this.options = {...this.options, ...options};
        return this;
    }

    /**
     * Invokes an AI model with the given options.
     * @param options - The options for invoking the model.
     * @returns A promise that resolves to the AI message response.
     */
    async invoke(options: InvokeOptions): Promise<AiMessageResponse> {
        const fullOptions = this.prepareOptions(options);
        return this._invokeOrStream(fullOptions, 'invoke');
    }

    /**
     * Streams responses from an AI model with the given options.
     * @param options - The options for streaming responses.
     * @returns A promise that resolves to an async generator of AI message responses.
     */
    async stream(options: StreamOptions): Promise<AsyncGenerator<AiMessageResponse, void, unknown>> {
        const fullOptions = this.prepareOptions(options);
        return this._invokeOrStream(fullOptions, 'stream');
    }

    /**
     * Prepares options by adding the structured output schema to the system prompt if available.
     * @param options - The options to prepare.
     * @returns The prepared options.
     */
    private prepareOptions(options: InvokeOptions | StreamOptions): InvokeOptions | StreamOptions {
        let {systemPrompt} = options;

        if (this.structuredOutputSchema) {
            const jsonSchema = generateSchema(this.structuredOutputSchema);
            systemPrompt += `\n\nSchema for output: ${JSON.stringify(jsonSchema)}`;
        }

        return {...options, systemPrompt};
    }

    /**
     * Invokes or streams responses from an AI model based on the method specified.
     * @param options - The options for invoking or streaming.
     * @param method - The method to use ('invoke' or 'stream').
     * @returns A promise that resolves to the AI message response or an async generator of AI message responses.
     * @throws Will throw an error if the provider is not configured.
     */
    private async _invokeOrStream(
        options: InvokeOptions | StreamOptions,
        method: 'invoke',
    ): Promise<AiMessageResponse>;
    private async _invokeOrStream(
        options: InvokeOptions | StreamOptions,
        method: 'stream',
    ): Promise<AsyncGenerator<AiMessageResponse, void, unknown>>;
    private async _invokeOrStream(
        options: InvokeOptions | StreamOptions,
        method: 'invoke' | 'stream'
    ): Promise<any> {
        const {model, messages, systemPrompt} = options;
        const provider = this._getProviderByModel(model);
        const client = this.clients[provider];

        if (!client) {
            throw new Error(`Provider ${provider} is not configured.`);
        }

        // eslint-disable-next-line no-useless-catch
        try {
            return await client[method](model, messages, systemPrompt);
        } catch (e) {
            throw e;
        }
    }

    /**
     * Generates an image using the specified options.
     * @param options - The options for generating the image.
     * @returns A promise that resolves to the AI message response image.
     * @throws Will throw an error if the provider is not configured.
     */
    async generateImage(options: GenerateImageOptions): Promise<AiMessageResponseImage> {
        const {model, prompt, size, n} = options;
        const provider = this._getProviderByModel(model);
        const client = this.clients[provider];

        if (!client) {
            throw new Error(`Provider ${provider} is not configured.`);
        }
        try {
            return await client.generateImage(model, prompt, size, n);
        } catch (e) {
            throw e;
        }
    }

    /**
     * Generates speech using the specified model, messages, and voice.
     * @param model - The model type.
     * @param messages - The messages to convert to speech.
     * @param voice - The voice to use for speech generation.
     * @returns A promise that resolves to the generated speech as a string.
     * @throws Will throw an error if the provider is not configured.
     */
    async generateSpeech(model: string, messages: string, voice: AiVoice): Promise<string> {
        const provider = this._getProviderByModel(model);
        const client = this.clients[provider];

        if (!client) {
            throw new Error(`Provider ${provider} is not configured.`);
        }
        try {
            return await client.generateSpeech(model, messages, voice);
        } catch (e) {
            throw e;
        }
    }
}