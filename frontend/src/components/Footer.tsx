export default function Footer() {
  return (
    <footer className="mt-16 pb-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ESA 声明 */}
        <div className="text-center mb-6">
          <p className="text-gray-500 text-xs mb-3">
            本项目由
            <a
              href="https://www.aliyun.com/product/esa"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyber-accent hover:underline mx-1"
            >
              阿里云ESA
            </a>
            提供加速、计算和保护
          </p>
          <img
            src="https://img.alicdn.com/imgextra/i3/O1CN01H1UU3i1Cti9lYtFrs_!!6000000000139-2-tps-7534-844.png"
            alt="阿里云ESA"
            className="h-8 mx-auto opacity-60 hover:opacity-100 transition-opacity"
          />
        </div>

        {/* 分隔线 */}
        <div className="border-t border-cyber-border pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <span>CopyMaster v1.0</span>
              <span className="hidden md:inline">|</span>
              <span>视频文案提取神器</span>
            </div>

            <div className="flex items-center gap-4">
              <span>支持 B站 / 小红书 / 抖音 / 快手 / 微博</span>
            </div>
          </div>
        </div>

        {/* 技术栈 */}
        <div className="mt-4 text-center">
          <p className="text-gray-700 text-xs">
            Powered by ESA Edge Functions + 通义千问 AI
          </p>
        </div>
      </div>
    </footer>
  )
}
