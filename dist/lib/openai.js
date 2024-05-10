"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default({
    apiKey: "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",
});
exports.default = openai;
