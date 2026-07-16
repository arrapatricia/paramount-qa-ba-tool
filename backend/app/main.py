from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="QA-BA DocuTest Tool")

class TestCase(BaseModel):
    id: str
    title: str
    status: str  # "Draft", "Ready", "Automated"

class BlogPost(BaseModel):
    id: int
    title: str
    content: str  # Supports HTML/Markdown
    linked_tests: List[str]  # IDs of TestCases

@app.get("/")
def read_root():
    return {"message": "Welcome to the QA BA Tool API"}

@app.get("/projects/{project_id}/docs")
def get_project_docs(project_id: int):
    # Mock data showing how a blog post links to test cases
    return [
        {
            "id": 101,
            "title": "Implementing OAuth2 Login Flow",
            "author": "BA Amanda",
            "content": "<p>We are implementing Google Auth. See test cases: #TC-101, #TC-102</p>",
            "linked_tests": ["TC-101", "TC-102"]
        }
    ]