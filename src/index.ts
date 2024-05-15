import { createConv, createMssg, productUpdate, updateProduct } from "./common/function";
import { fetchDocs } from "./fetchDocs";
import { fetchLinks } from "./fetchLinks";
import { fetchProducts } from "./fetchProducts";
import { getVideoTranscript } from "./fetchVideo";

const Redis = require('ioredis');
require('dotenv').config();
const redis = new Redis(process.env.REDIS_URL || "");

async function startWorker() {
    // const res = await redis.lpush('fetch-shopify-products',{message: "hello"});
    // console.log("pushed in reddis")

    try {
        console.log("Worker connected to Redis.");
        console.log(process.env.REDIS_URL);

        // Main loop
        const queues = ['fetch-shopify', 'fetch-links','fetch-docs','fetch-video','create-conv','create-mssg','product-update'];
        console.log(`Waiting for messages in queues: ${queues.join(', ')}...`);

        while (true) {
            const result = await redis.brpop(...queues,3);  // Timeout after 5 seconds
            if (result) {
                const [queue, message] = result;
                const data = JSON.parse(message);
                console.log(data)
                if(queue === 'fetch-shopify'){
                        const {shop} = data;
                        const {accessToken} = data;
                        await fetchProducts(shop, accessToken)
                }
                else if(queue === 'fetch-links'){
                    const {id} = data;
                    const {shop} = data;
                    const {url} = data;
                    await fetchLinks(id,shop,url)
                }
                else if(queue === 'fetch-docs'){
                    const {fileName} = data;
                    const {shop} = data;
                    const {publicUrl} = data;
                    await fetchDocs(fileName,publicUrl,shop)
                }
                else if(queue === 'fetch-video'){
                    const {shop} = data;
                    const {url} = data;
                    const text = await getVideoTranscript(url)
                    console.log(text)
                }
                else if(queue === 'product-update'){
                    const {id} = data;
                    const {shopDomain} = data;
                    const {type} = data;
                    await productUpdate(id,shopDomain)
                }
                else if(queue === 'create-conv'){
                    const {id} = data;
                    const {shop} = data;
                    const {time} = data;
                    await createConv(shop, id, time)
                }
                else if(queue === 'create-mssg'){
                    const {convId} = data;
                    const {sender} = data;
                    const {text} = data;
                    const {timestamp} = data;
                    await createMssg(convId, timestamp, sender, text)
                }
            }
            else {
                console.log('No message received, polling again...');
            }
        }
    }
    catch (error) {
        console.error("Failed to connect to Redis", error);
    }
}

startWorker();

