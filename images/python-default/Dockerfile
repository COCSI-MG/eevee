FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY trigger.py .
COPY eevee_resources.py .

ENV PYTHONUNBUFFERED=1
ENV PYTHONUTF8=1

CMD ["python", "-u", "/app/trigger.py"]
