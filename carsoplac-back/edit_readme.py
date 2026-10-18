with open('README.md', 'r') as f:
    lines = f.readlines()
# Find line index of '## Resources'
for i, line in enumerate(lines):
    if line.strip() == '## Resources':
        insert_idx = i
        break
else:
    insert_idx = len(lines)
# Insert new section before Resources
lines.insert(insert_idx, '\n## Desarrollo local con webhooks\n')
lines.insert(insert_idx+1, '\nPara desarrollar y probar los webhooks de MercadoPago localmente, necesitas exponer tu servidor de desarrollo a Internet usando un túnel. Puedes usar herramientas como [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/) o [ngrok](https://ngrok.com/).\n')
lines.insert(insert_idx+2, '\n### Usando cloudflared\n')
lines.insert(insert_idx+3, '\n1. Instala cloudflared siguiendo la documentación oficial.\n')
lines.insert(insert_idx+4, '\n2. Ejecuta el siguiente comando para crear un túnel que apunte a tu servidor local (por defecto en el puerto 3000):\n')
lines.insert(insert_idx+5, '\n```bash\n')
lines.insert(insert_idx+6, '$ npm run tunnel\n')
lines.insert(insert_idx+7, '\n```\n')
lines.insert(insert_idx+8, '\nEsto imprimirá una URL pública que puedes usar como `BACKEND_PUBLIC_URL` en tu `.env.development`.\n')
lines.insert(insert_idx+9, '\n### Usando ngrok (alternativa)\n')
lines.insert(insert_idx+10, '\n1. Instala ngrok.\n')
lines.insert(insert_idx+11, '\n2. Ejecuta: `ngrok http 3000`\n')
lines.insert(insert_idx+12, '\n3. Usa la URL forwarding que proporciona ngrok como `BACKEND_PUBLIC_URL`.\n')
lines.insert(insert_idx+13, '\nRecuerda que el endpoint del webhook es `${BACKEND_PUBLIC_URL}/mercadopago/webhook`.\n')
with open('README.md', 'w') as f:
    f.writelines(lines)
