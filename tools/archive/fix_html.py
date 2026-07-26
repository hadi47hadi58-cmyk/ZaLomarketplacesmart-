with open('web/register-step3.html', 'r', encoding='utf-8') as f:
    content = f.read()

# I will replace the end of that form-group to close both the form-group, the images-container, and leave the fieldsGrid closing div
content = content.replace(
    '<div class="fbi">📸</div>\n          <div class="fbl" id="fl-front">صورة تميز واجهة متجرك</div>\n        </div>\n      </div>\n    </div>',
    '<div class="fbi">📸</div>\n          <div class="fbl" id="fl-front">صورة تميز واجهة متجرك</div>\n        </div>\n      </div>\n      </div> <!-- close images-container -->\n    </div> <!-- close fieldsGrid -->'
)

with open('web/register-step3.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed missing div")
