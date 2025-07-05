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
                const errorData = await response.json();
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

            // Validate image by loading it
            const isValidImage = await new Promise(resolve => {
                const img = new Image();
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                img.src = URL.createObjectURL(file);
            });

            if (!isValidImage) {
                throw new Error('Invalid image file.');
            }

            // Upload to server
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch(`${this.baseUrl}/api/upload-image`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
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