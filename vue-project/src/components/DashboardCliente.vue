<template>
  <div class="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-cyan-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 class="text-xl font-bold text-slate-900">Clínica Dental Plus</h1>
              <p class="text-sm text-slate-500">Área de Paciente</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right">
              <p class="text-sm font-medium text-slate-900">{{ userData?.nombre }}</p>
              <p class="text-xs text-slate-500">Paciente</p>
            </div>
            <button
              @click="handleLogout"
              class="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Welcome Card -->
      <div class="bg-gradient-to-r from-cyan-500 to-teal-500 rounded-2xl shadow-lg p-6 mb-8 text-white">
        <h2 class="text-2xl font-bold mb-2">Bienvenido, {{ userData?.nombre }}</h2>
        <p class="text-cyan-50">Gestiona tus citas y revisa tu historial dental</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Card 1: Próxima Cita -->
        <div class="bg-white rounded-xl shadow-md p-6 border border-cyan-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500 mb-1">Próxima Cita</p>
              <p class="text-lg font-bold text-slate-900">{{ nextAppointment?.fecha || 'Sin cita' }}</p>
              <p class="text-xs text-slate-400 mt-1">{{ nextAppointment?.hora || '' }}</p>
            </div>
            <div class="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Card 2: Citas Programadas -->
        <div class="bg-white rounded-xl shadow-md p-6 border border-teal-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500 mb-1">Citas Programadas</p>
              <p class="text-3xl font-bold text-slate-900">{{ stats.citasProgramadas || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Card 3: Historial -->
        <div class="bg-white rounded-xl shadow-md p-6 border border-cyan-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500 mb-1">Visitas Realizadas</p>
              <p class="text-3xl font-bold text-slate-900">{{ stats.visitas || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-xl shadow-md p-6 border border-cyan-100">
        <h3 class="text-lg font-semibold text-slate-900 mb-4">Acciones Rápidas</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            class="p-4 border border-cyan-200 rounded-xl hover:bg-cyan-50 transition-colors text-left"
            @click="navigateTo('agendar')"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span class="font-medium text-slate-700">Agendar Cita</span>
            </div>
          </button>

          <button
            class="p-4 border border-teal-200 rounded-xl hover:bg-teal-50 transition-colors text-left"
            @click="navigateTo('mis-citas')"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span class="font-medium text-slate-700">Mis Citas</span>
            </div>
          </button>

          <button
            class="p-4 border border-cyan-200 rounded-xl hover:bg-cyan-50 transition-colors text-left"
            @click="navigateTo('historial')"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span class="font-medium text-slate-700">Mi Historial</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Próxima Cita Detail -->
      <div v-if="nextAppointment" class="mt-8 bg-white rounded-xl shadow-md p-6 border border-cyan-100">
        <h3 class="text-lg font-semibold text-slate-900 mb-4">Detalle de Próxima Cita</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-slate-500">Fecha</p>
            <p class="text-lg font-semibold text-slate-900">{{ nextAppointment.fecha }}</p>
          </div>
          <div>
            <p class="text-sm text-slate-500">Hora</p>
            <p class="text-lg font-semibold text-slate-900">{{ nextAppointment.hora }}</p>
          </div>
          <div>
            <p class="text-sm text-slate-500">Odontólogo</p>
            <p class="text-lg font-semibold text-slate-900">{{ nextAppointment.odontologo || 'Por asignar' }}</p>
          </div>
          <div>
            <p class="text-sm text-slate-500">Estado</p>
            <span class="inline-block px-3 py-1 text-sm font-medium bg-cyan-100 text-cyan-700 rounded-full">
              {{ nextAppointment.estado || 'Programada' }}
            </span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { eventBus, EVENTS } from '../utils/eventBus'

const emit = defineEmits(['logout'])

const userData = ref(null)
const nextAppointment = ref(null)
const stats = ref({
  citasProgramadas: 0,
  visitas: 0,
})

onMounted(() => {
  // Cargar datos del usuario desde localStorage
  const user = localStorage.getItem('user')
  if (user) {
    userData.value = JSON.parse(user).data
  }
  
  // Cargar datos de citas
  loadAppointments()
  
  // Escuchar eventos de actualización
  eventBus.on(EVENTS.REFRESH_DASHBOARD, () => {
    console.log('[Dashboard] Recibido evento de actualización, recargando...')
    loadAppointments()
  })
})

onUnmounted(() => {
  // Limpiar listeners al desmontar
  eventBus.off(EVENTS.REFRESH_DASHBOARD)
})

const loadAppointments = async () => {
  try {
    const user = localStorage.getItem('user')
    if (!user) return
    
    const userDataParsed = JSON.parse(user)
    const userId = userDataParsed?.data?.userId
    const entityId = userDataParsed?.data?.id || userDataParsed?.id
    
    if (!userId && !entityId) return
    
    const response = await fetch(`/api/dashboard/stats?userId=${userId}&entityId=${entityId}`)
    const data = await response.json()
    
    if (data.success && data.data) {
      stats.value = {
        citasProgramadas: data.data.citasProgramadas || 0,
        visitas: data.data.visitasRealizadas || 0
      }
      nextAppointment.value = data.data.nextAppointment || null
      console.log('[Dashboard] Estadísticas cargadas:', stats.value)
    }
  } catch (error) {
    console.error('[Dashboard] Error:', error)
    stats.value = { citasProgramadas: 0, visitas: 0 }
    nextAppointment.value = null
  }
}

const navigateTo = (section) => {
  // TODO: Implementar navegación a diferentes secciones
  console.log('Navegar a:', section)
}

const handleLogout = () => {
  localStorage.removeItem('user')
  emit('logout')
}
</script>

<style scoped></style>

