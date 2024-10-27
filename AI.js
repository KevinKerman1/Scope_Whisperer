// AI.js
import OpenAI from 'openai';
import dotenv from 'dotenv';

// *API Key if running locally  .env file
//dotenv.config();
// const client = new OpenAI({
//   apiKey: process.env['OpenAI_API_KEY'],
// });

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const client = new OpenAI({
  apiKey: process.env.OpenAI_API_KEY,  // Access the Render-injected environment variable directly
});


// Function to send base64 image to OpenAI API and respond to the client
export async function sendToOpenAI(base64Image, res) {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o", // or "gpt-3.5-turbo" based on available models
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the following financial data from the provided 'Summary for Dwelling' section of the insurance scope: Total RCV (Replacement Cost Value), ACV(Actual Cash Value), Deductible (Sometimes indicated by 'Less Deductible'), Total Depreciation (and/or 'Non-recoverable depreciation if listed in the Summary of dwelling), Net Claim, and the Date on the scope in format 'MM/DD/YYYY'. Return the values in JSON format as follows: { 'ACV': value, 'RCV': value, 'Deductible': value, 'Depreciation': value, 'Net Claim': value, 'Scope Date': value }." },
            {
              type: "image_url",
              image_url: {
                "url": `data:image/jpeg;base64,${base64Image}`,} ,
            },
          ],
        },
      ],
    });

    // Send the response back to the client
    res.json(response.choices[0]);
  } catch (error) {
    console.error("Error sending image to OpenAI:", error);
    res.status(500).send({ message: 'An error occurred while communicating with OpenAI.' });
  }
}
