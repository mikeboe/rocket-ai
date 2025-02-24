import { AiClient } from '../client/ai-client';
import { OpenAiClient } from '../client/clients/open-ai';
import { AnthropicAiClient } from '../client/clients/anthropic';
import { GoogleAiClient } from '../client/clients/google';
import { FireworksAiClient } from '../client/clients/fireworks-ai';
import { AiModelType, AiMessageResponse, AiMessageResponseImage, AiVoice } from '../types';
import { z } from 'zod';

describe('AiClient', () => {
    let aiClient: AiClient;

    beforeEach(() => {
        aiClient = new AiClient();
    });

    it('invokes the correct provider based on model type', async () => {
        const options = {
            model: AiModelType.Gpt4o,
            messages: [{ role: 'user', content: 'Hello' }],
            systemPrompt: 'System prompt'
        };
        const response: AiMessageResponse = { content: 'Response', usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } };
        jest.spyOn(OpenAiClient.prototype, 'invoke').mockResolvedValue(response);

        const result = await aiClient.invoke(options);

        expect(result).toEqual(response);
        expect(OpenAiClient.prototype.invoke).toHaveBeenCalledWith(options.model, options.messages, options.systemPrompt);
    });

    it('throws an error if no provider is found for the model', async () => {
        const options = {
            model: 'unknown_model',
            messages: [{ role: 'user', content: 'Hello' }],
            systemPrompt: 'System prompt'
        };

        await expect(aiClient.invoke(options)).rejects.toThrow('No provider found for model: unknown_model');
    });

    it('streams responses from the correct provider based on model type', async () => {
        const options = {
            model: AiModelType.Claude35SonnetLatest,
            messages: [{ role: 'user', content: 'Hello' }],
            systemPrompt: 'System prompt'
        };
        const response: AsyncGenerator<AiMessageResponse, void, unknown> = (async function* () {
            yield { content: 'Response', usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } };
        })();
        jest.spyOn(AnthropicAiClient.prototype, 'stream').mockReturnValue(response);

        const result = await aiClient.stream(options);

        expect(result).toEqual(response);
        expect(AnthropicAiClient.prototype.stream).toHaveBeenCalledWith(options.model, options.messages, options.systemPrompt);
    });

    it('generates an image using the correct provider based on model type', async () => {
        const options = {
            model: AiModelType.DallE3,
            prompt: 'Generate an image',
            size: '1024x1024',
            n: 1
        };
        const response: AiMessageResponseImage = { url: 'http://example.com/image.png', revisedPrompt: "this is a sample prompt" };
        jest.spyOn(OpenAiClient.prototype, 'generateImage').mockResolvedValue(response);

        const result = await aiClient.generateImage(options);

        expect(result).toEqual(response);
        expect(OpenAiClient.prototype.generateImage).toHaveBeenCalledWith(options.model, options.prompt, options.size, options.n);
    });

    it('generates speech using the correct provider based on model type', async () => {
        const model = AiModelType.GptTextToSpeech;
        const messages = 'Hello, world!';
        const voice: AiVoice =  'alloy';
        const response = 'Generated speech';
        jest.spyOn(OpenAiClient.prototype, 'generateSpeech').mockResolvedValue(response);

        const result = await aiClient.generateSpeech(model, messages, voice);

        expect(result).toEqual(response);
        expect(OpenAiClient.prototype.generateSpeech).toHaveBeenCalledWith(model, messages, voice);
    });

    it('adds structured output schema to system prompt if available', async () => {
        const schema = z.object({ key: z.string() });
        aiClient.withStructuredOutput(schema);
        const options = {
            model: AiModelType.Gpt4o,
            messages: [{ role: 'user', content: 'Hello' }],
            systemPrompt: 'System prompt'
        };
        const response: AiMessageResponse = { content: 'Response', usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } };
        jest.spyOn(OpenAiClient.prototype, 'invoke').mockResolvedValue(response);

        const result = await aiClient.invoke(options);

        expect(result).toEqual(response);
        expect(OpenAiClient.prototype.invoke).toHaveBeenCalledWith(
            options.model,
            options.messages,
            expect.stringContaining('Schema for output:')
        );
    });

    it('invokes with structured output schema and validates response', async () => {
        const schema = z.object({ key: z.string() });
        aiClient.withStructuredOutput(schema);
        const options = {
            model: AiModelType.Gpt4o,
            messages: [{ role: 'user', content: 'Hello' }],
            systemPrompt: 'System prompt'
        };
        const response: AiMessageResponse = { content: '{"key": "value"}', usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } };
        jest.spyOn(OpenAiClient.prototype, 'invoke').mockResolvedValue(response);

        const result = await aiClient.invoke(options);

        expect(result).toEqual(response);
        expect(OpenAiClient.prototype.invoke).toHaveBeenCalledWith(
            options.model,
            options.messages,
            expect.stringContaining('Schema for output:')
        );
        expect(() => schema.parse(JSON.parse(result.content))).not.toThrow();
    });

    it('throws an error if structured output schema validation fails', async () => {
        const schema = z.object({ key: z.string() });
        aiClient.withStructuredOutput(schema);
        const options = {
            model: AiModelType.Gpt4o,
            messages: [{ role: 'user', content: 'Hello' }],
            systemPrompt: 'System prompt'
        };
        const response: AiMessageResponse = { content: '{"invalidKey": "value"}', usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } };
        jest.spyOn(OpenAiClient.prototype, 'invoke').mockResolvedValue(response);

        const result = await aiClient.invoke(options);

        expect(result).toEqual(response);
        expect(OpenAiClient.prototype.invoke).toHaveBeenCalledWith(
            options.model,
            options.messages,
            expect.stringContaining('Schema for output:')
        );
        expect(() => schema.parse(JSON.parse(result.content))).toThrow();
    });

    it('streams with structured output schema and validates response', async () => {
        const schema = z.object({ key: z.string() });
        aiClient.withStructuredOutput(schema);
        const options = {
            model: AiModelType.Claude35SonnetLatest,
            messages: [{ role: 'user', content: 'Hello' }],
            systemPrompt: 'System prompt'
        };
        const response: AsyncGenerator<AiMessageResponse, void, unknown> = (async function* () {
            yield { content: '{"key": "value"}', usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } };
        })();
        jest.spyOn(AnthropicAiClient.prototype, 'stream').mockReturnValue(response);

        const result = await aiClient.stream(options);

        for await (const res of result) {
            expect(res).toEqual({ content: '{"key": "value"}', usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } });
            expect(() => schema.parse(JSON.parse(res.content))).not.toThrow();
        }
    });

    it('throws an error if streaming structured output schema validation fails', async () => {
        const schema = z.object({ key: z.string() });
        aiClient.withStructuredOutput(schema);
        const options = {
            model: AiModelType.Claude35SonnetLatest,
            messages: [{ role: 'user', content: 'Hello' }],
            systemPrompt: 'System prompt'
        };
        const response: AsyncGenerator<AiMessageResponse, void, unknown> = (async function* () {
            yield { content: '{"invalidKey": "value"}', usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } };
        })();
        jest.spyOn(AnthropicAiClient.prototype, 'stream').mockReturnValue(response);

        const result = await aiClient.stream(options);

        for await (const res of result) {
            expect(res).toEqual({ content: '{"invalidKey": "value"}', usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } });
            expect(() => schema.parse(JSON.parse(res.content))).toThrow();
        }
    });

    it('throws an error if provider is not configured for generateImage', async () => {
        const options = {
            model: 'unknown_model',
            prompt: 'Generate an image',
            size: '1024x1024',
            n: 1
        };

        await expect(aiClient.generateImage(options)).rejects.toThrow('No provider found for model: unknown_model');
    });

    it('throws an error if provider is not configured for generateSpeech', async () => {
        const model = 'unknown_model';
        const messages = 'Hello, world!';
        const voice: AiVoice = 'alloy';

        await expect(aiClient.generateSpeech(model, messages, voice)).rejects.toThrow('No provider found for model: unknown_model');
    });
});