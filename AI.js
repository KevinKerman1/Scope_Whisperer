import OpenAI from 'openai';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const client = new OpenAI({
  apiKey: process.env['OpenAI_API_KEY'], // This is the default and can be omitted
});

async function main() {
    const base64Image = fs.readFileSync('TestDocs/car-967387_1280.webp', 'base64');

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "What are in these images? Is there any difference between them?" },
            {
              type: "image_url",
              image_url: {
                "url": `data:image/jpeg;base64,${base64Image}`, // Match the content type to PDF
              },
            }
          ],
        },
      ],
    });
    console.log(response.choices[0]);
}

main();
