import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { detectPlatform, getPlatformInfo, generateId } from '../utils'
import { extractBvid, fetchBilibiliInfo, getOtherPlatformInfo, generateSummary } from '../utils/api'
import { transcribeBilibiliVideo } from '../utils/bilibili'

export default function ExtractForm() {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'desc' | 'speech'>('desc')
  const [progress, setProgress] = useState<{ status: string; percent: number } | null>(null)
  const { isLoading, setLoading, setCurrentResult, addHistory, apiKey } = useStore()

  const detectedPlatform = url ? detectPlatform(url) : null
  const platformInfo = detectedPlatform ? getPlatformInfo(detectedPlatform) : null
  const isBilibili = detectedPlatform === 'bilibili'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setProgress(null)

    if (!url.trim()) {
      setError('请输入视频链接')
      return
    }

    if (!detectedPlatform) {
      setError('暂不支持该平台，请输入B站、小红书、抖音等平台链接')
      return
    }

    // 语音识别模式需要API Key
    if (mode === 'speech' && !apiKey) {
      setError('语音识别需要配置千问API Key，请先在设置中配置')
      return
    }

    setLoading(true)

    try {
      let videoInfo: { title: string; author: string; content: string }

      if (mode === 'speech' && isBilibili) {
        // B站语音识别模式
        const result = await transcribeBilibiliVideo(
          url.trim(),
          apiKey,
          (status, percent) => {
            setProgress({ status, percent: percent || 0 })
          }
        )
        videoInfo = {
          title: result.title,
          author: result.author,
          content: result.text,
        }
      } else if (detectedPlatform === 'bilibili') {
        // B站描述提取模式
        const bvid = extractBvid(url.trim())
        if (!bvid) {
          throw new Error('无法解析B站视频链接，请确保链接包含BV号')
        }
        videoInfo = await fetchBilibiliInfo(bvid)
      } else {
        // 其他平台返回提示信息
        videoInfo = getOtherPlatformInfo(detectedPlatform, url.trim())
      }

      // 如果有API Key，生成AI摘要
      let summary = ''
      let keywords: string[] = []

      if (apiKey && videoInfo.content.length > 30) {
        try {
          setProgress({ status: '生成AI摘要...', percent: 95 })
          const aiResult = await generateSummary(videoInfo.content, apiKey)
          summary = aiResult.summary
          keywords = aiResult.keywords
        } catch (e) {
          console.log('AI摘要生成失败')
        }
      }

      const result = {
        id: generateId(),
        platform: detectedPlatform,
        url: url.trim(),
        title: videoInfo.title || '未知标题',
        author: videoInfo.author || '未知作者',
        content: videoInfo.content || '',
        summary,
        keywords,
        timestamp: Date.now(),
      }

      setCurrentResult(result)
      addHistory(result)
      setUrl('')
      setProgress(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '提取失败，请稍后重试')
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="max-w-2xl mx-auto px-4"
    >
      <form onSubmit={handleSubmit} className="relative">
        {/* 输入框容器 */}
        <div className="relative group">
          {/* 发光边框效果 */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyber-accent to-cyber-accent2 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500" />

          <div className="relative bg-cyber-darker rounded-xl border border-cyber-border overflow-hidden">
            {/* 平台检测指示器 */}
            <AnimatePresence>
              {platformInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 py-2 border-b border-cyber-border bg-cyber-muted/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: platformInfo.color, color: '#fff' }}
                      >
                        {platformInfo.icon}
                      </span>
                      <span style={{ color: platformInfo.color }}>
                        检测到 {platformInfo.name} 链接
                      </span>
                    </div>

                    {/* B站模式切换 */}
                    {isBilibili && (
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setMode('desc')}
                          className={`px-2 py-1 rounded transition-colors ${
                            mode === 'desc'
                              ? 'bg-cyber-accent text-cyber-dark'
                              : 'text-gray-500 hover:text-white'
                          }`}
                        >
                          描述
                        </button>
                        <button
                          type="button"
                          onClick={() => setMode('speech')}
                          className={`px-2 py-1 rounded transition-colors ${
                            mode === 'speech'
                              ? 'bg-cyber-accent2 text-white'
                              : 'text-gray-500 hover:text-white'
                          }`}
                        >
                          语音识别
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 语音识别提示 */}
                  {isBilibili && mode === 'speech' && (
                    <p className="mt-2 text-xs text-gray-500">
                      将下载视频音频并进行语音识别，可能需要几分钟
                      {!apiKey && <span className="text-red-400 ml-1">（需要配置API Key）</span>}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 输入区域 */}
            <div className="flex items-center">
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  setError('')
                }}
                placeholder="粘贴视频链接，支持B站、小红书、抖音..."
                className="flex-1 px-4 py-4 bg-transparent text-white placeholder-gray-500 text-sm md:text-base"
                disabled={isLoading}
              />

              <button
                type="submit"
                disabled={isLoading || !url.trim()}
                className={`m-2 px-6 py-3 font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                  mode === 'speech' && isBilibili
                    ? 'bg-cyber-accent2 text-white hover:shadow-lg hover:shadow-cyber-accent2/30'
                    : 'bg-cyber-accent text-cyber-dark hover:shadow-lg hover:shadow-cyber-accent/30'
                }`}
              >
                {isLoading ? (
                  <>
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
                    <span className="hidden md:inline">
                      {mode === 'speech' ? '识别中' : '提取中'}
                    </span>
                  </>
                ) : (
                  <>
                    {mode === 'speech' && isBilibili ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    )}
                    <span className="hidden md:inline">
                      {mode === 'speech' && isBilibili ? '语音识别' : '提取文案'}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* 进度条 */}
            <AnimatePresence>
              {progress && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 py-3 border-t border-cyber-border bg-cyber-muted/30"
                >
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span>{progress.status}</span>
                    <span>{Math.round(progress.percent)}%</span>
                  </div>
                  <div className="h-1 bg-cyber-border rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyber-accent to-cyber-accent2"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.percent}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 错误提示 */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* 使用提示 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center text-gray-500 text-xs"
      >
        <p>支持直接粘贴分享链接或视频页面URL</p>
        <p className="mt-1">
          {isBilibili && mode === 'speech'
            ? 'B站视频将自动下载音频并进行语音识别'
            : '提取的文案可一键复制或下载'}
        </p>
      </motion.div>
    </motion.div>
  )
}
