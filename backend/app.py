import os
import gradio as gr
from main import app as fastapi_app
import uvicorn

def greet():
    return "MatchPoint Backend API is running. Access API documentation at /docs"

with gr.Blocks() as demo:
    gr.Markdown("# MatchPoint Resume-Job Matching API")
    gr.Markdown("Backend service for AI-powered resume-job matching analysis.")
    gr.Markdown("API documentation: [FastAPI Docs](/docs)")
    greet_btn = gr.Button("Check API Status")
    output = gr.Textbox(label="Status")
    greet_btn.click(fn=greet, outputs=output)

app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
