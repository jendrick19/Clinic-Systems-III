#!/bin/bash

echo "======================================================================"
echo "TEST COMPLETO DEL FLUJO DE CHAT IA"
echo "======================================================================"
echo ""

echo "PASO 1: Inicializar sesión para userId=62"
echo "----------------------------------------------------------------------"
curl -s -X POST http://localhost:3000/api/intelligence/init-session \
  -H "Content-Type: application/json" \
  -d '{"userId": 62}' | python -m json.tool
echo ""
echo ""

echo "PASO 2: Esperar 2 segundos para que se guarde el contexto..."
sleep 2
echo ""

echo "PASO 3: Enviar mensaje 'cuales son mis citas'"
echo "----------------------------------------------------------------------"
curl -s -X POST http://localhost:3000/api/intelligence/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": 62, "message": "cuales son mis citas"}' | python -m json.tool
echo ""
echo ""

echo "======================================================================"
echo "REVISA LA TERMINAL DEL BACKEND PARA VER LOS LOGS DETALLADOS"
echo "Busca estos logs:"
echo "  - [init-session] Citas encontradas para peopleId 62"
echo "  - [ChatIA setInitialContext] Usuario 62"
echo "  - [ChatIA CONTEXTO COMPLETO] Usuario: 62"
echo "  - [MENSAJE SYSTEM ENVIADO A OPENAI]"
echo "======================================================================"

