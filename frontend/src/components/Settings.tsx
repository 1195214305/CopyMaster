import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'

export default function Settings() {
  const { showSettings, setShowSettings, apiKey, setApiKey } = useStore()
  const [tempKey, setTempKey] = useState(apiKey)
  const [showKey, setShowKey] = useState(false)

  const handleSave = () => {
    setApiKey(tempKey)
    setShowSettings(false)
  }

  return (
    <AnimatePresence>
      {showSettings && (
        <>
          {/* 遮罩层 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSettings(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* 设置面板 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50"
          >
            <div className="relative">
              {/* 发光边框 */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyber-accent to-cyber-accent2 rounded-xl blur opacity-30" />

              <div className="relative bg-cyber-darker rounded-xl border border-cyber-border overflow-hidden">
                {/* 头部 */}
                <div className="px-4 py-3 border-b border-cyber-border bg-cyber-muted/30 flex items-center justify-between">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 text-cyber-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    设置
                  </h2>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-1 text-gray-500 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* 内容 */}
                <div className="p-4 space-y-4">
                  {/* 千问API Key */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      通义千问 API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={tempKey}
                        onChange={(e) => setTempKey(e.target.value)}
                        placeholder="sk-xxxxxxxxxxxxxxxx"
                        className="w-full px-4 py-3 bg-cyber-dark border border-cyber-border rounded-lg text-white placeholder-gray-600 text-sm pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                      >
                        {showKey ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-600">
                      配置后可使用AI摘要和文案优化功能
                    </p>
                  </div>

                  {/* 获取API Key说明 */}
                  <div className="bg-cyber-muted/50 rounded-lg p-3">
                    <h4 className="text-cyber-accent text-xs font-semibold mb-2">如何获取 API Key？</h4>
                    <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
                      <li>访问阿里云百炼平台</li>
                      <li>注册/登录账号</li>
                      <li>在控制台创建 API Key</li>
                      <li>复制 Key 粘贴到上方输入框</li>
                    </ol>
                    <a
                      href="https://bailian.console.aliyun.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-cyber-accent hover:underline"
                    >
                      前往百炼平台
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  {/* 状态指示 */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`w-2 h-2 rounded-full ${apiKey ? 'bg-cyber-accent' : 'bg-gray-600'}`} />
                    <span className={apiKey ? 'text-cyber-accent' : 'text-gray-500'}>
                      {apiKey ? 'API Key 已配置' : 'API Key 未配置'}
                    </span>
                  </div>
                </div>

                {/* 底部按钮 */}
                <div className="px-4 py-3 border-t border-cyber-border bg-cyber-muted/30 flex gap-2">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="flex-1 px-4 py-2 bg-cyber-muted border border-cyber-border text-white font-medium rounded-lg text-sm transition-all hover:bg-cyber-border"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 bg-cyber-accent text-cyber-dark font-medium rounded-lg text-sm transition-all hover:shadow-lg hover:shadow-cyber-accent/30"
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
