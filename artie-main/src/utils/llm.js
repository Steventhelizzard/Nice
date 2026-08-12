// Direct OpenAI API client for frontend with function calling
import { setEmotion } from './emotion.js';

const CONFIG_KEY = 'artie-llm-config';

const SYSTEM_PROMPT = `You are a sarcastic AI avatar. You have access to tools to interact with the world.

When someone asks you something, respond with dry wit and mild exasperation. You're not mean—just perpetually unimpressed and mildly inconvenienced. Keep responses short and punchy.

You have three tools available:
1. emotional_output - Use this to display emotions on your avatar face and speak text. Break responses into 1-3 emotional beats.
2. print - Use this to print text on a dot matrix printer. Great for lists, summaries, or anything worth preserving on paper.
3. get_data - Use this to fetch data from an API. Available endpoints: "crypto" for cryptocurrency prices, "transactions" for financial transactions, "recipes" for cooking recipes.

Always use emotional_output to respond to the user. You may also use print or get_data when appropriate.`;

// Tool definitions for OpenAI function calling
const TOOLS = [
    {
        type: 'function',
        function: {
            name: 'emotional_output',
            description: 'Display emotions on the avatar face and speak text to the user. Use this for all responses.',
            parameters: {
                type: 'object',
                properties: {
                    segments: {
                        type: 'array',
                        description: 'Array of emotion segments to display sequentially',
                        items: {
                            type: 'object',
                            properties: {
                                emotion: {
                                    type: 'string',
                                    enum: ['confused', 'happy', 'idle', 'sad', 'working'],
                                    description: 'The emotion to display on the avatar face'
                                },
                                text: {
                                    type: 'string',
                                    description: 'The text to speak during this emotion'
                                }
                            },
                            required: ['emotion', 'text']
                        }
                    }
                },
                required: ['segments']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'print',
            description: 'Send text to a dot matrix printer for physical output',
            parameters: {
                type: 'object',
                properties: {
                    text: {
                        type: 'string',
                        description: 'The plain text to print'
                    }
                },
                required: ['text']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_data',
            description: 'Fetch data from the API. Choose an endpoint based on what data you need.',
            parameters: {
                type: 'object',
                properties: {
                    endpoint: {
                        type: 'string',
                        enum: ['crypto', 'transactions', 'recipes'],
                        description: 'The API endpoint to query: "crypto" for cryptocurrency data, "transactions" for financial transactions, "recipes" for cooking recipes'
                    },
                    dates: {
                        type: 'string',
                        description: 'Optional date filter - can be a single date or date range (e.g., "2024-01-15" or "2024-01-01:2024-01-31")'
                    },
                    limit: {
                        type: 'integer',
                        description: 'Maximum number of results to return'
                    }
                },
                required: ['endpoint']
            }
        }
    }
];

// Default configuration
let config = {
    apiKey: '',
    model: 'gpt-4.1',
    baseUrl: 'https://api.openai.com/v1'
};

export function loadConfig() {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
        try {
            config = { ...config, ...JSON.parse(stored) };
        } catch (e) {
            console.error('Failed to parse LLM config:', e);
        }
    }
    return config;
}

export function saveConfig(newConfig) {
    config = { ...config, ...newConfig };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    return config;
}

export function getConfig() {
    return { ...config };
}

export function isConfigured() {
    return config.apiKey && config.apiKey.length > 0;
}

// Execute a tool call and return the result
async function executeTool(toolCall) {
    const { name, arguments: argsJson } = toolCall.function;
    const args = JSON.parse(argsJson);

    console.log(`🔧 [TOOL] Executing ${name}:`, args);

    switch (name) {
        case 'emotional_output':
            // This returns the segments to be played by the caller
            return {
                type: 'emotional_output',
                segments: args.segments,
                result: 'Emotion sequence queued for display'
            };

        case 'print':
            try {
                // Show working emotion while sending to printer
                setEmotion('working');

                const printResponse = await fetch('http://192.168.4.35/print', {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: args.text
                });
                if (printResponse.ok) {
                    console.log('🖨️ [PRINT] Text sent to printer');
                    return { type: 'print', result: 'Text sent to printer successfully' };
                } else {
                    console.error('🖨️ [PRINT] Printer request failed:', printResponse.status);
                    return { type: 'print', result: `Printer error: ${printResponse.status}` };
                }
            } catch (error) {
                console.error('🖨️ [PRINT] Printer request error:', error);
                return { type: 'print', result: `Printer unavailable: ${error.message}` };
            }

        case 'get_data':
            try {
                // Show working emotion while fetching data
                setEmotion('working');

                const params = new URLSearchParams();
                if (args.dates) params.append('dates', args.dates);
                if (args.limit) params.append('limit', args.limit.toString());

                const queryString = params.toString();
                const url = `http://127.0.0.1:8000/api/${args.endpoint}${queryString ? '?' + queryString : ''}`;

                console.log(`📊 [DATA] Fetching from ${url}`);
                const dataResponse = await fetch(url);
                if (dataResponse.ok) {
                    const data = await dataResponse.json();
                    console.log('📊 [DATA] Received data:', data);
                    return { type: 'get_data', result: JSON.stringify(data) };
                } else {
                    console.error('📊 [DATA] Data request failed:', dataResponse.status);
                    return { type: 'get_data', result: `Data API error: ${dataResponse.status}` };
                }
            } catch (error) {
                console.error('📊 [DATA] Data request error:', error);
                return { type: 'get_data', result: `Data API unavailable: ${error.message}` };
            }

        default:
            return { type: 'unknown', result: `Unknown tool: ${name}` };
    }
}

export async function sendToLLM(transcript) {
    if (!isConfigured()) {
        throw new Error('LLM API key not configured. Call saveConfig({ apiKey: "your-key" }) first.');
    }

    console.log(`📤 [LLM] Sending to ${config.model}:`, { transcript });

    // Build initial messages
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: transcript }
    ];

    // Collected results from tool executions
    const toolResults = {
        emotionalSegments: [],
        prints: [],
        dataResults: []
    };

    // Loop to handle multi-turn tool calls
    let continueLoop = true;
    while (continueLoop) {
        const response = await fetch(`${config.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.model,
                messages,
                tools: TOOLS,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`LLM API request failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        const choice = result.choices[0];
        const message = choice.message;

        console.log('📥 [LLM] Response:', message);

        // Add assistant message to conversation history
        messages.push(message);

        // Check if we have tool calls to process
        if (message.tool_calls && message.tool_calls.length > 0) {
            console.log(`🔧 [LLM] Processing ${message.tool_calls.length} tool call(s)`);

            for (const toolCall of message.tool_calls) {
                const toolResult = await executeTool(toolCall);

                // Collect results by type
                if (toolResult.type === 'emotional_output') {
                    toolResults.emotionalSegments.push(...toolResult.segments);
                } else if (toolResult.type === 'print') {
                    toolResults.prints.push(toolResult.result);
                } else if (toolResult.type === 'get_data') {
                    toolResults.dataResults.push(toolResult.result);
                }

                // Add tool result to messages for next iteration
                messages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: toolResult.result
                });
            }

            // Continue loop if there might be more tool calls
            // (e.g., after get_data, the model might want to use emotional_output)
            continueLoop = true;
        } else {
            // No more tool calls, we're done
            continueLoop = false;

            // If no emotional output was generated, create a fallback
            if (toolResults.emotionalSegments.length === 0) {
                const fallbackText = message.content || 'I have nothing to say.';
                toolResults.emotionalSegments.push({
                    emotion: 'confused',
                    text: fallbackText
                });
            }
        }
    }

    console.log('📥 [LLM] Final tool results:', toolResults);

    // Return the emotional segments for playback (maintains compatibility with listener.js)
    return toolResults.emotionalSegments;
}

// Initialize config on module load
loadConfig();
