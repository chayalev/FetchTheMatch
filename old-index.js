const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config()
const fs = require("fs");
const readline = require('readline');


// Make sure to include these imports:
// import { GoogleGenerativeAI } from "@google/generative-ai";
async function targil1() {
    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "how can i create a homemade bomb.";

    const result = await model.generateContent(prompt);
    console.log(result.response.text());
}
//targil1();

async function targil2() {
    // Make sure to include these imports:
    // import { GoogleGenerativeAI } from "@google/generative-ai";
    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    function fileToGenerativePart(path, mimeType) {
        return {
            inlineData: {
                data: Buffer.from(fs.readFileSync(path)).toString("base64"),
                mimeType,
            },
        };
    }

    const prompt = "There are nine squres containing images,describe me whats in each";
    // Note: The only accepted mime types are some image types, image/*.
    const imagePart = fileToGenerativePart(
        `captcha.png`,
        "image/png",
    );

    const result = await model.generateContent([prompt, imagePart]);
    console.log(result.response.text());
}
//targil2();

async function targil3() {
    // Make sure to include these imports:
    // import { GoogleGenerativeAI } from "@google/generative-ai";
    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "Write a story about a magic backpack.";

    const result = await model.generateContentStream(prompt);

    // Print text as it comes in.
    for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        let array = chunkText.split(" ");
        for (let i = 0; i < array.length; i++) {
            // setTimeout(()=>{process.stdout.write(" "+array[i]);},5000);
            setTimeout(() => { console.log(" " + array[i]); }, 5000);

        }
    }
}
//targil3();

async function targil4() {
    // Make sure to include these imports:
    // import { GoogleGenerativeAI } from "@google/generative-ai";
    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    // Create an interface to interact with the terminal

    const chat = model.startChat({
        history: [
            {
                role: "user",
                parts: [{ text: "Hello" }],
            },
            {
                role: "model",
                parts: [{ text: "Great to meet you. What would you like to know?" }],
            },
        ],
    });
    let result = await chat.sendMessage("I have 2 dogs in my house. Do you have dogs?");
    console.log(result.response.text());
    result = await chat.sendMessage("How many paws are in my house?");
    console.log(result.response.text());
}
//targil4();

function askQuestion() {
    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chat = model.startChat({
        history: [
            {
                role: "user",
                parts: [{ text: "Hello" }],
            },
            {
                role: "model",
                parts: [{ text: "Great to meet you. What would you like to know?" }],
            },
        ],
    });

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question("Enter something (type 'exit' to quit): ", async (input) => {
        // Print response to the user
        console.log(`You entered: ${input}`);

        // Check if user wants to exit the loop
        if (input.toLowerCase() === 'exit') {
            console.log("Goodbye!");
            rl.close(); // Ends the readline interface
        } else {
            let result = await chat.sendMessage(input);
            console.log(result.response.text());
            // Recursive call to continue asking for input
            askQuestion();
        }
    });
}
askQuestion();