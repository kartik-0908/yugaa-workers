import axios from "axios";
import openai from "../lib/openai";
import { addContent, deleteContent } from "../lib/langchain/mongodb";

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

// export async function createandInsertEmbeddings(chunks: string[], indexName: string, docName: string): Promise<void> {
//     const index = pc.Index(indexName);

//     for (const [i, chunk] of chunks.entries()) {
//         const embeddingResponse = await openai.embeddings.create({
//             model: "text-embedding-ada-002",
//             input: chunk,
//         });

//         const embedding = embeddingResponse.data[0].embedding;

//         await index.upsert(
//             [
//                 {
//                     id: `${docName}-${i}`,
//                     values: embedding,
//                     metadata: {
//                         text: chunk,
//                     },
//                 },
//             ],
//         );
//     }
// }

export async function updateProduct(id: number, shop: string, type: string) {
    if (type === "delete") {

    }
}

// export async function updateTicket(ticketId: string, conversationId: string, shopDomain: string, time: Date) {
//     try {
//         // Check if the conversationId exists in the related table
//         const existingConversation = await client.conversation.findUnique({
//             where: {
//                 id: conversationId,
//             },
//         });

//         if (!existingConversation) {
//             console.log('Conversation ID does not exist');
//             return;
//         }

//         const existingTicket = await client.ticket.findUnique({
//             where: {
//                 id: ticketId,
//             },
//             include: {
//                 TicketConversation: {
//                     where: {
//                         conversationId: conversationId,
//                     },
//                 },
//             },
//         });

//         if (existingTicket) {
//             // Check if the conversation is already linked to the ticket
//             const isConversationLinked = existingTicket.TicketConversation.some(tc => tc.conversationId === conversationId);

//             if (!isConversationLinked) {
//                 // If the conversation is not linked, create the link
//                 await client.ticketConversation.create({
//                     data: {
//                         ticketId: ticketId,
//                         conversationId: conversationId,
//                         shopDomain: shopDomain,
//                         createdAt: time,
//                         updatedAt: time,
//                     },
//                 });
//                 console.log('Conversation linked to existing ticket');
//             } else {
//                 console.log('Conversation is already linked to this ticket');
//             }
//         } else {
//             // If the ticket does not exist, create a new ticket and link the conversation
//             await client.ticket.create({
//                 data: {
//                     id: ticketId,
//                     shopDomain: shopDomain,
//                     createdAt: time,
//                     updatedAt: time,
//                     TicketConversation: {
//                         create: {
//                             conversationId: conversationId,
//                             shopDomain: shopDomain,
//                             createdAt: time,
//                             updatedAt: time,
//                         },
//                     },
//                 },
//             });
//             console.log('New ticket created and conversation linked');
//         }

//     } catch (error) {
//         console.log(error);
//     }
// }

function generateUniqueId() {
    const timestamp = Date.now().toString(36); // Get the current timestamp and convert it to base36
    const randomStr = Math.random().toString(36).substring(2, 7); // Generate a random string
    return `${timestamp}-${randomStr}`;
}

export async function createMssg(ticketId: string, sender: string, message: string, timestamp: any) {
    console.log(timestamp)
    try {
        await axios.post(`${process.env.WORKER_WEBHOOK_URL}/save-mssg`, {
            ticketId,
            sender,
            message,
            timestamp
        })
    } catch (error) {
        console.log(error)
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
        handle
    } = product;

    const productString = `Title: ${title}
          Body HTML: ${body_html || ''}
          Product Type: ${product_type}
          Tags: ${tags}
          Variants: ${variants
            .map(
                (variant: any) =>
                    `ID: ${variant.id}, Title: ${variant.title}, Price: ${variant.price}, SKU: ${variant.sku}, Inventory Quantity: ${variant.inventory_quantity > 0 ? 'Available' : 'Not Available'}`
            )
            .join('; ')}
          Options: ${options
            .map((option: any) => `ID: ${option.id}, Name: ${option.name}, Values: ${option.values.join(', ')}`)
            .join('; ')}
          Image: ${image
            ? `ID: ${image.id}, Source: ${image.src}, Alt Text: ${image.alt}, Width: ${image.width}, Height: ${image.height}`
            : 'No Image'
        }`;

    return { productString, title, body_html, product_type, tags, variants, options, image, handle };
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
export async function productUpdate(id: string, shop: string, accessToken: string, type: string) {

    try {
        if (type === "delete") {
            await deleteContent(id)
        }
        else {
            const resp = await axios.get(`https://${shop}/admin/api/2024-04/products/${id}.json`, {
                headers: {
                    'X-Shopify-Access-Token': accessToken
                }
            })
            const { product } = resp.data;
            let { handle, productString, title, body_html, product_type, tags, variants, options, image } = extractProductData(product);
            const countresp = await axios.get(`https://${shop}/admin/api/2024-04/products/${id}/metafields/count.json`, {
                headers: {
                    'X-Shopify-Access-Token': accessToken
                }
            })
            const { count } = countresp.data
            console.log(count)
            let metadata: { [key: string]: any } = {};
            metadata["title"] = title
            metadata["id"] = id
            metadata["body_html"] = body_html
            metadata["product_type"] = product_type
            metadata["tags"] = tags
            metadata["variants"] = variants
            metadata["options"] = options
            metadata["image"] = image
            metadata["yugaa_shop"] = shop
            metadata["handle"] = handle
            metadata["yugaa_type"] = "product"
            if (count > 0) {
                const metaresp = await axios.get(`https://${shop}/admin/api/2024-04/products/${id}/metafields.json`, {
                    headers: {
                        'X-Shopify-Access-Token': accessToken
                    }
                })
                const data = extactMetaFields(metaresp.data)
                data.map(([key, value]) => {
                    metadata[key] = value;
                    productString += (`${key} : ${value}`)

                })
            }
            await addContent(id, shop, productString, metadata)
        }

    } catch (e) {
        console.log(e)
    }

}

const webhookurl = process.env.SHOPIFY_WEBHOOK_URL

export async function subscribeWebhook(shop: string, accessToken: string) {
    const webhooks = [
        {
            address: `${webhookurl}/app/uninstalled`,
            topic: 'app/uninstalled',
            format: 'json',
        },
        {
            address: `${webhookurl}/app_subscriptions/update`,
            topic: 'app_subscriptions/update',
            format: 'json',
        },
        {
            address: `${webhookurl}/products/create`,
            topic: 'products/create',
            format: 'json',
        },
        {
            address: `${webhookurl}/products/delete`,
            topic: 'products/delete',
            format: 'json',
        },
        {
            address: `${webhookurl}/products/update`,
            topic: 'products/update',
            format: 'json',
        },
    ];
    for (const webhookData of webhooks) {
        await createWebhook(shop, accessToken, webhookData);
        await delay(2000); // Delay for 1 second (1000 milliseconds)
    }
}
async function createWebhook(shop: any, accessToken: any, webhookData: any) {
    console.log(shop)
    console.log(accessToken)
    console.log(webhookData)

    try {
        const topic = webhookData.topic;
        const res = await axios.get(`https://${shop}/admin/api/2024-01/webhooks.json`, {
            headers: {
                'X-Shopify-Access-Token': accessToken,
            },
        })
        const { data } = res;
        const { webhooks } = data;
        let len = webhooks.length;
        for (let i = 0; i < len; i++) {
            const count = webhooks[i];
            const { topic } = count;
            if (webhookData.topic === topic) {
                console.log("webhook already found")
                return;
            }
        }
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
    } catch (error) {
        console.error(`Error creating webhook: ${error}`);
        throw new Error('could not create webhook ')
        // Handle the error
    }
}

function delay(ms: any) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function saveWebhookDetails(webhookResponse: any, shopDomain: any) {
    const webhook = webhookResponse.webhook;
    console.log(webhook)
    try {
        const createdWebhook = await axios.post(`${process.env.WORKER_WEBHOOK_URL}/save-webhook`, {
            id: String(webhook.id),
            address: webhook.address,
            topic: webhook.topic,
            createdAt: webhook.created_at,
            updatedAt: webhook.updated_at,
            shopDomain: shopDomain,
        }
        );
        console.log('Webhook details send:', createdWebhook.data);

    } catch (error) {
        console.log(error)
        console.log('could not save wwebhook details')
    }
}

// export async function deleteRecordsWithPrefix(indexName: string, prefix: string) {
//     try {
//         const index = pc.index(indexName);
//         let paginationToken: string | undefined = undefined;
//         let pageList = await index.listPaginated({ prefix });
//         let vectorIds = pageList?.vectors?.map((vector) => vector.id);
//         if (!vectorIds || !vectorIds.length) {
//             return;
//         }
//         if (vectorIds?.length > 0) {
//             await index.deleteMany(vectorIds);
//         }
//         paginationToken = pageList.pagination?.next;
//         while (paginationToken) {
//             pageList = await index.listPaginated({ prefix, paginationToken });
//             vectorIds = pageList?.vectors?.map((vector) => vector.id);
//             if (!vectorIds || !vectorIds.length) {
//                 return;
//             }
//             if (vectorIds.length > 0) {
//                 await index.deleteMany(vectorIds);
//             }
//             paginationToken = pageList.pagination?.next;
//         }
//     } catch (error) {
//         console.log(error)
//     }
// }