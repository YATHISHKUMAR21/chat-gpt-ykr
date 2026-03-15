// Import the Pinecone library
const { Pinecone } = require('@pinecone-database/pinecone');

// Initialize a Pinecone client with your API key
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

// Create a dense index with integrated embedding
const cohortChatGptIndex = pc.Index('cohort-chat-gpt');

async function createMemory({vectors, metadata , messageId}){
    try {
        if(!vectors || vectors.length === 0) {
            console.log("Invalid vectors, skipping upsert");
            return;
        }
        
        // Ensure vectors are a plain array of numbers
        const plainArrayVectors = Array.isArray(vectors) ? [...vectors] : Array.from(vectors);
        
        // Create the upsert record
        const upsertRecord = {
            id: String(metadata.id),
            values: plainArrayVectors,
            metadata: {
                chat: String(metadata.chat),
                user: String(metadata.user),
                text: String(metadata.text || "").substring(0, 1000)  // Limit text to 1000 chars
            }
        };
        
        console.log("Attempting upsert...");
        
        // Pinecone expects { records: [...] } not just the array
        await cohortChatGptIndex.upsert({
            records: [upsertRecord]
        });
        
        console.log("Vector memory created successfully");
    } catch (err) {
        console.error("Vector memory creation failed:", err.message);
        // Don't throw - allow the app to continue without vector storage
    }
}

async function queryMemory({queryVector, limit = 5, metadata}){

    // Build filter for Pinecone - it expects individual field conditions
    let filterCondition = undefined;
    if(metadata && metadata.user) {
        filterCondition = {
            "user": {"$eq": metadata.user}
        };
    }

    const data = await cohortChatGptIndex.query({
        vector: queryVector,
        topK: limit,
        filter : filterCondition,
        includeMetadata: true,
        includeValues: false
    });
    
    console.log("Query results:", data.matches);
    return data.matches;

}

module.exports = {
    createMemory,
    queryMemory
}




