import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = formidable({ maxFileSize: 10 * 1024 * 1024 }); // 10MB

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ error: 'File upload failed' });
    }

    const file = files.image;
    if (!file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const mimeType = file.mimetype || 'image/png';
    const fs = require('fs');
    const imageBuffer = fs.readFileSync(file.filepath);
    const base64 = imageBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    res.status(200).json({
      imageData: dataUrl,
      mimeType,
      size: file.size
    });
  });
}
