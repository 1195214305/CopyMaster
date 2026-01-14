const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

async function extractBilibili(url) {
  const bvMatch = url.match(/BV[a-zA-Z0-9]+/)
  if (!bvMatch) {
    throw new Error('无法解析B站视频链接')
  }
  const bvid = bvMatch[0]

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
          subtitleContent = subData.body.map((item) => item.content).join('\n')
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

function extractOther(platform, url) {
  const messages = {
    xiaohongshu: '小红书',
    douyin: '抖音',
    kuaishou: '快手',
    weibo: '微博',
    youtube: 'YouTube',
  }
  const name = messages[platform] || '该平台'
  return {
    title: `${name}内容`,
    author: `${name}用户`,
    content: `${name}链接: ${url}\n\n由于${name}API限制，请手动复制内容。`,
  }
}

async function generateSummary(content, apiKey) {
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

export async function onRequest(context) {
  const { request } = context

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

    const responseData = {
      ...result,
      summary,
      keywords,
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('提取失败:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : '提取失败' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}
