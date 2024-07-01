import axios from 'axios';
import { chunkDocument,  } from './common/function';
import { Buffer } from 'buffer';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';


const getFileType = (url: string): string => {
    const match = url.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
    return match ? match[1].toLowerCase() : "";
};

const downloadFile = async (url: string): Promise<Buffer> => {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return response.data;
};


export async function fetchDocs(filename: string, url: string, shop: string, type: string) {
    let text = '';
    // const indexName = extractIndexName(shop)
    try {
        if (type === "delete") {
            // await deleteRecordsWithPrefix(indexName, filename)
        }
        else {
            const fileType = getFileType(url);
            const data = await downloadFile(url);
            switch (fileType) {
                case 'pdf':
                    const pdfData = await pdfParse(data);
                    text = pdfData.text;
                    break;
                case 'docx':
                    const docxResult = await mammoth.extractRawText({ buffer: Buffer.from(data) });
                    text = docxResult.value;
                    break;
                case 'txt':
                    text = data.toString('utf8');
                    break;
                default:
                    throw new Error('Unsupported file type');
            }
            const chunk = chunkDocument(text)
            // await createandInsertEmbeddings(chunk, indexName, filename)
        }
    } catch (error) {
        console.log(error)
    }
}
