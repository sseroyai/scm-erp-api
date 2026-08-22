import json

# Read new_models.json
with open('g:/+++JUN project+++/STOCK Manager ERP/scm_erp_system/backend/new_models.json', 'r', encoding='utf-8') as f:
    models_data = json.load(f)

# Categories
# ALL, CNC T/C, Vertical M/C, Horizontal M/C, Multi-Tasking, 5-Axis M/C
category_map = {
    "CNC T/C": "CNC T/C",
    "Vertical M/C": "Vertical M/C",
    "Horizontal M/C": "Horizontal M/C",
    "Multi-Tasking": "Multi-Tasking",
    "5-Axis M/C": "5-Axis M/C"
}

import random

def get_random_specs(category):
    if category == 'CNC T/C':
        return {
            '척 사이즈 (inch)': random.choice(['6', '8', '10', '12', '15']),
            '최대 가공경 (mm)': random.randint(200, 600),
            '최대 가공길이 (mm)': random.randint(300, 1500),
            '최대이송거리 (X/Z) (mm)': f"{random.randint(150, 300)} / {random.randint(300, 1500)}",
            '급이송속도 (X/Z) (m/min)': f"{random.choice([20, 24, 30])} / {random.choice([24, 30, 36])}",
            '주축 회전수 (r/min)': random.choice([3500, 4000, 4500, 5000]),
            '주축 출력 (kW)': f"{random.choice([11, 15, 18.5, 22])}/{random.choice([15, 18.5, 22, 26])}",
            '주축 토크 (N.m)': random.randint(150, 800),
            '주축 구동방식 (-)': random.choice(['Belt', 'Built-in', 'Gear']),
            '공구 보유수 (EA)': random.choice(['10', '12', '24']),
            '회전공구 회전수 (r/min)': random.choice(['-', '4000', '5000', '6000']),
            '슬라이드 방식 (-)': random.choice(['LM Guide', 'Box Guide'])
        }
    elif category == 'Multi-Tasking':
        return {
            '척 사이즈 (inch)': random.choice(['8', '10', '12']),
            '최대 가공경 (mm)': random.randint(400, 800),
            '최대 가공길이 (mm)': random.randint(1000, 2500),
            '최대이송거리 (X/Z) (mm)': f"{random.randint(300, 600)} / {random.randint(1000, 2500)}",
            '급이송속도 (X/Z) (m/min)': f"{random.choice([20, 24, 30])} / {random.choice([20, 24, 30])}",
            '주축 회전수 (r/min)': random.choice([4000, 5000, 12000]),
            '주축 출력 (kW)': f"{random.choice([22, 26, 30])}/{random.choice([26, 30, 37])}",
            '주축 토크 (N.m)': random.randint(300, 1000),
            '주축 구동방식 (-)': 'Built-in',
            '공구 보유수 (EA)': random.choice(['40', '80', '120']),
            '회전공구 회전수 (r/min)': random.choice(['10000', '12000']),
            '슬라이드 방식 (-)': 'LM Guide'
        }
    else: # M/C (Vertical, Horizontal, 5-Axis)
        return {
            '척 사이즈 (inch)': '-',
            '최대 가공경 (mm)': '-',
            '최대 가공길이 (mm)': '-',
            '최대이송거리 (X/Y/Z) (mm)': f"{random.randint(600, 2000)} / {random.randint(400, 1000)} / {random.randint(400, 1000)}",
            '급이송속도 (X/Y/Z) (m/min)': f"{random.choice([30, 36, 42])} / {random.choice([30, 36, 42])} / {random.choice([30, 36, 42])}",
            '주축 회전수 (r/min)': random.choice([8000, 10000, 12000, 15000]),
            '주축 출력 (kW)': f"{random.choice([15, 18.5, 22])}/{random.choice([18.5, 22, 26])}",
            '주축 토크 (N.m)': random.randint(100, 500),
            '주축 구동방식 (-)': random.choice(['Direct', 'Built-in', 'Gear']),
            '공구 보유수 (EA)': random.choice(['30', '40', '60', '120']),
            '회전공구 회전수 (r/min)': '-',
            '슬라이드 방식 (-)': random.choice(['LM Guide', 'Roller LM Guide'])
        }

formatted_models = []
for m in models_data:
    cat = category_map.get(m['type'], m['type'])
    code = m['code']
    specs = get_random_specs(cat)
    
    # Python 딕셔너리를 JS 객체 문자열로 변환하되 키(key)의 따옴표 유지
    specs_str = ",\n        ".join([f"'{k}': '{v}'" for k, v in specs.items()])
    
    formatted_models.append(f"""
    {{
      id: '{code}',
      name: '{code}',
      category: '{cat}',
      image: 'https://via.placeholder.com/300x200.png?text={code}',
      specs: {{
        {specs_str}
      }},
      documents: [
        {{ id: 1, title: '홍보용 브로슈어 (EN)', type: 'BROCHURE', securityLevel: 'PUBLIC', size: '4.2 MB' }},
        {{ id: 2, title: '사용자 매뉴얼', type: 'MANUAL', securityLevel: 'PUBLIC', size: '12.5 MB' }}
      ]
    }}""")

js_content = "export const productLibraryModels = [" + ",".join(formatted_models) + "];"

with open('g:/+++JUN project+++/STOCK Manager ERP/scm_erp_system/frontend/src/data/productLibraryModels.js', 'w', encoding='utf-8') as f:
    f.write(js_content)
