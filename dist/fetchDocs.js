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
exports.fetchDocs = void 0;
const axios_1 = __importDefault(require("axios"));
const function_1 = require("./common/function");
const buffer_1 = require("buffer");
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const mammoth_1 = __importDefault(require("mammoth"));
const getFileType = (url) => {
    const match = url.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
    return match ? match[1].toLowerCase() : "";
};
const downloadFile = (url) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield axios_1.default.get(url, { responseType: 'arraybuffer' });
    return response.data;
});
function fetchDocs(filename, url, shop) {
    return __awaiter(this, void 0, void 0, function* () {
        let text = '';
        try {
            const fileType = getFileType(url);
            const data = yield downloadFile(url);
            switch (fileType) {
                case 'pdf':
                    const pdfData = yield (0, pdf_parse_1.default)(data);
                    text = pdfData.text;
                    break;
                case 'docx':
                    const docxResult = yield mammoth_1.default.extractRawText({ buffer: buffer_1.Buffer.from(data) });
                    text = docxResult.value;
                    break;
                case 'txt':
                    text = data.toString('utf8');
                    break;
                default:
                    throw new Error('Unsupported file type');
            }
            const chunk = (0, function_1.chunkDocument)(text);
            const indexName = (0, function_1.extractIndexName)(shop);
            yield (0, function_1.createandInsertEmbeddings)(chunk, indexName, filename);
        }
        catch (error) {
            console.log(error);
        }
    });
}
exports.fetchDocs = fetchDocs;
