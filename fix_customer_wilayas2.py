import re

WILAYAS_LIST = [
    "أدرار", "الشلف", "الأغواط", "أم البواقي", "باتنة",
    "بجاية", "بسكرة", "بشار", "البليدة", "البويرة",
    "تمنراست", "تبسة", "تلمسان", "تيارت", "تيزي وزو",
    "الجزائر", "الجلفة", "جيجل", "سطيف", "سعيدة",
    "سكيكدة", "سيدي بلعباس", "عنابة", "قالمة", "قسنطينة",
    "المدية", "مستغانم", "المسيلة", "معسكر", "ورقلة",
    "وهران", "البيض", "إليزي", "برج بوعريريج", "بومرداس",
    "الطارف", "تندوف", "تيسمسيلت", "الوادي", "خنشلة",
    "سوق أهراس", "تيبازة", "ميلة", "عين الدفلى", "النعامة",
    "عين تموشنت", "غرداية", "غليزان", "تيميمون", "برج باجي مختار",
    "أولاد جلال", "بني عباس", "عين صالح", "عين قزام", "تقرت",
    "جانت", "المغير", "المنيعة", "بريكة", "بوسعادة",
    "مسعد", "قصر الشلالة", "العلمة", "فرجيوة", "شلغوم العيد",
    "عين البيضاء", "عين وسارة", "الأبيض سيدي الشيخ", "أفلو"
]

arr_content = "[\n"
for i in range(0, len(WILAYAS_LIST), 5):
    chunk = WILAYAS_LIST[i:i+5]
    arr_content += "  " + ",".join([f'{{n:"{w}"}}' for w in chunk]) + ",\n"
arr_content = arr_content.rstrip(',\n') + "\n]"

with open('web/customer-home.html', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'const WILAYAS = \[\s*\{n:"أدرار"}.*?\];'
replacement = f'const WILAYAS = {arr_content};'

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
if new_content != content:
    with open('web/customer-home.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Updated WILAYAS in customer-home.html")
else:
    print("Could not find WILAYAS in customer-home.html")
