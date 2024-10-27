import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { PDFImage } from 'pdf-image';

const app = express();
const port = 3000;

// Global variable to store the base64 encoded result
let Base64Result = '';

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

    // Creating a directory to store the combined JPEG file
    const outputDir = path.join('uploads', 'images');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Generate the combined image for all pages
    const combinedImagePath = await pdfImage.convertFile();
    const finalImagePath = path.join(outputDir, 'combined.jpg');

    // Rename the image to ensure it's saved as .jpg
    fs.renameSync(combinedImagePath, finalImagePath);

    // Convert the image to base64 and store it in the global variable
    Base64Result = fs.readFileSync(finalImagePath, { encoding: 'base64' });
    console.log(Base64Result);

    // Set headers to send the image as a JPEG file
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', 'inline; filename="combined.jpg"');

    // Stream the image file directly to the response
    const imageStream = fs.createReadStream(finalImagePath);
    imageStream.pipe(res);

    console.log(`Combined image saved at: ${finalImagePath}`);

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