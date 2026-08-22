# 시스템 운영 환경 구축 가이드 (Production Deployment Guide)

## 1. 개요 및 운영 환경 선정

### 1.1. 현재 시스템 아키텍처
*   **프론트엔드 (Frontend):** React 18, Vite
*   **백엔드 (Backend):** Python FastAPI, Uvicorn
*   **데이터베이스 (DB):** SQLite (`scm_erp.db` 파일 기반)
*   **백그라운드 작업:** APScheduler (단일 프로세스 내 동작)

### 1.2. 운영 환경으로 IaaS 채택 이유
현재 구조(특히 SQLite와 단일 프로세스 APScheduler)를 수정 없이 가장 빠르고 안정적으로 배포하기 위해 **IaaS (가상 서버 호스팅)** 방식을 채택합니다.
*   **데이터 보존:** PaaS(Render, Heroku 등)와 달리 서버가 재시작되어도 파일 시스템(SQLite DB)이 초기화되지 않습니다.
*   **비용 효율성:** AWS Lightsail, DigitalOcean 등 월 $5~$10 수준의 저렴한 요금제로 프론트/백엔드 통합 호스팅이 가능합니다.
*   **유연성 제어:** Nginx, HTTPS 인증서 등 시스템의 모든 요소를 자유롭게 설정할 수 있습니다.

---

## 2. 1인 개발자를 위한 배포 전략: Docker

1인 개발자가 서버에 직접 패키지를 설치하고 환경을 세팅하는 것은 유지보수성(버전 충돌, 설정 유실 등)을 크게 떨어뜨립니다. 이를 해결하기 위해 **Docker(컨테이너화)**와 **Docker Compose**를 활용합니다.

*   **인프라의 코드화 (IaC):** `Dockerfile`과 `docker-compose.yml`을 통해 서버 실행 환경을 코드로 명세화합니다.
*   **무중단/쉬운 배포:** 서버에 접속하여 `git pull` 후 `docker compose up -d --build` 명령어 단 한 줄로 전체 시스템을 최신 상태로 띄울 수 있습니다.
*   **환경 일관성:** 로컬(개발 환경)과 운영(서버) 환경의 차이로 인해 발생하는 에러를 원천 차단합니다.

---

## 3. 배포 로드맵 (Step-by-Step)

### 단계 1: 프로젝트 배포 설정 파일 작성 (로컬)
소스코드 최상단에 컨테이너 실행을 위한 설정 파일을 생성합니다.
1.  `frontend/Dockerfile`: Vite로 React 코드를 빌드(`npm run build`)하고 Nginx로 정적 파일을 서빙하는 설정.
2.  `backend/Dockerfile`: Python 환경을 구성하고 FastAPI를 Gunicorn/Uvicorn 워커로 실행하는 설정.
3.  `docker-compose.yml`: 프론트엔드, 백엔드 컨테이너를 하나로 묶고 포트를 맵핑하는 명세서.

### 단계 2: IaaS 서버 생성 (클라우드 콘솔)
*   **권장 서비스:** AWS Lightsail (초보자 친화적), Vultr, DigitalOcean
*   **운영체제(OS):** Ubuntu 22.04 LTS (혹은 최신 LTS 버전)
*   **네트워크 설정:** 방화벽(보안 그룹)에서 웹 서비스용 포트(80 HTTP, 443 HTTPS)와 접속용 포트(22 SSH)를 개방합니다.

### 단계 3: 서버 초기 설정 (서버 접속 후)
발급받은 고정 IP를 통해 SSH로 서버에 접속한 후, 필수 유틸리티만 설치합니다.
```bash
# 1. 패키지 업데이트
sudo apt update && sudo apt upgrade -y

# 2. 필수 패키지(Docker, Git) 설치
sudo apt install docker.io docker-compose git -y

# 3. Docker 권한 설정 (sudo 없이 사용)
sudo usermod -aG docker $USER
```

### 단계 4: 소스코드 복제 및 컨테이너 실행
```bash
# 1. GitHub에서 소스코드 가져오기 (Private 저장소인 경우 Personal Access Token 필요)
git clone [본인의 GitHub 저장소 주소]
cd [저장소 폴더명]

# 2. 도커 컴포즈로 백그라운드 실행
docker-compose up -d --build
```
이 시점부터 브라우저에서 `http://서버IP` 로 접속하면 ERP 시스템이 구동됩니다.

### 단계 5: 도메인 연결 및 HTTPS(SSL) 적용
보안을 위해 IP가 아닌 도메인으로 접속하고, 데이터 암호화(HTTPS)를 적용해야 합니다.
1.  가비아/호스팅케이알 등에서 도메인을 구매하고, 서버의 고정 IP(A 레코드)로 연결합니다.
2.  복잡한 Nginx + Certbot 수동 설정 대신, **Nginx Proxy Manager** 또는 **Caddy** 컨테이너를 도입하여 도메인만 입력하면 무료 SSL 인증서(Let's Encrypt)가 평생 자동 갱신되도록 구성합니다.

---

## 4. 향후 고도화(Scale-up) 시 고려 사항

서비스 트래픽이 많아져 서버를 확장하거나 완전 관리형 PaaS로 넘어가고 싶을 때 대비해야 할 사항입니다.

1.  **데이터베이스 마이그레이션:** 파일 기반인 SQLite를 **PostgreSQL** 또는 MySQL 같은 독립된 RDBMS 서버로 분리해야 합니다.
2.  **스케줄러 분산 처리:** 서버 인스턴스가 2대 이상으로 늘어나면, 현재의 APScheduler 코드는 각 서버에서 중복 실행됩니다. 이를 방지하기 위해 Redis 기반의 분산 작업 큐(Celery 등)를 도입하거나, 스케줄링 전용 워커를 분리해야 합니다.
3.  **파일 스토리지 분리:** 문서(PDF, 엑셀 등) 및 이미지를 서버 디스크에 직접 저장하고 있다면, AWS S3 같은 외부 오브젝트 스토리지로 저장 경로를 변경해야 합니다.
