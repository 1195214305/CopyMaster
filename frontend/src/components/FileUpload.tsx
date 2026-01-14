import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { generateId } from '../utils'
import {
  submitTranscriptionTask,
  waitForTranscription,
  isSupportedAudioFormat,
} from '../utils/transcription'

export default function FileUpload() {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { apiKey, setCurrentResult, addHistory } = useStore()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleFileSelect = (selectedFile: File) => {
    setError('')

    if (!isSupportedAudioFormat(selectedFile)) {
      setError('不支持的文件格式，请上传 MP3、WAV、M4A、MP4 等格式')
      return
    }

    if (selectedFile.size > 500 * 1024 * 1024) {
      setError('文件过大，最大支持 500MB')
      return
    }

    setFile(selectedFile)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleTranscribe = async () => {
    if (!file || !apiKey) {
      if (!apiKey) {
        setError('请先在设置中配置千问API Key')
      }
      return
    }

    setStatus('uploading')
    setProgress('准备上传文件...')
    setError('')

    try {
      // 由于阿里云API需要公开URL，我们需要先上传文件
      // 这里使用一个临时方案：将文件转为base64，但这只适用于小文件
      // 对于大文件，需要先上传到OSS

      // 检查文件大小，如果太大则提示
      if (file.size > 25 * 1024 * 1024) {
        setError('文件过大（>25MB），请使用较短的音频文件，或联系管理员配置OSS存储')
        setStatus('error')
        return
      }

      setProgress('正在上传文件...')

      // 使用免费的文件托管服务（临时方案）
      // 实际生产中应该使用OSS
      const formData = new FormData()
      formData.append('file', file)

      // 尝试使用 file.io 临时托管
      const uploadResponse = await fetch('https://file.io', {
        method: 'POST',
        body: formData,
      })

      const uploadData = await uploadResponse.json()

      if (!uploadData.success || !uploadData.link) {
        throw new Error('文件上传失败，请稍后重试')
      }

      const fileUrl = uploadData.link
      setProgress('文件上传成功，开始语音识别...')
      setStatus('processing')

      // 提交语音识别任务
      const taskId = await submitTranscriptionTask(fileUrl, apiKey)
      setProgress('任务已提交，正在识别中...')

      // 等待识别完成
      const result = await waitForTranscription(taskId, apiKey, (taskStatus) => {
        if (taskStatus === 'PENDING') {
          setProgress('排队中...')
        } else if (taskStatus === 'RUNNING') {
          setProgress('正在识别语音...')
        }
      })

      setStatus('done')
      setProgress('识别完成！')

      // 保存结果
      const extractResult = {
        id: generateId(),
        platform: 'upload',
        url: file.name,
        title: file.name.replace(/\.[^/.]+$/, ''),
        author: '本地文件',
        content: result.text,
        summary: '',
        keywords: [],
        timestamp: Date.now(),
      }

      setCurrentResult(extractResult)
      addHistory(extractResult)

      // 重置状态
      setTimeout(() => {
        setFile(null)
        setStatus('idle')
        setProgress('')
      }, 2000)

    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : '识别失败，请稍后重试')
    }
  }

  const handleCancel = () => {
    setFile(null)
    setStatus('idle')
    setProgress('')
    setError('')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="max-w-2xl mx-auto px-4 mt-8"
    >
      <div className="text-center mb-4">
        <h3 className="text-sm font-medium text-gray-400">或者上传音频/视频文件</h3>
      </div>

      {/* 上传区域 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-cyber-accent bg-cyber-accent/5'
            : file
            ? 'border-cyber-border bg-cyber-darker'
            : 'border-cyber-border hover:border-cyber-accent/50 bg-cyber-darker/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,video/*,.mp3,.wav,.m4a,.mp4,.webm,.ogg,.flac"
          onChange={handleInputChange}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <svg
                className="w-12 h-12 mx-auto mb-4 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-gray-400 text-sm">
                拖拽文件到这里，或点击选择文件
              </p>
              <p className="text-gray-600 text-xs mt-2">
                支持 MP3、WAV、M4A、MP4 等格式，最大 25MB
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="file"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-center gap-3">
                <svg
                  className="w-8 h-8 text-cyber-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
                <div className="text-left">
                  <p className="text-white text-sm font-medium truncate max-w-[200px]">
                    {file.name}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              {/* 进度显示 */}
              {status !== 'idle' && (
                <div className="text-center">
                  {status === 'processing' && (
                    <div className="flex items-center justify-center gap-2 text-cyber-accent">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span className="text-sm">{progress}</span>
                    </div>
                  )}
                  {status === 'done' && (
                    <div className="flex items-center justify-center gap-2 text-green-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">{progress}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 操作按钮 */}
              {status === 'idle' && (
                <div className="flex justify-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCancel()
                    }}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTranscribe()
                    }}
                    disabled={!apiKey}
                    className="px-6 py-2 bg-cyber-accent text-cyber-dark font-medium rounded-lg text-sm transition-all hover:shadow-lg hover:shadow-cyber-accent/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    开始识别
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 错误提示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* API Key 提示 */}
      {!apiKey && (
        <p className="mt-3 text-center text-gray-600 text-xs">
          需要配置千问API Key才能使用语音识别功能
        </p>
      )}
    </motion.div>
  )
}
