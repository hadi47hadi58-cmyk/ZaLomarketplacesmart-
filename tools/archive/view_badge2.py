with open("web/customer-home.html", "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find("const badge = document.getElementById(current-wilaya-display-badge);")
if idx != -1:
    print(text[idx-100:idx+300])
