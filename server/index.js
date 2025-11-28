const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdf = require("pdf-parse");
const fs = require("fs");
const { generateResumeFromGithub } = require("./aiService");
const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

// Helper: Parse Resume Text
const parseFile = async (filePath, mimeType) => {
  const dataBuffer = fs.readFileSync(filePath);
  if (mimeType === "application/pdf") {
    const data = await pdf(dataBuffer);
    return data.text;
  }
  // Add docx parsing logic here if needed
  return dataBuffer.toString();
};

app.post("/api/parse-resume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No file uploaded");
    const text = await parseFile(req.file.path, req.file.mimetype);

    // Cleanup temp file
    fs.unlinkSync(req.file.path);

    res.json({ text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/generate-cover-letter", async (req, res) => {
  const { resumeText, jobDescription } = req.body;
  try {
    const letter = await generateCoverLetter(resumeText, jobDescription);
    res.json({ coverLetter: letter });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/github/:username", async (req, res) => {
  try {
    const data = await getGithubData(req.params.username);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/generate-resume", async (req, res) => {
  const { githubData } = req.body;
  try {
    const resumeContent = await generateResumeFromGithub(githubData);
    res.json({ resumeContent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
