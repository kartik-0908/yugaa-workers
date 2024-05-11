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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createandInsertEmbeddings = exports.createEmbedding = exports.chunkDocument = exports.PineconeIndexcreate = exports.extractIndexName = void 0;
const openai_1 = __importDefault(require("../lib/openai"));
const pinecone_1 = __importDefault(require("../lib/pinecone"));
function extractIndexName(shop) {
    const indexName = shop.replace(/\./g, '-');
    return indexName;
}
exports.extractIndexName = extractIndexName;
function PineconeIndexcreate(indexName) {
    return __awaiter(this, void 0, void 0, function* () {
        yield pinecone_1.default.createIndex({
            name: indexName,
            dimension: 1536,
            spec: {
                serverless: {
                    cloud: 'aws',
                    region: 'us-east-1'
                }
            },
            metric: 'cosine',
            suppressConflicts: true
        });
    });
}
exports.PineconeIndexcreate = PineconeIndexcreate;
function chunkDocument(text) {
    const wordsPerChunk = 1000;
    const overlapWords = 200;
    // Split the text into an array of words
    const words = text.split(/\s+/);
    console.log(words);
    const chunks = [];
    let startIndex = 0;
    // console.log(text)
    console.log(text);
    const endIndex = Math.min(startIndex + wordsPerChunk, words.length);
    const chunk = words.slice(startIndex, endIndex).join(' ');
    chunks.push(chunk);
    console.log(chunks);
    console.log(words);
    startIndex = endIndex - overlapWords;
    console.log(startIndex);
    while (startIndex < words.length) {
        const endIndex = Math.min(startIndex + wordsPerChunk, words.length);
        const chunk = words.slice(startIndex, endIndex).join(' ');
        chunks.push(chunk);
        startIndex += (wordsPerChunk - overlapWords);
        console.log(startIndex);
    }
    return chunks;
}
exports.chunkDocument = chunkDocument;
function createEmbedding(text) {
    return __awaiter(this, void 0, void 0, function* () {
        const embeddingResponse = yield openai_1.default.embeddings.create({
            model: "text-embedding-ada-002",
            input: text,
        });
        const embedding = embeddingResponse.data[0].embedding;
        return embedding;
    });
}
exports.createEmbedding = createEmbedding;
function createandInsertEmbeddings(chunks, indexName, docName) {
    return __awaiter(this, void 0, void 0, function* () {
        const index = pinecone_1.default.Index(indexName);
        for (const [i, chunk] of chunks.entries()) {
            const embeddingResponse = yield openai_1.default.embeddings.create({
                model: "text-embedding-ada-002",
                input: chunk,
            });
            const embedding = embeddingResponse.data[0].embedding;
            yield index.upsert([
                {
                    id: `${docName}-${i}`,
                    values: embedding,
                    metadata: {
                        data: chunk,
                    },
                },
            ]);
        }
    });
}
exports.createandInsertEmbeddings = createandInsertEmbeddings;
