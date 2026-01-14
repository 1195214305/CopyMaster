interface Env {
  KV_NAMESPACE?: KVNamespace
}

interface OptimizeRequest {
  content: string
  apiKey: string
  style?: 'formal' | 'casual' | 'marketing' | 'summary'
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
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
    const body: OptimizeRequest = await request.json()
    const { content, apiKey, style = 'formal' } = body

    if (!content || !apiKey) {
      return new Response(JSON.stringify({ error: '缺少必要参数' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 根据风格选择提示词
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

    const optimized = data.choices?.[0]?.message?.content || ''

    if (!optimized) {
      throw new Error('优化结果为空')
    }

    return new Response(JSON.stringify({ optimized }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('优化失败:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : '优化失败' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

export default { onRequest }
