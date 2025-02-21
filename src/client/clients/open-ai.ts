import {
    AiImageSize, AiMessage, AiMessageResponse, AiMessageResponseImage, AiVoice, LlmGenerateImage,
    LlmGenerateSpeech, LlmInvoke, LlmStream
} from "../../types";
import dotenv from "dotenv";
import OpenAi from "openai";


dotenv.config();


export class OpenAiClient implements LlmInvoke, LlmStream, LlmGenerateImage, LlmGenerateSpeech {

    protected apiKey: string;
    protected baseUrl: string;


    constructor(protected client = new OpenAi(), apiKey?: string, baseUrl?: string) {
        this.apiKey = apiKey ?? process.env.OPENAI_API_KEY!;
        this.baseUrl = baseUrl ?? 'https://api.openai.com/v1';


        if (!this.apiKey) {
            throw new Error('OpenAI API key is required. Set it in config or via OPENAI_API_KEY environment variable.');
        }
    }

    async invoke(model: string, messages: AiMessage[], systemPrompt: string, temperature: number = 0.7): Promise<AiMessageResponse> {

        messages.unshift({
            role: 'system',
            content: systemPrompt
        })

        const response = await this.client.chat.completions.create({
            model: model,
            messages: messages as any,
            temperature
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

    async* stream(model: string, messages: AiMessage[], systemPrompt: string, temperature: number = 0.7): AsyncGenerator<AiMessageResponse, void, unknown> {

        messages.unshift({
            role: 'system',
            content: systemPrompt,
        })

        const stream = await this.client.chat.completions.create({
            model: model,
            messages: messages as any,
            temperature,
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

    async generateImage(model: string, messages: string, size: AiImageSize, n = 1): Promise<AiMessageResponseImage> {
        const response = await this.client.images.generate({
            model: 'dall-e-3',
            prompt: messages,
            n: n,
            size: size
        });

        return {
            url: response.data[0]?.url ?? '',
            revisedPrompt: response.data[0]?.revised_prompt ?? '',
        }
    }

    async generateSpeech(model: string, messages: string, voice: AiVoice): Promise<string> {
        const voiceResponse = await this.client.audio.speech.create({
            model: 'tts-1',
            input: messages,
            voice: voice,
        });

        const buffer = Buffer.from(await voiceResponse.arrayBuffer());
        return buffer.toString('base64');
    }

}