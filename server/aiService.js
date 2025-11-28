const { ChatOllama } = require("@langchain/ollama");
const { PromptTemplate } = require("@langchain/core/prompts");

// Initialize Ollama
const llm = new ChatOllama({
  baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  model: "mistral",
  temperature: 0.2, // Low temp for factual resume data
});

async function generateCoverLetter(resumeText, jobDescription) {
  const template = `
    You are an expert career consultant. 
    Using the following Resume: "{resume}" 
    and this Job Description: "{jd}",
    write a professional cover letter.
    Highlight relevant skills from the resume that match the JD.
    Keep it concise and professional.
  `;

  const prompt = PromptTemplate.fromTemplate(template);
  const chain = prompt.pipe(llm);

  const response = await chain.invoke({
    resume: resumeText,
    jd: jobDescription,
  });

  return response.content;
}

module.exports = { generateCoverLetter, llm };
