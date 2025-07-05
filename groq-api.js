// groq-api.js
import fetch from 'node-fetch';

class GroqAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        this.defaultModel = 'llama-3.3-70b-versatile';
        this.visionModel = 'meta-llama/llama-4-scout-17b-16e-instruct';
    }

    detectLanguage(text) {
        if (!text) return 'en';
        const normalizedText = text.toLowerCase();
        if (/(apa|siapa|dimana|kapan|mengapa|kenapa|berapa|bagaimana|tolong|bisa|mohon|boleh|apakah|terima kasih|selamat)/i.test(normalizedText)) return 'id';
        if (/(di mana|bila)/i.test(normalizedText)) return 'ms';
        return 'en';
    }

    getSystemPrompt(language = 'en') {
        const prompts = {
            en: `You are ChatterBot, a friendly and helpful AI assistant. Provide clear, concise answers in English. Use simple language unless asked for technical details. If an image is provided, describe and analyze it if relevant to the user's question. If unsure, say so.`,
            id: `Kamu adalah ChatterBot, asisten AI yang ramah dan membantu. Berikan jawaban yang jelas dan mudah dipahami dalam Bahasa Indonesia. Gunakan bahasa sederhana kecuali diminta detail teknis. Jika ada gambar, deskripsikan dan analisis jika relevan dengan pertanyaan pengguna. Jika tidak yakin, akui itu.`,
            ms: `Anda adalah ChatterBot, pembantu AI yang mesra. Berikan jawapan yang jelas dalam Bahasa Melayu. Gunakan bahasa mudah kecuali diminta butiran teknikal. Jika ada gambar, terangkan dan analisis jika berkaitan dengan soalan pengguna. Jika tidak pasti, nyatakan demikian.`
        };
        return prompts[language] || prompts.en;
    }

    async generateResponse(messages, options = {}) {
        if (!messages || messages.length === 0) {
            throw new Error('No messages provided');
        }

        try {
            const messagesCopy = JSON.parse(JSON.stringify(messages));
            const lastUserMessage = messagesCopy.filter(m => m.role === 'user').pop()?.content || '';
            const language = this.detectLanguage(lastUserMessage);
            const systemPrompt = this.getSystemPrompt(language);
            
            let currentModel = options.model || this.defaultModel;
            
            // Handle image if provided
            if (options.imageData) {
                currentModel = this.visionModel;
                const lastUserMessageIndex = messagesCopy.map(m => m.role).lastIndexOf('user');
                if (lastUserMessageIndex !== -1) {
                    const userText = messagesCopy[lastUserMessageIndex].content || '';
                    messagesCopy[lastUserMessageIndex] = {
                        role: 'user',
                        content: [
                            { type: 'text', text: userText.replace(' [Image attached]', '') },
                            { type: 'image_url', image_url: { url: options.imageData } }
                        ]
                    };
                }
            }

            const formattedMessages = [
                { role: 'system', content: systemPrompt },
                ...messagesCopy
            ];

            const requestBody = {
                model: currentModel,
                messages: formattedMessages,
                temperature: 0.7,
                max_tokens: 4096,
                top_p: 0.95,
                frequency_penalty: 0.5
            };

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || 'No response content';
        } catch (error) {
            console.error('[GroqAPI Error]', error);
            throw new Error(`Failed to generate response: ${error.message}`);
        }
    }
}

export default GroqAPI;