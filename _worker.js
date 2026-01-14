export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // 路由处理
    if (url.pathname === '/api/extract' && request.method === 'POST') {
      return handleExtract(request, corsHeaders)
    }

    if (url.pathname === '/api/optimize' && request.method === 'POST') {
      return handleOptimize(request, corsHeaders)
    }

    // 其他请求返回静态资源（由ESA处理）
    return env.ASSETS.fetch(request)
  }
}

async function handleExtract(request, corsHeaders) {
  try {
    const body = await request.json()
    const { url, platform, apiKey } = body

    if (!url || !platform) {
      return new Response(JSON.stringify({ error: '缺少必要参数' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let result
    if (platform === 'bilibili') {
      result = await extractBilibili(url)
    } else {
      result = extractOther(platform, url)
    }

    let summary = ''
    let keywords = []

    if (apiKey && result.content.length > 50) {
      const aiResult = await generateSummary(result.content, apiKey)
      summary = aiResult.summary
      keywords = aiResult.keywords
    }

    return new Response(JSON.stringify({ ...result, summary, keywords }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || '提取失败' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

async function handleOptimize(request, corsHeaders) {
  try {
    const body = await request.json()
    const { content, apiKey, style = 'formal' } = body

    if (!content || !apiKey) {
      return new Response(JSON.stringify({ error: '缺少必要参数' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const stylePrompts = {
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
          { role: 'system', content: '你是一个专业的文案优化助手。直接输出优化后的文案，不要添加额外说明。' },
          { role: 'user', content: `${stylePrompts[style]}\n\n${content.slice(0, 3000)}` }
        ],
        max_tokens: 2000,
      }),
    })

    const data = await response.json()
    const optimized = data.choices?.[0]?.message?.content || ''

    return new Response(JSON.stringify({ optimized }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || '优化失败' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

async function extractBilibili(url) {
  const bvMatch = url.match(/BV[a-zA-Z0-9]+/)
  if (!bvMatch) throw new Error('无法解析B站视频链接')

  const bvid = bvMatch[0]
  const infoRes = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://www.bilibili.com',
    }
  })
  const infoData = await infoRes.json()

  if (infoData.code !== 0) throw new Error('获取视频信息失败')

  const { title, owner, desc, cid, aid } = infoData.data

  let subtitleContent = ''
  try {
    const subtitleRes = await fetch(`https://api.bilibili.com/x/player/v2?aid=${aid}&cid=${cid}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.bilibili.com',
      }
    })
    const subtitleData = await subtitleRes.json()

    if (subtitleData.data?.subtitle?.subtitles?.length > 0) {
      const subtitleUrl = subtitleData.data.subtitle.subtitles[0].subtitle_url
      if (subtitleUrl) {
        const fullUrl = subtitleUrl.startsWith('//') ? `https:${subtitleUrl}` : subtitleUrl
        const subRes = await fetch(fullUrl)
        const subData = await subRes.json()
        if (subData.body) {
          subtitleContent = subData.body.map(item => item.content).join('\n')
        }
      }
    }
  } catch (e) {
    console.log('字幕获取失败')
  }

  return {
    title,
    author: owner.name,
    content: subtitleContent || desc || '暂无文案内容',
  }
}

function extractOther(platform, url) {
  const names = {
    xiaohongshu: '小红书', douyin: '抖音', kuaishou: '快手',
    weibo: '微博', youtube: 'YouTube',
  }
  const name = names[platform] || '该平台'
  return {
    title: `${name}内容`,
    author: `${name}用户`,
    content: `${name}链接: ${url}\n\n由于${name}API限制，请手动复制内容。`,
  }
}

async function generateSummary(content, apiKey) {
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
          { role: 'system', content: '分析文案，返回JSON：{"summary": "50字摘要", "keywords": ["关键词1", ...]}' },
          { role: 'user', content: content.slice(0, 2000) }
        ],
        max_tokens: 300,
      }),
    })
    const data = await response.json()
    const result = data.choices?.[0]?.message?.content || ''
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return { summary: parsed.summary || '', keywords: parsed.keywords || [] }
    }
  } catch (e) {}
  return { summary: '', keywords: [] }
}
