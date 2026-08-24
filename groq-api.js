// Use native fetch if available (Node 18+), fallback to node-fetch if needed
const getFetch = () => {
    if (typeof fetch !== 'undefined') return fetch;
    return import('node-fetch').then(mod => mod.default);
};

class GroqAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.defaultModel = 'llama-3.3-70b-versatile';
        this.visionModel = 'llama-3.2-11b-vision-preview';
        this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        this.supportedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
        this.maxImageSize = 10 * 1024 * 1024; // 10MB
    }

    getSystemPrompt() {
        return `You are ChatterBot, a friendly, intelligent, and helpful AI assistant. Provide clear, accurate, and concise answers in the language the user speaks to you in. Use markdown formatting and KaTeX syntax for math equations when helpful. If an image is provided, analyze and describe it accurately according to the user's request.`;
    }

    async generateResponse(messages, options = {}) {
        if (!this.apiKey) {
            throw new Error('GROQ_API_KEY environment variable is not set. Please add it to your environment variables.');
        }

        if (!messages || messages.length === 0) {
            throw new Error('No messages provided');
        }

        try {
            const fetchFn = await getFetch();
            const messagesCopy = JSON.parse(JSON.stringify(messages));
            const systemPrompt = options.systemPrompt || this.getSystemPrompt();
            
            let currentModel = options.model || this.defaultModel;
            
            // Handle image if provided
            if (options.imageData) {
                currentModel = this.visionModel;
                const lastUserMessageIndex = messagesCopy.map(m => m.role).lastIndexOf('user');
                if (lastUserMessageIndex !== -1) {
                    let userText = messagesCopy[lastUserMessageIndex].content || '';
                    if (typeof userText !== 'string') {
                        userText = typeof userText === 'object' ? JSON.stringify(userText) : String(userText);
                    }
                    userText = userText.replace(' [Image attached]', '').trim();
                    
                    messagesCopy[lastUserMessageIndex] = {
                        role: 'user',
                        content: [
                            { type: 'text', text: userText || 'Please analyze this image.' },
                            { type: 'image_url', image_url: { url: options.imageData } }
                        ]
                    };
                }
            }

            // Check if system prompt is already in messages, otherwise prepend
            const hasSystemPrompt = messagesCopy.some(m => m.role === 'system');
            const formattedMessages = hasSystemPrompt
                ? messagesCopy
                : [{ role: 'system', content: systemPrompt }, ...messagesCopy];

            const requestBody = {
                model: currentModel,
                messages: formattedMessages,
                temperature: 0.7,
                max_tokens: 4096,
                top_p: 0.95,
                frequency_penalty: 0.5
            };

            const response = await fetchFn(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `Groq API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || 'No response content';
        } catch (error) {
            console.error('[GroqAPI Error]', error);
            throw new Error(error.message);
        }
    }
}

export default GroqAPI;