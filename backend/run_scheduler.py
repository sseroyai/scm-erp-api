import time
import os
import logging
from scheduler import start_scheduler, stop_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    logger.info("Initializing Standalone Scheduler Worker...")
    start_scheduler()
    
    try:
        # 무한 루프를 돌며 프로세스가 종료되지 않게 유지합니다.
        while True:
            time.sleep(60)
    except (KeyboardInterrupt, SystemExit):
        logger.info("Shutting down Standalone Scheduler Worker...")
        stop_scheduler()
