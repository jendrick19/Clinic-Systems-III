<script setup>
import { ref, onMounted } from 'vue'
import Login from './components/Login.vue'
import Register from './components/Register.vue'
import DashboardAdmin from './components/DashboardAdmin.vue'
import DashboardCliente from './components/DashboardCliente.vue'
import ChatIA from './components/ChatIA.vue'

// Estados: 'login', 'register', 'dashboard-admin', 'dashboard-client'
const currentView = ref('login')
const showChat = ref(false)
const userType = ref(null)

onMounted(() => {
  // Verificar si hay un usuario logueado
  const user = localStorage.getItem('user')
  if (user) {
    const userData = JSON.parse(user)
    userType.value = userData.tipo
    currentView.value = userData.tipo === 'admin' ? 'dashboard-admin' : 'dashboard-client'
  }
})

const handleLoginSuccess = (data) => {
  userType.value = data.tipo
  currentView.value = data.tipo === 'admin' ? 'dashboard-admin' : 'dashboard-client'
}

const handleRegisterSuccess = () => {
  // Después del registro exitoso, mostrar el login
  currentView.value = 'login'
}

const handleShowRegister = () => {
  currentView.value = 'register'
}

const handleShowLogin = () => {
  currentView.value = 'login'
}

const handleLogout = () => {
  localStorage.removeItem('user')
  currentView.value = 'login'
  userType.value = null
}
</script>

<template>
  <div>
    <!-- Login View -->
    <Login
      v-if="currentView === 'login'"
      @login-success="handleLoginSuccess"
      @show-register="handleShowRegister"
    />

    <!-- Register View -->
    <Register
      v-if="currentView === 'register'"
      @register-success="handleRegisterSuccess"
      @show-login="handleShowLogin"
    />

    <!-- Admin Dashboard -->
    <DashboardAdmin
      v-if="currentView === 'dashboard-admin'"
      @logout="handleLogout"
    />

    <!-- Client Dashboard -->
    <DashboardCliente
      v-if="currentView === 'dashboard-client'"
      @logout="handleLogout"
    />

    <!-- Botón Flotante de Chat IA -->
    <div v-if="currentView !== 'login' && currentView !== 'register'" class="fixed bottom-6 right-6 z-50">
      <div v-if="showChat" class="mb-4">
        <ChatIA />
      </div>
      <button 
        @click="showChat = !showChat"
        :class="[ showChat ? 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600' : 'bg-blue-600 hover:bg-blue-700', 'text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-110' ]"
      >
        <span v-if="!showChat" class="text-2xl">💬</span>
        <span v-else class="text-2xl">✖</span>
      </button>
    </div>
  </div>
</template>

<style scoped></style>
