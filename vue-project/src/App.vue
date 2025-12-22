<script setup>
import { ref, onMounted } from 'vue'
import Login from './components/Login.vue'
import Register from './components/Register.vue'
import DashboardAdmin from './components/DashboardAdmin.vue'
import DashboardCliente from './components/DashboardCliente.vue'

// Estados: 'login', 'register', 'dashboard-admin', 'dashboard-client'
const currentView = ref('login')
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
  </div>
</template>

<style scoped></style>
