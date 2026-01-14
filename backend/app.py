import os
import gradio as gr
from main import app as fastapi_app
import uvicorn

# Minimal Gradio interface
def greet():
    return "Welcome to MatchPoint Backend API. The API is running at /api/docs"

with gr.Blocks() as demo:
    gr.Markdown("# MatchPoint Resume-Job Matching API")
    gr.Markdown("This is a backend service for matching resumes to job descriptions.")
    gr.Markdown("API documentation available at [FastAPI Docs](/api/docs)")
    greet_btn = gr.Button("Check Status")
    output = gr.Textbox(label="Status")
    greet_btn.click(fn=greet, outputs=output)

# Mount FastAPI app
app = gr.mount_gradio_app(fastapi_app, demo, path="/api")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
