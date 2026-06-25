#!/usr/bin/env python3
import re

path = '/home/miguelc/threatradar-osint/server.ts'

with open(path, 'r') as f:
    content = f.read()

# Añadir validate: { xForwardedForHeader: false } a cada rateLimit({...})
# Buscamos windowMs que es el primer campo de cada limiter
old_patterns = [
    # apiLimiter
    (
        "  windowMs: 15 * 60 * 1000,\n  max: 100,\n  message: { error: 'Too many requests, please try again later.' },",
        "  windowMs: 15 * 60 * 1000,\n  max: 100,\n  validate: { xForwardedForHeader: false },\n  message: { error: 'Too many requests, please try again later.' },"
    ),
    # reportLimiter
    (
        "  windowMs: 60 * 60 * 1000,\n  max: 50,\n  message: { error: 'Report generation limit reached. Try again later.' },",
        "  windowMs: 60 * 60 * 1000,\n  max: 50,\n  validate: { xForwardedForHeader: false },\n  message: { error: 'Report generation limit reached. Try again later.' },"
    ),
    # scanLimiter
    (
        "  windowMs: 60 * 60 * 1000,\n  max: 50,\n  message: { error: 'Scan limit reached. Try again later.' },",
        "  windowMs: 60 * 60 * 1000,\n  max: 50,\n  validate: { xForwardedForHeader: false },\n  message: { error: 'Scan limit reached. Try again later.' },"
    ),
    # demoLimiter
    (
        "  windowMs: 24 * 60 * 60 * 1000,\n  max: 3,\n  keyGenerator: (req: any) => req.ip || 'unknown',",
        "  windowMs: 24 * 60 * 60 * 1000,\n  max: 3,\n  validate: { xForwardedForHeader: false },\n  keyGenerator: (req: any) => req.ip || 'unknown',"
    ),
]

changes = 0
for old, new in old_patterns:
    if old in content:
        content = content.replace(old, new, 1)
        changes += 1
        print(f"✓ Patched: {old[:40].strip()}")
    else:
        print(f"✗ Not found: {old[:40].strip()}")

if changes > 0:
    with open(path, 'w') as f:
        f.write(content)
    print(f"\n✓ {changes}/4 limiters parcheados en server.ts")
else:
    print("\n✗ No se aplicó ningún parche — revisar patrones")
