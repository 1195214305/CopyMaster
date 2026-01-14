import Header from './components/Header'
import ExtractForm from './components/ExtractForm'
import ResultPanel from './components/ResultPanel'
import History from './components/History'
import Settings from './components/Settings'
import Footer from './components/Footer'
import { useStore } from './store'

export default function App() {
  const { setShowSettings, apiKey } = useStore()

  return (
    <div className="min-h-screen grid-bg relative">
      {/* 背景装饰 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* 左上角光晕 */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-cyber-accent/5 rounded-full blur-3xl" />
        {/* 右下角光晕 */}
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-cyber-accent2/5 rounded-full blur-3xl" />
      </div>

      {/* 设置按钮 */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed top-4 right-4 z-30 p-3 bg-cyber-darker border border-cyber-border rounded-lg text-gray-500 hover:text-cyber-accent hover:border-cyber-accent/50 transition-all group"
        title="设置"
      >
        <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {/* API状态指示点 */}
        <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${apiKey ? 'bg-cyber-accent' : 'bg-gray-600'}`} />
      </button>

      {/* 主内容 */}
      <main className="relative z-10">
        <Header />
        <ExtractForm />
        <ResultPanel />
        <History />
        <Footer />
      </main>

      {/* 设置弹窗 */}
      <Settings />
    </div>
  )
}
