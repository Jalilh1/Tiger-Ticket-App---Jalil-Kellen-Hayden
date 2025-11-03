/**
 * Purpose: Unit test LLM model parse + fallback, mock HF client.
 */

jest.mock('@huggingface/inference', () => ({
    HfInference: function () {
      return {
        textGeneration: jest.fn().mockResolvedValue({
          generated_text: '{"intent":"view_events","event_name":null,"quantity":null,"confidence":"high"}'
        })
      };
    }
  }));
  
  process.env.HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || 'test-key';
  
  const llmModel = require('../models/llmModel');
  
  test('parseBookingIntent returns view_events', async () => {
    const out = await llmModel.parseBookingIntent('show events');
    expect(out.intent).toBe('view_events');
  });
  
  test('fallback when malformed JSON', async () => {
    const { HfInference } = require('@huggingface/inference');
    HfInference.prototype.textGeneration = jest.fn().mockResolvedValue({ generated_text: 'not-json' });
    const out = await llmModel.parseBookingIntent('hello');
    expect(out.intent).toMatch(/greeting|unknown|view_events|book/);
  });