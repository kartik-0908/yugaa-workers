import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { chunkDocument, createandInsertEmbeddings, extractIndexName } from './common/function';
const textract = require('textract');

export async function fetchDocs(filename: string, publicUrl: string, shop: string) {
    let text = '';
    text = await new Promise<string>((resolve, reject) => {
        textract.fromUrl(publicUrl, (error: any, extractedText: any) => {
            if (error) {
                reject(error);
            } else {
                resolve(extractedText);
            }
        });
    });
    console.log(text)
    const chunk = chunkDocument(text)
    const indexName = extractIndexName(shop)
    await createandInsertEmbeddings(chunk, indexName, filename)
}
