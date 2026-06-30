#!/usr/bin/env bash
# sync_audit.sh — Auditoría de coherencia local / GitHub / servidor para threatradar-osint
# Uso: bash sync_audit.sh
set -uo pipefail

LOCAL_DIR="$HOME/threatradar-osint"
REMOTE_HOST="deploy@178.105.80.193"
REMOTE_DIR="/home/deploy/apps/threatradar-osint"
REPO="mcasrom/threatradar-osint"

echo "=============================================="
echo " AUDITORÍA THREATRADAR-OSINT  $(date)"
echo "=============================================="

echo -e "\n--- [1] ESTADO LOCAL ---"
cd "$LOCAL_DIR" || { echo "ERROR: no existe $LOCAL_DIR"; exit 1; }
echo "Branch actual: $(git branch --show-current)"
echo "Último commit local: $(git log -1 --format='%h %ci %s')"
echo "Archivos modificados sin commitear:"
git status --porcelain || echo "  (ninguno)"
echo "Archivos NO trackeados (candidatos a perderse):"
git status --porcelain | grep '^??' || echo "  (ninguno)"

echo -e "\n--- [2] ESTADO GITHUB (origin) ---"
git fetch origin --quiet
LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse origin/$(git branch --show-current))
echo "HEAD local:  $LOCAL_HASH"
echo "HEAD origin: $REMOTE_HASH"
if [ "$LOCAL_HASH" == "$REMOTE_HASH" ]; then
  echo "✅ Local y GitHub sincronizados"
else
  echo "⚠️  DESINCRONIZADO con GitHub"
  git log --oneline HEAD..origin/$(git branch --show-current) | sed 's/^/  [solo en origin] /'
  git log --oneline origin/$(git branch --show-current)..HEAD | sed 's/^/  [solo en local]  /'
fi

echo -e "\n--- [3] ESTADO SERVIDOR (deploy@hetzner) ---"
ssh "$REMOTE_HOST" "cd $REMOTE_DIR && git rev-parse HEAD 2>/dev/null && git status --porcelain 2>/dev/null && echo '---PM2---' && pm2 jlist 2>/dev/null | python3 -c 'import json,sys; d=json.load(sys.stdin); [print(p[\"name\"], p[\"pm2_env\"][\"status\"]) for p in d if \"threatradar\" in p[\"name\"]]'" 2>/dev/null > /tmp/remote_state.txt

REMOTE_DEPLOY_HASH=$(head -1 /tmp/remote_state.txt)
echo "HEAD en servidor: $REMOTE_DEPLOY_HASH"
if [ "$LOCAL_HASH" == "$REMOTE_DEPLOY_HASH" ]; then
  echo "✅ Servidor coincide con local/GitHub"
else
  echo "⚠️  Servidor en commit distinto (revisar si hizo deploy manual o hot-fix in-situ)"
fi
echo "Cambios sin commitear EN EL SERVIDOR (peligro: se pierden en próximo deploy):"
tail -n +2 /tmp/remote_state.txt | grep -B100 '\-\-\-PM2\-\-\-' | grep -v '\-\-\-PM2\-\-\-' || echo "  (ninguno)"

echo -e "\n--- [4] CARPETA scripts/ (Python en testing) ---"
if [ -d "$LOCAL_DIR/scripts" ]; then
  echo "Existe localmente. Contenido:"
  ls -la "$LOCAL_DIR/scripts"
  IN_GITIGNORE=$(grep -c "^scripts" "$LOCAL_DIR/.gitignore" 2>/dev/null || echo 0)
  if [ "$IN_GITIGNORE" -gt 0 ]; then
    echo "⚠️  scripts/ está en .gitignore → NO se sube a GitHub → riesgo de pérdida si solo vive en local"
  else
    echo "✅ scripts/ no está ignorada, se trackea normalmente"
  fi
else
  echo "No existe aún scripts/ en local"
fi

echo -e "\n--- [5] BACKUP DB en servidor ---"
ssh "$REMOTE_HOST" "ls -la $REMOTE_DIR/data/*.db 2>/dev/null; ls -la $REMOTE_DIR/backups/ 2>/dev/null || echo 'No hay carpeta backups/'"

echo -e "\n=============================================="
echo " FIN AUDITORÍA"
echo "=============================================="
