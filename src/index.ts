import axios from "axios";
import { sendInitialEmail } from "./common/email";
import { createMssg, productUpdate, subscribeWebhook, updateProduct } from "./common/function";
import { fetchDocs } from "./fetchDocs";
import { fetchLinks } from "./fetchLinks";
import { fetchProducts } from "./fetchProducts";
// import { getVideoTranscript } from "./fetchVideo";
import { PubSub } from '@google-cloud/pubsub';

const pubSubClient = new PubSub({
    projectId: "yugaa-424705",
    credentials: {
        client_email: process.env.CLIENT_EMAIL,
        private_key: process.env.PRIVATE_KEY,
    },
});


require('dotenv').config();

async function startWorker() {

    try {
        console.log("Worker connected to Pub/Sub.");
        const subscriptions = [
            // { name: 'email-topic-sub', handler: handleSendEmail },
            { name: 'initialize-shop', handler: handleinitializeShop },
            { name: 'store-mssg-sub', handler: handleCreateMssg },
            { name: 'fetch-products', handler: handlefetchProduct },
            { name: 'update-product-with-id-sub', handler: handleUpdateProductwithID },
        ];

        console.log(`Waiting for messages in subscriptions: ${subscriptions.map(sub => sub.name).join(', ')}...`);
        subscriptions.forEach(sub => {
            const subscription = pubSubClient.subscription(sub.name);
            subscription.on('message', async message => {
                try {
                    const data = JSON.parse(message.data.toString());
                    await sub.handler(data);
                    message.ack();
                } catch (error) {
                    console.error(`Error processing message from ${sub.name}:`, error);
                    message.nack();
                }
            });

            subscription.on('error', error => {
                console.error(`Error in subscription ${sub.name}:`, error);
            });
        });

        // while (true) {
        //     const result = await redis.brpop(...queues, 3);  // Timeout after 5 seconds
        //     if (result) {
        //         const [queue, message] = result;
        //         const data = JSON.parse(message);
        //         console.log(data)
        //         if (queue === 'fetch-shopify') {
        //             const { shop } = data;
        //             const { accessToken } = data;
        //             await fetchProducts(shop, accessToken)
        //         }
        //         else if (queue === 'fetch-links') {
        //             const { id } = data;
        //             const { shop } = data;
        //             const { url } = data;
        //             const { type } = data;
        //             await fetchLinks(id, shop, url, type)
        //         }
        //         else if (queue === 'fetch-docs') {
        //             const { fileName } = data;
        //             const { shop } = data;
        //             const { publicUrl } = data;
        //             const { type } = data;
        //             await fetchDocs(fileName, publicUrl, shop, type)
        //         }
        //         else if (queue === 'fetch-video') {
        //             const { shop } = data;
        //             const { url } = data;
        //             const text = await getVideoTranscript(url)
        //             console.log(text)
        //         }
        //         else if (queue === 'product-update') {
        //             const { id } = data;
        //             const { shopDomain } = data;
        //             const { type } = data;
        // await productUpdate(id, shopDomain, type)
        //         }
        //         else if (queue === 'create-ticket') {
        //             const { ticketId } = data;
        //             const { conversationId } = data;
        //             const { shop } = data;
        //             const { time } = data;
        //             await updateTicket(ticketId, conversationId, shop, time)
        //         }
        //         else if (queue === 'create-conv') {
        //             const { id } = data;
        //             const { shop } = data;
        //             const { time } = data;
        //             await createConv(shop, id, time)
        //         }
        //         else if (queue === 'create-mssg') {
        //             const { convId } = data;
        //             const { sender } = data;
        //             const { text } = data;
        //             const { timestamp } = data;
        //             await createMssg(convId, timestamp, sender, text)
        //         }
        //         else if (queue === 'subs-webhook') {
        //             const { shop } = data;
        //             const { accessToken } = data;
        //             await subscribeWebhook(shop, accessToken)
        //         }
        //     }
        //     else {
        //         console.log('No message received, polling again...');
        //     }
        // }
    }
    catch (error) {
        console.error("Failed to connect to Pub/Sub", error);
    }
}

async function handlefetchProduct(data: any) {
    const { shopDomain } = data;
    const res = await axios.post(`${process.env.BASE_API_URL}/v1/admin/access-token`, {
        shopDomain
    })
    const { accessToken } = res.data;
    await subscribeWebhook(shopDomain, accessToken);
    await fetchProducts(shopDomain, accessToken);

}
async function handleinitializeShop(data: any) {
    const { shopDomain } = data;
    try {
        const res1 = await axios.post(`${process.env.WORKER_WEBHOOK_URL}/initialize/plan`, {
            shopDomain
        })
        const res2 = await axios.post(`${process.env.WORKER_WEBHOOK_URL}/initialize/customizations`, {
            shopDomain
        })
        const res3 = await axios.post(`${process.env.WORKER_WEBHOOK_URL}/initialize/email`, {
            shopDomain
        })
    } catch (error) {
        console.log(error)
    }
}
async function handleSendEmail(data: any) {
    // const { shop, accessToken } = data;
    // console.log(data)
    await sendInitialEmail(data.fromAddress, data.recipientAddress, data.subject, data.htmlContent)
}

async function handleUpdateProductwithID(data: any) {
    const { id, shopDomain, type } = data;
    const res = await axios.post(`${process.env.BASE_API_URL}/v1/admin/access-token`, {
        shopDomain
    })
    const { accessToken } = res.data;
    await productUpdate(id, shopDomain, accessToken, type)
}

async function handleCreateTicket(data: any) {
    const { ticketId, conversationId, shop, time } = data;
    // await updateTicket(ticketId, conversationId, shop, time);
}

async function handleCreateConv(data: any) {
    const { id, shop, time } = data;
    // await createConv(shop, id, time);
}

async function handleCreateMssg(data: any) {
    const { ticketId, sender, message , timestamp } = data;
    await createMssg(ticketId, sender, message, timestamp);
}

async function handleProductUpdate(data: any) {
    const { id, shopDomain, type } = data;
    const res = await axios.post(`${process.env.BASE_API_URL}/v1/admin/access-token`, {
        shopDomain
    })
    const { accessToken } = res.data;
    await productUpdate(id, shopDomain, accessToken, type);
}

startWorker();

