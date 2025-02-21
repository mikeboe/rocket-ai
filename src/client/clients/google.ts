import {AiMessage, AiMessageResponse, LlmInvoke, LlmStream} from "../../types";
import dotenv from "dotenv";
import {GoogleGenerativeAI, Content} from '@google/generative-ai';

dotenv.config();

export class GoogleAiClient implements LlmInvoke, LlmStream {

    protected apiKey: string;
    protected client: GoogleGenerativeAI;


    constructor(apiKey?: string) {
        this.apiKey = apiKey ?? process.env.GOOGLE_API_KEY!;
        this.client = new GoogleGenerativeAI(this.apiKey);


        if (!this.apiKey) {
            throw new Error('Gemini API key is required. Set it in config or via GEMINI_API_KEY environment variable.');
        }
    }

    async invoke(model: string, messages: AiMessage[]): Promise<AiMessageResponse> {

        const chatModel = this.client.getGenerativeModel({
            model
        })

        const mappedMessages: Content[] = messages.map((message) => {
            if (message.role === 'user') {
                return {
                    role: 'user',
                    parts: [{text: message.content}],
                };
            } else {
                return {
                    role: 'model',
                    parts: [{text: message.content}],
                };
            }
        });


        const chat = chatModel.startChat({
            history: mappedMessages,
            generationConfig: {
                maxOutputTokens: 4096,
                temperature: 0.7,
            },
        });

        const result = await chat.sendMessage(messages[messages.length - 1].content);
        const response = result.response;

        return {
            content: response.text(),
            usage: {
                inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
                outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
                totalTokens: response.usageMetadata?.totalTokenCount ?? 0
            }
        }

    }

    async *stream(model: string, messages: AiMessage[], systemPrompt: string): AsyncGenerator<AiMessageResponse, void, unknown> {

        const chatModel = this.client.getGenerativeModel({
            systemInstruction: systemPrompt,
            model
        })

        const mappedMessages: Content[] = messages.map((message) => {
            if (message.role === 'user') {
                return {
                    role: 'user',
                    parts: [{text: message.content}],
                };
            } else {
                return {
                    role: 'model',
                    parts: [{text: message.content}],
                };
            }
        });


        const chat = chatModel.startChat({
            history: mappedMessages,
            generationConfig: {
                maxOutputTokens: 4096,
                temperature: 0.7,
            },
        });

        const stream = await chat.sendMessageStream(messages[messages.length - 1].content);

        for await (const chunk of stream.stream) {
            yield {
                content: chunk.text(),
                usage: {
                    inputTokens: chunk.usageMetadata?.promptTokenCount ?? 0,
                    outputTokens: chunk.usageMetadata?.candidatesTokenCount ?? 0,
                    totalTokens: chunk.usageMetadata?.totalTokenCount ?? 0
                }
            }
        }
    }
}