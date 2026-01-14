export function detectPlatform(url: string): string | null {
  const patterns: Record<string, RegExp[]> = {
    bilibili: [
      /bilibili\.com\/video\//,
      /b23\.tv\//,
      /bilibili\.com\/BV/
    ],
    xiaohongshu: [
      /xiaohongshu\.com/,
      /xhslink\.com/,
      /小红书/
    ],
    douyin: [
      /douyin\.com/,
      /v\.douyin\.com/,
      /抖音/
    ],
    kuaishou: [
      /kuaishou\.com/,
      /v\.kuaishou\.com/,
      /快手/
    ],
    weibo: [
      /weibo\.com/,
      /weibo\.cn/,
      /微博/
    ],
    youtube: [
      /youtube\.com/,
      /youtu\.be/
    ],
    tiktok: [
      /tiktok\.com/,
      /vm\.tiktok\.com/
    ]
  }

  for (const [platform, regexList] of Object.entries(patterns)) {
    for (const regex of regexList) {
      if (regex.test(url)) {
        return platform
      }
    }
  }
  return null
}

export function getPlatformInfo(platform: string): { name: string; color: string; icon: string } {
  const info: Record<string, { name: string; color: string; icon: string }> = {
    bilibili: { name: 'B站', color: '#00a1d6', icon: 'B' },
    xiaohongshu: { name: '小红书', color: '#fe2c55', icon: 'R' },
    douyin: { name: '抖音', color: '#000000', icon: 'D' },
    kuaishou: { name: '快手', color: '#ff4906', icon: 'K' },
    weibo: { name: '微博', color: '#e6162d', icon: 'W' },
    youtube: { name: 'YouTube', color: '#ff0000', icon: 'Y' },
    tiktok: { name: 'TikTok', color: '#000000', icon: 'T' }
  }
  return info[platform] || { name: '未知', color: '#666', icon: '?' }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`

  return date.toLocaleDateString('zh-CN')
}

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard.writeText(text)
    .then(() => true)
    .catch(() => false)
}

export function downloadAsFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
