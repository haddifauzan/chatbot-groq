class ClientAPI {
    constructor() {
        this.baseUrl = window.location.origin;
        this.imageCache = {};
    }

    async generateResponse(messages, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages, options })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Client API Error:', error);
            throw new Error(`Failed to generate response: ${error.message}`);
        }
    }

    async processImage(file) {
        try {
            // Validate file
            const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
            if (!supportedTypes.includes(file.type)) {
                throw new Error('Unsupported image format. Use JPEG, PNG, JPG, GIF, or WebP.');
            }

            if (file.size > 10 * 1024 * 1024) {
                throw new Error('Image size too large. Maximum 10MB.');
            }

            // Convert to base64
            const base64Data = await this.fileToBase64(file);
            const imageData = `data:${file.type};base64,${base64Data}`;

            // Send to server for processing
            const response = await fetch(`${this.baseUrl}/api/upload-image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    imageData,
                    mimeType: file.type
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Upload failed: ${response.status}`);
            }

            const data = await response.json();
            
            // Cache the image data
            const imageId = Date.now().toString(36) + Math.random().toString(36).substr(2);
            this.imageCache[imageId] = data.imageData;

            return { 
                imageId, 
                imageData: data.imageData, 
                mimeType: data.mimeType 
            };
        } catch (error) {
            throw new Error(`Failed to process image: ${error.message}`);
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    }

    detectLanguage(text) {
        if (!text) return 'en';
        const normalizedText = text.toLowerCase();
        if (/(apa|siapa|dimana|kapan|mengapa|kenapa|berapa|bagaimana|tolong|bisa|mohon|boleh|apakah|terima kasih|selamat)/i.test(normalizedText)) return 'id';
        if (/(di mana|bila)/i.test(normalizedText)) return 'ms';
        return 'en';
    }

    getImageData(imageId) {
        return this.imageCache[imageId] || null;
    }

    removeImageData(imageId) {
        if (this.imageCache[imageId]) {
            delete this.imageCache[imageId];
        }
    }
}

// Global instance
const clientApi = new ClientAPI();