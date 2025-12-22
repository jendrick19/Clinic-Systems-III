<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-teal-50 p-4 py-8">
    <div class="w-full max-w-md">
      <!-- Logo y Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-2xl mb-4 shadow-lg">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-slate-900 mb-2 text-balance">
          Clínica Dental Plus
        </h1>
        <p class="text-slate-600 text-pretty">
          Crear Nueva Cuenta
        </p>
      </div>

      <!-- Card de Registro -->
      <div class="bg-white rounded-3xl shadow-xl border border-cyan-100 p-8">
        <div class="mb-6">
          <h2 class="text-2xl font-semibold text-slate-900 mb-2">
            Registro de Paciente
          </h2>
          <p class="text-sm text-slate-500">
            Completa tus datos para crear tu cuenta
          </p>
        </div>

        <form @submit.prevent="handleRegister" class="space-y-5">
          <!-- Nombres -->
          <div>
            <label for="nombres" class="block text-sm font-medium text-slate-700 mb-2">
              Nombres *
            </label>
            <input
              id="nombres"
              v-model="formData.names"
              type="text"
              placeholder="Juan Carlos"
              class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
              required
            />
          </div>

          <!-- Apellidos -->
          <div>
            <label for="apellidos" class="block text-sm font-medium text-slate-700 mb-2">
              Apellidos *
            </label>
            <input
              id="apellidos"
              v-model="formData.surNames"
              type="text"
              placeholder="Pérez González"
              class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
              required
            />
          </div>

          <!-- Tipo de Documento -->
          <div>
            <label for="documentType" class="block text-sm font-medium text-slate-700 mb-2">
              Tipo de Documento *
            </label>
            <select
              id="documentType"
              v-model="formData.documentType"
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
            <label for="documentId" class="block text-sm font-medium text-slate-700 mb-2">
              Número de Documento *
            </label>
            <input
              id="documentId"
              v-model="formData.documentId"
              type="text"
              placeholder="12345678"
              class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
              required
            />
          </div>

          <!-- Correo Electrónico -->
          <div>
            <label for="email" class="block text-sm font-medium text-slate-700 mb-2">
              Correo Electrónico *
            </label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              placeholder="correo@ejemplo.com"
              class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
              required
            />
          </div>

          <!-- Teléfono -->
          <div>
            <label for="phone" class="block text-sm font-medium text-slate-700 mb-2">
              Teléfono
            </label>
            <input
              id="phone"
              v-model="formData.phone"
              type="tel"
              placeholder="+58 412 1234567"
              class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
            />
          </div>

          <!-- Fecha de Nacimiento -->
          <div>
            <label for="dateOfBirth" class="block text-sm font-medium text-slate-700 mb-2">
              Fecha de Nacimiento
            </label>
            <input
              id="dateOfBirth"
              v-model="formData.dateOfBirth"
              type="date"
              class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
            />
          </div>

          <!-- Género -->
          <div>
            <label for="gender" class="block text-sm font-medium text-slate-700 mb-2">
              Género
            </label>
            <select
              id="gender"
              v-model="formData.gender"
              class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
            >
              <option value="">Selecciona un género</option>
              <option value="m">Masculino</option>
              <option value="f">Femenino</option>
              <option value="o">Otro</option>
            </select>
          </div>

          <!-- Dirección -->
          <div>
            <label for="address" class="block text-sm font-medium text-slate-700 mb-2">
              Dirección
            </label>
            <input
              id="address"
              v-model="formData.address"
              type="text"
              placeholder="Avenida Principal #123"
              class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
            />
          </div>

          <!-- Contacto de Emergencia -->
          <div>
            <label for="emergencyContact" class="block text-sm font-medium text-slate-700 mb-2">
              Contacto de Emergencia
            </label>
            <input
              id="emergencyContact"
              v-model="formData.emergencyContact"
              type="text"
              placeholder="Nombre - Parentesco - Teléfono"
              class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
            />
          </div>

          <!-- Patologías -->
          <div>
            <label for="patologias" class="block text-sm font-medium text-slate-700 mb-2">
              Patologías Conocidas
            </label>
            <textarea
              id="patologias"
              v-model="formData.patologias"
              rows="3"
              placeholder="Ej: Hipertensión, Diabetes, Asma..."
              class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none resize-none"
            ></textarea>
            <p class="text-xs text-slate-500 mt-1">Separa las patologías por comas si hay más de una</p>
          </div>

          <!-- Mensaje de Error -->
          <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
            <svg class="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <span>{{ errorMessage }}</span>
          </div>


          <!-- Botones -->
          <div class="space-y-3 pt-2">
            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg v-if="loading" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ loading ? 'Registrando...' : 'Crear Cuenta' }}</span>
            </button>

            <button
              type="button"
              @click="$emit('show-login')"
              class="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium py-3 px-4 rounded-xl transition-all border border-slate-200 hover:border-slate-300"
            >
              Volver al Login
            </button>
          </div>
        </form>
      </div>

      <!-- Footer -->
      <p class="text-center text-sm text-slate-500 mt-6">
        Ya tienes cuenta? <button @click="$emit('show-login')" class="text-cyan-600 hover:text-cyan-700 font-medium">Inicia sesión aquí</button>
      </p>
    </div>

    <!-- Modal de Éxito -->
    <div
      v-if="showSuccessModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="handleAcceptAndRedirect"
    >
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        <!-- Icono de éxito -->
        <div class="flex justify-center mb-4">
          <div class="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <!-- Título -->
        <h3 class="text-2xl font-bold text-slate-900 text-center mb-2">
          ¡Registro Exitoso!
        </h3>

        <!-- Mensaje -->
        <p class="text-slate-600 text-center mb-6">
          Tu cuenta ha sido creada correctamente.
        </p>

        <!-- Información de Login -->
        <div class="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl p-4 mb-6 border border-cyan-200">
          <p class="text-sm text-slate-600 mb-3 text-center font-medium">
            Para iniciar sesión usa tu documento de identidad:
          </p>
          <div class="bg-white rounded-lg p-3 mb-2">
            <p class="text-xs text-slate-500 text-center mb-1">Tipo de Documento:</p>
            <p class="text-lg font-semibold text-slate-900 text-center capitalize">
              {{ registeredDocumentType }}
            </p>
          </div>
          <div class="bg-white rounded-lg p-3">
            <p class="text-xs text-slate-500 text-center mb-1">Número de Documento:</p>
            <p class="text-2xl font-bold text-cyan-600 text-center font-mono">
              {{ registeredDocumentNumber }}
            </p>
          </div>
          <p class="text-xs text-slate-500 text-center mt-3">
            Usa estos datos para acceder al sistema
          </p>
        </div>

        <!-- Botón Aceptar -->
        <button
          @click="handleAcceptAndRedirect"
          class="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Aceptar</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['register-success', 'show-login'])

const formData = ref({
  names: '',
  surNames: '',
  documentType: '',
  documentId: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  address: '',
  emergencyContact: '',
  patologias: '',
})

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const showSuccessModal = ref(false)
const registeredDocumentType = ref('')
const registeredDocumentNumber = ref('')

const handleRegister = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  loading.value = true

  try {
    // Preparar datos para enviar
    const payload = {
      nombres: formData.value.names,
      apellidos: formData.value.surNames,
      tipoDocumento: formData.value.documentType,
      numeroDocumento: formData.value.documentId,
      correo: formData.value.email,
      telefono: formData.value.phone || undefined,
      fechaNacimiento: formData.value.dateOfBirth || undefined,
      sexo: formData.value.gender || undefined,
      direccion: formData.value.address || undefined,
      contactoEmergencia: formData.value.emergencyContact || undefined,
      patologias: formData.value.patologias || undefined,
    }

    const response = await fetch('/api/operative/personas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (response.ok) {
      // Guardar datos del documento para mostrar en el modal
      registeredDocumentType.value = formData.value.documentType
      registeredDocumentNumber.value = formData.value.documentId
      
      // Limpiar formulario
      formData.value = {
        names: '',
        surNames: '',
        documentType: '',
        documentId: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        address: '',
        emergencyContact: '',
        patologias: '',
      }

      // Mostrar modal de éxito
      showSuccessModal.value = true
    } else {
      // Manejar errores de validación
      if (data.errores && Array.isArray(data.errores)) {
        errorMessage.value = data.errores.map(e => e.mensaje).join('. ')
      } else {
        errorMessage.value = data.mensaje || 'Error al crear la cuenta'
      }
    }
  } catch (error) {
    errorMessage.value = 'Error de conexión. Por favor intenta nuevamente.'
    console.error('Register error:', error)
  } finally {
    loading.value = false
  }
}

const handleAcceptAndRedirect = () => {
  showSuccessModal.value = false
  emit('register-success', {
    documentType: registeredDocumentType.value,
    documentNumber: registeredDocumentNumber.value
  })
  // Redirigir al login
  emit('show-login')
}
</script>

<style scoped></style>

