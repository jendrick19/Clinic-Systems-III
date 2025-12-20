<script setup>
import { ref } from 'vue'

const apiStatus = ref('Esperando...')
const loading = ref(false)

const testAPI = async () => {
  loading.value = true
  try {
    // Ejemplo de petición a tu API
    const response = await fetch('/api')
    if (response.ok) {
      const data = await response.json()
      apiStatus.value = `✅ ${data.mensaje} - Versión: ${data.version}`
    } else {
      apiStatus.value = '⚠️ API respondió con error'
    }
  } catch (error) {
    apiStatus.value = '❌ Error conectando con API: ' + error.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
      <h1 class="text-4xl font-bold text-gray-800 mb-4 text-center">
        ¡Clinic System! 🏥
      </h1>
      <p class="text-blue-800 text-center mb-6">
        Vue 3 + Vite + Tailwind CSS + Node.js
      </p>
      
      <div class="space-y-4">
        <button 
          @click="testAPI"
          :disabled="loading"
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105 disabled:transform-none">
          {{ loading ? 'Probando...' : 'Probar API Backend' }}
        </button>
        
        <div class="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-lg">
          <p class="text-sm text-gray-700 font-semibold mb-2">
            Estado del Backend:
          </p>
          <p class="text-sm text-gray-600">
            {{ apiStatus }}
          </p>
        </div>

        <div class="bg-green-50 p-4 rounded-lg border border-green-200">
          <p class="text-xs text-green-800">
            ✅ Tailwind CSS funcionando<br>
            ✅ Vue 3 + Vite funcionando<br>
            ✅ Proxy configurado
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
