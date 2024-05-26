const { google } = require('googleapis');
const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(express.static('public')); // Serve static files from "public" directory

const KEYFILEPATH = './plated-shelter-422311-h2-b3e42f8a98fa.json'; // Шлях до вашого файлу ключа JSON
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });
const stream = require("stream");
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileMetadata = {
            name: req.file.originalname,
            parents: ['1nqwVb10YD_q21gzqc6fiKpXcZH0KCQ2q'], // ID папки на загальному Google Диску
        };

        const media = {
            mimeType: req.file.mimetype,
            body:  new stream.PassThrough().end(Buffer.from(req.file.buffer)), // Convert the buffer to a valid type
        };

        const file = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id',
        });

        res.status(200).json({ fileId: file.data.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
