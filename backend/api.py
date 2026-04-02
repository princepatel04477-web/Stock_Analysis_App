"""
Vercel serverless handler for FastAPI backend.
Wraps the FastAPI app to work as a serverless function.
"""

import sys
import os
from pathlib import Path

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.server import app

# Configure CORS for Vercel deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://stockanalysisapp.vercel.app",
        "https://*.vercel.app",
        "http://localhost:3000",
        "http://localhost:5000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Export as handler for Vercel
handler = app
