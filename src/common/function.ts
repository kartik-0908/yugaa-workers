import axios from "axios";
import openai from "../lib/openai";
import pc from "../lib/pinecone";
import { client } from "../lib/prisma";
import { error } from "console";

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

        startIndex += (wordsPerChunk - overlapWords);
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
                        text: chunk,
                    },
                },
            ],
        );
    }
}

export async function updateProduct(id: number, shop: string, type: string) {
    if (type === "delete") {

    }
}

export async function createConv(shop: string, id: string, time: Date) {
    try {
        let conversation = await client.conversation.findUnique({
            where: { id: id }
        });
        if (!conversation) {
            // const date = new Date(time);
            // if (isNaN(date.getTime())) {
            //     throw new Error(`Invalid date format: ${time}`);
            // }
            conversation = await client.conversation.create({
                data: {
                    id: id,
                    shopDomain: shop,
                    startedAt: time // Assuming 'timestamp' is when the conversation started
                }
            });
        }
    } catch (error) {
        console.log(error)
    }
}

function generateUniqueId() {
    const timestamp = Date.now().toString(36); // Get the current timestamp and convert it to base36
    const randomStr = Math.random().toString(36).substring(2, 7); // Generate a random string
    return `${timestamp}-${randomStr}`;
}
export async function createMssg(convId: string, timestamp: string, sender: string, text: string) {
    try {
        await client.message.create({
            data: {
                id: generateUniqueId(),
                conversationId: convId,
                timestamp: new Date(timestamp),
                senderId: 45454, // You didn't specify how to determine senderId
                text: text,
                senderType: sender,
            }
        });
    } catch (error) {
        console.log(error)
    }
}

async function getToken(shop: string) {

    try {
        const shopRecord = await client.shopify_installed_shop.findUnique({
            where: { shop },
        });
        if (shopRecord) {
            return shopRecord.accessToken;
        } else {
            console.log(`Shop ${shop} not found.`);
            return null;
        }

    } catch (error) {
        console.error('Error retrieving access token:', error);
        return null;

    }

}

function extractProductData(product: any) {

    const {
        title,
        body_html,
        product_type,
        tags,
        variants,
        options,
        image,
    } = product;

    const productString = `Title: ${title}
          Body HTML: ${body_html || ''}
          Product Type: ${product_type}
          Tags: ${tags}
          Variants: ${variants
            .map(
                (variant: any) =>
                    `ID: ${variant.id}, Title: ${variant.title}, Price: ${variant.price}, SKU: ${variant.sku}, Inventory Quantity: ${variant.inventory_quantity}`
            )
            .join('; ')}
          Options: ${options
            .map((option: any) => `ID: ${option.id}, Name: ${option.name}, Values: ${option.values.join(', ')}`)
            .join('; ')}
          Image: ${image
            ? `ID: ${image.id}, Source: ${image.src}, Alt Text: ${image.alt}, Width: ${image.width}, Height: ${image.height}`
            : 'No Image'
        }`;

    return productString;
}
function extactMetaFields(data: any) {
    const { metafields } = data;
    const keyValuePair = []
    const len = metafields.length;
    for (let i = 0; i < len; i++) {
        const { key } = metafields[i];
        const { value } = metafields[i];
        keyValuePair.push([key, value]);
    }
    return keyValuePair;
}
export async function productUpdate(id: string, shop: string) {
    try {
        const token = await getToken(shop)
        const resp = await axios.get(`https://${shop}/admin/api/2024-04/products/${id}.json`, {
            headers: {
                'X-Shopify-Access-Token': token
            }
        })
        const { product } = resp.data;
        const details = extractProductData(product);
        const metaresp = await axios.get(`https://${shop}/admin/api/2024-04/products/${id}/metafield.json`, {
            headers: {
                'X-Shopify-Access-Token': token
            }
        })
        const data = extactMetaFields(metaresp.data)
        let metadata: { [key: string]: any } = {};
        metadata["text"] = details;
        data.map(([key, value]) => {
            metadata[key] = value;
        })

        const indexName = extractIndexName(shop);
        const index = pc.index(indexName)
        const vector = await createEmbedding(details);
        await index.upsert([
            {
                "id": String(id),
                "values": vector,
                "metadata": metadata
            }
        ])
    } catch (e) {
        console.log(e)
    }

}