// AI.js
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { z } from "zod";

dotenv.config();

const client = new OpenAI({
   //apiKey: process.env['OpenAI_API_KEY'], // API Key for local development
   apiKey: process.env.OpenAI_API_KEY, // API Key for Render
});

// Define the expected response structure using zod
// Define the expected response structure using zod
const FinancialDataSchema = z.object({
    Dwelling_ACV: z.number().nullable().optional().default(null),
    Dwelling_RCV: z.number().nullable().optional().default(null),
    Dwelling_Deductible: z.number().nullable().optional().default(null),
    Dwelling_Depreciation: z.number().nullable().optional().default(null),
    Dwelling_NetClaim: z.number().nullable().optional().default(null),
    Scope_DT: z.string().nullable().optional().default(null),
    Carrier: z.string().nullable().optional().default(null),
    TypeOfLoss: z.string().nullable().optional().default(null),
    DOL: z.string().nullable().optional().default(null),
    DOD: z.string().nullable().optional().default(null),
    PHname: z.string().nullable().optional().default(null),
    PHemail: z.string().nullable().optional().default(null),
    PHphone: z.string().nullable().optional().default(null),
    ClaimRep: z.string().nullable().optional().default(null),
    ClaimRepEmail: z.string().nullable().optional().default(null),
    ClaimRepPhone: z.string().nullable().optional().default(null),
    Estimator: z.string().nullable().optional().default(null),
    EstimatorEmail: z.string().nullable().optional().default(null),
    EstimatorPhone: z.string().nullable().optional().default(null),
    LossLocationAddress: z.string().nullable().optional().default(null),
    DwellingSQ_CT: z.number().nullable().optional().default(null),
    Tear_Off_CT: z.number().nullable().optional().default(null),
    Interior_ACV: z.number().nullable().optional().default(null),
    Interior_RCV: z.number().nullable().optional().default(null),
    Interior_DEP: z.number().nullable().optional().default(null),
    OS_RCV: z.number().nullable().optional().default(null),
    OS_ACV: z.number().nullable().optional().default(null),
    OS_DEP: z.number().nullable().optional().default(null),
    CertaintyScore: z.preprocess((val) => val ?? 0, z.number().min(0).max(100).default(0)),
});


export async function sendToOpenAI(base64Images, res) {
  try {
    const imageMessages = base64Images.map((base64Image) => ({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${base64Image}` },
    }));

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the following financial and claim details from the attached insurance scope document. Format the response as a JSON object with the structure shown below. For all financial values (e.g., ACV, RCV, Deductible), return a number. If any field is missing or unavailable, return null. \n\nJSON format:\n\n{\n    \"Dwelling_ACV\": The Actual Cash Value (ACV) for the dwelling as a number,\n    \"Dwelling_RCV\": The Replacement Cost Value (RCV) for the dwelling as a number,\n    \"Dwelling_Deductible\": Deductible amount for the dwelling as a number (this value usually has the key of 'Full Deductible'),\n    \"Dwelling_Depreciation\": Depreciation for the dwelling as a number,\n    \"Dwelling_NetClaim\": Net claim amount for the dwelling as a number,\n    \"Scope_DT\": Date when the estimate was issued (usually found in the bottom right hand corner of every page),\n    \"Carrier\": Name of the insurance carrier,\n    \"TypeOfLoss\": Type of loss (e.g., Hurricane, Fire, Hail, Wind),\n    \"DOL\": Date of loss,\n    \"DOD\": Date of discovery (also called 'Date Contacted'),\n    \"PHname\": Name of the policyholder (also referred to as the 'insured'),\n    \"PHemail\": Email of the policyholder/insured,\n   \"PHphone\": phone number of the policyholder/insured,\n   \"ClaimRep\": Name of the claim representative,\n    \"ClaimRepEmail\": Email of the claim representative,\n    \"ClaimRepPhone\": Phone number of the claim representative,\n    \"Estimator\": Name of the estimator if different from claim representative,\n    \"EstimatorEmail\": Email of the estimator,\n    \"EstimatorPhone\": Phone number of the estimator,\n    \"LossLocationAddress\": Address of the property where the loss occurred,\n    \"DwellingSQ_CT\": Square count associated with the dwelling coverage (if present),\n    \"Tear_Off_CT\": quantity of tear-off also refered to as 'Tear off composition shingles' this datapoint is also usualy the first line item of estimate (if present),\n    \"Interior_ACV\": ACV for interior items as a number (if present),\n    \"Interior_RCV\": RCV for interior items as a number (if present),\n    \"Interior_DEP\": Depreciation for interior items as a number (if present),\n    \"OS_RCV\": Replacement Cost Value for 'other structures' (e.g., fences) as a number (if present),\n    \"OS_ACV\": Actual Cash Value for other structures as a number (if present),\n    \"OS_DEP\": Depreciation for other structures as a number (if present),\n    \"CertaintyScore\": A certainty score based on document consistency, rated 0-100.\n}\n\nReturn all financial values as numbers and leave any missing information as null."
            },
            ...imageMessages,
          ],
        },
      ],
    });

    // Clean up response content to ensure it's valid JSON
    const rawContent = response.choices[0].message.content;
    const cleanedContent = rawContent.replace(/```json|```/g, ''); // Remove ```json and ``` markers

    const data = JSON.parse(cleanedContent); // Parse the cleaned JSON response

    // Validate against the schema
    const parsedData = FinancialDataSchema.parse(data);
    res.json(parsedData);

  } catch (error) {
    console.error("Error sending images to OpenAI:", error);
    res.status(500).send({ message: 'An error occurred while communicating with OpenAI.' });
  }
}
