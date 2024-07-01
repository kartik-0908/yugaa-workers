import { PubSub } from '@google-cloud/pubsub';

const pubSubClient = new PubSub({
    projectId: "yugaa-424705",
    credentials: {
        client_email: process.env.CLIENT_EMAIL,
        private_key: process.env.PRIVATE_KEY,
    },
});

export async function updateProductwithID(shopDomain: string, id: string, type: string) {
    const topicName = 'update-product-with-id';
    const dataBuffer = Buffer.from(JSON.stringify({ 
        shopDomain,
        id,
        type:type
     }));
    try {
        const messageId = await pubSubClient.topic(topicName).publishMessage({ data: dataBuffer });
        console.log(`Message ${messageId} published to ${topicName}.`);
    } catch (error) {
        console.error(`Error publishing message to ${topicName}:`, error);
    }
}

