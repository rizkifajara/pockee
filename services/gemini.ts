import { ReceiptData, BankMutasiData } from '../types';
import { StorageService } from './storage';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Helper function to get API key from storage or fallback to env
async function getApiKey(): Promise<string> {
  const storedApiKey = await StorageService.getApiKey();
  return storedApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
}

export const GeminiService = {
  async uploadFile(fileUri: string, mimeType: string): Promise<string> {
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('No API key configured. Please set your Gemini API key in Settings.');
      }

      // First, upload the file to Gemini Files API
      const uploadResponse = await fetch(`${GEMINI_API_BASE}/files?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: {
            mimeType: mimeType,
            displayName: `pockee-upload-${Date.now()}`,
          },
        }),
      });

      const uploadData = await uploadResponse.json();
      return uploadData.file.uri;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  async parseReceipt(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<ReceiptData> {
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('No API key configured. Please set your Gemini API key in Settings.');
      }

      const prompt = `Analyze this receipt image carefully and extract ALL items including sub-items, taxes, service charges, and drinks in JSON format:
{
  "merchant": "store name",
  "date": "YYYY-MM-DD",
  "items": [
    {"name": "item name (e.g., Pizza Margherita, Mineral Water, etc.)", "price": number, "quantity": number}
  ],
  "subtotal": number (if available, otherwise use total),
  "tax": number (if tax/VAT is listed separately),
  "serviceCharge": number (if service charge is listed),
  "total": number
}

IMPORTANT:
- Extract EVERY line item from the receipt including drinks, food, taxes, and service charges
- If quantity is shown, include it. If not shown, use 1
- If tax or service charge is included in the total and not listed separately, set them to 0
- Be thorough and include all items visible on the receipt

Return ONLY valid JSON, no additional text.`;

      const response = await fetch(
        `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: imageBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.4,
              topK: 32,
              topP: 1,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      const data = await response.json();

      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response from Gemini API');
      }

      const text = data.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error parsing receipt:', error);
      throw error;
    }
  },

  async parseBankMutasi(
    fileContent: string,
    fileType: 'csv' | 'pdf' | 'excel'
  ): Promise<BankMutasiData[]> {
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('No API key configured. Please set your Gemini API key in Settings.');
      }

      const prompt = `Analyze this Bank Mandiri mutasi ${fileType} file and extract all transactions in JSON array format:
[
  {
    "date": "YYYY-MM-DD",
    "description": "transaction description",
    "type": "debit" or "credit",
    "amount": number,
    "balance": number
  }
]

File content:
${fileContent}

Return ONLY valid JSON array, no additional text.`;

      const response = await fetch(
        `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.4,
              topK: 32,
              topP: 1,
              maxOutputTokens: 4096,
            },
          }),
        }
      );

      const data = await response.json();

      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response from Gemini API');
      }

      const text = data.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error parsing bank mutasi:', error);
      throw error;
    }
  },

  async parseBankMutasiPDF(pdfBase64: string): Promise<BankMutasiData[]> {
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('No API key configured. Please set your Gemini API key in Settings.');
      }

      const prompt = `Extract all transactions from this bank statement PDF and return ONLY a JSON array. No explanations, no thinking, just the JSON.

Format:
[{"date":"YYYY-MM-DD","description":"text","type":"debit","amount":1000,"balance":5000}]

Rules:
- date: YYYY-MM-DD format
- type: "debit" for expenses/withdrawals, "credit" for income/deposits
- amount: number only, no currency symbols
- Extract ALL transactions you see`;

      const response = await fetch(
        `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: 'application/pdf',
                      data: pdfBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              topK: 1,
              topP: 0.8,
              maxOutputTokens: 16384,
              responseMimeType: 'text/plain',
            },
          }),
        }
      );

      const data = await response.json();

      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error('Gemini API Response:', JSON.stringify(data, null, 2));
        throw new Error(`Invalid response from Gemini API: ${data.error?.message || 'No candidates returned'}`);
      }

      const text = data.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error parsing bank mutasi PDF:', error);
      throw error;
    }
  },

  async suggestCategory(description: string, merchant?: string): Promise<string> {
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('No API key configured. Please set your Gemini API key in Settings.');
      }

      const contextInfo = merchant ? `Merchant: ${merchant}\n` : '';
      const prompt = `Categorize this transaction into one of these categories: food, shopping, transport, bills, entertainment, salary, other.

${contextInfo}Description: "${description}"

Consider:
- "food" for restaurants, cafes, groceries, food delivery
- "shopping" for retail, clothing, electronics, online shopping
- "transport" for fuel, parking, ride-sharing, public transit
- "bills" for utilities, phone, internet, rent, subscriptions
- "entertainment" for movies, games, hobbies, concerts
- "salary" for income, wages, bonuses
- "other" for everything else

Return ONLY the category name, nothing else.`;

      const response = await fetch(
        `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 10,
            },
          }),
        }
      );

      const data = await response.json();
      const category = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase();

      const validCategories = ['food', 'shopping', 'transport', 'bills', 'entertainment', 'salary', 'other'];
      return validCategories.includes(category) ? category : 'other';
    } catch (error) {
      console.error('Error suggesting category:', error);
      return 'other';
    }
  },
};
