interface Env {
  KV_NAMESPACE?: KVNamespace
}

interface ExtractRequest {
  url: string
  platform: string
  apiKey?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// B站视频信息提取
async function extractBilibili(url: string): Promise<{ title: string; author: string; content: string }> {
  // 提取BV号
  const bvMatch = url.match(/BV[a-zA-Z0-9]+/)
  if (!bvMatch) {
    throw new Error('无法解析B站视频链接')
  }
  const bvid = bvMatch[0]

  // 获取视频信息
  const infoRes = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://www.bilibili.com',
    }
  })
  const infoData = await infoRes.json()

  if (infoData.code !== 0) {
    throw new Error('获取视频信息失败')
  }

  const { title, owner, desc, cid, aid } = infoData.data

  // 尝试获取字幕
  let subtitleContent = ''
  try {
    const subtitleRes = await fetch(
      `https://api.bilibili.com/x/player/v2?aid=${aid}&cid=${cid}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.bilibili.com',
        }
      }
    )
    const subtitleData = await subtitleRes.json()

    if (subtitleData.data?.subtitle?.subtitles?.length > 0) {
      const subtitleUrl = subtitleData.data.subtitle.subtitles[0].subtitle_url
      if (subtitleUrl) {
        const fullUrl = subtitleUrl.startsWith('//') ? `https:${subtitleUrl}` : subtitleUrl
        const subRes = await fetch(fullUrl)
        const subData = await subRes.json()

        if (subData.body) {
          subtitleContent = subData.body.map((item: { content: string }) => item.content).join('\n')
        }
      }
    }
  } catch (e) {
    console.log('字幕获取失败，使用视频描述')
  }

  return {
    title,
    author: owner.name,
    content: subtitleContent || desc || '暂无文案内容',
  }
}

// 小红书笔记提取（模拟）
async function extractXiaohongshu(url: string): Promise<{ title: string; author: string; content: string }> {
  // 小红书API较为封闭，这里返回提示信息
  // 实际生产中可以使用爬虫或第三方API
  return {
    title: '小红书笔记',
    author: '小红书用户',
    content: `小红书链接: ${url}\n\n由于小红书API限制，请手动复制笔记内容，或使用浏览器插件提取。\n\n提示：您可以在小红书App中长按文字复制，或使用分享功能获取文案。`,
  }
}

// 抖音视频提取（模拟）
async function extractDouyin(url: string): Promise<{ title: string; author: string; content: string }> {
  return {
    title: '抖音视频',
    author: '抖音用户',
    content: `抖音链接: ${url}\n\n由于抖音API限制，请手动复制视频文案。\n\n提示：在抖音App中点击分享 -> 复制链接，可获取视频描述文案。`,
  }
}

// 快手视频提取（模拟）
async function extractKuaishou(url: string): Promise<{ title: string; author: string; content: string }> {
  return {
    title: '快手视频',
    author: '快手用户',
    content: `快手链接: ${url}\n\n由于快手API限制，请手动复制视频文案。`,
  }
}

// 微博提取（模拟）
async function extractWeibo(url: string): Promise<{ title: string; author: string; content: string }> {
  return {
    title: '微博内容',
    author: '微博用户',
    content: `微博链接: ${url}\n\n由于微博API限制，请手动复制微博内容。`,
  }
}

// YouTube提取（模拟）
async function extractYoutube(url: string): Promise<{ title: string; author: string; content: string }> {
  return {
    title: 'YouTube视频',
    author: 'YouTube用户',
    content: `YouTube链接: ${url}\n\n由于YouTube API限制，请使用YouTube官方字幕功能获取文案。`,
  }
}

// 使用千问AI生成摘要和关键词
async function generateSummary(content: string, apiKey: string): Promise<{ summary: string; keywords: string[] }> {
  if (!apiKey || content.length < 50) {
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

    // 尝试解析JSON
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

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: '仅支持POST请求' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body: ExtractRequest = await request.json()
    const { url, platform, apiKey } = body

    if (!url || !platform) {
      return new Response(JSON.stringify({ error: '缺少必要参数' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 检查边缘缓存
    const cache = caches.default
    const cacheKey = new Request(`https://cache/extract/${encodeURIComponent(url)}`)
    const cached = await cache.match(cacheKey)

    if (cached) {
      const cachedData = await cached.json()
      return new Response(JSON.stringify({ ...cachedData, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
      })
    }

    // 根据平台提取内容
    let result: { title: string; author: string; content: string }

    switch (platform) {
      case 'bilibili':
        result = await extractBilibili(url)
        break
      case 'xiaohongshu':
        result = await extractXiaohongshu(url)
        break
      case 'douyin':
        result = await extractDouyin(url)
        break
      case 'kuaishou':
        result = await extractKuaishou(url)
        break
      case 'weibo':
        result = await extractWeibo(url)
        break
      case 'youtube':
        result = await extractYoutube(url)
        break
      default:
        return new Response(JSON.stringify({ error: '不支持的平台' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    // 使用AI生成摘要（如果提供了API Key）
    let summary = ''
    let keywords: string[] = []

    if (apiKey && result.content.length > 50) {
      const aiResult = await generateSummary(result.content, apiKey)
      summary = aiResult.summary
      keywords = aiResult.keywords
    }

    const responseData = {
      ...result,
      summary,
      keywords,
    }

    // 缓存结果（1小时）
    const cacheResponse = new Response(JSON.stringify(responseData), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=3600' },
    })
    await cache.put(cacheKey, cacheResponse.clone())

    // 存储到KV（如果可用）
    if (env.KV_NAMESPACE) {
      await env.KV_NAMESPACE.put(
        `extract:${encodeURIComponent(url)}`,
        JSON.stringify(responseData),
        { expirationTtl: 86400 }
      )
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    })
  } catch (error) {
    console.error('提取失败:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : '提取失败' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

export default { onRequest }
