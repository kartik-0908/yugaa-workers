const sgMail = require('@sendgrid/mail');
import { v4 as uuidv4 } from 'uuid';


export async function sendInitialEmail(fromAddress: string, recipientAddress: string, subject: string, htmlContent: string) {
    const messageId = uuidv4(); // Generate a unique ID for the email
    // console.log(process.env.SENDGRID_API_KEY)
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const emailMessage = {
        to: recipientAddress,
        from: fromAddress, // Dynamic sender address
        subject: subject,
        html: htmlContent,
        headers: {
            'Message-ID': `<${messageId}@yourdomain.com>`,
        },
    };

    try {
        const result = await sgMail.send(emailMessage);
        // console.log(result);
        return messageId; // Return the unique message ID for tracking
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}
export async function replyToEmail(fromAddress: string, recipientAddress: string, subject: string, htmlContent: string, originalMessageId: string) {
    const replyMessageId = uuidv4(); // Generate a unique ID for the reply email

    const emailMessage = {
        to: recipientAddress,
        from: fromAddress, // Dynamic sender address
        subject: `Re: ${subject}`,
        html: htmlContent,
        headers: {
            'Message-ID': `<${replyMessageId}@yourdomain.com>`,
            'In-Reply-To': `<${originalMessageId}@yourdomain.com>`,
            'References': `<${originalMessageId}@yourdomain.com>`,
        },
    };

    try {
        const result = await sgMail.send(emailMessage);
        console.log(result);
        return replyMessageId; // Return the unique message ID for tracking the reply
    } catch (error) {
        console.error('Error sending reply email:', error);
        throw error;
    }
}

