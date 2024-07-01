import { MongoClient } from "mongodb";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { embeddingModel } from "../azureOpenai/embedding";
const client = new MongoClient(process.env.MONGODB_ATLAS_URI || "");

export async function addContent(id: string, shopDomain: string, pageContent: string, metadata: any) {
    const collection = client.db(process.env.MONGO_DB_NAME).collection(process.env.MONGO_DB_COLLECTION || "");
    await deleteContent(id)
    const vectorstore = await new MongoDBAtlasVectorSearch(embeddingModel, {
        collection,
    }).addDocuments([
        { pageContent: pageContent, metadata: metadata }
    ],{
        
    })
    console.log(vectorstore);
}

export async function deleteContent(id: string) {
    const collection = client.db(process.env.MONGO_DB_NAME).collection(process.env.MONGO_DB_COLLECTION || "");
    const query = { [id]: id };
    const document = await collection.findOne(query)
    if (document) {
        console.log(document);
        const result = await collection.deleteOne(query);
    }
}



