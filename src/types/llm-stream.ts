import { AiMessage } from "./ai-message";
import { AiMessageResponse } from "./ai-message-response";

export interface LlmStream {
    stream(model: string, messages: AiMessage[], systemPrompt: string): AsyncGenerator<AiMessageResponse, void, unknown>;
}