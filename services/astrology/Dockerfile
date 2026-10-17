FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /engine
COPY requirements.txt .
RUN pip install --no-cache-dir --only-binary=:all: -r requirements.txt \
    && useradd --system --uid 10001 helena
COPY helena_engine.py server.py ./
USER helena
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health/live', timeout=3)"
CMD ["python", "server.py"]
