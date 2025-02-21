import {AiMessage} from "./ai-message";
import {AiMessageResponse} from "./ai-message-response";

export interface LlmInvoke {
    invoke(model: string, messages: AiMessage[], systemPrompt: string, temperature?: number): Promise<AiMessageResponse>;
}