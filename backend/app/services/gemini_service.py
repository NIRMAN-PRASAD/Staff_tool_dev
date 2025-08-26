import google.generativeai as genai
import json
import re
from typing import List
from app.core.config import GEMINI_API_KEY

# Configure the Gemini API client
try:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
except Exception as e:
    print(f"FATAL: Error configuring Gemini AI: {e}")
    model = None

def _clean_and_parse_json(response_text: str) -> dict:
    """
    A helper function to clean markdown backticks from AI response and parse JSON.
    """
    json_match = re.search(r'```json\s*(\{.*?\})\s*```', response_text, re.DOTALL)
    if json_match:
        json_string = json_match.group(1)
    else:
        json_string = response_text

    try:
        return json.loads(json_string)
    except json.JSONDecodeError:
        raise ValueError(f"AI service returned invalid JSON. Could not parse the response: {json_string}")

def analyze_resume_with_job_desc(resume_text: str, job_description: str) -> dict:
    """
    Calls the Gemini API to analyze a resume against a job description
    and returns a structured dictionary including a list of skills.
    """
    if model is None:
        raise ConnectionError("Gemini AI model is not configured. Check your API key and configuration.")

    prompt = f"""
    Act as an expert HR technical recruiter. Analyze the following resume against the provided job description.
    Your response must be a single, valid JSON object and nothing else.
    
    The JSON object must have the following keys:
    - "match_score": A number from 0 to 100 representing how well the resume matches the job requirements.
    - "score_details": A JSON object with keys "skills_match", "experience_match", and "education_match", each with a score from 0 to 100.
    - "resume_summary": A concise 3-4 sentence professional summary of the candidate.
    - "technical_skills_summary": A brief paragraph summarizing the key technologies mentioned in the resume.
    - "extracted_email": The candidate's email address found in the resume. If not found, use an empty string "".
    - "extracted_name": The candidate's full name found in the resume. If not found, use an empty string "".
    - "extracted_skills": An array of strings listing all technical skills found in the resume (e.g., ["Python", "React", "SQL", "Docker"]).

    --- JOB DESCRIPTION ---
    {job_description}

    --- RESUME TEXT ---
    {resume_text}
    
    --- JSON OUTPUT ---
    """
    
    try:
        response = model.generate_content(prompt)
        return _clean_and_parse_json(response.text)
    except Exception as e:
        raise ConnectionError(f"An error occurred with the Gemini API: {e}")

def generate_job_description(title: str, skills: List[str], experience: str) -> dict:
    """
    Generates a job description using AI based on provided details.
    """
    if model is None:
        raise ConnectionError("Gemini AI model is not configured.")

    skills_str = ", ".join(skills)
    prompt = f"""
    Act as a senior hiring manager for a top tech company. 
    Generate a professional and compelling job description for the following role.
    The response must be a single, valid JSON object and nothing else.
    
    The JSON object must have one key: "job_description". The value should be a single string containing the full job description formatted with Markdown for readability (using newlines '\\n').
    
    The job description should include these sections:
    - Introduction to the role and company.
    - Key Responsibilities.
    - Required Skills and Qualifications.
    - Preferred Qualifications (optional).

    Job Details:
    - Title: "{title}"
    - Required Skills: "{skills_str}"
    - Years of Experience: "{experience}"

    --- JSON OUTPUT ---
    """
    
    try:
        response = model.generate_content(prompt)
        return _clean_and_parse_json(response.text)
    except Exception as e:
        raise ConnectionError(f"An error occurred during JD generation: {e}")