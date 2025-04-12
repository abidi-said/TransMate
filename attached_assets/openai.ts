import OpenAI from "openai";

/**
 * Get a chat completion from OpenAI
 * 
 * @param prompt - The prompt
 * @param model - The model to use
 * @param apiKey - The OpenAI API key
 * @returns The completion text
 */
export async function getChatCompletion(
  prompt: string,
  model: string = "gpt-4o",
  apiKey: string
): Promise<string> {
  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  try {
    const openai = new OpenAI({ apiKey });
    
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "You are a professional translator with expertise in multiple languages and technical terminology." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,  // Lower temperature for more consistent translations
      max_tokens: 1000
    });
    
    return response.choices[0].message.content || "";
  } catch (err) {
    if (err.status === 401) {
      throw new Error("Invalid OpenAI API key");
    } else if (err.status === 429) {
      throw new Error("OpenAI API rate limit exceeded");
    } else {
      throw new Error(`OpenAI API error: ${err.message}`);
    }
  }
}

/**
 * Get a JSON chat completion from OpenAI
 * 
 * @param prompt - The prompt
 * @param model - The model to use
 * @param apiKey - The OpenAI API key
 * @returns The parsed JSON response
 */
export async function getJsonChatCompletion<T>(
  prompt: string,
  model: string = "gpt-4o",
  apiKey: string
): Promise<T> {
  try {
    const openai = new OpenAI({ apiKey });
    
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "You are a helpful assistant that responds with valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });
    
    const content = response.choices[0].message.content || "{}";
    return JSON.parse(content) as T;
  } catch (err) {
    if (err.status === 401) {
      throw new Error("Invalid OpenAI API key");
    } else if (err.status === 429) {
      throw new Error("OpenAI API rate limit exceeded");
    } else {
      throw new Error(`OpenAI API error: ${err.message}`);
    }
  }
}
