import express from 'express';
import multer from 'multer';
import { PDFDocument } from 'pdf-lib';
import axios from 'axios';
import fs from 'fs';
import sharp from 'sharp';

const app = express();
const port = 3000;

// Set up multer for handling file uploads
const upload = multer({ dest: 'uploads/' });

// POST route to handle image or PDF file upload
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        let imagePath = '';

        // Check if the file is a PDF and convert it to an image
        if (file.mimetype === 'application/pdf') {
            const imageBuffer = await convertPdfToImage(file.path);
            imagePath = './uploads/converted-image.jpeg';
            fs.writeFileSync(imagePath, imageBuffer);
        } else {
            // If the file is already an image
            imagePath = file.path;
        }

        // Process the image to ensure it's in a good format
        const processedImage = await sharp(imagePath).jpeg().toBuffer();

        // Send the image to the OpenAI assistant for processing
        const result = await callOpenAI(processedImage);

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

// Function to call OpenAI API
const callOpenAI = async (imageData) => {
    const apiKey = 'YOUR_OPENAI_API_KEY';  // Replace with your actual OpenAI API key

    const response = await axios.post(
        'https://api.openai.com/v1/assistants/Scope_Whisperer/messages',
        {
            file: imageData, // Send the image as part of the request
        },
        {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'multipart/form-data',
            },
        }
    );

    return response.data;
};

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
