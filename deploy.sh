#!/bin/bash

echo "🚀 LecturaViva - Script de Despliegue"
echo "======================================"
echo ""

# Verificar si Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI no encontrado"
    echo "Instalando..."
    npm i -g vercel
fi

echo "✅ Vercel CLI encontrado"
echo ""
echo "Para desplegar en Vercel:"
echo "1. Si no tienes cuenta, crea una en https://vercel.com"
echo "2. Ejecuta: vercel login"
echo "3. Luego ejecuta: vercel --prod"
echo ""
echo "Para desplegar en GitHub Pages:"
echo "1. Crea un repositorio en GitHub"
echo "2. Ejecuta: npm run deploy"
echo ""
echo "Para probar localmente:"
echo "npm run preview"
echo ""

# Preguntar qué desea hacer
read -p "¿Deseas probar localmente ahora? (s/n): " choice

if [ "$choice" = "s" ] || [ "$choice" = "S" ]; then
    echo "Iniciando servidor de preview..."
    npm run preview
fi
