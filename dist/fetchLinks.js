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
exports.fetchLinks = void 0;
const axios_1 = __importDefault(require("axios"));
const function_1 = require("./common/function");
require('dotenv').config();
require("cheerio");
//id:0 - faq
//id:1 - terms
//id:2 - help
function fetchLinks(id, shop, url) {
    return __awaiter(this, void 0, void 0, function* () {
        const indexName = (0, function_1.extractIndexName)(shop);
        try {
            // Extract data from the URL using Scraping Ant API
            const response = yield axios_1.default.get("https://api.scrapingant.com/v2/extract", {
                params: {
                    url: url,
                    extract_properties: "content",
                },
                headers: {
                    "x-api-key": process.env.SCRAPING_ANT_API_KEY,
                },
            });
            const { content } = response.data;
            console.log(typeof (content));
            if (id === 0) {
                const chunks = (0, function_1.chunkDocument)(content);
                yield (0, function_1.createandInsertEmbeddings)(chunks, indexName, "faq");
            }
            else if (id === 1) {
                const chunks = (0, function_1.chunkDocument)(content);
                // console.log(chunks)
                yield (0, function_1.createandInsertEmbeddings)(chunks, indexName, "terms");
            }
            else if (id === 2) {
                const chunks = (0, function_1.chunkDocument)(content);
                yield (0, function_1.createandInsertEmbeddings)(chunks, indexName, "help");
            }
        }
        catch (error) {
            console.error(`Error processing URL: ${url}`, error);
        }
    });
}
exports.fetchLinks = fetchLinks;
