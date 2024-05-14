import { Pinecone } from '@pinecone-database/pinecone';
require('dotenv').config();
const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || ""
});

export default pc;