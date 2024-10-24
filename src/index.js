import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
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
    const pdfImage = new PDFImage(pdfPath, { combinedImage: true });

    // Creating a directory to store the JPEG files
    const outputDir = path.join('uploads', 'images');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const numberOfPages = await pdfImage.numberOfPages();
    const imageFiles = [];

    for (let i = 0; i < numberOfPages; i++) {
      const imagePath = await pdfImage.convertPage(i);
      const newImagePath = path.join(outputDir, `page-${i}.jpg`);

      // Rename the image to ensure it's saved as .jpg
      fs.renameSync(imagePath, newImagePath);

      // Read the image file as binary data or base64 encoded string
      const imageData = fs.readFileSync(newImagePath, { encoding: 'base64' });
      imageFiles.push(`data:image/jpeg;base64,${imageData}`);

      // Clean up the image file
      fs.unlinkSync(newImagePath);
    }

    // Send the actual images in base64 format as the response
    res.json({
      message: 'PDF converted to images successfully!',
      images: imageFiles // Base64 encoded image data
    });

    // Cleanup uploaded PDF
    fs.unlinkSync(pdfPath);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'An error occurred while converting the PDF.' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
