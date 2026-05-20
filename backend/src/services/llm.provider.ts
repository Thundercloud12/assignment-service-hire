import logger from '../config/logger';

export interface ILLMProvider {
  generateText(systemPrompt: string, userPrompt: string): Promise<string>;
}

class GroqLLMProvider implements ILLMProvider {
  async generateText(systemPrompt: string, userPrompt: string): Promise<string> {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is not set');
    }

    logger.info(`Routing text generation request to Groq API`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b', // Default fast model on Groq
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API returned HTTP ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();

      if (!responseData?.choices?.[0]?.message?.content) {
        throw new Error('Incomplete response structure returned from Groq API');
      }

      return responseData.choices[0].message.content.trim();
    } catch (error) {
      logger.error(`llmProvider text generation failure: ${error}`);
      throw error;
    }
  }
}

export const llmProvider: ILLMProvider = new GroqLLMProvider();
