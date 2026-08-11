import re

with open('web-admin/src/config/docTypeFormSchemas.ts') as f:
    content = f.read()

keys = re.findall(r"^\s*'([^']+)': \{", content, re.MULTILINE)
print(f"Schemas found in docTypeFormSchemas.ts: {len(keys)}")
for k in keys:
    print(' -', k)
