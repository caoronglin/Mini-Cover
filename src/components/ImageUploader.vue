<template>
  <button v-if="uploadApiUrl" 
          @click="uploadImage"
          class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
    获取外链
  </button>
  
  <div class="fixed top-0 left-1/2 transform -translate-x-1/2 w-[90%] max-w-[600px] bg-white rounded-lg shadow-lg transition-all duration-300"
       :class="[showPopup ? 'opacity-100 visible translate-y-3' : 'opacity-0 invisible translate-y-0']">
    <div class="flex flex-col items-center justify-center p-4 text-center">
      <p v-if="isSuccess">{{ successMessage }}</p>
      <p v-else class="text-red-500">{{ errorMessage }}</p>
      <a v-if="isSuccess" 
         :href="uploadedImageUrl" 
         target="_blank"
         class="text-green-600 hover:text-gray-800 transition-colors">
        {{ uploadedImageUrl }}
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  canvasId: string
}>()

const uploadApiUrl = ref(import.meta.env.VITE_APP_UPLOAD_API_URL)
const showPopup = ref(false)
const uploadedImageUrl = ref('')
const isSuccess = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const uploadImage = (): void => {
  const canvas = document.getElementById(props.canvasId) as HTMLCanvasElement | null
  if (!canvas) return
  
  canvas.toBlob(blob => {
    if (!blob) return
    
    const formData = new FormData()
    formData.append('image', blob, 'Canvas-Ruom.webp')
    
    fetch(uploadApiUrl.value, {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then((data: { result?: string; url?: string; message?: string }) => {
      if (data.result === 'success' && data.url) {
        showUploadResult(data.url, true)
      } else {
        showUploadResult('图片上传失败: ' + (data.message || 'Unknown error'), false)
      }
    })
    .catch((error: Error) => {
      console.error('上传图片时出错:', error)
      showUploadResult('图片上传失败: ' + error.message, false)
    })
  }, 'image/webp')
}

const showUploadResult = (message: string, success: boolean): void => {
  isSuccess.value = success
  if (success) {
    successMessage.value = '图片上传成功！链接已复制到剪切板。'
    errorMessage.value = ''
    uploadedImageUrl.value = message
  } else {
    successMessage.value = ''
    errorMessage.value = message
    uploadedImageUrl.value = ''
  }
  showPopup.value = true
  navigator.clipboard.writeText(message).then(() => {
    setTimeout(() => {
      showPopup.value = false
    }, 3000)
  })
}
</script>