# Build stage: Install dependencies
FROM python:3.12-slim as builder

WORKDIR /app

# Install system dependencies for building
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Create wheels - use only binary packages when available
RUN pip install --user --no-cache-dir --upgrade pip setuptools wheel && \
    pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt || \
    pip install --user --no-cache-dir -r requirements.txt

# Final stage: Runtime
FROM python:3.12-slim

WORKDIR /app

# Copy wheels from builder
COPY --from=builder /app/wheels /wheels 2>/dev/null || true
COPY --from=builder /root/.local /root/.local 2>/dev/null || true
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    (pip install --no-cache-dir --no-index --find-links=/wheels -r requirements.txt 2>/dev/null || \
     pip install --no-cache-dir -r requirements.txt)

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run the FastAPI app
CMD ["sh", "-c", "python -m uvicorn backend.server:app --host 0.0.0.0 --port ${PORT:-8000}"]
