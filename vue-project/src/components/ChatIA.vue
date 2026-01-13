<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { eventBus, EVENTS } from '../utils/eventBus'

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

// Función para extraer userId/patientId desde localStorage o sessionStorage
const getUserFromStorage = () => {
  try {
    const possibleKeys = ['user', 'userData', 'session', 'auth', 'currentUser', 'authUser']
    const storages = [
      { name: 'localStorage', storage: localStorage },
      { name: 'sessionStorage', storage: sessionStorage }
    ]
    
    for (const { name, storage } of storages) {
      // Buscar en claves específicas
      for (const key of possibleKeys) {
        const dataStr = storage.getItem(key)
        if (dataStr) {
          try {
            const userData = JSON.parse(dataStr)
            // CORRECCIÓN CRÍTICA: Usar userData.data.userId (ID del usuario logueado)
            // NO usar userData.id o userData.data.id (que es el entityId/peopleId/professionalId)
            // Estructura: { id: 3, data: { userId: 5, id: 3, ... } }
            // userId=5 es el ID del usuario en la tabla Users
            // id=3 es el ID en PeopleAttended o Professional
            const extractedUserId = userData?.data?.userId || null
            const extractedEntityId = userData?.data?.id || userData?.id || null
            
            if (extractedUserId) {
              console.log(`[ChatIA] userId extraído de ${name}.${key}:`, extractedUserId, '| entityId:', extractedEntityId)
              console.log('[ChatIA] Estructura completa:', userData)
              // Guardamos ambos IDs en variables globales
              window.__EXTRACTED_USER_ID__ = extractedUserId
              window.__EXTRACTED_ENTITY_ID__ = extractedEntityId
              return { userId: Number(extractedUserId), entityId: Number(extractedEntityId) }
            }
          } catch (e) {
            // No es JSON válido, continuar
          }
        }
      }
      // Fallback: leer userId simple
      const simpleUserId = storage.getItem('userId')
      if (simpleUserId) {
        console.log(`[ChatIA] userId simple desde ${name}:`, simpleUserId)
        return { userId: Number(simpleUserId), entityId: Number(simpleUserId) }
      }
    }
  } catch (e) {
    console.error('[ChatIA] Error leyendo userId del storage:', e)
  }
  return null
}


const userIds = getUserFromStorage() || { userId: null, entityId: null }
const userId = ref(userIds.userId || (window.__USER_ID__ ? Number(window.__USER_ID__) : null))
const patientId = ref(userIds.entityId || (window.__PATIENT_ID__ ? Number(window.__PATIENT_ID__) : null))
const sessionContext = ref(null)

const scrollToBottom = async () => {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

// Funciones para respuestas variadas y humanas
const getRandomResponse = (options) => {
  return options[Math.floor(Math.random() * options.length)]
}

const getNoResultsMessage = () => {
  const messages = [
    'Hmm, no encontré horarios que se ajusten a lo que buscas para este mes. ¿Quieres que busque en otro período?',
    'Lo siento, no hay horarios disponibles que coincidan con tu solicitud en enero de 2026. ¿Te gustaría probar con otras fechas?',
    'Parece que no tengo horarios libres para esas fechas específicas. ¿Qué te parece si exploramos otras opciones?',
    'No logré encontrar espacios disponibles con esos criterios. ¿Prefieres que busque en fechas alternativas?',
    'Vaya, todos los horarios de enero están ocupados para lo que necesitas. ¿Puedo ayudarte a buscar en otro mes?'
  ]
  return getRandomResponse(messages)
}

const getIntroMessage = (count) => {
  const intros = [
    `¡Perfecto! Encontré ${count} ${count === 1 ? 'opción' : 'opciones'} que podrían interesarte:\n\n`,
    `Genial, tengo ${count} ${count === 1 ? 'horario disponible' : 'horarios disponibles'} para ti:\n\n`,
    `¡Excelente! He encontrado ${count} ${count === 1 ? 'alternativa' : 'alternativas'} que se ajustan a lo que buscas:\n\n`,
    `Mira lo que encontré: ${count} ${count === 1 ? 'opción perfecta' : 'opciones perfectas'} para ti:\n\n`,
    `¡Buenas noticias! Tengo ${count} ${count === 1 ? 'horario' : 'horarios'} que podrían funcionarte:\n\n`
  ]
  return getRandomResponse(intros)
}

const getErrorMessage = (errorText) => {
  const messages = [
    `Ups, algo salió mal: ${errorText}. ¿Podrías intentarlo de nuevo?`,
    `Vaya, tuve un pequeño problema: ${errorText}. ¿Probamos otra vez?`,
    `Lo siento, encontré un error: ${errorText}. Intentémoslo nuevamente.`,
    `Parece que hubo un inconveniente: ${errorText}. ¿Quieres volver a intentarlo?`
  ]
  return getRandomResponse(messages)
}

const getConnectionErrorMessage = () => {
  const messages = [
    'No pude conectarme con el servidor. ¿Está el backend funcionando? (npm run dev)',
    'Parece que hay un problema de conexión. Asegúrate de que el backend esté activo (npm run dev).',
    'Hmm, no puedo alcanzar el servidor. Verifica que el backend esté corriendo (npm run dev).',
    'Error de conexión. ¿El backend está encendido? Intenta ejecutar npm run dev.'
  ]
  return getRandomResponse(messages)
}

const getUnexpectedResponseMessage = () => {
  const messages = [
    'Recibí una respuesta un poco confusa. ¿Podrías reformular tu pregunta?',
    'No estoy seguro de cómo interpretar eso. ¿Puedes intentar preguntarlo de otra manera?',
    'La respuesta que obtuve no tiene mucho sentido. ¿Intentamos de nuevo?',
    'Algo extraño pasó con mi respuesta. ¿Me lo preguntas otra vez?'
  ]
  return getRandomResponse(messages)
}

const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return

  const userText = userInput.value
  messages.value.push({ role: 'user', content: userText })
  userInput.value = ''
  isLoading.value = true
  
  await scrollToBottom()

  // Si no hay userId ni patientId, no llamamos al backend de chat.
  // Preguntamos al usuario cómo prefiere identificarse para poder consultar sus citas.
  if (!userId.value && !patientId.value) {
    const consultPatterns = [
      /mis citas/i,
      /\bconsultar (mis )?citas\b/i,
      /\bver mis citas\b/i,
      /\btengo citas\b/i,
      /\bcuáles son mis citas\b/i,
      /\bmostrar mis citas\b/i
    ]
    if (consultPatterns.some(p => p.test(userText))) {
      const askId = 'Para mostrar tus citas necesito que inicies sesión o me facilites el tipo y número de documento (ej: "DNI 12345678") o tu nombre completo. ¿Cómo prefieres continuar?'
      messages.value.push({ role: 'assistant', content: askId })
      isLoading.value = false
      await scrollToBottom()
      return
    }
  }
  // Detectar si el usuario está enviando su userId para guardarlo (ej: "mi id es 123")
  const idMatch = userText.match(/(?:mi id es|mi user id es|mi usuario es|user id|userid|soy usuario|soy)[:\\s]*?(\\d{1,10})/i)
  if (idMatch) {
    userId.value = Number(idMatch[1])
    try {
      localStorage.setItem('userId', String(userId.value))
      messages.value.push({ role: 'assistant', content: `Perfecto, he guardado tu userId (${userId.value}) en esta sesión.` })
    } catch (err) {
      messages.value.push({ role: 'assistant', content: `He recibido tu id (${userId.value}) pero no pude guardarlo localmente.` })
    }
    isLoading.value = false
    await scrollToBottom()
    return
  }

  try {
    const response = await fetch('/api/intelligence/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userText,
        userId: userId.value,
        patientId: patientId.value
      })
    })

    const result = await response.json()

    if (result.success && result.data) {
      const assistantPayload = result.data;
      const assistantMessage = assistantPayload.message || 'Lo siento, no entendí. ¿Puedes repetirlo?';
      messages.value.push({ role: 'assistant', content: assistantMessage })
      
      // Emitir evento si hubo cambios en las citas (usando flag del backend)
      if (assistantPayload.appointmentChanged === true) {
        console.log('[ChatIA] Cambio en citas detectado, emitiendo evento REFRESH_DASHBOARD')
        eventBus.emit(EVENTS.REFRESH_DASHBOARD)
      }
    } else {
      messages.value.push({ role: 'assistant', content: getErrorMessage(result.message || 'Error desconocido') })
    }
  } catch (error) {
    console.error('Error:', error)
    messages.value.push({ 
      role: 'assistant', 
      content: getConnectionErrorMessage()
    })
  } finally {
    isLoading.value = false
    await scrollToBottom()
  }
}

// Función para configurar manualmente el userId
const setManualUserId = () => {
  const inputId = window.prompt('Ingresa tu ID de usuario (PeopleAttended):')
  if (inputId && !isNaN(inputId)) {
    const numId = Number(inputId)
    userId.value = numId
    patientId.value = numId
    localStorage.setItem('userId', String(numId))
    localStorage.setItem('patientId', String(numId))
    messages.value.push({
      role: 'assistant',
      content: `Perfecto, he guardado tu sesión con ID ${numId}. Ahora puedes consultarme sobre tus citas.`
    })
    scrollToBottom()
    
    // NOTA: No llamamos a init-session porque sobrescribe el contexto del login
    /* DESHABILITADO
    fetch('/api/intelligence/init-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: numId })
    })
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          sessionContext.value = json.data
          console.log('[ChatIA] Sesión inicializada:', json.data)
        }
      })
      .catch(err => console.error('Error inicializando sesión:', err))
    */
  }
}

onMounted(async () => {
  // Verificar nuevamente el userId al montar (por si se actualizó localStorage después de cargar)
  const freshUserIds = getUserFromStorage()
  if (freshUserIds && !userId.value) {
    userId.value = freshUserIds.userId
    patientId.value = freshUserIds.entityId
    console.log('[ChatIA onMounted] userId actualizado:', freshUserIds.userId, '| entityId:', freshUserIds.entityId)
  }
  
  console.log('[ChatIA onMounted] userId:', userId.value, 'patientId:', patientId.value)
  
  // NOTA: NO llamamos a init-session aquí porque el contexto ya se inicializa
  // automáticamente en el AuthController durante el login.
  // Llamar a init-session aquí sobrescribe el contexto correcto del profesional.
  
  /* DESHABILITADO - El contexto se inicializa en el login
  if (userId.value || patientId.value) {
    try {
      const resp = await fetch('/api/intelligence/init-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId.value, patientId: patientId.value })
      })
      const json = await resp.json()
      if (json.success && json.data) {
        sessionContext.value = json.data
        console.log('==========================================')
        console.log('[ChatIA Frontend] SESIÓN INICIALIZADA')
        console.log('[ChatIA Frontend] Patient:', json.data.patient)
        console.log('[ChatIA Frontend] Appointments:', json.data.appointments?.length || 0, 'citas')
        console.log('[ChatIA Frontend] Citas detalle:', json.data.appointments)
        console.log('[ChatIA Frontend] Availability:', Object.keys(json.data.availability || {}))
        console.log('==========================================')
      } else {
        console.error('[ChatIA Frontend] Error en init-session:', json)
      }
    } catch (err) {
      console.error('init-session error', err)
    }
  }
  */
  
  console.log('[ChatIA] Contexto ya inicializado en el login. No se llama a init-session.')
  
  // Si hay userId obtenido desde window.__USER_ID__, guardarlo en localStorage para futuras sesiones
  if (window.__USER_ID__ && !localStorage.getItem('userId')) {
    try {
      localStorage.setItem('userId', String(window.__USER_ID__))
      userId.value = Number(window.__USER_ID__)
    } catch (err) {
      console.error('No se pudo guardar userId en localStorage', err)
    }
  }
  if (window.__PATIENT_ID__ && !localStorage.getItem('patientId')) {
    try {
      localStorage.setItem('patientId', String(window.__PATIENT_ID__))
      patientId.value = Number(window.__PATIENT_ID__)
    } catch (err) {
      console.error('No se pudo guardar patientId en localStorage', err)
    }
  }
})
</script>

<template>
  <div class="flex flex-col h-[500px] w-full max-w-lg mx-auto border border-cyan-100 rounded-3xl overflow-hidden bg-white shadow-2xl">
    <!-- Header -->
    <div class="bg-gradient-to-r from-cyan-500 to-teal-500 text-white p-4 flex justify-between items-center shadow-md">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
          <span class="text-lg">🤖</span>
        </div>
        <div>
          <h3 class="font-bold text-base">Asistente Dental IA</h3>
          <p v-if="userId" class="text-xs text-white/80">Usuario: {{ userId }}</p>
          <button v-else @click="setManualUserId" class="text-xs text-white/80 hover:text-white underline">Configurar sesión</button>
        </div>
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
