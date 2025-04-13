/**
 * GROQ API Wrapper for ChatterBot
 * Handles communication with the GROQ API
 */
class GroqAPI {
    constructor() {
        // Hardcoded API key - replace with your own GROQ API key
        this.apiKey = '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'; // Replace this with your actual GROQ API key
        this.model = localStorage.getItem('groqModel') || 'llama3-8b-8192';
        this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        this.systemPrompt = "You are ChatterBot, a helpful, friendly, and slightly playful AI assistant. You provide concise, accurate information and occasionally use emojis. You are created by a developer who integrated you with GROQ's API. Keep responses relatively short and engaging. If you don't know something, admit it rather than making up information.";
    }

    /**
     * Set the AI model to use
     * @param {string} model - Model identifier
     */
    setModel(model) {
        this.model = model;
        localStorage.setItem('groqModel', model);
    }

    /**
     * Generate a chat response from GROQ
     * @param {Array} messages - Array of message objects
     * @returns {Promise} - Promise resolving to the response
     */
    async generateResponse(messages) {
        // Add system prompt
        const formattedMessages = [
            {
                role: "system",
                content: this.systemPrompt
            },
            ...messages
        ];

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: formattedMessages,
                    temperature: 0.7,
                    max_tokens: 1024
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || "Error connecting to GROQ API");
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error("GROQ API Error:", error);
            throw error;
        }
    }

    /**
     * Check if API key is set
     * @returns {boolean} - Whether API key is set
     */
    hasApiKey() {
        return true; // Always return true since we're using a hardcoded key
    }

    /**
     * Get current model name
     * @returns {string} - Current model
     */
    getCurrentModel() {
        return this.model;
    }
}

// Export a singleton instance
const groqApi = new GroqAPI();