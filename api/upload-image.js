export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { imageData, mimeType } = req.body;
        
        if (!imageData || !mimeType) {
            return res.status(400).json({ error: 'Image data and mime type required' });
        }

        // Validate image type
        const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
        if (!supportedTypes.includes(mimeType)) {
            return res.status(400).json({ error: 'Unsupported image format' });
        }

        // Return the processed image data
        res.status(200).json({ 
            imageData,
            mimeType,
            processed: true
        });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ error: error.message });
    }
}