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
exports.getVideoTranscript = void 0;
const axios_1 = __importDefault(require("axios"));
const google_auth_library_1 = require("google-auth-library");
// Function to get transcript from video URL
function getVideoTranscript(videoUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const auth = new google_auth_library_1.GoogleAuth({
            keyFilename: '/home/kartik/yugaa/workers/yugaa-422606-2d91539663c1.json', // Update the path to your service account JSON file
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
        const client = yield auth.getClient();
        const endpoint = `https://speech.googleapis.com/v1/speech:recognize`;
        const requestPayload = {
            config: {
                languageCode: 'en-US', // Change this based on your video language
                enableAutomaticPunctuation: true
            },
            audio: {
                uri: videoUrl
            }
        };
        try {
            const response = yield axios_1.default.post(endpoint, requestPayload, {
                headers: yield client.getRequestHeaders()
            });
            const results = response.data.results;
            return results.map(result => result.alternatives[0].transcript).join(' ');
        }
        catch (error) {
            console.error('Failed to retrieve transcript:', error);
            return 'Failed to retrieve transcript';
        }
    });
}
exports.getVideoTranscript = getVideoTranscript;
