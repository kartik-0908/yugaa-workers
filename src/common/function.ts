import openai from "../lib/openai";
import pc from "../lib/pinecone";

export function extractIndexName(shop: string) {
    const indexName = shop.replace(/\./g, '-');
    return indexName
}
export async function PineconeIndexcreate(indexName: string) {
    await pc.createIndex({
        name: indexName,
        dimension: 1536,
        spec: {
            serverless: {
                cloud: 'aws',
                region: 'us-east-1'
            }
        },
        metric: 'cosine',
        suppressConflicts: true
    });
}

export function chunkDocument(text: string): string[] {
    const wordsPerChunk = 1000;
    const overlapWords = 200;

    // Split the text into an array of words
    const words = text.split(/\s+/);
    console.log(words)

    const chunks: string[] = [];
    let startIndex = 0;
    // console.log(text)
    console.log(text)
    const endIndex = Math.min(startIndex + wordsPerChunk, words.length);
    const chunk = words.slice(startIndex, endIndex).join(' ');
    chunks.push(chunk);
    console.log(chunks)
    console.log(words)
    startIndex = endIndex - overlapWords;
    console.log(startIndex)

    while (startIndex < words.length) {
        const endIndex = Math.min(startIndex + wordsPerChunk, words.length);
        const chunk = words.slice(startIndex, endIndex).join(' ');
        chunks.push(chunk);

        startIndex += (wordsPerChunk-overlapWords);
        console.log(startIndex)
    }

    return chunks;
}


export async function createEmbedding(text: string) {
    const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
    });

    const embedding = embeddingResponse.data[0].embedding;
    return embedding
}

export async function createandInsertEmbeddings(chunks: string[], indexName: string, docName: string): Promise<void> {
    const index = pc.Index(indexName);

    for (const [i, chunk] of chunks.entries()) {
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: chunk,
        });

        const embedding = embeddingResponse.data[0].embedding;

        await index.upsert(
            [
                {
                    id: `${docName}-${i}`,
                    values: embedding,
                    metadata: {
                        data: chunk,
                    },
                },
            ],
        );
    }
}