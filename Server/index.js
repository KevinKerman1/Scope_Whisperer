import express from 'express';
import multer from 'multer';
import { PDFDocument } from 'pdf-lib';
import axios from 'axios';
import fs from 'fs';
import sharp from 'sharp';
import Tesseract from 'tesseract.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3000;

// Set up multer for handling file uploads
const upload = multer({ dest: 'uploads/' });

// Function to extract text from an image using Tesseract
const extractTextFromImage = async (imageBuffer) => {
    const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng');
    return text;
};

// POST route to handle image or PDF file upload
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        let imagePath = '';

        // Check if the file is a PDF and convert it to an image
        if (file.mimetype === 'application/pdf') {
            // Convert PDF to image
            const imageBuffer = await convertPdfToImage(file.path);
            imagePath = './uploads/converted-image.jpeg';
            fs.writeFileSync(imagePath, imageBuffer);
        } else {
            // If the file is already an image
            imagePath = file.path;
        }

        // Process the image to ensure it's in a good format
        const processedImage = await sharp(imagePath).jpeg().toBuffer();

        // Extract text from the image using OCR
        const extractedText = await extractTextFromImage(processedImage);

        // Send the extracted text to the OpenAI assistant for processing
        const result = await callOpenAI(extractedText);

        // Respond with the result
        res.json(result);
    } catch (err) {
        console.error('Error handling file:', err);
        res.status(500).send('Server Error');
    } finally {
        // Clean up the uploaded files
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        }
    }
});

// Function to convert PDF to an image using pdf-lib and sharp
const convertPdfToImage = async (pdfPath) => {
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();

    // For simplicity, we'll only convert the first page
    const firstPage = pages[0];
    const pageWidth = firstPage.getWidth();
    const pageHeight = firstPage.getHeight();

    // Create a blank image with the same dimensions
    const jpegImage = await sharp({
        create: {
            width: Math.floor(pageWidth),
            height: Math.floor(pageHeight),
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
    }).png().toBuffer();

    return jpegImage;
};

// Function to call OpenAI API using your assistant ID
const callOpenAI = async (text) => {
    const apiKey = process.env.OPENAI_API_KEY;  // Use the API key from environment variables
    const assistantId = 'asst_ql01W5np8OOlaAOzAh2FFmNx';  // Your OpenAI assistant ID

    const response = await axios.post(
        `https://api.openai.com/v1/assistants/${assistantId}/messages`,
        {
            model: 'gpt-3.5-turbo',  // or 'gpt-4' if you have access
            messages: [
                { role: 'system', content: 'Your system instructions here...' },
                { role: 'user', content: text }
            ],
            temperature: 0.3
        },
        {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        }
    );

    // Extract the assistant's reply
    const assistantReply = response.data.choices[0].message.content;
    return JSON.parse(assistantReply);  // Assuming the assistant returns valid JSON
};

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
