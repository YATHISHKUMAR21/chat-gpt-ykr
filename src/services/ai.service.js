const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({});

async function generateResponse(content){
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents : content
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