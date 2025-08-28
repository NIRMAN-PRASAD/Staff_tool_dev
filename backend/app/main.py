# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import all your API routers
from app.api import users, jobs, candidates, departments, portfolios, skills

app = FastAPI(
    title="Staffing Tool API",
    description="API for an AI-powered staffing and recruitment tool.",
    version="1.0.0"
)

# CORS (Cross-Origin Resource Sharing) Middleware
origins = [
    "http://localhost",
    "http://localhost:3000", # For Create React App
    "http://localhost:5173", # For Vite
    # Add your deployed frontend URL here later
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Welcome to the Staffing Tool API"}

# Include all the API routers from your application
app.include_router(users.router)
app.include_router(jobs.router)
app.include_router(candidates.router)
app.include_router(departments.router)
app.include_router(portfolios.router)
app.include_router(skills.router) # <-- Naya skills router