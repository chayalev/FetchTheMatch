// We work with: Vertex AI SDK


const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const { PDFDocument } = require("pdf-lib");
const { PDFFile} = require('pdfkit');
const express = require('express');
const multer = require('multer');
const jsPDF = require('jspdf');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const utils = require("./utils");
// Function to generate content using Google Generative AI
async function generateContentFromPDF(filePath, jobDescription, textPrompt) {
    // Initialize GoogleGenerativeAI and GoogleAIFileManager with API_KEY.
    const genAI = new GoogleGenerativeAI("AIzaSyCpTtRhvrwzNXzNvnuRVVEFKJntL-sMJ6o");
    const fileManager = new GoogleAIFileManager("AIzaSyCpTtRhvrwzNXzNvnuRVVEFKJntL-sMJ6o");

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
    });

    // Upload the file and specify a display name.
    const uploadResponse = await fileManager.uploadFile(filePath, {
        mimeType: "application/pdf",
        displayName: "Uploaded PDF", // You can customize this
    });

    console.log(
        `Uploaded file ${uploadResponse.file.displayName} as: ${uploadResponse.file.uri}`,
    );

    // Generate content 
    const result = await model.generateContent([
        {
            fileData: {
                mimeType: uploadResponse.file.mimeType,
                fileUri: uploadResponse.file.uri,
            },
        },
        {
            text: textPrompt + jobDescription
        },
    ]);

    return result;
}

//===================================================================
//    NO NEED TO INSTALL ANYTHING, JUST THE REGULAR GEMINI SDK WE ALREADY USED
app.get('/afterhello', async (req, res) => {
    // Initialize GoogleGenerativeAI with API_KEY.
    const genAI = new GoogleGenerativeAI("AIzaSyBNDkvkF1-NHuIFFsPkDqGa9K1tG4FLViA");
    // Initialize GoogleAIFileManager with API_KEY.
    const fileManager = new GoogleAIFileManager("AIzaSyBNDkvkF1-NHuIFFsPkDqGa9K1tG4FLViA");

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",  // which model to use
    });

    // Upload the file and specify a display name.
    const uploadResponse = await fileManager.uploadFile("CV/CV_student_SW.pdf", {
        mimeType: "application/pdf",
        displayName: "Anna CV PDF",
    });

    // Print the response.
    console.log(
        `Uploaded file ${uploadResponse.file.displayName} as: ${uploadResponse.file.uri}`,
    );

    const theJob = require("./job");
    let theJobOffering = theJob.job;

    // Generate content using text and the URI reference for the uploaded file.
    const result = await model.generateContent([
        {
            fileData: {
                mimeType: uploadResponse.file.mimeType,
                fileUri: uploadResponse.file.uri,
            },
        },
        // { text: "Please summarize this document as list of skills formated as valid json object without any quates marks" },
        // { text: "Please summarize this document as list of tech skills" },
        {
            text: `I am uploading my resume and a job description for a specific position. Please create a professional, personalized cover letter that aligns my skills and experience with the job requirements. 
                  The cover letter should:
                    - Address the company and job title.
                    - Include a brief introduction about me, highlighting my key skills and background.
                    - Mention my relevant experiences and how they relate to the job description.
                    - Explain why I would be an excellent fit for this role.
                    - Conclude with a positive statement about my interest in the position and readiness to discuss further.
                    - don't leave generic information in the text, like "[your name]", instand usethe informaion from the cv document.
                    The job description is as follows: ` +
                `${jobDescription}`
        },
    ]);

    // Output the generated text to the console
    console.log(result.response.text());
    res.send(result.response.text())
})
//===========================================
// please remember to run: npm i multer
// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Specify upload directory
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Rename uploaded file
    }
});

const upload = multer({ storage: storage });

// Middleware to handle file upload and add path LOCATION to req object
const uploadAndAttachPath = (req, res, next) => {
    upload.single('pdfFile')(req, res, (err) => {
        if (err) {
            return res.status(400).send('Error uploading file.');
        }

        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        console.log("req.file.path from client:", req.file.path);

        req.filePathLocation = req.file.path; // TODO: check value again
        next();
    });
};

//====================
app.post('/uploadCV', uploadAndAttachPath, async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    // Access uploaded file information
    console.log("+++++++ req.file", req.file);
    //console.log("******* req.filePathLocation.path", req.filePathLocation.path);


    // Process the uploaded PDF (e.g., save to database, analyze content, etc.)
    const filePathToPrint = `PDF uploaded successfully! ${req.file.path}`;
    //console.log("filePathToPrint", filePathToPrint);


    const filePath = req.file.path;
    const theJob = req.body.jobDescription;


    const jobDescription = theJob;
    let prompt = "";
    const resptypeTemp = req.body.resptype;
    if(resptypeTemp == "skillslist"){
        prompt = `Extract the list of skills from the provided CV file and store them in an array called skills.
        Skills could include programming languages, tools, frameworks, or other technical abilities. Please carefully analyze the document and identify the relevant skills.
        Make sure to return a variable stored in the field result.skills`;

    }
    else {
        prompt = `I am uploading my resume and a job description for a specific position. Please create a professional, personalized cover letter that aligns my skills and experience with the job requirements.

        The cover letter should:
        - Address the company and job title using the provided information or leave out these details if they are not available.
        - Include a brief introduction about me, highlighting my key skills and background relevant to the job.
        - Mention my relevant experiences and specifically align them with the job description.
        - Avoid including placeholders or prompts like "[Platform where you saw the job posting]," "[your name]," or "[your address]". Instead, only use details from my resume or the job description.
        - Conclude with a positive statement about my interest in the position and readiness to discuss further.

        If any specific details are missing from my resume or the job description (like the platform where I found the job posting), leave them out without adding generic placeholders.
      `;
   
    }          
         
    

    try {
        const result = await generateContentFromPDF(filePath, jobDescription, prompt);
        //add option to return a pdf aspdf astext (switch(resptype))
        switch (req.body.resptype) {
            case 'aspdf':
                // Here we need to take result.response.text() and export it to pdf
                const pdfDoc = await PDFDocument.create();
                const page = pdfDoc.addPage([1200, 1000]);
                page.drawText(result.response.text(), {
                    x: 20,
                    y: 950,        // Start the text higher up on the page
                    size: 12,
                    maxWidth: 1160 // Ensure the text doesn't exceed the page width minus margins
                });

                // Convert to bytes and send as response
                const pdfBytes = await pdfDoc.save();

                res.setHeader("Content-Type", "application/pdf");
                res.setHeader("Content-Disposition", "attachment; filename=CoverLetter.pdf");
                return res.send(Buffer.from(pdfBytes));

            case 'astext':
                res.send({
                    content: result.response.text(),
                    message: "File uploaded successfully"
                });
            case 'skillslist':
                res.send(result.response.text())
            default:
                break;
        }

    } catch (error) {
        console.error("Error generating content:", error);
        res.status(500).send("An error occurred while processing your request.");
    }

});

app.post('/existingtexttopdf', async (req, res) => {
    try {
        const { thetext } = req.body;

        if (!thetext) {
            return res.status(400).json({ error: 'Missing "thetext" field in request body' });
        }

        // Create a new PDF document
        const doc = new PDFFile();

        // Set response headers to indicate PDF content
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="generated.pdf"');

        // Pipe the PDF into the response
        doc.pipe(res);

        // Add the text to the PDF
        doc.text(thetext, {
            align: 'left', // You can adjust alignment and other options
            lineGap: 10
        });

        // Finalize the PDF and end the stream
        doc.end();
    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});


//==================================================

//Search jobs on SerpApi based on skills and location
async function searchJobs(skills, location) {
    const apiKey = "fa1ecbb3064b38f2ff60b9fe2f43777d3578d740c50b2f109ecc130f5a9b4af2";

    console.log("skills: ", skills);
    console.log("location:  ", location);

    try {

        // Fetch request to SerpApi
        const response = await fetch(`https://serpapi.com/search?engine=google_jobs&q=${encodeURIComponent(skills.join(', '))}&location=${encodeURIComponent(location)}&api_key=${apiKey}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        //Response
        const data = await response.json();
        const jobResults = data.jobs_results;

        //Filtered the fields
        const filteredJobs = jobResults.map(job => ({
            title: job.title,
            company_name: job.company_name,
            description: job.description,
            url: job.share_link || "" // add link if exists
        }));
        return filteredJobs;

    } catch (error) {
        console.error('Error searching jobs:', error.message);
        throw error;
    }
}

// Route for posting job search requests
app.post('/jobsFromSkillsListSerpApi', async (req, res) => {

    //Get the specific skills
    const skills = req.body.skills;
    const country = "new york";
    try {
        const jobs = await searchJobs(skills, country);

        //Return results & receives skills
        res.json({ skills: skills, jobs: jobs });
    } catch (error) {
        res.status(500).json({ error: 'error while searching'});
    }
});

app.use(express.static('public'));
//=========================
app.listen(3001, function () {
    console.log('My app is listening on port 3001!');
});


//=============================
//In this part we envolve analyzing data from the jobs and from the CV files to predict the latest required skills
//save data page
import mongoose from 'mongoose';
import { GeminiClient } from '@google-cloud/gemini';
import dotenv from 'dotenv';

dotenv.config();

const mongoAtlasUri = 'mongodb+srv://naamashvalb:leHnICQc9v91p649@cluster0.zoxge.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoAtlasUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB Atlas!");
}).catch(err => {
    console.error("Error connecting to MongoDB Atlas:", err);
});

const jobSchema = new mongoose.Schema({
    keywords: [String]
});

const candidateSchema = new mongoose.Schema({
    skills: [String]
});

const Job = mongoose.model('Job', jobSchema);
const Candidate = mongoose.model('Candidate', candidateSchema);

export async function saveJob(keywords) {
    const job = new Job({ keywords });
    await job.save();
}

export async function saveCandidate(skills) {
    const candidate = new Candidate({ skills });
    await candidate.save();
}

export async function analyzeSupplyAndDemand() {
    const jobs = await Job.find();
    const candidates = await Candidate.find();

    const requiredSkills = new Map();
    const existingSkills = new Map();

    jobs.forEach(job => {
        job.keywords.forEach(skill => {
            requiredSkills.set(skill, (requiredSkills.get(skill) || 0) + 1);
        });
    });

    candidates.forEach(candidate => {
        candidate.skills.forEach(skill => {
            existingSkills.set(skill, (existingSkills.get(skill) || 0) + 1);
        });
    });

    const gapAnalysis = [];
    requiredSkills.forEach((count, skill) => {
        const supply = existingSkills.get(skill) || 0;
        if (count > supply) {
            gapAnalysis.push({ skill, demand: count, supply });
        }
    });

    const recommendations = await generateRecommendations(gapAnalysis);
    return recommendations;
}

const gemini = new GeminiClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

export async function generateRecommendations(gapAnalysis) {
    const prompt = `Analyze the following skill gaps and suggest training courses:\n${JSON.stringify(gapAnalysis)}`;
    
    const request = {
        model: 'gemini-text-001',
        prompt: prompt,
        maxTokens: 100
    };

    try {
        const [response] = await gemini.generateText(request);
        return response.text.trim();
    } catch (error) {
        console.error("Error generating recommendations:", error);
        throw error;
    }
}

