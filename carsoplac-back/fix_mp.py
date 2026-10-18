import sys
with open('src/payments/mercadopago/mercadopago.service.ts', 'r') as f:
    lines = f.readlines()
# Fix line 40 (index 39)
lines[39] = '    const backendBaseUrl = this.backendPublicUrl.replace(/\/+$/, "");\\n'
# Fix line 41 (index 40)
lines[40] = '    const notificationUrl = `${backendBaseUrl}/mercadopago/webhook`;\\n'
# Now add notification_url field in preferenceBody
# Find line with 'auto_return: \"approved\",'
for i, line in enumerate(lines):
    if 'auto_return: \"approved\"' in line:
        # Insert after this line
        lines.insert(i+1, '       notification_url: notificationUrl,\\n')
        break
with open('src/payments/mercadopago/mercadopago.service.ts', 'w') as f:
    f.writelines(lines)
