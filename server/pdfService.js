const puppeteer = require("puppeteer");

async function createPdf(resumeContent) {
  // Simple HTML Wrapper for the content
  // In a real app, you would use a template engine like EJS or Handlebars here
  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Helvetica, sans-serif; padding: 40px; line-height: 1.6; }
          h1, h2, h3 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
          pre { white-space: pre-wrap; font-family: inherit; }
        </style>
      </head>
      <body>
        <div class="resume-container">
          <pre>${resumeContent}</pre>
        </div>
      </body>
    </html>
  `;

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // Required for Docker
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent);

  const pdfBuffer = await page.pdf({ format: "A4" });

  await browser.close();
  return pdfBuffer;
}

module.exports = { createPdf };
