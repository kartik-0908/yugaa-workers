"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pinecone_1 = require("@pinecone-database/pinecone");
const pc = new pinecone_1.Pinecone({
    apiKey: 'ad1612ee-9b3f-4269-9e18-362ff724713d'
});
exports.default = pc;
