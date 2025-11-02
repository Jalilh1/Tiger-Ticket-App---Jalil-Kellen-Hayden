const { HfInference } = require('@huggingface/inference');
require('dotenv').config({ path: '../.env' });

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const TigerTixLLM = {
  parseBookingIntent: async (userMessage) => {
    try {
      const systemPrompt = `
        You are a ticket booking assistant for TigerTix (Clemson University events).
        Extract booking information from user messages and respond ONLY with valid JSON.

        Available events:
        - Clemson Football Game
        - Campus Concert
        - Career Fair

        Extract:
        1. intent: "book" | "view_events" | "greeting" | "unknown"
        2. event_name: The event name or null
        3. quantity: Number of tickets or null
        4. confidence: "high" | "medium" | "low"

        Examples:
        User: "Book two tickets for the football game"
        JSON: {"intent": "book", "event_name": "Clemson Football Game", "quantity": 2, "confidence": "high"}

        User: "Show me events"
        JSON: {"intent": "view_events", "event_name": null, "quantity": null, "confidence": "high"}

        User: "Hello"
        JSON: {"intent": "greeting", "event_name": null, "quantity": null, "confidence": "high"}
        
        Now extract from this user message:
      `;

      const fullPrompt = `${systemPrompt}\nUser: "${userMessage}"\nJSON:`;

      const raw = await hf.textGeneration({
        model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
        inputs: fullPrompt,
        provider: 'hf', 
        parameters: { max_new_tokens: 256, temperature: 0.2, return_full_text: false }
      });

     
      const llmOutput =
        (raw && raw.generated_text) ??
        (Array.isArray(raw) ? raw[0]?.generated_text : '') ??
        '';
      const trimmed = String(llmOutput).trim();
      console.log('LLM Output:', trimmed);


      let parsedIntent;
      try {
        const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedIntent = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Parse error:', parseError);
        return TigerTixLLM.keywordFallback(userMessage);
      }

      if (!parsedIntent.intent) {
        return TigerTixLLM.keywordFallback(userMessage);
      }


      return {
        intent: null,
        event_name: null,
        quantity: null,
        confidence: 'low',
        ...parsedIntent
      };

    } catch (error) {
      console.error('Hugging Face API error:', error);
      return TigerTixLLM.keywordFallback(userMessage);
    }
  },

  keywordFallback: (message) => {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.match(/\b(hi|hello|hey|greetings|good morning|good afternoon)\b/)) {
      return { intent: "greeting", event_name: null, quantity: null, confidence: "medium" };
    }

    if (lowerMsg.match(/\b(show|list|view|see|available|events)\b/)) {
      return { intent: "view_events", event_name: null, quantity: null, confidence: "medium" };
    }

    if (lowerMsg.match(/\b(book|buy|purchase|reserve|get|want)\b/)) {
      const quantityMatch = lowerMsg.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|1|2|3|4|5|6|7|8|9|10)\b/);
      let quantity = 1;
      if (quantityMatch) {
        const numMap = { one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10 };
        quantity = numMap[quantityMatch[0]] ?? parseInt(quantityMatch[0], 10) ?? 1;
      }

      let eventName = null;
      if (/\b(football|game|clemson football)\b/.test(lowerMsg)) eventName = 'Clemson Football Game';
      else if (/\b(concert|music|campus concert)\b/.test(lowerMsg)) eventName = 'Campus Concert';
      else if (/\b(career|fair|job|career fair)\b/.test(lowerMsg)) eventName = 'Career Fair';

      return { intent: "book", event_name: eventName, quantity, confidence: eventName ? "medium" : "low" };
    }

    return { intent: "unknown", event_name: null, quantity: null, confidence: "low" };
  }
};

module.exports = TigerTixLLM;


