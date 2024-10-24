import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { PDFImage } from 'pdf-image';

const app = express();
const port = 3000;

// Multer setup for handling file uploads
const upload = multer({ dest: 'uploads/' });

// Route to handle PDF to image conversion
app.post('/convert-pdf', upload.single('PDF'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: 'No PDF file provided!' });
    }

    const pdfPath = req.file.path;
    const pdfImage = new PDFImage(pdfPath);
    
    const pages = [];
    const numberOfPages = await pdfImage.numberOfPages();

    for (let i = 0; i < numberOfPages; i++) {
      const imagePath = await pdfImage.convertPage(i);
      const imageBuffer = fs.readFileSync(imagePath);
      pages.push(imageBuffer.toString('base64')); // Convert image to base64 string
    }

    // Return base64 images in the response
    res.status(200).send({ images: pages });
    
    // Cleanup the uploaded PDF after conversion
    fs.unlinkSync(pdfPath);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'An error occurred while converting the PDF.' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
