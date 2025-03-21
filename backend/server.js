const express = require("express");
const multer = require("multer");
const Tesseract = require("tesseract.js");
const gTTS = require("gtts");
const cors = require("cors");
const fs = require("fs");

const app = express();
const port = 5000;

// Enable CORS for frontend communication
app.use(cors());
app.use(express.json());

// Set up Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Endpoint to process uploaded image
app.post("/upload", upload.single("image"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    try {
        // Convert image to text using Tesseract.js
        const { data: { text } } = await Tesseract.recognize(req.file.buffer, "eng");

        if (!text.trim()) {
            return res.status(400).json({ error: "No readable text found" });
        }

        // Create a new file name for each audio to avoid conflicts
        const audioFilePath = "output.mp3";

        // Delete previous audio file (if exists) to ensure fresh audio generation
        if (fs.existsSync(audioFilePath)) {
            fs.unlinkSync(audioFilePath);
        }

        // Convert text to speech using gTTS
        const speech = new gTTS(text, "en");
        

        speech.save(audioFilePath, function (err) {
            if (err) {
                return res.status(500).json({ error: "Error generating speech" });
            }

            // Send extracted text and speech file
            res.json({ text, audio: `http://localhost:${port}/audio` });
        });

    } catch (error) {
        console.error("Error processing image:", error);
        res.status(500).json({ error: "Error processing image" });
    }
});

// Serve the generated audio file
app.get("/audio", (req, res) => {
    res.sendFile(__dirname + "/output.mp3");
});

// Start the backend server
app.listen(port, () => {
    console.log(`✅ Server is running at http://localhost:${port}`);
});
