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
exports.fetchDocs = void 0;
const function_1 = require("./common/function");
const textract = require('textract');
function fetchDocs(filename, publicUrl, shop) {
    return __awaiter(this, void 0, void 0, function* () {
        let text = '';
        text = yield new Promise((resolve, reject) => {
            textract.fromUrl(publicUrl, (error, extractedText) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(extractedText);
                }
            });
        });
        console.log(text);
        const chunk = (0, function_1.chunkDocument)(text);
        const indexName = (0, function_1.extractIndexName)(shop);
        yield (0, function_1.createandInsertEmbeddings)(chunk, indexName, filename);
    });
}
exports.fetchDocs = fetchDocs;
