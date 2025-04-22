import {GoogleGenAI} from '@google/genai'
import { env } from 'process'

const chatParams = {
    "model": "gemini-2.5-pro-preview-03-25",
    "history": []
}

const messageParams = {
    "message": [
        {
            "text": "Please create a python program that generates the factorial of a number input on the command line. Respond only with the create_file tool call for factorial.py"
        }
    ],
    "config": {
        "tools": [
            {
                "functionDeclarations": [
                    {
                        "name": "create_file",
                        "description": "Create or overwrite a file in the workspace.",
                        "parameters": {
                            "type": "OBJECT",
                            "required": [
                                "path",
                                "content"
                            ],
                            "properties": {
                                "path": {
                                    "type": "STRING",
                                    "description": "The path of the file to be created. If the file exists, it will be overwritten."
                                },
                                "content": {
                                    "type": "STRING",
                                    "description": "The content for the file (REQUIRED)"
                                }
                            }
                        }
                    }
                ]
            }
        ],
        "maxOutputTokens": 65536
    }
}
const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })
const chat = client.chats.create(chatParams)
const stream = await chat.sendMessageStream(messageParams)

for await (const chunk of stream) {
    for (const part of chunk?.candidates?.at(0)?.content?.parts ?? []) {
        if (part.functionCall?.name !== "create_file") {
            continue;
        }
        const generatedContent = part.functionCall?.args?.content ?? ""
        if (generatedContent[0] === '\\') {
            console.log(generatedContent.slice(0, 20) + "...")
        }
    }
}
