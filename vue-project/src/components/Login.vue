<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-teal-50 p-4">
    <div class="w-full max-w-md">
      <!-- Logo y Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-2xl mb-4 shadow-lg">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-slate-900 mb-2 text-balance">
          Clínica Dental Plus
        </h1>
        <p class="text-slate-600 text-pretty">
          Sistema de Agendamiento Inteligente
        </p>
      </div>

      <!-- Card de Login -->
      <div class="bg-white rounded-3xl shadow-xl border border-cyan-100 p-8">
        <div class="mb-6">
          <h2 class="text-2xl font-semibold text-slate-900 mb-2">
            Iniciar Sesión
          </h2>
          <p class="text-sm text-slate-500">
            Selecciona tu tipo de usuario
          </p>
        </div>

        <!-- Selector de Tipo de Usuario -->
        <div class="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            @click="userType = 'patient'"
            :class="[
              'flex-1 py-2 px-4 rounded-lg font-medium transition-all',
              userType === 'patient'
                ? 'bg-white text-cyan-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            Paciente
          </button>
          <button
            type="button"
            @click="userType = 'dentist'"
            :class="[
              'flex-1 py-2 px-4 rounded-lg font-medium transition-all',
              userType === 'dentist'
                ? 'bg-white text-cyan-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            Odontólogo
          </button>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Formulario para Paciente -->
          <div v-if="userType === 'patient'" class="space-y-4">
            <!-- Tipo de Documento -->
            <div>
              <label for="documentType" class="block text-sm font-medium text-slate-700 mb-2">
                Tipo de Documento *
              </label>
              <select
                id="documentType"
                v-model="loginData.documentType"
                class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
                required
              >
                <option value="">Selecciona un tipo</option>
                <option value="cedula">Cédula</option>
                <option value="rif">RIF</option>
                <option value="pasaporte">Pasaporte</option>
                <option value="extranjero">Extranjero (E)</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <!-- Número de Documento -->
            <div>
              <label for="documentNumber" class="block text-sm font-medium text-slate-700 mb-2">
                Número de Documento *
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </div>
                <input
                  id="documentNumber"
                  v-model="loginData.documentNumber"
                  type="text"
                  placeholder="12345678"
                  class="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <!-- Formulario para Odontólogo -->
          <div v-if="userType === 'dentist'" class="space-y-4">
            <div>
              <label for="professionalRegister" class="block text-sm font-medium text-slate-700 mb-2">
                Registro Profesional *
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <input
                  id="professionalRegister"
                  v-model="loginData.professionalRegister"
                  type="text"
                  placeholder="OD-01"
                  class="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none uppercase"
                  required
                />
              </div>
              <p class="text-xs text-slate-500 mt-1">Ejemplo: OD-01</p>
            </div>
          </div>

          <!-- Mensaje de Error -->
          <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
            <svg class="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Mensaje de Éxito -->
          <div v-if="successMessage" class="bg-teal-50 border border-teal-200 text-teal-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
            <svg class="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span>{{ successMessage }}</span>
          </div>

          <!-- Botón de Login -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg v-if="loading" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ loading ? 'Verificando...' : 'Ingresar al Sistema' }}</span>
          </button>
        </form>

        <!-- Divisor -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-slate-200"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-4 bg-white text-slate-500">¿Primera vez aquí?</span>
          </div>
        </div>

        <!-- Botón Registro -->
        <button
          @click="$emit('show-register')"
          class="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium py-3 px-4 rounded-xl transition-all border border-slate-200 hover:border-slate-300"
        >
          Crear Nueva Cuenta
        </button>
      </div>

      <!-- Footer -->
      <p class="text-center text-sm text-slate-500 mt-6">
        Sistema con IA · Agendamiento Automatizado
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['login-success', 'show-register'])

const userType = ref('patient') // 'patient' o 'dentist'
const loginData = ref({
  documentType: '',
  documentNumber: '',
  professionalRegister: '',
})
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const handleLogin = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  loading.value = true

  try {
    let body = {}
    
    if (userType.value === 'dentist') {
      body = {
        professionalRegister: loginData.value.professionalRegister.toUpperCase().trim()
      }
    } else {
      body = {
        tipoDocumento: loginData.value.documentType,
        numeroDocumento: loginData.value.documentNumber.trim()
      }
    }

    const response = await fetch('/api/platform/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (response.ok) {
      successMessage.value = `¡Bienvenido, ${data.data.nombre}!`
      
      // Guardar datos del usuario en localStorage
      localStorage.setItem('user', JSON.stringify({
        id: data.data.id,
        nombre: data.data.nombre,
        tipo: data.tipo,
        data: data.data,
      }))

      // Emitir evento de éxito después de un breve delay
      setTimeout(() => {
        emit('login-success', {
          tipo: data.tipo,
          data: data.data,
        })
      }, 1000)
    } else {
      errorMessage.value = data.mensaje || 'Error al iniciar sesión'
    }
  } catch (error) {
    if (error.message && error.message.includes('fetch')) {
      errorMessage.value = 'Error de conexión con el servidor. Verifica que el backend esté corriendo.'
    } else {
      errorMessage.value = 'Error de conexión. Por favor intenta nuevamente.'
    }
    console.error('Login error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped></style>
