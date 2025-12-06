import { Chat, CreateMLCEngine } from '@mlc-ai/web-llm';

let chatInstance = null;
let engine = null;
let isInitializing = false;
let initPromise = null;

/**
 * Initialize WebLLM engine and chat instance
 * Uses a small, fast model suitable for browser execution
 */
export async function initializeWebLLM(progressCallback = null) {
  if (chatInstance && engine) {
    return chatInstance;
  }

  if (isInitializing) {
    return initPromise;
  }

  isInitializing = true;
  initPromise = (async () => {
    try {
      // Using a smaller, faster model for quicker download and initialization
      // TinyLlama-1.1B-Chat-v0.4 is much smaller (~600MB) and faster to download
      // Alternative: 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC' (even smaller, ~300MB)
      const model = 'TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC';
      
      // Create the MLCEngine with progress callback
      engine = await CreateMLCEngine(model, {
        initProgressCallback: (report) => {
          console.log('Model loading progress:', report);
          if (progressCallback) {
            progressCallback(report);
          }
        },
      });
      
      // Create Chat instance with the engine
      chatInstance = new Chat(engine);

      isInitializing = false;
      return chatInstance;
    } catch (error) {
      isInitializing = false;
      console.error('Failed to initialize WebLLM:', error);
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Generate a response using WebLLM
 * @param {string} systemPrompt - System prompt defining the bot's role
 * @param {string} userMessage - User's question
 * @param {Function} onUpdate - Callback for streaming updates
 * @returns {Promise<string>} - Generated response
 */
export async function generateResponse(systemPrompt, userMessage, onUpdate = null) {
  if (!chatInstance) {
    await initializeWebLLM();
  }

  try {
    let fullResponse = '';
    
    // Use the Chat completions API with messages format
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    // Create streaming request with a moderate max_tokens so answers can finish
    // without being huge; the system prompt enforces short, friendly replies.
    const stream = await chatInstance.completions.create({
      messages: messages,
      stream: true,
      max_tokens: 220,
      temperature: 0.7,
    });

    // Handle streaming response
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        if (onUpdate) {
          onUpdate(fullResponse);
        }
      }
    }

    return fullResponse;
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
}

/**
 * Check if WebLLM is supported in the current browser
 */
export function isWebLLMSupported() {
  // Check for WebGPU support (required for WebLLM)
  if (navigator.gpu === undefined) {
    return false;
  }
  return true;
}

