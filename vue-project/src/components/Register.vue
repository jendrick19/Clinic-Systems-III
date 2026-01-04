<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-teal-50 p-4 py-8">
    <div class="w-full max-w-md">
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

      <div class="bg-white rounded-3xl shadow-xl border border-cyan-100 p-8">
        
        <div class="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            @click="userType = 'patient'"
            :class="[
              'flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200',
              userType === 'patient'
                ? 'bg-white text-cyan-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            Paciente
          </button>
          <button
            type="button"
            @click="userType = 'professional'"
            :class="[
              'flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200',
              userType === 'professional'
                ? 'bg-white text-cyan-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            Profesional
          </button>
        </div>

        <div class="mb-6">
          <h2 class="text-2xl font-semibold text-slate-900 mb-2">
            Registro de {{ userType === 'patient' ? 'Paciente' : 'Profesional' }}
          </h2>
          <p class="text-sm text-slate-500">
            Completa tus datos para crear tu cuenta
          </p>
        </div>

        <form @submit.prevent="handleRegister" class="space-y-5">
          
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Nombres *</label>
            <input v-model="formData.names" type="text" placeholder="Juan Carlos" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none" required />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Apellidos *</label>
            <input v-model="formData.surNames" type="text" placeholder="Pérez González" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none" required />
          </div>

          <div v-if="userType === 'patient'" class="space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Tipo de Documento *</label>
              <select v-model="formData.documentType" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none" required>
                <option value="">Selecciona un tipo</option>
                <option value="cedula">Venezolano</option>
                <option value="rif">RIF</option>
                <option value="pasaporte">Pasaporte</option>
                <option value="extranjero">Extranjero (E)</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Número de Documento *</label>
              <input v-model="formData.documentId" type="text" placeholder="12345678" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none" required />
            </div>

            <div class="grid grid-cols-2 gap-4">
               <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Fecha Nacimiento</label>
                  <input v-model="formData.dateOfBirth" type="date" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none" />
               </div>
               <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Género</label>
                  <select v-model="formData.gender" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none">
                    <option value="">Seleccionar</option>
                    <option value="m">Masculino</option>
                    <option value="f">Femenino</option>
                    <option value="o">Otro</option>
                  </select>
               </div>
            </div>
            
            <div>
               <label class="block text-sm font-medium text-slate-700 mb-2">Dirección</label>
               <input v-model="formData.address" type="text" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none" />
            </div>
          </div>

          <div v-if="userType === 'professional'" class="space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Registro Profesional *</label>
              <input v-model="formData.professionalRegister" type="text" placeholder="MPPS-12345" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none uppercase" required />
              <p class="text-xs text-slate-500 mt-1">Este será tu usuario para ingresar</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Especialidad *</label>
              <select v-model="formData.specialty" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none" required>
                <option value="">Selecciona una especialidad</option>
                <!-- Guardamos el value en minúsculas para consistencia con BD -->
                <option value="odontología general">Odontología General</option>
                <option value="ortodoncia">Ortodoncia</option>
                <option value="endodoncia">Endodoncia</option>
                <option value="periodoncia">Periodoncia</option>
                <option value="odontopediatría">Odontopediatría</option>
                <option value="cirugía oral y maxilofacial">Cirugía Oral y Maxilofacial</option>
                <option value="prótesis dental">Prótesis Dental</option>
                <option value="implantología">Implantología</option>
                <option value="estética dental">Estética Dental</option>
                <option value="patología oral">Patología Oral</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Correo Electrónico *</label>
            <input v-model="formData.email" type="email" placeholder="correo@ejemplo.com" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none" required />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Teléfono</label>
            <input v-model="formData.phone" type="tel" placeholder="+58 412 1234567" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Contraseña *</label>
            <input v-model="formData.password" type="password" placeholder="••••••••" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none" required minlength="6"/>
            <p class="text-xs text-slate-500 mt-1">Mínimo 6 caracteres</p>
          </div>

          <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
            <svg class="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <span>{{ errorMessage }}</span>
          </div>

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

      <p class="text-center text-sm text-slate-500 mt-6">
        Ya tienes cuenta? <button @click="$emit('show-login')" class="text-cyan-600 hover:text-cyan-700 font-medium">Inicia sesión aquí</button>
      </p>
    </div>

    <div
      v-if="showSuccessModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      @click.self="handleAcceptAndRedirect"
    >
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        <div class="flex justify-center mb-4">
          <div class="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h3 class="text-2xl font-bold text-slate-900 text-center mb-2">
          ¡Registro Exitoso!
        </h3>

        <p class="text-slate-600 text-center mb-6">
          Tu cuenta ha sido creada correctamente.
        </p>

        <div class="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl p-4 mb-6 border border-cyan-200">
          <p class="text-sm text-slate-600 mb-3 text-center font-medium">
            Tus credenciales de acceso:
          </p>
          
          <div v-if="registeredUserType === 'patient'" class="bg-white rounded-lg p-3 mb-2 shadow-sm">
             <p class="text-xs text-slate-500 text-center mb-1">Usuario (Tu Documento):</p>
             <p class="text-xl font-bold text-cyan-600 text-center font-mono tracking-wide">
               {{ registeredUsername }}
             </p>
          </div>
          
          <div v-if="registeredUserType === 'professional'" class="bg-white rounded-lg p-3 mb-2 shadow-sm">
             <p class="text-xs text-slate-500 text-center mb-1">Usuario (Registro Profesional):</p>
             <p class="text-xl font-bold text-cyan-600 text-center font-mono tracking-wide">
               {{ registeredUsername }}
             </p>
          </div>

          <p class="text-xs text-slate-500 text-center mt-3">
            Usa este usuario y tu contraseña para ingresar.
          </p>
        </div>

        <button
          @click="handleAcceptAndRedirect"
          class="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <span>Ir a Iniciar Sesión</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['register-success', 'show-login'])

const userType = ref('patient') // 'patient' | 'professional'
const loading = ref(false)
const errorMessage = ref('')
const showSuccessModal = ref(false)

// Datos para el modal
const registeredUserType = ref('')
const registeredUsername = ref('')

const formData = ref({
  names: '',
  surNames: '',
  email: '',
  phone: '',
  password: '', // Nuevo campo
  // Paciente
  documentType: '',
  documentId: '',
  dateOfBirth: '',
  gender: '',
  address: '',
  emergencyContact: '',
  alergias: '',
  // Profesional
  professionalRegister: '',
  specialty: ''
})

const handleRegister = async () => {
  errorMessage.value = ''
  loading.value = true

  try {
    let url = ''
    let payload = {}

    if (userType.value === 'patient') {
      url = '/api/operative/personas'
      // Preparar payload Paciente
      payload = {
        nombres: formData.value.names,
        apellidos: formData.value.surNames,
        tipoDocumento: formData.value.documentType,
        numeroDocumento: formData.value.documentId,
        correo: formData.value.email,
        password: formData.value.password, // Enviar contraseña
        telefono: formData.value.phone || undefined,
        fechaNacimiento: formData.value.dateOfBirth || undefined,
        sexo: formData.value.gender || undefined,
        direccion: formData.value.address || undefined
      }
    } else {
      url = '/api/operative/profesionales'
      // Normalizar especialidad en minúsculas ANTES de enviar
      const normalizedSpecialty = (formData.value.specialty || '').toString().trim().toLowerCase()
      formData.value.specialty = normalizedSpecialty

      // Preparar payload Profesional
      payload = {
        nombres: formData.value.names,
        apellidos: formData.value.surNames,
        registroProfesional: formData.value.professionalRegister.toUpperCase(),
        especialidad: normalizedSpecialty,
        correo: formData.value.email,
        telefono: formData.value.phone || undefined,
        // Estructura especial para el Controller de Profesionales
        usuario: {
          password: formData.value.password,
          email: formData.value.email
        }
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (response.ok) {
      // Guardar datos para mostrar en el modal
      registeredUserType.value = userType.value
      
      if (userType.value === 'patient') {
         // Generar visualización del usuario (Ej: V123456)
         let prefix = ''
         if(formData.value.documentType === 'cedula') prefix = 'V'
         else if(formData.value.documentType === 'rif') prefix = 'J'
         else if(formData.value.documentType === 'pasaporte') prefix = 'P'
         else prefix = 'E'
         registeredUsername.value = prefix + formData.value.documentId
      } else {
         registeredUsername.value = formData.value.professionalRegister.toUpperCase()
      }

      // Limpiar formulario
      resetForm()
      
      // Mostrar modal
      showSuccessModal.value = true
    } else {
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

const resetForm = () => {
  formData.value = {
    names: '', surNames: '', email: '', phone: '', password: '',
    documentType: '', documentId: '', dateOfBirth: '', gender: '', address: '', emergencyContact: '', alergias: '',
    professionalRegister: '', specialty: ''
  }
}

const handleAcceptAndRedirect = () => {
  showSuccessModal.value = false
  emit('show-login')
}
</script>