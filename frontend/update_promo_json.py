import json
import os

ko_path = r"g:\+++JUN project+++\STOCK Manager ERP\scm_erp_system\frontend\src\locales\ko\translation.json"
en_path = r"g:\+++JUN project+++\STOCK Manager ERP\scm_erp_system\frontend\src\locales\en\translation.json"

ko_add = {
  "dealer_promotion": {
    "page_title": "법인 주관 프로모션 안내",
    "page_desc": "유럽 법인에서 특별 조건으로 제공하는 프로모션 장비 리스트를 확인하고 예약을 요청할 수 있습니다.",
    "current_promo": "현재 진행 중인 프로모션 장비 현황",
    "no_promo": "진행 중인 프로모션이 없습니다.",
    "btn_inquiry": "예약 및 구매 문의",
    "no_apply": "신청 불가",
    "alert_msg": "[{{modelName}}] 프로모션 기계에 대한 예약/구매 요청이 유럽 법인 영업팀으로 발송되었습니다. 담당자가 확인 후 회신드릴 예정입니다."
  }
}

en_add = {
  "dealer_promotion": {
    "page_title": "Corporate Promotion Info",
    "page_desc": "Check out the special promotion equipment offered by the EU office and request reservations.",
    "current_promo": "Currently Active Promotion Equipment",
    "no_promo": "No active promotions at the moment.",
    "btn_inquiry": "Inquiry / Reserve",
    "no_apply": "Unavailable",
    "alert_msg": "Your reservation/purchase request for [{{modelName}}] has been sent to the EU Sales Team. A representative will contact you shortly."
  }
}

for path, add_dict in [(ko_path, ko_add), (en_path, en_add)]:
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    data.update(add_dict)
    
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

print("JSON files updated for promotion.")
