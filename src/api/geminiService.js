// Gemini API Service
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyDpYourDefaultKeyHere';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

class GeminiService {
    constructor() {
        this.conversationHistory = [];
    }

    async sendMessage(userMessage) {
        try {
            // Add user message to history
            this.conversationHistory.push({
                role: 'user',
                parts: [{ text: userMessage }]
            });

            const response = await fetch(`${API_URL}?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: this.conversationHistory,
                    generationConfig: {
                        temperature: 0.9,
                        topK: 1,
                        topP: 1,
                        maxOutputTokens: 2048,
                    },
                    safetySettings: [
                        {
                            category: 'HARM_CATEGORY_HARASSMENT',
                            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                        },
                        {
                            category: 'HARM_CATEGORY_HATE_SPEECH',
                            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                        },
                        {
                            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                        },
                        {
                            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                        }
                    ]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'API request failed');
            }

            const data = await response.json();
            const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

            // Add AI response to history
            this.conversationHistory.push({
                role: 'model',
                parts: [{ text: aiResponse }]
            });

            return aiResponse;

        } catch (error) {
            console.error('Gemini API Error:', error);

            // Provide helpful error messages
            if (error.message.includes('API_KEY_INVALID') || error.message.includes('API key')) {
                return '❌ Invalid API key. Please check your .env file and add a valid Gemini API key from https://aistudio.google.com/app/apikey';
            }

            if (!navigator.onLine) {
                return '📡 You are offline. Please connect to the internet to chat with AI.';
            }

            return `⚠️ Error: ${error.message}. Please try again.`;
        }
    }

    clearHistory() {
        this.conversationHistory = [];
    }

    getHistory() {
        return this.conversationHistory;
    }
}

export default new GeminiService();
