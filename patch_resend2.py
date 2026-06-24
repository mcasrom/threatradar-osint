#!/usr/bin/env python3
PATH = '/home/miguelc/threatradar-osint/server.ts'

with open(PATH, 'r', encoding='utf-8') as f:
    c = f.read()

# 1. import nodemailer -> resend
c = c.replace("import nodemailer from 'nodemailer';\n", "", 1)
c = c.replace(
    "import Groq from 'groq-sdk';",
    "import Groq from 'groq-sdk';\nimport { Resend } from 'resend';",
    1
)
c = c.replace(
    "const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;",
    "const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;\nconst resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;",
    1
)

# 2. status endpoint
c = c.replace(
    "hasSmtpConfig: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),",
    "hasResend: !!process.env.RESEND_API_KEY,",
    1
)

# 3. bloque SMTP — con línea vacía después de fromAddress tal como está en disco
OLD = (
    "  let emailStatus = '';\n"
    "  if (emailTo) {\n"
    "    const host = process.env.SMTP_HOST;\n"
    "    const port = process.env.SMTP_PORT;\n"
    "    const user = process.env.SMTP_USER;\n"
    "    const pass = process.env.SMTP_PASS;\n"
    "    const fromAddress = process.env.SMTP_FROM || '\"ThreatRadar SOC\" <no-reply@threatradar-osint.com>';\n"
    "\n"
    "    if (!host || !user || !pass) {\n"
    "      emailStatus = 'SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env';\n"
    "    } else {\n"
    "      try {\n"
    "        const transporter = nodemailer.createTransport({\n"
    "          host,\n"
    "          port: Number(port) || 587,\n"
    "          secure: Number(port) === 465,\n"
    "          auth: { user, pass }\n"
    "        });\n"
    "\n"
    "        await transporter.sendMail({\n"
    "          from: fromAddress,\n"
    "          to: emailTo,\n"
    "          subject: `[ThreatRadar] ${period.toUpperCase()} Security Report - ${newReport.id}`,\n"
    "          text: analysisText,\n"
    "          html: `<div style=\"font-family: sans-serif; padding: 20px; background: #0c1322; color: #f4f4f5;\">\n"
    "            <h2 style=\"color: #00f2ff;\">ThreatRadar Report [${period.toUpperCase()}]</h2>\n"
    "            <p>ID: ${newReport.id} | Date: ${new Date().toUTCString()}</p>\n"
    "            <pre style=\"background: #090e17; padding: 15px; border-radius: 4px;\">${analysisText}</pre>\n"
    "          </div>`\n"
    "        });\n"
    "        emailStatus = `Email sent to ${emailTo} via SMTP`;\n"
    "      } catch (err: any) {\n"
    "        emailStatus = `SMTP error: ${err?.message}`;\n"
    "      }\n"
    "    }\n"
    "  }"
)

NEW = (
    "  let emailStatus = '';\n"
    "  if (emailTo) {\n"
    "    if (!resend) {\n"
    "      emailStatus = 'Resend no configurado. Añade RESEND_API_KEY al .env';\n"
    "    } else {\n"
    "      try {\n"
    "        await resend.emails.send({\n"
    "          from: 'ThreatRadar SOC <alerts@viajeinteligencia.com>',\n"
    "          to: emailTo,\n"
    "          subject: `[ThreatRadar] ${period.toUpperCase()} Security Report - ${newReport.id}`,\n"
    "          html: `<div style=\"font-family:monospace;padding:24px;background:#0c1322;color:#f4f4f5;border-radius:8px\">\n"
    "            <h2 style=\"color:#00f2ff;margin-bottom:4px\">ThreatRadar SOC Report</h2>\n"
    "            <p style=\"color:#8b949e;font-size:12px\">ID: ${newReport.id} | ${new Date().toUTCString()}</p>\n"
    "            <hr style=\"border-color:#1e2d3d;margin:16px 0\">\n"
    "            <pre style=\"background:#090e17;padding:16px;border-radius:4px;font-size:12px;white-space:pre-wrap\">${analysisText}</pre>\n"
    "            <p style=\"color:#8b949e;font-size:11px\">ThreatRadar OSINT &mdash; alerts@viajeinteligencia.com</p>\n"
    "          </div>`\n"
    "        });\n"
    "        emailStatus = `Email enviado a ${emailTo} via Resend`;\n"
    "      } catch (err: any) {\n"
    "        emailStatus = `Resend error: ${err?.message}`;\n"
    "      }\n"
    "    }\n"
    "  }"
)

if OLD not in c:
    # debug: mostrar fragmento del archivo en esa zona
    idx = c.find('let emailStatus')
    print("FRAGMENTO EN DISCO:")
    print(repr(c[idx:idx+800]))
    print("\nBUSCANDO:")
    print(repr(OLD[:200]))
    exit(1)

c = c.replace(OLD, NEW, 1)

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(c)

print("OK: SMTP -> Resend completado")
