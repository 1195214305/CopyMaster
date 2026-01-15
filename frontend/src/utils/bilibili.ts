// B站音频下载和语音识别服务

const BILIBILI_API = 'https://api.bilibili.com'

// 提取BV号
export function extractBvid(url: string): string | null {
  const match = url.match(/BV[a-zA-Z0-9]+/)
  return match ? match[0] : null
}

// 获取视频信息
export async function getBilibiliVideoInfo(bvid: string): Promise<{
  title: string
  author: string
  desc: string
  aid: number
  cid: number
  duration: number
}> {
  // 使用CORS代理
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
    `${BILIBILI_API}/x/web-interface/view?bvid=${bvid}`
  )}`

  const response = await fetch(proxyUrl)
  const data = await response.json()

  if (data.code !== 0) {
    throw new Error('获取视频信息失败')
  }

  return {
    title: data.data.title,
    author: data.data.owner.name,
    desc: data.data.desc,
    aid: data.data.aid,
    cid: data.data.cid,
    duration: data.data.duration,
  }
}

// 获取音频流URL
export async function getBilibiliAudioUrl(bvid: string, cid: number): Promise<string | null> {
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
    `${BILIBILI_API}/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=16&fnval=16`
  )}`

  const response = await fetch(proxyUrl)
  const data = await response.json()

  if (data.code !== 0 || !data.data?.dash?.audio?.length) {
    return null
  }

  return data.data.dash.audio[0].baseUrl
}

// 通过代理下载音频（返回Blob）
export async function downloadAudioViaProxy(audioUrl: string): Promise<Blob> {
  // 尝试多个CORS代理
  const proxies = [
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(audioUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(audioUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(audioUrl)}`,
    `https://proxy.cors.sh/${audioUrl}`,
  ]

  for (const proxyUrl of proxies) {
    try {
      console.log('尝试代理:', proxyUrl.substring(0, 50))
      const response = await fetch(proxyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      })
      if (response.ok) {
        const blob = await response.blob()
        if (blob.size > 1000) { // 确保不是错误页面
          console.log('下载成功，大小:', blob.size)
          return blob
        }
      }
    } catch (e) {
      console.log('代理下载失败:', e)
    }
  }

  throw new Error('音频下载失败。B站有防盗链限制，请使用下方的"上传文件"功能：先用第三方工具下载视频，再上传进行语音识别。')
}

// 将Blob上传到临时文件托管服务
export async function uploadToTempStorage(blob: Blob, filename: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', blob, filename)

  // 使用 file.io 临时托管（文件下载后自动删除）
  const response = await fetch('https://file.io', {
    method: 'POST',
    body: formData,
  })

  const data = await response.json()

  if (!data.success || !data.link) {
    throw new Error('文件上传失败')
  }

  return data.link
}

// 完整的B站视频语音识别流程
export async function transcribeBilibiliVideo(
  url: string,
  apiKey: string,
  onProgress?: (status: string, progress?: number) => void
): Promise<{
  title: string
  author: string
  text: string
}> {
  // 1. 提取BV号
  onProgress?.('解析视频链接...', 5)
  const bvid = extractBvid(url)
  if (!bvid) {
    throw new Error('无法解析B站视频链接')
  }

  // 2. 获取视频信息
  onProgress?.('获取视频信息...', 10)
  const videoInfo = await getBilibiliVideoInfo(bvid)

  // 检查视频时长（超过30分钟可能会很慢）
  if (videoInfo.duration > 1800) {
    onProgress?.(`视频较长(${Math.floor(videoInfo.duration / 60)}分钟)，识别可能需要较长时间...`, 15)
  }

  // 3. 获取音频URL
  onProgress?.('获取音频地址...', 20)
  const audioUrl = await getBilibiliAudioUrl(bvid, videoInfo.cid)
  if (!audioUrl) {
    throw new Error('无法获取音频地址')
  }

  // 4. 下载音频
  onProgress?.('下载音频文件...', 30)
  let audioBlob: Blob
  try {
    audioBlob = await downloadAudioViaProxy(audioUrl)
  } catch (e) {
    throw new Error('音频下载失败，B站可能有防盗链限制。请尝试手动下载音频后上传。')
  }

  // 5. 上传到临时存储
  onProgress?.('上传音频文件...', 50)
  const tempUrl = await uploadToTempStorage(audioBlob, `${bvid}.m4s`)

  // 6. 提交语音识别任务
  onProgress?.('提交语音识别任务...', 60)
  const taskResponse = await fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/asr/transcription', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-DashScope-Async': 'enable',
    },
    body: JSON.stringify({
      model: 'paraformer-v2',
      input: {
        file_urls: [tempUrl],
      },
      parameters: {
        language_hints: ['zh', 'en'],
      },
    }),
  })

  const taskData = await taskResponse.json()
  if (taskData.code) {
    throw new Error(taskData.message || '提交识别任务失败')
  }

  const taskId = taskData.output.task_id

  // 7. 轮询等待结果
  onProgress?.('语音识别中...', 70)
  const maxWaitTime = 600000 // 最长等待10分钟
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitTime) {
    await new Promise(resolve => setTimeout(resolve, 3000))

    const statusResponse = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    const statusData = await statusResponse.json()
    const status = statusData.output?.task_status

    if (status === 'SUCCEEDED') {
      onProgress?.('获取识别结果...', 90)

      // 获取转录结果
      const resultUrl = statusData.output.results?.[0]?.transcription_url
      if (resultUrl) {
        const resultResponse = await fetch(resultUrl)
        const resultData = await resultResponse.json()

        const transcripts = resultData.transcripts || []
        const text = transcripts.map((t: { text: string }) => t.text).join('\n')

        onProgress?.('识别完成！', 100)

        return {
          title: videoInfo.title,
          author: videoInfo.author,
          text: text || videoInfo.desc,
        }
      }
    }

    if (status === 'FAILED') {
      const errorMsg = statusData.output?.message || '语音识别失败'
      throw new Error(errorMsg)
    }

    // 更新进度
    const elapsed = Date.now() - startTime
    const progress = Math.min(70 + (elapsed / maxWaitTime) * 20, 89)
    onProgress?.('语音识别中...', progress)
  }

  throw new Error('语音识别超时，请稍后重试')
}
