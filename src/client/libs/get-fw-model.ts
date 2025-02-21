import { AiModelType } from "../../types"

export const getFwModel = (model: string) => {
    if (model === AiModelType.Llama33) {
        return "accounts/fireworks/models/llama-v3p3-70b-instruct"
    }

    if (model === AiModelType.DeepSeekV3) {
        return "accounts/fireworks/models/deepseek-v3"
    }

    if (model === AiModelType.DeepSeekR1) {
        return "accounts/fireworks/models/deepseek-r1"
    }

    return "accounts/fireworks/models/llama-v3p3-70b-instruct"
}