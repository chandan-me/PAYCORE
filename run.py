import os
import sys
import subprocess
import signal
import time

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")

    python_exe = os.path.join(backend_dir, ".venv", "Scripts", "python.exe")
    if not os.path.exists(python_exe):
        python_exe = sys.executable

    print("=" * 60)
    print("       STARTING PAYCORE ORCHESTRATION PLATFORM")
    print("=" * 60)
    print(f"[*] Root Directory:     {root_dir}")
    print(f"[*] Python Executable:  {python_exe}")
    print("[*] Backend Endpoint:   http://localhost:8000")
    print("[*] Swagger API Docs:   http://localhost:8000/docs")
    print("[*] Frontend Dashboard: http://localhost:5173")
    print("=" * 60)

    processes = []

    try:
        # 1. Start Backend FastAPI Server
        print("\n[+] Launching FastAPI Backend Server...")
        backend_cmd = [
            python_exe,
            "-m",
            "uvicorn",
            "app.main:app",
            "--reload",
            "--port",
            "8000",
            "--host",
            "0.0.0.0"
        ]
        p_backend = subprocess.Popen(backend_cmd, cwd=backend_dir)
        processes.append(p_backend)

        # 2. Start Frontend Vite Dev Server
        print("[+] Launching React Frontend Server...")
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        frontend_cmd = [npm_cmd, "run", "dev"]
        p_frontend = subprocess.Popen(frontend_cmd, cwd=frontend_dir)
        processes.append(p_frontend)

        print("\n[✔] Both Backend and Frontend are running!")
        print("    Press Ctrl+C at any time to stop all services.\n")

        # Keep alive
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n\n[*] Shutting down PAYCORE services...")
        for p in processes:
            try:
                p.terminate()
            except Exception:
                pass
        print("[✔] All services stopped.")

if __name__ == "__main__":
    main()
