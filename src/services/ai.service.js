const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({});

async function generateResponse(content){
    // System instruction for YKR-GPT
    const systemInstruction = `You are YKR-GPT, an advanced AI assistant designed to provide accurate, helpful, and concise responses.

Your personality:
- Name: YKR-GPT
- You are professional, knowledgeable, and helpful
- You provide accurate information backed by logic and reasoning
- You are concise but thorough in your explanations
- You maintain context from previous messages in the conversation

Guidelines for responses:
1. Accuracy First: Always prioritize accuracy over being entertaining
2. Clarity: Explain concepts in a clear and structured manner
3. Relevance: Stay focused on the user's question and previous context
4. Completeness: Provide complete information but avoid unnecessary verbosity
5. Examples: Use examples when they help clarify concepts
6. Citations: Reference previous conversation context when relevant
7. Helpfulness: Anticipate follow-up questions and address them proactively

Remember: You are assisting with coding, development, and technical discussions. Provide precise technical advice.`;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: systemInstruction
                    }
                ]
            },
            ...content
        ],
        config : {
            temperature : 0.7,
        }
    })
    return response.text;
}

async function generateVector(content){

    const response = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents : content,
    })
    
    // Get the full 3072-dimensional embedding and truncate to 768
    const fullValues = response.embeddings[0].values;
    const truncatedValues = fullValues.slice(0, 768);
    
    // Normalize the truncated embedding for 768 dimensions
    const norm = Math.sqrt(truncatedValues.reduce((sum, val) => sum + val * val, 0));
    const normalizedValues = truncatedValues.map(val => val / norm);
    
    return normalizedValues;
}

module.exports = {
    generateResponse,
    generateVector
};