#!/usr/bin/env python3
"""Reemplaza nodemailer/SMTP por Resend en server.ts"""

PATH = '/home/miguelc/threatradar-osint/server.ts'

with open(PATH, 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Quitar import nodemailer
c = c.replace("import nodemailer from 'nodemailer';\n", "", 1)

# 2. Añadir import Resend después del import Groq
c = c.replace(
    "import Groq from 'groq-sdk';",
    "import Groq from 'groq-sdk';\nimport { Resend } from 'resend';",
    1
)

# 3. Añadir instancia Resend después de la instancia groq
c = c.replace(
    "const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;",
    "const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;\nconst resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;",
    1
)

# 4. Reemplazar bloque SMTP por Resend
OLD_SMTP = """  let emailStatus = '';
  if (emailTo) {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const fromAddress = process.env.SMTP_FROM || '"ThreatRadar SOC" <no-reply@threatradar-osint.com>';
    if (!host || !user || !pass) {
      emailStatus = 'SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env';
    } else {
      try {
        const transporter = nodemailer.createTransport({
          host,
          port: Number(port) || 587,
          secure: Number(port) === 465,
          auth: { user, pass }
        });
        await transporter.sendMail({
          from: fromAddress,
          to: emailTo,
          subject: `[ThreatRadar] ${period.toUpperCase()} Security Report - ${newReport.id}`,
          text: analysisText,
          html: `<div style="font-family: sans-serif; padding: 20px; background: #0c1322; color: #f4f4f5;">
            <h2 style="color: #00f2ff;">ThreatRadar Report [${period.toUpperCase()}]</h2>
            <p>ID: ${newReport.id} | Date: ${new Date().toUTCString()}</p>
            <pre style="background: #090e17; padding: 15px; border-radius: 4px;">${analysisText}</pre>
          </div>`
        });
        emailStatus = `Email sent to ${emailTo} via SMTP`;
      } catch (err: any) {
        emailStatus = `SMTP error: ${err?.message}`;
      }
    }
  }"""

NEW_RESEND = """  let emailStatus = '';
  if (emailTo) {
    if (!resend) {
      emailStatus = 'Resend no configurado. Añade RESEND_API_KEY al .env';
    } else {
      try {
        await resend.emails.send({
          from: 'ThreatRadar SOC <alerts@viajeinteligencia.com>',
          to: emailTo,
          subject: `[ThreatRadar] ${period.toUpperCase()} Security Report - ${newReport.id}`,
          html: `<div style="font-family:monospace;padding:24px;background:#0c1322;color:#f4f4f5;border-radius:8px">
            <h2 style="color:#00f2ff;margin-bottom:4px">ThreatRadar SOC Report</h2>
            <p style="color:#8b949e;font-size:12px">ID: ${newReport.id} &nbsp;|&nbsp; ${new Date().toUTCString()}</p>
            <hr style="border-color:#1e2d3d;margin:16px 0">
            <pre style="background:#090e17;padding:16px;border-radius:4px;font-size:12px;white-space:pre-wrap;word-break:break-all">${analysisText}</pre>
            <hr style="border-color:#1e2d3d;margin:16px 0">
            <p style="color:#8b949e;font-size:11px">ThreatRadar OSINT Platform &mdash; alerts@viajeinteligencia.com</p>
          </div>`
        });
        emailStatus = `Email enviado a ${emailTo} via Resend`;
      } catch (err: any) {
        emailStatus = `Resend error: ${err?.message}`;
      }
    }
  }"""

if OLD_SMTP not in c:
    print("ERROR: bloque SMTP no encontrado")
    exit(1)

c = c.replace(OLD_SMTP, NEW_RESEND, 1)

# 5. Actualizar hasSmtpConfig en /api/status para reflejar Resend
c = c.replace(
    "hasSmtpConfig: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),",
    "hasResend: !!process.env.RESEND_API_KEY,",
    1
)

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(c)

print("OK: nodemailer/SMTP reemplazado por Resend")
print("   from: alerts@viajeinteligencia.com")
print("   Siguiente: npm install resend + añadir RESEND_API_KEY al .env")
