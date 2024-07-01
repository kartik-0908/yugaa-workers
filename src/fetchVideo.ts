import axios from 'axios';
// import { GoogleAuth } from 'google-auth-library';

// Types for request and response
interface SpeechToTextRequest {
    config: {
        languageCode: string;
        enableAutomaticPunctuation: boolean;
    };
    audio: {
        uri: string;
    };
}

interface TranscriptResponse {
    results: Array<{
        alternatives: Array<{
            transcript: string;
            confidence: number;
        }>
    }>;
}

// Function to get transcript from video URL
// export async function getVideoTranscript(videoUrl: string): Promise<string> {
//     const auth = new GoogleAuth({
//         keyFilename: '/home/kartik/yugaa/workers/yugaa-422606-2d91539663c1.json', // Update the path to your service account JSON file
//         scopes: ['https://www.googleapis.com/auth/cloud-platform']
//     });

//     const client = await auth.getClient();
//     const endpoint = `https://speech.googleapis.com/v1/speech:recognize`;

//     const requestPayload: SpeechToTextRequest = {
//         config: {
//             languageCode: 'en-US', // Change this based on your video language
//             enableAutomaticPunctuation: true
//         },
//         audio: {
//             uri: videoUrl
//         }
//     };

//     try {
//         const response = await axios.post<TranscriptResponse>(endpoint, requestPayload, {
//             headers: await client.getRequestHeaders()
//         });
//         const results = response.data.results;
//         return results.map(result => result.alternatives[0].transcript).join(' ');
//     } catch (error) {
//         console.error('Failed to retrieve transcript:', error);
//         return 'Failed to retrieve transcript';
//     }
// }

