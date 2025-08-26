# app/services/talent_rediscovery_service.py
import json
from sqlalchemy.orm import Session

# Import your models and the generic AI service
from app.database.models import candidate as candidate_model
from app.database.models import job as job_model
from app.services import gemini_service

def find_matching_candidates_for_job(job_id: int, db: Session):
    print(f"\n--- [DEBUG] Starting Talent Rediscovery for Job ID: {job_id} ---")
    
    db_job = db.query(job_model.JobPosting).filter(job_model.JobPosting.JobID == job_id).first()
    if not db_job: return None

    all_candidates = db.query(candidate_model.Candidate).all()
    print(f"--- [DEBUG] Found {len(all_candidates)} total candidates in the talent pool. ---")
    
    matching_candidates = []
    threshold = 60.0

    for candidate in all_candidates:
        print(f"\n--- [DEBUG] Processing Candidate ID: {candidate.CandidateID} ({candidate.FullName}) ---")

        # --- NEW GUARDRAIL ---
        # If the candidate has no resume summary, we can't score them.
        if not candidate.ResumeSummary or not candidate.ResumeSummary.strip():
            print(f"  --> SKIPPING: Candidate has no resume summary.")
            continue
        # --- END OF GUARDRAIL ---

        existing_application = db.query(candidate_model.JobApplication).filter(
            candidate_model.JobApplication.CandidateID == candidate.CandidateID,
            candidate_model.JobApplication.JobID == job_id
        ).first()
        if existing_application:
            print(f"  --> SKIPPING: Candidate has already applied for this job.")
            continue

        prompt = f"""
        #-- Role: Expert System --#
        You are a highly precise data extraction system. Your only function is to compare two pieces of text and return a structured JSON object. You must adhere to the output format exactly.

        #-- Task --#
        Analyze the "Candidate Summary" and determine how well it matches the "Job Description".
        Provide a numerical score and a brief justification.

        #-- Input Data --#
        Job Description: "{db_job.Description}"
        Candidate Summary: "{candidate.ResumeSummary}"

        #-- STRICT OUTPUT FORMAT --#
        Your response MUST be a single, valid JSON object and nothing else.
        Do not include markdown, comments, or any text outside of the JSON structure.
        The JSON object MUST contain ONLY these two keys: "match_score" and "match_summary".

        {{
          "match_score": <A number from 0 to 100>,
          "match_summary": "<A one-sentence justification for the score>"
        }}
        """
        
        ai_response_text = ""
        try:
            ai_response_text = gemini_service.get_text_response(prompt)
            
            # --- START OF NEW JSON EXTRACTION LOGIC ---
            # Find the start of the JSON object
            json_start = ai_response_text.find('{')
            # Find the end of the JSON object (the last closing brace)
            json_end = ai_response_text.rfind('}')
            
            if json_start != -1 and json_end != -1:
                # Slice the string to get only the JSON part
                json_string = ai_response_text[json_start:json_end+1]
                
                # Parse the extracted, clean JSON string
                ai_analysis = json.loads(json_string)
            else:
                # If we can't find a JSON object, raise an error
                raise ValueError("No valid JSON object found in AI response")
            # --- END OF NEW JSON EXTRACTION LOGIC ---
            
            score = float(ai_analysis.get("match_score", 0))
            print(f"  --> AI Score Received: {score}")

            if score > threshold:
                print(f"  --> SUCCESS: Score is above threshold ({threshold}). Adding to results.")
                matching_candidates.append({
                    "CandidateID": candidate.CandidateID,
                    "FullName": candidate.FullName,
                    "Email": candidate.Email,
                    "match_score": score,
                    "match_summary": ai_analysis.get("match_summary", "No summary provided.")
                })
            else:
                print(f"  --> SKIPPING: Score of {score} is not above threshold ({threshold}).")

        except (json.JSONDecodeError, ValueError) as e:
            print(f"  --> SKIPPING: Could not parse JSON from AI response. Error: {e}")
            print(f"  --> AI RAW RESPONSE: '{ai_response_text}'")
            continue
        except Exception as e:
            print(f"  --> SKIPPING: AI call failed. Error: {e}")
            continue

    # ... (rest of the function is the same) ...
    print(f"\n--- [DEBUG] Finished Processing. Found {len(matching_candidates)} matches. ---")
    sorted_matches = sorted(matching_candidates, key=lambda x: x['match_score'], reverse=True)
    return {"job_title": db_job.JobTitle, "matching_candidates": sorted_matches}