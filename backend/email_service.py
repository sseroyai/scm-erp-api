import logging
from typing import Optional
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# 환경 변수에서 SMTP 설정을 가져오거나 기본값 사용
# 테스트를 위해 아래 변수에 직접 본인의 이메일과 앱 비밀번호를 입력하셔도 됩니다.
SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USER = os.environ.get("SMTP_USER", "freelogin3975@gmail.com") # 발송에 사용할 구글 이메일
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "shdbwjbikvgborll") # 띄어쓰기 없는 16자리 알파벳

def send_email_notification(to_email: str, subject: str, content: str):
    """
    SMTP 서버를 통해 실제 이메일을 발송합니다.
    계정 정보가 없으면 기존처럼 콘솔에 로그만 남깁니다.
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("[이메일 발송 모의실행] SMTP_USER 또는 SMTP_PASSWORD가 설정되지 않았습니다.")
        logger.info(f"================ EMAIL NOTIFICATION ================")
        logger.info(f"TO:      {to_email}")
        logger.info(f"SUBJECT: {subject}")
        logger.info(f"CONTENT: {content}")
        logger.info(f"====================================================")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(content, 'plain', 'utf-8'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)

        # 수신자가 여러 명일 수 있으므로 세미콜론(;) 기준으로 분리
        recipients = [email.strip() for email in to_email.split(';') if email.strip()]

        server.sendmail(SMTP_USER, recipients, msg.as_string())
        server.quit()
        logger.info(f"성공적으로 이메일을 발송했습니다: {to_email}")
    except Exception as e:
        logger.error(f"이메일 발송 실패: {e}")

def send_etd_notification(to_email: str, order_ref: str, etd: str, initial_eta: str):
    subject = f"[SCM 알림] 발주번호 {order_ref} 장비가 출항(ETD) 하였습니다."
    content = f"장비({order_ref})가 선적되어 출항하였습니다.\nETD: {etd}\n초기 예정 ETA: {initial_eta}"
    send_email_notification(to_email, subject, content)

def send_shipping_interval_notification(to_email: str, order_ref: str, days_since_etd: int, current_eta: str):
    subject = f"[SCM 알림] 발주번호 {order_ref} 해상 운송 중 안내 ({days_since_etd}일 경과)"
    content = f"장비({order_ref})가 해상 운송 중입니다.\n현재 예정 ETA: {current_eta}"
    send_email_notification(to_email, subject, content)

def send_eta_update_notification(order_ref: str, vessel: str, new_eta: str):
    subject = f"[SCM 알림] 발주번호 {order_ref} 유럽 항구 도착 예정일 업데이트 (HHLA 연동)"
    content = f"장비({order_ref})가 적재된 선박({vessel})의 함부르크 항구(HHLA) 스케줄이 업데이트 되었습니다.\n최신 예정 ETA: {new_eta}"
    send_email_notification("scm_admin@example.com", subject, content)

def send_port_arrival_notification(to_email: str, order_ref: str):
    subject = f"[SCM 알림] 발주번호 {order_ref} 유럽 항구(함부르크) 도착 통지"
    content = f"장비({order_ref})가 함부르크 항구에 도착 완료하였습니다. 하역 및 통관 절차가 진행될 예정입니다."
    send_email_notification(to_email, subject, content)

def send_warehouse_arrival_notification(to_email: str, order_ref: str, stock_type: Optional[str]):
    subject = f"[SCM 알림] 발주번호 {order_ref} 현지 창고 입고 및 가용 재고 전환 안내"
    stype_str = stock_type if stock_type else 'AVAILABLE'
    content = f"장비({order_ref})가 유럽 현지 법인 창고에 입고 완료되었습니다.\n현재 상태: {stype_str} (가용 재고 전환)"
    send_email_notification(to_email, subject, content)
