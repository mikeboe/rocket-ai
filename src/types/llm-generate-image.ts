import {AiMessageResponseImage} from "./ai-message-response-image";
import {AiImageSize} from "./ai-image-size";

export interface LlmGenerateImage {
    generateImage(model: string, prompt: string, size: AiImageSize, n: number): Promise<AiMessageResponseImage>;
}