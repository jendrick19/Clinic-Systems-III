<script setup>
import { ref, onMounted, nextTick } from 'vue'

const messages = ref([
  { 
    role: 'assistant', 
    content: '¡Hola! Soy tu asistente médico inteligente. ¿En qué puedo ayudarte hoy? Puedes pedirme que te recomiende un horario para tu cita.' 
  }
])

const userInput = ref('')
const isLoading = ref(false)
const chatContainer = ref(null)

// Para pruebas, usaremos un professionalId fijo si no se proporciona uno
const professionalId = ref(1) 
const provider = ref('openai') // 'gemini' o 'openai'

const scrollToBottom = async () => {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return

  const userText = userInput.value
  messages.value.push({ role: 'user', content: userText })
  userInput.value = ''
  isLoading.value = true
  
  await scrollToBottom()

  try {
    const response = await fetch('/api/intelligence/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: userText,
        professionalId: professionalId.value,
        provider: provider.value
      })
    })

    const result = await response.json()

    if (result.success) {
      if (Array.isArray(result.data)) {
        if (result.data.length === 0) {
          messages.value.push({ 
            role: 'assistant', 
            content: 'Lo siento, no encontré horarios disponibles que coincidan con tu solicitud para el mes de enero de 2026.' 
          })
        } else {
          let reply = 'He encontrado estas opciones para ti en enero:\n\n'
          result.data.forEach((slot, index) => {
            reply += `${index + 1}. **${slot.date_human}**\n   *Motivo: ${slot.reason}*\n\n`
          })
          messages.value.push({ role: 'assistant', content: reply })
        }
      } else if (result.data && result.data.message) {
        messages.value.push({ role: 'assistant', content: result.data.message })
      } else {
        // Caso de respuesta inesperada
        messages.value.push({ role: 'assistant', content: 'La IA respondió algo inesperado. Por favor, intenta de nuevo.' })
      }
    } else {
      messages.value.push({ 
        role: 'assistant', 
        content: 'Hubo un error en la IA: ' + (result.message || 'Error desconocido') 
      })
    }
  } catch (error) {
    console.error('Error:', error)
    messages.value.push({ 
      role: 'assistant', 
      content: 'Error de conexión. Asegúrate de que el backend esté corriendo (npm run dev).' 
    })
  } finally {
    isLoading.value = false
    await scrollToBottom()
  }
}
</script>

<template>
  <div class="flex flex-col h-[500px] w-full max-w-lg mx-auto border border-cyan-100 rounded-3xl overflow-hidden bg-white shadow-2xl">
    <!-- Header -->
    <div class="bg-gradient-to-r from-cyan-500 to-teal-500 text-white p-4 flex justify-between items-center shadow-md">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
          <span class="text-lg">🤖</span>
        </div>
        <h3 class="font-bold text-base">Asistente Dental IA</h3>
      </div>
      <select v-model="provider" class="bg-white/20 text-xs p-1.5 rounded-xl border-none text-white outline-none hover:bg-white/30 transition-colors cursor-pointer">
        <option value="gemini" class="text-slate-900">Google Gemini</option>
        <option value="openai" class="text-slate-900">OpenAI GPT</option>
      </select>
    </div>

    <!-- Messages Container -->
    <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50 to-white">
      <div 
        v-for="(msg, index) in messages" 
        :key="index"
        :class="['flex', msg.role === 'user' ? 'justify-end' : 'justify-start']"
      >
        <div 
          :class="[
            'max-w-[85%] p-3.5 rounded-2xl text-sm shadow-sm transition-all',
            msg.role === 'user' 
              ? 'bg-cyan-500 text-white rounded-br-none' 
              : 'bg-white text-slate-700 border border-cyan-50 rounded-bl-none'
          ]"
        >
          <div class="whitespace-pre-line leading-relaxed">{{ msg.content }}</div>
        </div>
      </div>
      
      <!-- Loading Indicator -->
      <div v-if="isLoading" class="flex justify-start">
        <div class="bg-white border border-cyan-50 p-4 rounded-2xl rounded-bl-none shadow-sm">
          <div class="flex space-x-1.5">
            <div class="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:-.3s]"></div>
            <div class="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:-.5s]"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="p-4 border-t border-slate-100 bg-white">
      <form @submit.prevent="sendMessage" class="flex space-x-2">
        <input 
          v-model="userInput"
          type="text" 
          placeholder="Escribe tu consulta aquí..."
          class="flex-1 border border-slate-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-sm placeholder:text-slate-400"
          :disabled="isLoading"
        />
        <button 
          type="submit"
          class="bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-5 py-2.5 rounded-2xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          :disabled="isLoading || !userInput.trim()"
        >
          <span v-if="!isLoading" class="font-semibold text-sm">Enviar</span>
          <span v-else class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.animate-bounce {
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(-25%);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: translateY(0);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}
</style>
