// 阿里云Paraformer语音识别服务
// 文档: https://help.aliyun.com/zh/model-studio/developer-reference/paraformer-real-time-speech-recognition-api

const DASHSCOPE_API = 'https://dashscope.aliyuncs.com/api/v1'

export interface TranscriptionResult {
  text: string
  sentences?: Array<{
    text: string
    begin_time: number
    end_time: number
  }>
  duration?: number
}

// 提交语音识别任务（通过文件URL）
export async function submitTranscriptionTask(
  fileUrl: string,
  apiKey: string
): Promise<string> {
  const response = await fetch(`${DASHSCOPE_API}/services/audio/asr/transcription`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-DashScope-Async': 'enable',
    },
    body: JSON.stringify({
      model: 'paraformer-v2',
      input: {
        file_urls: [fileUrl],
      },
      parameters: {
        language_hints: ['zh', 'en'],
      },
    }),
  })

  const data = await response.json()

  if (data.code) {
    throw new Error(data.message || '提交任务失败')
  }

  return data.output.task_id
}

// 查询任务状态
export async function queryTranscriptionTask(
  taskId: string,
  apiKey: string
): Promise<{ status: string; result?: TranscriptionResult }> {
  const response = await fetch(`${DASHSCOPE_API}/tasks/${taskId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  })

  const data = await response.json()

  if (data.code) {
    throw new Error(data.message || '查询任务失败')
  }

  const taskStatus = data.output.task_status

  if (taskStatus === 'SUCCEEDED') {
    // 获取转录结果
    const resultUrl = data.output.results?.[0]?.transcription_url
    if (resultUrl) {
      const resultResponse = await fetch(resultUrl)
      const resultData = await resultResponse.json()

      const transcripts = resultData.transcripts || []
      const text = transcripts.map((t: { text: string }) => t.text).join('\n')
      const sentences = transcripts.flatMap((t: { sentences?: Array<{ text: string; begin_time: number; end_time: number }> }) =>
        t.sentences?.map(s => ({
          text: s.text,
          begin_time: s.begin_time,
          end_time: s.end_time,
        })) || []
      )

      return {
        status: 'SUCCEEDED',
        result: {
          text,
          sentences,
          duration: resultData.properties?.original_duration_in_milliseconds,
        },
      }
    }
  }

  return { status: taskStatus }
}

// 轮询等待任务完成
export async function waitForTranscription(
  taskId: string,
  apiKey: string,
  onProgress?: (status: string) => void,
  maxWaitTime: number = 300000 // 最长等待5分钟
): Promise<TranscriptionResult> {
  const startTime = Date.now()
  const pollInterval = 2000 // 2秒轮询一次

  while (Date.now() - startTime < maxWaitTime) {
    const { status, result } = await queryTranscriptionTask(taskId, apiKey)

    onProgress?.(status)

    if (status === 'SUCCEEDED' && result) {
      return result
    }

    if (status === 'FAILED') {
      throw new Error('语音识别任务失败')
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval))
  }

  throw new Error('语音识别超时，请稍后重试')
}

// 将文件转换为Base64 Data URL（用于小文件）
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// 检查文件类型是否支持
export function isSupportedAudioFormat(file: File): boolean {
  const supportedTypes = [
    'audio/wav',
    'audio/mp3',
    'audio/mpeg',
    'audio/ogg',
    'audio/flac',
    'audio/m4a',
    'audio/aac',
    'audio/x-m4a',
    'audio/mp4',
    'video/mp4',
    'video/webm',
    'video/x-matroska',
    'video/quicktime',
    'application/octet-stream', // 允许未知类型，靠扩展名判断
  ]

  // 支持的扩展名
  const supportedExtensions = /\.(wav|mp3|ogg|flac|m4a|aac|mp4|webm|mkv|mov|m4s|ts|flv)$/i

  return supportedTypes.includes(file.type) || supportedExtensions.test(file.name)
}

// 格式化时间（毫秒转为 mm:ss 格式）
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}
