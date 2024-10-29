// AI.js
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const client = new OpenAI({

   //apiKey: process.env['OpenAI_API_KEY'], // API Key for local development
   apiKey: process.env.OpenAI_API_KEY, // API Key for Render
});

// Function to send multiple base64 images to OpenAI API
export async function sendToOpenAI(base64Images, res) {
  try {
    // Prepare messages with all images included as "image_url" entries
    const imageMessages = base64Images.map((base64Image) => ({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${base64Image}` },
    }));

    // Construct the full message to send all images in a single API call
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the following financial data from the provided 'Summary for Dwelling' section of the insurance scope: Total RCV (Replacement Cost Value), ACV(Actual Cash Value), Deductible (Sometimes indicated by 'Less Deductible'), Total Depreciation (and/or 'Non-recoverable depreciation if listed in the Summary of dwelling), Net Claim, and the Date on the scope in format 'MM/DD/YYYY'. Return the values in JSON format as follows: { 'ACV': value, 'RCV': value, 'Deductible': value, 'Depreciation': value, 'Net Claim': value, 'Scope Date': value }. ",
            },
            ...imageMessages, // Spread in the images array as individual entries
          ],
        },
      ],
    });

    // Send the response back to the client
    res.json(response.choices[0]);
  } catch (error) {
    console.error("Error sending images to OpenAI:", error);
    res.status(500).send({ message: 'An error occurred while communicating with OpenAI.' });
  }
}
