import { motion } from 'framer-motion'

export default function Header() {
  return (
    <header className="relative py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-4"
        >
          {/* Logo */}
          <div className="relative">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-cyber-muted border border-cyber-border flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-12 h-12 md:w-14 md:h-14">
                <path
                  d="M25 35 L45 50 L25 65"
                  fill="none"
                  stroke="#00ff88"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="55"
                  y1="65"
                  x2="75"
                  y2="65"
                  stroke="#ff6b35"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="absolute -inset-1 bg-gradient-to-r from-cyber-accent to-cyber-accent2 rounded-lg blur opacity-30 -z-10" />
          </div>

          {/* Title */}
          <div className="text-left">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              <span className="text-cyber-accent">Copy</span>
              <span className="text-cyber-accent2">Master</span>
            </h1>
            <p className="text-sm md:text-base text-gray-500 mt-1 font-normal">
              视频文案提取神器
            </p>
          </div>
        </motion.div>

        {/* 支持平台展示 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          {[
            { name: 'B站', color: '#00a1d6' },
            { name: '小红书', color: '#fe2c55' },
            { name: '抖音', color: '#161823' },
            { name: '快手', color: '#ff4906' },
            { name: '微博', color: '#e6162d' },
            { name: 'YouTube', color: '#ff0000' },
          ].map((platform, index) => (
            <motion.span
              key={platform.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="px-3 py-1 text-xs rounded-full border transition-all duration-300 hover:scale-105"
              style={{
                borderColor: platform.color,
                color: platform.color,
              }}
            >
              {platform.name}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </header>
  )
}
