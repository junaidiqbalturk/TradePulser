import sys

path = r'c:\laragon\www\TradeFlow\frontend\src\app\settings\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('catch (error) {', 'catch (error: any) {')
content = content.replace('toast.error("Failed to load company data");', 'if (error.response?.status !== 401) toast.error("Failed to load company data");')
content = content.replace('toast.error("Failed to save company settings");', 'if (error.response?.status !== 401) toast.error("Failed to save company settings");')

with open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print("Done")
