# 공작기계 글로벌 SCM 재고 관리 ERP 시스템 (V5 Final Architecture)

유럽 현지 판매 법인의 SCM 효율화와 딜러 협업을 위해 확정된 V5 설계안에 맞추어 기초 뼈대부터 구축한 **풀스택 웹 애플리케이션 (`Python FastAPI` + `React Vite`)** 입니다.

---

## 1. 아키텍처 및 폴더 구조 (`scm_erp_system/`)

```
scm_erp_system/
├── backend/               # Python FastAPI 백엔드 및 SQLAlchemy ORM
│   ├── main.py            # REST API 서버 (주문/배송, 엑셀 Pandas 업로드, 프로모션/ETA 규칙 등)
│   ├── models.py          # 5단계 파이프라인, 딜러사/사용자 격리, 단가 제외 마스터 DB 스키마
│   ├── schemas.py         # Pydantic 입출력 데이터 규격
│   ├── database.py        # SQLite / PostgreSQL 접속 설정
│   ├── seed.py            # 유럽 SCM 현실 시드 데이터 자동 생성기
│   └── requirements.txt   # 백엔드 의존성 (fastapi, uvicorn, sqlalchemy, pandas, openpyxl)
├── frontend/              # Vite React 프리미엄 웹 애플리케이션
│   ├── src/
│   │   ├── components/    # App Shell (Navbar 권한 스위처, Sidebar, StepBar 배송 타임라인)
│   │   ├── pages/
│   │   │   ├── DealerDashboard.jsx  # 실시간 운영 중심 딜러 전용 포털 대시보드 (Zone 1,2,3)
│   │   │   ├── SalesAnalytics.jsx   # 관리자 영업 통계 및 다차원 분석 (Admin-Only KPIs)
│   │   │   └── AdminManagement.jsx  # Pandas 엑셀 업로드 / 장기 프로모션 예약 / 자동 ETA 알림 엔진
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css      # 다크 모드 & Glassmorphism 커스텀 디자인 시스템
│   ├── package.json       # react, lucide-react, recharts 등
│   ├── index.html
│   └── vite.config.js     # API 프록시 (/api -> http://localhost:8000)
└── run_all.bat            # 윈도우용 원클릭 자동 실행 배치 스크립트
```

---

## 2. V5 설계 가이드 핵심 반영 기능 요약

### A. 5단계 확정 공급망 프로세스 상태값 (Status Pipeline)
- `주문 (CONFIRMED)` ➔ `생산 중 (IN_PRODUCTION)` ➔ `배송 (SHIPPING)` ➔ `항구도착 (ARRIVED)` ➔ `입고 (IN_STOCK)`

### B. 철저한 데이터 격리 (Data Isolation) 및 권한별 뷰 이원화
- **`SCM_ADMIN` (유럽 법인 총괄)**: 전 딜러사 주문 관리, 배송 상태 이동 제어, 엑셀 일괄 업로드, 영업 통계 전체 조회.
- **`RSM` (지역 영업 담당자)**: 본인 담당 영업 지역(`Western Europe`, `Southern Europe` 등) 내 주문 및 목표 달성 현황 조회.
- **`DEALER` (현지 외부 딜러사)**: 소속 회사의 주문 및 유럽 가용 재고(`IN_STOCK`)만 조회 가능하며 타사 데이터 격리 적용.

### C. 신규 비즈니스 로직 2종 (V5 반영)
1. **프로모션 및 실시간 예약 관리 (`PromotionInventory`)**: 3년 이상 장기 재고 및 특정 모델 특가 행사. `판매가능(Available)` ➔ `예약중(Reserved)` (예약 딜러/만료일) ➔ `판매완료(Sold)`.
2. **주기 조절형 자동 ETA 알림 엔진 (`EmailNotificationConfig`)**: 출항 2일 후, 15일 정기 보고 등 자동 이메일 스케줄 규칙 및 온/오프 제어.

---

## 3. 원클릭 실행 방법 (Windows 환경)

Windows 명령 프롬프트(CMD) 또는 PowerShell에서 아래 명령어로 백엔드와 프론트엔드를 동시에 띄울 수 있습니다.

### 방법 1: 자동 배치 파일 실행
1. 이 폴더(`scm_erp_system`)를 엽니다.
2. `run_all.bat` 파일을 더블 클릭하거나 터미널에서 실행합니다:
   ```cmd
   cd scm_erp_system
   run_all.bat
   ```
3. 브라우저가 자동으로 열리며 **http://localhost:3000** 에 접속됩니다.

### 방법 2: 수동 터미널 2개 실행
**[터미널 1 - 백엔드 실행]**
```cmd
cd scm_erp_system\backend
pip install -r requirements.txt
python seed.py
python -m uvicorn main:app --reload --port 8000
```
- API 명세서(Swagger UI) 확인: **http://localhost:8000/docs**

**[터미널 2 - 프론트엔드 실행]**
```cmd
cd scm_erp_system\frontend
npm install
npm run dev
```
- 웹 애플리케이션 접속: **http://localhost:3000**
