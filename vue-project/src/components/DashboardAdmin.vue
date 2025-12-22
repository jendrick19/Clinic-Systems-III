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
              <p class="text-sm text-slate-500">Panel de Administración</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right">
              <p class="text-sm font-medium text-slate-900">{{ userData?.nombre }}</p>
              <p class="text-xs text-slate-500">Odontólogo</p>
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
        <p class="text-cyan-50">Gestiona tu práctica odontológica desde este panel</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Card 1: Citas del Día -->
        <div class="bg-white rounded-xl shadow-md p-6 border border-cyan-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500 mb-1">Citas del Día</p>
              <p class="text-3xl font-bold text-slate-900">{{ stats.citasHoy || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Card 2: Pacientes -->
        <div class="bg-white rounded-xl shadow-md p-6 border border-teal-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500 mb-1">Pacientes Activos</p>
              <p class="text-3xl font-bold text-slate-900">{{ stats.pacientes || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Card 3: Próximas Citas -->
        <div class="bg-white rounded-xl shadow-md p-6 border border-cyan-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500 mb-1">Próximas Citas</p>
              <p class="text-3xl font-bold text-slate-900">{{ stats.proximasCitas || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-xl shadow-md p-6 border border-cyan-100">
        <h3 class="text-lg font-semibold text-slate-900 mb-4">Acciones Rápidas</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            class="p-4 border border-cyan-200 rounded-xl hover:bg-cyan-50 transition-colors text-left"
            @click="navigateTo('citas')"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span class="font-medium text-slate-700">Gestionar Citas</span>
            </div>
          </button>

          <button
            class="p-4 border border-teal-200 rounded-xl hover:bg-teal-50 transition-colors text-left"
            @click="navigateTo('pacientes')"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span class="font-medium text-slate-700">Ver Pacientes</span>
            </div>
          </button>

          <button
            class="p-4 border border-cyan-200 rounded-xl hover:bg-cyan-50 transition-colors text-left"
            @click="navigateTo('agenda')"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span class="font-medium text-slate-700">Mi Agenda</span>
            </div>
          </button>

          <button
            class="p-4 border border-teal-200 rounded-xl hover:bg-teal-50 transition-colors text-left"
            @click="navigateTo('historial')"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span class="font-medium text-slate-700">Historial Clínico</span>
            </div>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const emit = defineEmits(['logout'])

const userData = ref(null)
const stats = ref({
  citasHoy: 0,
  pacientes: 0,
  proximasCitas: 0,
})

onMounted(() => {
  // Cargar datos del usuario desde localStorage
  const user = localStorage.getItem('user')
  if (user) {
    userData.value = JSON.parse(user).data
  }
  
  // Aquí puedes cargar estadísticas desde la API
  loadStats()
})

const loadStats = async () => {
  // TODO: Implementar carga de estadísticas desde la API
  // Por ahora, valores por defecto
  stats.value = {
    citasHoy: 0,
    pacientes: 0,
    proximasCitas: 0,
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

