FROM python:3.11-slim

WORKDIR /app

# 시스템 패키지 설치 (필요시)
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 코드 복사
COPY . .

# uvicorn 실행 (운영 환경에서는 gunicorn과 uvicorn worker 조합을 권장하지만, 초기에는 uvicorn 단일 구동으로 시작)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
