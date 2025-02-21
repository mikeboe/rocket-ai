import { AiMessageUsage } from "./ai-message-usage";

export type AiMessageResponse = {
    content: string;
    usage: AiMessageUsage;
}