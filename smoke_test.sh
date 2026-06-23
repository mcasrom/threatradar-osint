#!/bin/bash
BASE="http://localhost:3000"
PASS=0
FAIL=0

check() {
  local name=$1
  local result=$2
  local expected=$3
  if echo "$result" | grep -q "$expected"; then
    echo "✅ $name"
    ((PASS++))
  else
    echo "❌ $name — esperado: $expected"
    echo "   got: $(echo $result | head -c 100)"
    ((FAIL++))
  fi
}

echo "=== ThreatRadar OSINT — Smoke Tests ==="
echo ""

# 1. Status
R=$(curl -s $BASE/api/status)
check "GET /api/status" "$R" "online"

# 2. Register
R=$(curl -s -X POST $BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke_'$(date +%s)'@test.com","password":"Smoke1234!"}')
check "POST /api/auth/register" "$R" "token"
TOKEN=$(echo $R | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)

# 3. Login
R=$(curl -s -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@threatradar.com","password":"Admin1234!"}')
check "POST /api/auth/login" "$R" "token"

# 4. Me
R=$(curl -s $BASE/api/auth/me -H "Authorization: Bearer $TOKEN")
check "GET /api/auth/me" "$R" "email"

# 5. Usage
R=$(curl -s $BASE/api/user/usage -H "Authorization: Bearer $TOKEN")
check "GET /api/user/usage" "$R" "scansUsed"

# 6. No token → 401
R=$(curl -s $BASE/api/osint/shodan/1.1.1.1)
check "GET /api/osint/shodan (sin token → 401)" "$R" "No token"

# 7. Shodan con token
R=$(curl -s $BASE/api/osint/shodan/1.1.1.1 -H "Authorization: Bearer $TOKEN")
check "GET /api/osint/shodan/1.1.1.1" "$R" "isp"

# 8. AbuseIPDB
R=$(curl -s $BASE/api/osint/abuseipdb/8.8.8.8 -H "Authorization: Bearer $TOKEN")
check "GET /api/osint/abuseipdb/8.8.8.8" "$R" "abuseConfidenceScore"

# 9. VirusTotal
R=$(curl -s $BASE/api/osint/virustotal/8.8.8.8 -H "Authorization: Bearer $TOKEN")
check "GET /api/osint/virustotal/8.8.8.8" "$R" "reputation"

# 10. Hunter
R=$(curl -s "$BASE/api/osint/hunter/google.com" -H "Authorization: Bearer $TOKEN")
check "GET /api/osint/hunter/google.com" "$R" "organization"

# 11. GreyNoise
R=$(curl -s $BASE/api/osint/greynoise/8.8.8.8 -H "Authorization: Bearer $TOKEN")
check "GET /api/osint/greynoise/8.8.8.8" "$R" "noise"

# 12. IPInfo
R=$(curl -s $BASE/api/osint/ipinfo/8.8.8.8 -H "Authorization: Bearer $TOKEN")
check "GET /api/osint/ipinfo/8.8.8.8" "$R" "city"

# 13. ip-full
R=$(curl -s $BASE/api/osint/ip-full/8.8.8.8 -H "Authorization: Bearer $TOKEN")
check "GET /api/osint/ip-full/8.8.8.8" "$R" "shodan"

echo ""
echo "=== Resultado: $PASS passed, $FAIL failed ==="
