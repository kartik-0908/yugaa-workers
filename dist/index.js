"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fetchDocs_1 = require("./fetchDocs");
const fetchLinks_1 = require("./fetchLinks");
const fetchProducts_1 = require("./fetchProducts");
const fetchVideo_1 = require("./fetchVideo");
const Redis = require('ioredis');
require('dotenv').config();
const redis = new Redis(process.env.REDIS_URL || "");
function startWorker() {
    return __awaiter(this, void 0, void 0, function* () {
        // const res = await redis.lpush('fetch-shopify-products',{message: "hello"});
        // console.log("pushed in reddis")
        try {
            console.log("Worker connected to Redis.");
            console.log(process.env.REDIS_URL);
            // Main loop
            const queues = ['fetch-shopify', 'fetch-links', 'fetch-docs', 'fetch-video', 'create-conv', 'create-mssg', 'product-update'];
            console.log(`Waiting for messages in queues: ${queues.join(', ')}...`);
            while (true) {
                const result = yield redis.brpop(...queues, 3); // Timeout after 5 seconds
                if (result) {
                    const [queue, message] = result;
                    const data = JSON.parse(message);
                    console.log(data);
                    if (queue === 'fetch-shopify') {
                        const { shop } = data;
                        const { accessToken } = data;
                        yield (0, fetchProducts_1.fetchProducts)(shop, accessToken);
                    }
                    else if (queue === 'fetch-links') {
                        const { id } = data;
                        const { shop } = data;
                        const { url } = data;
                        yield (0, fetchLinks_1.fetchLinks)(id, shop, url);
                    }
                    else if (queue === 'fetch-docs') {
                        const { fileName } = data;
                        const { shop } = data;
                        const { publicUrl } = data;
                        yield (0, fetchDocs_1.fetchDocs)(fileName, publicUrl, shop);
                    }
                    else if (queue === 'fetch-video') {
                        const { shop } = data;
                        const { url } = data;
                        const text = yield (0, fetchVideo_1.getVideoTranscript)(url);
                        console.log(text);
                    }
                    else if (queue === 'product-update') {
                        const { id } = data;
                        const { shopDomain } = data;
                        const { type } = data;
                    }
                    else if (queue === 'create-conv') {
                        const { id } = data;
                        const { shopDomain } = data;
                        const { timestamp } = data;
                    }
                    else if (queue === 'create-mssg') {
                        const { convId } = data;
                        const { sender } = data;
                        const { text } = data;
                        const { timestamp } = data;
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
    });
}
startWorker();
