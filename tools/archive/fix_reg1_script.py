with open('web/register-step1.html', 'r', encoding='utf-8') as f:
    content = f.read()

start_str = "window.handleNextStep = async function(event) {"
end_str = "// Save to sessionStorage"

start_idx = content.find(start_str)
end_idx = content.find(end_str, start_idx)

if start_idx != -1 and end_idx != -1:
    new_script = """window.handleNextStep = async function(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('fullName').value.trim();
    const storeName = document.getElementById('storeName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const wilaya = document.getElementById('wilaya').value;
    const commune = document.getElementById('commune').value.trim();
    
    if (!fullName || !storeName || !phone || !wilaya || !commune) {
      window.showStatus("يرجى ملء جميع الحقول الإلزامية.", "error");
      return;
    }
    
    const cleanPhone = phone.replace(/[\\s\\-()]/g, '');
    if (!/^(05|06|07|02|03|04|09|\\+213)[0-9]{8,11}$/.test(cleanPhone)) {
      window.showStatus("يرجى إدخال رقم هاتف جزائري صالح.", "error");
      return;
    }

    const nextBtn = document.getElementById('next-step-btn') || document.getElementById('nextBtn');
    if (nextBtn) {
      nextBtn.disabled = true;
      const span = nextBtn.querySelector('span');
      if (span) span.textContent = 'جاري الحفظ...';
    }
    
    try {
      """
    
    content = content[:start_idx] + new_script + content[end_idx:]
    with open('web/register-step1.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced handleNextStep")
else:
    print("Could not find boundaries")
