#!/usr/bin/env python3
"""
Development startup script for Stock Analysis App
Starts both backend and frontend services
"""

import subprocess
import sys
import time
import requests
import os
from threading import Thread

def start_backend():
    """Start the FastAPI backend server"""
    print("🚀 Starting Backend Server (FastAPI)...")
    os.chdir("backend")
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "server:app", 
            "--host", "127.0.0.1", 
            "--port", "8001", 
            "--reload"
        ])
    except KeyboardInterrupt:
        print("\n👋 Backend server stopped")
    finally:
        os.chdir("..")

def start_frontend():
    """Start the Next.js frontend server"""
    print("🚀 Starting Frontend Server (Next.js)...")
    try:
        subprocess.run([
            "npm", "run", "dev"
        ])
    except KeyboardInterrupt:
        print("\n👋 Frontend server stopped")

def check_backend_health():
    """Check if backend is healthy"""
    try:
        response = requests.get("http://127.0.0.1:8001/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def check_frontend_health():
    """Check if frontend is healthy"""
    try:
        response = requests.get("http://localhost:3001", timeout=5)
        return response.status_code == 200
    except:
        return False

def main():
    """Main startup function"""
    print("=" * 60)
    print("🎯 Stock Analysis App - Development Server Startup")
    print("=" * 60)
    
    # Check if ports are already in use
    if check_backend_health():
        print("⚠️  Backend is already running on port 8001")
    
    if check_frontend_health():
        print("⚠️  Frontend is already running on port 3001")
    
    print("\n📋 Service Configuration:")
    print("   Backend (FastAPI):  http://127.0.0.1:8001")
    print("   Frontend (Next.js): http://localhost:3001")
    print("   API Proxy:          http://localhost:3001/api/*")
    print()
    
    choice = input("🤔 How do you want to start the services?\n"
                  "   1. Both Backend & Frontend (default)\n"
                  "   2. Backend Only\n"
                  "   3. Frontend Only\n"
                  "   4. Run Tests Only\n"
                  "Choose (1-4): ").strip() or "1"
    
    if choice == "1":
        print("\n🚀 Starting both services...")
        print("   Press Ctrl+C to stop both servers")
        print("   Backend will start first, then frontend")
        
        # Start backend in background thread
        backend_thread = Thread(target=start_backend, daemon=True)
        backend_thread.start()
        
        # Wait a moment for backend to start
        print("⏳ Waiting for backend to start...")
        for i in range(10):
            if check_backend_health():
                print("✅ Backend is ready!")
                break
            time.sleep(1)
        else:
            print("⚠️  Backend might not be ready yet, continuing anyway...")
        
        # Start frontend (blocking)
        start_frontend()
        
    elif choice == "2":
        print("\n🚀 Starting Backend Only...")
        start_backend()
        
    elif choice == "3":
        print("\n🚀 Starting Frontend Only...")
        start_frontend()
        
    elif choice == "4":
        print("\n🧪 Running Backend Tests...")
        subprocess.run([sys.executable, "test_backend.py"])
        
    else:
        print("❌ Invalid choice. Exiting.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Startup script interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")