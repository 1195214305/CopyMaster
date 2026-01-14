// B站API服务 - 前端直接调用
// 注意：B站API有CORS限制，需要通过代理或边缘函数调用

export interface VideoInfo {
  title: string
  author: string
  content: string
  desc?: string
}

// 提取BV号
export function extractBvid(url: string): string | null {
  const bvMatch = url.match(/BV[a-zA-Z0-9]+/)
  return bvMatch ? bvMatch[0] : null
}

// 通过公开API获取B站视频信息（使用第三方代理）
export async function fetchBilibiliInfo(bvid: string): Promise<VideoInfo> {
  // 尝试多个代理服务
  const proxyUrls = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`)}`,
    `https://corsproxy.io/?${encodeURIComponent(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`)}`,
  ]

  for (const proxyUrl of proxyUrls) {
    try {
      const response = await fetch(proxyUrl)
      if (!response.ok) continue

      const data = await response.json()
      if (data.code === 0 && data.data) {
        const { title, owner, desc } = data.data
        return {
          title,
          author: owner?.name || '未知作者',
          content: desc || '暂无视频描述',
          desc,
        }
      }
    } catch (e) {
      console.log('代理请求失败，尝试下一个')
    }
  }

  throw new Error('无法获取视频信息，请稍后重试')
}

// 直接从B站页面提取信息（备用方案）
export async function fetchFromBilibiliPage(_bvid: string): Promise<VideoInfo> {
  // 这个方法需要边缘函数支持，因为直接访问B站页面有CORS限制
  throw new Error('需要边缘函数支持')
}

// 其他平台的提示信息
export function getOtherPlatformInfo(platform: string, url: string): VideoInfo {
  const platformNames: Record<string, string> = {
    xiaohongshu: '小红书',
    douyin: '抖音',
    kuaishou: '快手',
    weibo: '微博',
    youtube: 'YouTube',
    tiktok: 'TikTok',
  }

  const name = platformNames[platform] || '该平台'

  return {
    title: `${name}内容`,
    author: `${name}用户`,
    content: `${name}链接: ${url}\n\n由于${name}API限制，暂时无法自动提取文案。\n\n手动提取方法：\n1. 打开${name}App或网页\n2. 找到视频/笔记的文案部分\n3. 长按或点击复制按钮\n4. 粘贴到此处进行AI优化`,
  }
}

// 使用千问API生成摘要
export async function generateSummary(
  content: string,
  apiKey: string
): Promise<{ summary: string; keywords: string[] }> {
  if (!apiKey || content.length < 30) {
    return { summary: '', keywords: [] }
  }

  try {
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一个文案分析助手。请分析用户提供的视频文案，生成简洁的摘要（50字以内）和5个关键词。以JSON格式返回：{"summary": "摘要内容", "keywords": ["关键词1", "关键词2", ...]}'
          },
          {
            role: 'user',
            content: `请分析以下视频文案：\n\n${content.slice(0, 2000)}`
          }
        ],
        max_tokens: 300,
      }),
    })

    const data = await response.json()
    const result = data.choices?.[0]?.message?.content || ''

    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        summary: parsed.summary || '',
        keywords: parsed.keywords || [],
      }
    }
  } catch (e) {
    console.error('AI摘要生成失败:', e)
  }

  return { summary: '', keywords: [] }
}

// 使用千问API优化文案
export async function optimizeContent(
  content: string,
  apiKey: string,
  style: 'formal' | 'casual' | 'marketing' | 'summary' = 'formal'
): Promise<string> {
  const stylePrompts: Record<string, string> = {
    formal: '请将以下文案优化为正式、专业的风格，保持原意但使表达更加规范、清晰：',
    casual: '请将以下文案优化为轻松、口语化的风格，让内容更加亲切易读：',
    marketing: '请将以下文案优化为营销推广风格，突出亮点，增加吸引力和感染力：',
    summary: '请将以下文案精简为简洁的摘要版本，保留核心信息，控制在200字以内：',
  }

  const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'qwen-turbo',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的文案优化助手。请根据用户的要求优化文案，保持原意的同时提升表达质量。直接输出优化后的文案，不要添加额外说明。'
        },
        {
          role: 'user',
          content: `${stylePrompts[style]}\n\n${content.slice(0, 3000)}`
        }
      ],
      max_tokens: 2000,
    }),
  })

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error.message || 'AI服务调用失败')
  }

  return data.choices?.[0]?.message?.content || ''
}
