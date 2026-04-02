# Use Python 3.12 slim image
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies and setuptools
RUN apt-get update && apt-get install -y \
    build-essential \
    && pip install --no-cache-dir setuptools wheel \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install with binary-only preference to avoid long compilation times
RUN pip install --no-cache-dir --only-binary :all: -r requirements.txt 2>&1 || \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run the FastAPI app (use sh -c to properly expand $PORT from Railway)
ENTRYPOINT ["/bin/sh", "-c"]
CMD ["python -m uvicorn backend.server:app --host 0.0.0.0 --port ${PORT:-8000}"]
