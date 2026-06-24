#!/usr/bin/env python3
"""Implementar envío real a webhook Discord/Slack en server.ts"""

PATH = '/home/miguelc/threatradar-osint/server.ts'

with open(PATH, 'r', encoding='utf-8') as f:
    c = f.read()

OLD = (
    "  db.logReports.unshift(newReport);\n"
    "  writeDB(db);\n"
    "  res.json({\n"
    "    success: true,\n"
    "    report: newReport,\n"
    "    notificationMessage: `Report compiled. ${emailTo ? `Email: ${emailStatus}` : 'No email configured.'}`\n"
    "  });\n"
    "});"
)

NEW = (
    "  // Webhook Discord/Slack\n"
    "  let webhookStatus = '';\n"
    "  if (webhookUrl && webhookUrl.startsWith('https://')) {\n"
    "    try {\n"
    "      const isDiscord = webhookUrl.includes('discord.com');\n"
    "      const body = isDiscord\n"
    "        ? JSON.stringify({\n"
    "            username: 'ThreatRadar SOC',\n"
    "            avatar_url: 'https://viajeinteligencia.com/favicon.ico',\n"
    "            embeds: [{\n"
    "              title: `ThreatRadar ${period.toUpperCase()} Report — ${newReport.id}`,\n"
    "              description: analysisText.slice(0, 4000),\n"
    "              color: 0x00e5ff,\n"
    "              footer: { text: `ThreatRadar OSINT | ${new Date().toUTCString()}` }\n"
    "            }]\n"
    "          })\n"
    "        : JSON.stringify({\n"
    "            text: `*ThreatRadar ${period.toUpperCase()} Report — ${newReport.id}*\\n${analysisText.slice(0, 3000)}`\n"
    "          });\n"
    "      const whRes = await fetch(webhookUrl, {\n"
    "        method: 'POST',\n"
    "        headers: { 'Content-Type': 'application/json' },\n"
    "        body\n"
    "      });\n"
    "      webhookStatus = whRes.ok ? `Webhook enviado (${isDiscord ? 'Discord' : 'Slack'})` : `Webhook error: ${whRes.status}`;\n"
    "    } catch (err: any) {\n"
    "      webhookStatus = `Webhook error: ${err.message}`;\n"
    "    }\n"
    "  }\n"
    "\n"
    "  db.logReports.unshift(newReport);\n"
    "  writeDB(db);\n"
    "  res.json({\n"
    "    success: true,\n"
    "    report: newReport,\n"
    "    notificationMessage: [\n"
    "      emailTo ? `Email: ${emailStatus}` : 'Email: no configurado',\n"
    "      webhookUrl ? `Webhook: ${webhookStatus}` : 'Webhook: no configurado'\n"
    "    ].join(' | ')\n"
    "  });\n"
    "});"
)

if OLD not in c:
    print("ERROR: bloque no encontrado")
    exit(1)

c = c.replace(OLD, NEW, 1)

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(c)

print("OK: webhook Discord/Slack implementado en server.ts")
print("   - Discord: embed con titulo, descripcion, color cyan, footer")
print("   - Slack: mensaje texto formateado")
print("   - Deteccion automatica Discord vs Slack por URL")
print("   - Estado webhook incluido en notificationMessage")
