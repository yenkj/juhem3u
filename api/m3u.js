import { NextResponse } from '@vercel/edge';
import axios from 'axios';

export const config = { runtime: 'edge' };

// 定义 M3U 源列表
const sources = [
  { name: 'feng hua', url: 'http://us.199301.xyz:6000/fh.m3u' },
  { name: 'yst4', url: 'http://us.199301.xyz:6000/yst4.m3u' },
  { name: 'xt4g', url: 'http://us.199301.xyz:6000/xt4g.m3u' },
  { name: 'xthami', url: 'http://us.199301.xyz:6000/xthami.m3u' },
  { name: 'thetv', url: 'http://us.199301.xyz:6000/xtttv.m3u' },
  { name: '4K8K', url: 'http://us.199301.xyz:6000/4K8K.m3u' },
  { name: '电台', url: 'http://us.199301.xyz:6000/radio.m3u' }
];

// 获取并聚合 M3U 文件内容
async function fetchAndAggregateM3U() {
  try {
    // 5 秒超时，防止服务器长时间无响应
    const promises = sources.map(source =>
      axios.get(source.url, { timeout: 5000 })
        .then(response => response.data)
        .catch(error => {
          console.error(`⚠️ 获取 ${source.name} 失败:`, error.message);
          return ''; // 失败的请求返回空字符串，防止影响整体结果
        })
    );

    // 等待所有请求完成（即使有部分失败）
    const responses = await Promise.allSettled(promises);

    // 头部信息
    let aggregatedContent = '#EXTM3U\n#EXTM3U x-tvg-url="https://assets.livednow.com/epg.xml"\n';

    // 处理 M3U 内容
    responses.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        aggregatedContent += `\n# --- 来源: ${sources[index].name} ---\n${result.value.trim()}\n`;
      }
    });

    return aggregatedContent.trim();
  } catch (error) {
    console.error('❌ 处理 M3U 失败:', error);
    return '#EXTM3U\n#ERROR fetching sources';
  }
}

// Edge Function 入口
export default async function handler() {
  // 获取 M3U 内容
  const aggregatedContent = await fetchAndAggregateM3U();

  // 返回 TXT 格式的内容
  return new NextResponse(aggregatedContent, {
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': 'inline; filename="4gtv.m3u"'
    }
  });
}
