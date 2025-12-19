#!/bin/bash

# Script para ejecutar todos los seeders en el orden correcto

echo "🌱 Ejecutando seeders en orden..."
echo ""

echo "1️⃣  Creando personas..."
npx sequelize-cli db:seed --seed 20251115000000-demo-people.js
if [ $? -eq 0 ]; then
    echo "✅ Personas creadas"
else
    echo "❌ Error al crear personas"
    exit 1
fi
echo ""

echo "2️⃣  Creando profesionales y usuarios..."
npx sequelize-cli db:seed --seed 20241116000000-demo-professionals.js
if [ $? -eq 0 ]; then
    echo "✅ Profesionales creados"
else
    echo "❌ Error al crear profesionales"
    exit 1
fi
echo ""

echo "3️⃣  Creando unidades de atención..."
npx sequelize-cli db:seed --seed 20251116000000-demo-care-units.js
if [ $? -eq 0 ]; then
    echo "✅ Unidades de atención creadas"
else
    echo "❌ Error al crear unidades de atención"
    exit 1
fi
echo ""

echo "4️⃣  Creando agendas..."
npx sequelize-cli db:seed --seed 20251119000000-demo-schedules.js
if [ $? -eq 0 ]; then
    echo "✅ Agendas creadas"
else
    echo "❌ Error al crear agendas"
    exit 1
fi
echo ""

echo "5️⃣  Creando citas..."
npx sequelize-cli db:seed --seed 20251120000000-demo-appointments.js
if [ $? -eq 0 ]; then
    echo "✅ Citas creadas"
else
    echo "❌ Error al crear citas"
    exit 1
fi
echo ""

echo "6️⃣  Creando episodios, notas clínicas y diagnósticos..."
npx sequelize-cli db:seed --seed 20251121000000-demo-episodes.js
if [ $? -eq 0 ]; then
    echo "✅ Episodios, notas clínicas y diagnósticos creados"
else
    echo "❌ Error al crear episodios"
    exit 1
fi
echo ""

echo "7️⃣  Creando versiones de notas clínicas (contenido SOAP)..."
npx sequelize-cli db:seed --seed 20251122000000-demo-clinical-note-versions.js
if [ $? -eq 0 ]; then
    echo "✅ Versiones de notas clínicas creadas"
else
    echo "❌ Error al crear versiones de notas clínicas"
    exit 1
fi
echo ""

echo "🎉 ¡Todos los seeders ejecutados exitosamente!"
echo ""
echo "📊 Resumen de datos creados:"
echo "   - 50 personas"
echo "   - 20 profesionales"
echo "   - Unidades de atención"
echo "   - Agendas"
echo "   - Citas"
echo "   - 30 episodios"
echo "   - ~60 notas clínicas"
echo "   - ~45 diagnósticos"
echo "   - ~42 versiones de notas clínicas (con contenido SOAP completo)"

