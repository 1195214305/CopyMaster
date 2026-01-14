import { motion, AnimatePresence } from 'framer-motion'
import { useStore, ExtractResult } from '../store'
import { getPlatformInfo, formatTime, copyToClipboard } from '../utils'
import { useState } from 'react'

export default function History() {
  const { history, removeHistory, clearHistory, setCurrentResult } = useStore()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  if (history.length === 0) return null

  const handleCopy = async (result: ExtractResult) => {
    const success = await copyToClipboard(result.content)
    if (success) {
      setCopiedId(result.id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="max-w-3xl mx-auto px-4 mt-12"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-cyber-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          提取历史
        </h2>
        <button
          onClick={clearHistory}
          className="text-xs text-gray-500 hover:text-red-400 transition-colors"
        >
          清空历史
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {history.map((item, index) => {
            const platformInfo = getPlatformInfo(item.platform)
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-cyber-darker rounded-lg border border-cyber-border hover:border-cyber-accent/30 transition-all duration-300 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* 平台图标 */}
                    <span
                      className="w-8 h-8 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: platformInfo.color, color: '#fff' }}
                    >
                      {platformInfo.icon}
                    </span>

                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white text-sm font-medium truncate">
                          {item.title}
                        </h3>
                        <span className="text-gray-600 text-xs flex-shrink-0">
                          {formatTime(item.timestamp)}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs line-clamp-2">
                        {item.content}
                      </p>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setCurrentResult(item)}
                        className="p-2 text-gray-500 hover:text-cyber-accent transition-colors"
                        title="查看详情"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleCopy(item)}
                        className="p-2 text-gray-500 hover:text-cyber-accent transition-colors"
                        title="复制文案"
                      >
                        {copiedId === item.id ? (
                          <svg className="w-4 h-4 text-cyber-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => removeHistory(item.id)}
                        className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                        title="删除"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
