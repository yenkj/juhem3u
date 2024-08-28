const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

const sources = [
  {
    name: 'feng hua',
    url: 'http://us.199301.xyz:6000/fh.m3u'
  },
  // {
  //   name: '央视频',
  //   url: 'http://us.199301.xyz:6000/ysp.m3u'
  // },
  {
    name: 'itv_hevc',
    url: 'http://us.199301.xyz:6000/itv_hevc.m3u'
  },
//  {
//    name: '四季',
//    url: 'http://us.199301.xyz:6000/4g_proxy.m3u'
//  },
  {
    name: 'xt4g',
    url: 'http://us.199301.xyz:6000/xt4g.m3u'
  },
  {
    name: 'MyTvSuper',
    url: 'http://us.199301.xyz:6000/xtsuper.m3u'
  },
//  {
//    name: 'beesport',
//    url: 'http://us.199301.xyz:6000/b_proxy.m3u'
//  },
//  {
//    name: 'xtb',
//    url: 'http://us.199301.xyz:6000/xtb.m3u'
//  },
//  {
//    name: 'thetv',
//    url: 'http://us.199301.xyz:6000/ttv.m3u'
//  },
  {
    name: '电台',
    url: 'http://us.199301.xyz:6000/radio.m3u'
  }
];

// 获取并聚合 m3u 文件内容
async function fetchAndAggregateM3U() {
  try {
    // 并发获取所有源的内容
    const promises = sources.map(source => axios.get(source.url));
    const responses = await Promise.all(promises);

    // 头部信息
    let aggregatedContent = '#EXTM3U\n#EXTM3U x-tvg-url="https://assets.livednow.com/epg.xml"\n';

    // 处理每个源的响应
    const allChannels = [];

    for (const response of responses) {
      const data = response.data;

      // 使用正则表达式处理并分割数据
      const channels = data
        .split(/^#EXT/gm)  // 按 #EXT 分割
        .map(it => '#EXT' + it.trim())  // 添加 #EXT 前缀并修剪多余的空白
        .filter(it => it.startsWith('#EXTINF'))  // 只保留以 #EXTINF 开头的行
        .filter(it => it.trim() !== '');  // 过滤掉空行

      // 移除每个源内容中的头部信息
      const filteredChannels = channels
        .filter(it => !it.startsWith('#EXTM3U'));  // 移除 #EXTM3U 行

      // 将所有频道合并
      allChannels.push(...filteredChannels);
    }

    // 将所有频道合并成一个字符串，每个频道之间用换行符分隔
    aggregatedContent += allChannels.join('\n\n'); // 用两个换行符分隔每个条目

    // 去除可能的多余换行符
    aggregatedContent = aggregatedContent.trimEnd();
    
    return aggregatedContent;
  } catch (error) {
    console.error('Error fetching M3U files:', error);
    return 'Error fetching sources';
  }
}

// 渲染 HTML 页面显示内容
app.get('/', async (req, res) => {
  // 获取并聚合 M3U 内容
  let aggregatedContent = await fetchAndAggregateM3U();
  
  // 修剪头部和尾部空白
  aggregatedContent = aggregatedContent.trim();
  
  // 生成不带标题的 HTML 内容
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>M3U Aggregated Content</title>
      <style>
        body {
          font-family: monospace;
          white-space: pre; /* 保持文本的格式 */
          margin: 0; /* 去掉页面边距 */
        }
      </style>
    </head>
    <body>
      <pre>${aggregatedContent}</pre>
    </body>
    </html>
  `;

  // 设置响应标头以 TXT 文件形式显示
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', 'inline; filename="4gtv.txt"');

  // 发送 HTML 内容作为响应
  res.send(aggregatedContent);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
