import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { getPlatformInfo, copyToClipboard, downloadAsFile } from '../utils'

export default function ResultPanel() {
  const { currentResult, setCurrentResult, apiKey } = useStore()
  const [copied, setCopied] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [optimizedContent, setOptimizedContent] = useState('')

  if (!currentResult) return null

  const platformInfo = getPlatformInfo(currentResult.platform)

  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    const content = `标题：${currentResult.title}
作者：${currentResult.author}
平台：${platformInfo.name}
链接：${currentResult.url}

---文案内容---

${currentResult.content}

${currentResult.summary ? `\n---AI摘要---\n\n${currentResult.summary}` : ''}
${currentResult.keywords?.length ? `\n---关键词---\n\n${currentResult.keywords.join('、')}` : ''}
${optimizedContent ? `\n---AI优化版本---\n\n${optimizedContent}` : ''}

---
由 CopyMaster 提取
`
    downloadAsFile(content, `${currentResult.title || '文案'}.txt`)
  }

  const handleOptimize = async () => {
    if (!apiKey) {
      alert('请先在设置中配置千问API Key')
      return
    }

    setOptimizing(true)
    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: currentResult.content,
          apiKey,
        }),
      })

      const data = await response.json()
      if (data.optimized) {
        setOptimizedContent(data.optimized)
      }
    } catch (err) {
      console.error('优化失败:', err)
    } finally {
      setOptimizing(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="max-w-3xl mx-auto px-4 mt-8"
      >
        <div className="relative">
          {/* 发光边框 */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyber-accent/30 to-cyber-accent2/30 rounded-xl blur" />

          <div className="relative bg-cyber-darker rounded-xl border border-cyber-border overflow-hidden">
            {/* 头部信息 */}
            <div className="px-4 py-3 border-b border-cyber-border bg-cyber-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: platformInfo.color, color: '#fff' }}
                >
                  {platformInfo.icon}
                </span>
                <div>
                  <h3 className="text-white font-medium text-sm line-clamp-1">
                    {currentResult.title}
                  </h3>
                  <p className="text-gray-500 text-xs">
                    @{currentResult.author}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCurrentResult(null)}
                className="p-2 text-gray-500 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 文案内容 */}
            <div className="p-4">
              <div className="bg-cyber-dark rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                  {currentResult.content}
                </pre>
              </div>

              {/* AI摘要 */}
              {currentResult.summary && (
                <div className="mt-4">
                  <h4 className="text-cyber-accent text-xs font-semibold mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI 摘要
                  </h4>
                  <p className="text-gray-400 text-sm bg-cyber-muted/50 rounded-lg p-3">
                    {currentResult.summary}
                  </p>
                </div>
              )}

              {/* 关键词 */}
              {currentResult.keywords && currentResult.keywords.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-cyber-accent2 text-xs font-semibold mb-2">关键词</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentResult.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-cyber-accent2/10 text-cyber-accent2 rounded border border-cyber-accent2/30"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI优化内容 */}
              {optimizedContent && (
                <div className="mt-4">
                  <h4 className="text-green-400 text-xs font-semibold mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI 优化版本
                  </h4>
                  <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                    <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                      {optimizedContent}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="px-4 py-3 border-t border-cyber-border bg-cyber-muted/30 flex flex-wrap gap-2">
              <button
                onClick={() => handleCopy(optimizedContent || currentResult.content)}
                className="flex-1 min-w-[100px] px-4 py-2 bg-cyber-accent text-cyber-dark font-medium rounded-lg text-sm transition-all hover:shadow-lg hover:shadow-cyber-accent/30 flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    已复制
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    复制文案
                  </>
                )}
              </button>

              <button
                onClick={handleDownload}
                className="flex-1 min-w-[100px] px-4 py-2 bg-cyber-muted border border-cyber-border text-white font-medium rounded-lg text-sm transition-all hover:bg-cyber-border flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                下载
              </button>

              <button
                onClick={handleOptimize}
                disabled={optimizing || !apiKey}
                className="flex-1 min-w-[100px] px-4 py-2 bg-cyber-accent2/20 border border-cyber-accent2/50 text-cyber-accent2 font-medium rounded-lg text-sm transition-all hover:bg-cyber-accent2/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {optimizing ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    优化中
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI优化
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
