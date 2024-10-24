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
    const pdfImage = new PDFImage(pdfPath, {
      combinedImage: true } );

    // Creating a directory to store the JPEG files
    const outputDir = path.join('uploads', 'images');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const numberOfPages = await pdfImage.numberOfPages();
    const imagePaths = [];

    for (let i = 0; i < numberOfPages; i++) {
      const imagePath = await pdfImage.convertPage(i);
      const newImagePath = path.join(outputDir, `page-${i}.jpg`);

      // Rename the image to ensure it's saved as .jpg
      fs.renameSync(imagePath, newImagePath);
      imagePaths.push(newImagePath);
    }

    // If there are multiple images, compress them into a zip file or just send them in a JSON array.
    if (imagePaths.length === 1) {
      // For single-page PDF, send the image directly
      res.sendFile(path.resolve(imagePaths[0]), err => {
        if (err) {
          console.error(err);
          res.status(500).send({ message: 'Error sending the image.' });
        }

        // Cleanup after sending the file
        fs.unlinkSync(pdfPath);
        fs.unlinkSync(imagePaths[0]);
      });
    } else {
      // For multi-page PDF, send the images as a JSON array with links to each image
      res.json({
        message: 'PDF converted to images successfully!',
        images: imagePaths.map(image => `http://localhost:${port}/${image}`)
      });

      // Cleanup uploaded PDF
      fs.unlinkSync(pdfPath);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'An error occurred while converting the PDF.' });
  }
});

// Serve static files (the JPEG images)
app.use('/uploads', express.static('uploads'));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
//