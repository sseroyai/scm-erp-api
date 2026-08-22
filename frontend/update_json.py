import json
import os

ko_path = r"g:\+++JUN project+++\STOCK Manager ERP\scm_erp_system\frontend\src\locales\ko\translation.json"
en_path = r"g:\+++JUN project+++\STOCK Manager ERP\scm_erp_system\frontend\src\locales\en\translation.json"

ko_add = {
  "dealer_dashboard": {
    "title": "딜러 포털 현황판",
    "subtitle": "내 주문 현황 요약 및 유럽 법인 전체 가용 재고 현황입니다.",
    "shipping_orders": "운송 중 내 장비 (SHIPPING)",
    "shipping_desc": "해상 운송 중인 내 주문",
    "eta_orders": "이번 달 입고 예정 (ETA)",
    "eta_desc": "유럽 항구 도착 및 통관 진행 대상",
    "atp_orders": "유럽 창고 가용 재고 (ATP)",
    "atp_desc": "전체 딜러망 가용 즉시 출고 가능 대수",
    "pie_title": "기종별 가용 재고 분포 (Pie Chart)",
    "pie_desc": "유럽 현지 창고에 보관되어 즉시 할당 신청이 가능한 기계 모델 분포입니다.",
    "no_atp": "현재 가용(AVAILABLE) 상태인 장비가 없습니다.",
    "atp_list_title": "즉시 할당 가능 장비 목록 (ATP List)",
    "atp_list_desc": "원하는 모델을 선택하여 즉시 출고(소프트 할당)를 관리자에게 요청할 수 있습니다.",
    "btn_allocation": "즉시 할당 신청",
    "unit": "대"
  },
  "dealer_orders": {
    "title": "내 발주 및 배송상태",
    "subtitle": "PO 번호, S/N 정보로 내 발주 건의 배송상태를 조회합니다.",
    "search_placeholder": "검색..",
    "pipeline_title": "배송 추적 타임라인",
    "mobile_alert": "현장 접근성 강화를 위한 모바일 대응 페이지",
    "btn_desktop_view": "🖥️ 데스크탑 뷰로 복귀",
    "btn_mobile_view": "📱 모바일 리스트 뷰 시뮬레이션",
    "no_orders": "발주 내역이 없습니다.",
    "current_location": "현재 위치:",
    "eta": "도착 예정(ETA):"
  }
}

en_add = {
  "dealer_dashboard": {
    "title": "Dealer Portal Dashboard",
    "subtitle": "Order summary and ATP stock overview.",
    "shipping_orders": "My Equipment in Transit (SHIPPING)",
    "shipping_desc": "My orders currently in sea transit",
    "eta_orders": "Expected This Month (ETA)",
    "eta_desc": "Arriving at European ports & customs clearing",
    "atp_orders": "EU Warehouse Available Stock (ATP)",
    "atp_desc": "Total units available for immediate dispatch",
    "pie_title": "ATP Stock Distribution by Model",
    "pie_desc": "Models currently in local EU warehouses ready for allocation requests.",
    "no_atp": "No equipment is currently in AVAILABLE status.",
    "atp_list_title": "Equipment Available for Immediate Allocation (ATP List)",
    "atp_list_desc": "Select a desired model to request immediate dispatch (soft allocation) from the admin.",
    "btn_allocation": "Request Allocation",
    "unit": "Units"
  },
  "dealer_orders": {
    "title": "My Orders & Shipping Status",
    "subtitle": "Track your orders through a detailed 6-step shipping timeline using Ref No. or S/N.",
    "search_placeholder": "Search Ref No., Model, S/N...",
    "pipeline_title": "Delivery Tracking TimePipeline",
    "mobile_alert": "Mobile-responsive page for enhanced field accessibility",
    "btn_desktop_view": "🖥️ Return to Desktop View",
    "btn_mobile_view": "📱 Simulate Mobile List View",
    "no_orders": "No order history available.",
    "current_location": "Current Location:",
    "eta": "Expected Arrival (ETA):"
  }
}

for path, add_dict in [(ko_path, ko_add), (en_path, en_add)]:
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    data.update(add_dict)
    
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

print("JSON files updated.")
