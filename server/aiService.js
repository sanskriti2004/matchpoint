const { ChatOllama, OllamaEmbeddings } = require("@langchain/ollama");
const { PromptTemplate } = require("@langchain/prompts");
const { LLMChain } = require("@langchain/chains");
const { MemoryVectorStore } = require("@langchain/vectorstores/memory");
const { Document } = require("@langchain/schema");

// Initialize Ollama
const llm = new ChatOllama({
  baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  model: "mistral",
  temperature: 0.2,
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

  const prompt = new PromptTemplate({
    template,
    inputVariables: ["resume", "jd"],
  });

  const chain = new LLMChain({ llm, prompt });
  const response = await chain.call({ resume: resumeText, jd: jobDescription });

  return response.text || response.output_text;
}

const embeddings = new OllamaEmbeddings({
  model: "mistral",
  baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
});

async function calculateATSScore(resumeText, jobDescription) {
  const vectorStore = await MemoryVectorStore.fromDocuments(
    [new Document({ pageContent: jobDescription })],
    embeddings
  );

  const results = await vectorStore.similaritySearchWithScore(resumeText, 1);

  const template = `
Act as an ATS Scanner.
Resume: {resume}
Job Description: {jd}

Task:
1. Give a match score from 0 to 100.
2. List missing keywords.
3. List matching strong skills.

Output JSON format: {{ "score": number, "missing": [], "matching": [] }}
`;

  const prompt = new PromptTemplate({
    template,
    inputVariables: ["resume", "jd"],
  });
  const chain = new LLMChain({ llm, prompt });
  const response = await chain.call({ resume: resumeText, jd: jobDescription });

  try {
    return JSON.parse(response.text || response.output_text);
  } catch (err) {
    console.error("Invalid JSON from LLM:", response.text);
    return { score: 0, missing: [], matching: [] };
  }
}

async function generateResumeFromGithub(githubData) {
  const template = `
    You are an expert Resume Writer. 
    Convert the following GitHub profile data into a professional resume text.
    
    GitHub Data: {data}
    
    Rules:
    1. Organize into sections: Summary, Technical Skills, Projects.
    2. Use the "Bio" for the Summary.
    3. Use "Top Projects" to describe experience.
    4. Infer skills based on the programming languages used in projects.
    5. Output strictly in Markdown format.
  `;

  const prompt = PromptTemplate.fromTemplate(template);
  const chain = prompt.pipe(llm);

  // Convert JSON to string for the prompt
  const dataString = JSON.stringify(githubData);

  const response = await chain.invoke({ data: dataString });
  return response.content;
}

module.exports = {
  generateCoverLetter,
  calculateATSScore,
  generateResumeFromGithub,
  llm,
};
