# RocketAI 

Simple AI client to interface with different LLMs in a unified way.

## Installation

```bash
npm install rocket-ai

# or
yarn add rocket-ai
```

## API Keys 

You need to set the api keys as environment variables. Those environment variables need to be present, even if they are just an empty string:

```bash
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
FIREWORKS_API_KEY=
```

## Usage

```typescript jsx
import {AiClient} from 'rocket-ai';

const aiClient = new AiClient();

// invoke
const response = await aiClient.invoke({
    model: 'gpt-4o',
    message: [{role: "user", content: "tell me a joke"}],
    systemPrompt: 'You are a helpful assistant.',
});

// stream
const stream = await aiClient.stream({
    model: 'gpt-4o',
    message: [{role: "user", content: "tell me a joke"}],
    systemPrompt: 'You are a helpful assistant.',
});

for await (const chunk of stream) {
    console.log(response);
}

// generate image
const image = await aiClient.generateImage({
    model: 'dall-e3',
    prompt: 'a painting of a flower vase',
    size: '1024x1024',
    n: 1
})

// generate speech
const speech = await aiClient.generateSpeech({
    model: 'tts-1',
    text: 'Hello, how are you doing today?',
    voice: 'alloy',
})

// structured output, works for stream an invoke
import {z} from 'zod';

const schema = z.object({
    joke: z.string(),
})

const structuredOutput = aiClient
    .withStructuredOutput(schema)
    .invoke({
        model: 'gpt-4o',
        message: [{role: "user", content: "tell me a joke"}],
        systemPrompt: 'You are a helpful assistant.',
    });
```

## Available Models

All models are available through the `AiModelType` enum:

- `gpt-4o`
- `gpt-4o-mini`
- `dall-e3`
- `tts-1`
- `o1-preview`
- `o1-mini`
- `claude-3-5-sonnet-latest`
- `claude-3-5-haiku-latest`
- `gemini-2.0-flash-latest`
- `gemini-1.5-flash-latest`
- `gemini-1.5-pro-latest`
- `fw-llama-3-3`
- `fw-deepseek-v3`
- `fw-deepseek-r1`

> note: `fw-llama-3-3`, `fw-deepseek-v3` and `fw-deepseek-r1` are used from the [Fireworks AI API](https://fireworks.ai/).

## License 

MIT