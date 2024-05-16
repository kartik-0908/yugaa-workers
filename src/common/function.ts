import axios from "axios";
import openai from "../lib/openai";
import pc from "../lib/pinecone";
import { client } from "../lib/prisma";
import { error } from "console";
import { val } from "cheerio/lib/api/attributes";

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
export async function productUpdate(id: string, shop: string, type: string) {

    try {
        const indexName = extractIndexName(shop);
        const index = pc.index(indexName)
        if (type === "delete") {
            await index._deleteOne(id)
            console.log(`id ${id} deleted successfull`)
        }
        else {
            const token = await getToken(shop)
            console.log(token)
            const resp = await axios.get(`https://${shop}/admin/api/2024-04/products/${id}.json`, {
                headers: {
                    'X-Shopify-Access-Token': token
                }
            })
            const { product } = resp.data;
            let details = extractProductData(product);
            const countresp = await axios.get(`https://${shop}/admin/api/2024-04/products/${id}/metafields/count.json`, {
                headers: {
                    'X-Shopify-Access-Token': token
                }
            })
            const { count } = countresp.data
            console.log(count)
            let metadata: { [key: string]: any } = {};
            if (count > 0) {
                const metaresp = await axios.get(`https://${shop}/admin/api/2024-04/products/${id}/metafields.json`, {
                    headers: {
                        'X-Shopify-Access-Token': token
                    }
                })
                const data = extactMetaFields(metaresp.data)
                data.map(([key, value]) => {
                    metadata[key] = value;
                    details += (`${key} : ${value}`)

                })

            }
            metadata["text"] = details;



            const vector = await createEmbedding(details);
            await index.upsert([
                {
                    "id": String(id),
                    "values": vector,
                    "metadata": metadata
                }
            ])

        }

    } catch (e) {
        console.log(e)
    }

}

const webhookurl = "https://api.yugaa.tech/webhooks/"

export async function subscribeWebhook(shop: string, accessToken: string) {
    const webhooks = [
        {
            address: `${webhookurl}app/uninstalled`,
            topic: 'app/uninstalled',
            format: 'json',
        },
        {
            address: `${webhookurl}app_subscriptions/update`,
            topic: 'app_subscriptions/update',
            format: 'json',
        },
        {
            address: `${webhookurl}products/create`,
            topic: 'products/create',
            format: 'json',
        },
        {
            address: `${webhookurl}products/delete`,
            topic: 'products/delete',
            format: 'json',
        },
        {
            address: `${webhookurl}products/update`,
            topic: 'products/update',
            format: 'json',
        },
    ];
    for (const webhookData of webhooks) {
        try {
            await createWebhook(shop, accessToken, webhookData);
            await delay(1000); // Delay for 1 second (1000 milliseconds)
        } catch (error) {
            console.error('Error creating webhook:', error);
        }
    }


}


async function createWebhook(shop: any, accessToken: any, webhookData: any) {
    try {
        const response = await axios.post(
            `https://${shop}/admin/api/2024-01/webhooks.json`,
            { webhook: webhookData },
            {
                headers: {
                    'X-Shopify-Access-Token': accessToken,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log('Webhook created:', response.data);
        await saveWebhookDetails(response.data, shop)
        // Handle the successful webhook creation
    } catch (error) {
        console.error('Error creating webhook:');
        // Handle the error
    }
}

function delay(ms: any) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function saveWebhookDetails(webhookResponse: any, shopDomain: any) {
    try {
        const webhook = webhookResponse.webhook;
        console.log(webhook)

        const createdWebhook = await client.registeredWebhooks.create({
            data: {
                id: String(webhook.id),
                address: webhook.address,
                topic: webhook.topic,
                created_at: webhook.created_at,
                updated_at: webhook.updated_at,
                shopDomain: shopDomain,
            },
        });
        console.log('Webhook details saved:', createdWebhook);
    } catch (error) {
        console.error('Error saving webhook details:', error);
        // throw error;
    }
}

export async function deleteRecordsWithPrefix(indexName: string, prefix: string) {
    try {
        const index = pc.index(indexName);
        let paginationToken: string | undefined = undefined;
        let pageList = await index.listPaginated({ prefix });
        let vectorIds = pageList?.vectors?.map((vector) => vector.id);
        if (!vectorIds || !vectorIds.length) {
            return;
        }
        if (vectorIds?.length > 0) {
            await index.deleteMany(vectorIds);
        }
        paginationToken = pageList.pagination?.next;
        while (paginationToken) {
            pageList = await index.listPaginated({ prefix, paginationToken });
            vectorIds = pageList?.vectors?.map((vector) => vector.id);
            if (!vectorIds || !vectorIds.length) {
                return;
            }
            if (vectorIds.length > 0) {
                await index.deleteMany(vectorIds);
            }
            paginationToken = pageList.pagination?.next;
        }
    } catch (error) {
        console.log(error)
    }
}