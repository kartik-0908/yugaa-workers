import axios from "axios";
import { chunkDocument, createandInsertEmbeddings, extractIndexName } from "./common/function";
require('dotenv').config();
import "cheerio";
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/dist/text_splitter";

//id:0 - faq
//id:1 - terms
//id:2 - help
export async function fetchLinks(id: number, shop: string, url: string) {
    const indexName = extractIndexName(shop);
    try {
        // Extract data from the URL using Scraping Ant API
       
        const response = await axios.get("https://api.scrapingant.com/v2/extract", {
            params: {
                url: url,
                extract_properties: "content",
            },
            headers: {
                "x-api-key": process.env.SCRAPING_ANT_API_KEY,
            },
        });

        const { content } = response.data;
        console.log(typeof(content))
        if (id === 0) {
            const chunks = chunkDocument(content);
            await createandInsertEmbeddings(chunks, indexName, "faq")
        }
        else if (id === 1) {
            const chunks = chunkDocument(content);
            // console.log(chunks)
            await createandInsertEmbeddings(chunks, indexName, "terms")
        }
        else if (id === 2) {
            const chunks = chunkDocument(content);
            await createandInsertEmbeddings(chunks, indexName, "help")
        }
    } catch (error) {
        console.error(`Error processing URL: ${url}`, error);
    }
}