/**
 * File: llmModel.js
 * Brief: LLM prompts/parsing and DB-backed helpers for TigerTix intents.
 *
 * Responsibilities:
 * - Call Hugging Face LLM to parse free-text booking messages.
 * - Provide keyword-based fallback parsing if LLM fails.
 * - Read available events from Postgres.
 * - Confirm bookings with a transactional update on the events table.
 */

const { HfInference } = require('@huggingface/inference');
const pool = require('../db'); // Shared Postgres connection

// IMPORTANT: no dotenv here – Railway injects env vars directly.
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

// Instantiate HF client only if key is present
const hf = HF_API_KEY ? new HfInference(HF_API_KEY) : null;

const TigerTixLLM = {
  /**
   * Purpose: Prompt the LLM to extract { intent, event_name, quantity, confidence } from user text.
   * Params: (userMessage: string)
   * Returns/Side effects:
   *   - On success: { intent, event_name, quantity, confidence }
   *   - On HF/parse error: falls back to keywordFallback(message).
   */
  parseBookingIntent: async (userMessage) => {
    // If no HF API key configured, immediately fall back to keyword logic
    if (!hf) {
      console.warn('HUGGINGFACE_API_KEY not set; using keyword fallback only.');
      return TigerTixLLM.keywordFallback(userMessage);
    }

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
        parameters: {
          max_new_tokens: 256,
          temperature: 0.2,
          return_full_text: false
        }
      });

      // HF can return either an object or an array depending on provider
      const llmOutput =
        (raw && raw.generated_text) ??
        (Array.isArray(raw) ? raw[0]?.generated_text : '') ??
        '';

      const trimmed = String(llmOutput).trim();
      console.log('LLM Output:', trimmed);

      let parsedIntent;
      try {
        // Try to pull the first JSON object from the output
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

      // Merge with safe defaults so all fields are present
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

  /**
   * Purpose: Lightweight rule-based intent extraction when LLM output is unavailable/invalid.
   * Params: (message: string)
   * Returns/Side effects: { intent, event_name|null, quantity|null, confidence } — no external effects.
   */
  keywordFallback: (message) => {
    const lowerMsg = message.toLowerCase();

    // Greeting
    if (lowerMsg.match(/\b(hi|hello|hey|greetings|good morning|good afternoon)\b/)) {
      return {
        intent: 'greeting',
        event_name: null,
        quantity: null,
        confidence: 'medium'
      };
    }

    // Show events
    if (lowerMsg.match(/\b(show|list|view|see|available|events)\b/)) {
      return {
        intent: 'view_events',
        event_name: null,
        quantity: null,
        confidence: 'medium'
      };
    }

    // Booking intent
    if (lowerMsg.match(/\b(book|buy|purchase|reserve|get|want)\b/)) {
      const quantityMatch = lowerMsg.match(
        /\b(one|two|three|four|five|six|seven|eight|nine|ten|1|2|3|4|5|6|7|8|9|10)\b/
      );

      let quantity = 1;
      if (quantityMatch) {
        const numMap = {
          one: 1,
          two: 2,
          three: 3,
          four: 4,
          five: 5,
          six: 6,
          seven: 7,
          eight: 8,
          nine: 9,
          ten: 10
        };
        quantity = numMap[quantityMatch[0]] ?? parseInt(quantityMatch[0], 10) ?? 1;
      }

      let eventName = null;
      if (/\b(football|game|clemson football)\b/.test(lowerMsg)) {
        eventName = 'Clemson Football Game';
      } else if (/\b(concert|music|campus concert)\b/.test(lowerMsg)) {
        eventName = 'Campus Concert';
      } else if (/\b(career|fair|job|career fair)\b/.test(lowerMsg)) {
        eventName = 'Career Fair';
      }

      return {
        intent: 'book',
        event_name: eventName,
        quantity,
        confidence: eventName ? 'medium' : 'low'
      };
    }

    // Unknown / fallback
    return {
      intent: 'unknown',
      event_name: null,
      quantity: null,
      confidence: 'low'
    };
  },

  /**
   * Purpose: Fetch events that still have tickets available from Postgres.
   * Params: none
   * Returns/Side effects:
   *   - Resolves to an array of { id, name, date, capacity, available_tickets }.
   */
  getAvailableEvents: async () => {
    const result = await pool.query(
      `SELECT id, name, date, capacity, available_tickets
       FROM events
       WHERE available_tickets > 0
       ORDER BY date ASC, id ASC`
    );
    return result.rows;
  },

  /**
   * Purpose: Confirm a booking with transactional safety.
   * Params: ({ event_id: number, user_id: number, quantity: number })
   * Returns/Side effects:
   *   - On success: { event_name, quantity, purchase }
   *   - Side effects: Inserts into purchases; decrements events.available_tickets.
   */
  confirmBooking: async ({ event_id, user_id, quantity }) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const eventRes = await client.query(
        `SELECT id, name, available_tickets
         FROM events
         WHERE id = $1
         FOR UPDATE`,
        [event_id]
      );

      const event = eventRes.rows[0];

      if (!event) {
        throw new Error('Event not found');
      }
      if (event.available_tickets < quantity) {
        throw new Error('Not enough tickets available');
      }

      const purchaseRes = await client.query(
        `INSERT INTO purchases (event_id, user_id, quantity)
         VALUES ($1, $2, $3)
         RETURNING id, event_id, user_id, quantity, purchase_date`,
        [event_id, user_id, quantity]
      );

      await client.query(
        `UPDATE events
         SET available_tickets = available_tickets - $1
         WHERE id = $2`,
        [quantity, event_id]
      );

      await client.query('COMMIT');

      return {
        event_name: event.name,
        quantity,
        purchase: purchaseRes.rows[0]
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};

module.exports = TigerTixLLM;


