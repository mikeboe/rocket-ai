import {AiVoice} from "./ai-voice";

export interface LlmGenerateSpeech {
    generateSpeech(model: string, prompt: string, voice: AiVoice): Promise<string>;
}