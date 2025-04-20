const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

const sources = [
    { name: 'feng hua', url: 'http://us.199301.xyz:6000/fh.m3u' },
//    { name: 'yst4', url: 'http://us.199301.xyz:6000/yst4.m3u' },
//    { name: 'fhrp', url: 'http://us.199301.xyz:6000/fhrp.m3u' },
    { name: 'bptv', url: 'http://us.199301.xyz:6000/xtsx.m3u' },
    { name: 'bptv', url: 'http://us.199301.xyz:6000/bptv.m3u' },
//    { name: 'itv', url: 'http://us.199301.xyz:6000/itv_hevc2.m3u' },
//    { name: 'xtbestzb', url: 'http://us.199301.xyz:6000/xtbestzb.m3u' },
//    { name: '四季', url: 'http://us.199301.xyz:6000/4g_proxy.m3u' },
    { name: 'xt4g', url: 'http://us.199301.xyz:6000/xt4g.m3u' },
    { name: 'xt4g', url: 'http://us.199301.xyz:6000/xthk.m3u' },
//    { name: 'xthami', url: 'http://us.199301.xyz:6000/xthami.m3u' },
    { name: 'thetv', url: 'http://us.199301.xyz:6000/xtttv.m3u' },
    { name: '4K8K', url: 'http://us.199301.xyz:6000/4K8K.m3u' },
    { name: '电台', url: 'http://us.199301.xyz:6000/radio.m3u' }
];

// 获取并聚合 M3U 文件内容
async function fetchAndAggregateM3U() {
    try {
        // 发送所有请求，使用 `Promise.allSettled` 避免请求失败导致全部崩溃
        const promises = sources.map(source =>
            axios.get(source.url, { timeout: 5000 }) // 设置 5 秒超时
                .then(response => ({ name: source.name, data: response.data }))
                .catch(error => {
                    console.error(`⚠️ ${source.name} 获取失败:`, error.message);
                    return null; // 失败时返回 null
                })
        );
        const results = await Promise.allSettled(promises);

        // 头部信息
        let aggregatedContent = '#EXTM3U\n#EXTM3U x-tvg-url="https://assets.livednow.com/epg.xml"\n';

        // 处理成功的 M3U 数据
        const allChannels = [];
        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value && result.value.data) {
                const data = result.value.data;

                // 解析 M3U 数据
                const channels = data.split(/^#EXT/gm)
                    .map(it => '#EXT' + it.trim())  // 还原 #EXT 前缀
                    .filter(it => it.startsWith('#EXTINF')) // 只保留 #EXTINF 数据
                    .filter(it => it.trim() !== '');

                allChannels.push(...channels);
            }
        });

        // 组合 M3U 数据
        aggregatedContent += allChannels.join('\n\n'); // 用两个换行符分隔频道
        return aggregatedContent.trim();
    } catch (error) {
        console.error('❌ 发生错误:', error);
        return 'Error fetching sources';
    }
}

// 处理 API 请求
app.get('/', async (req, res) => {
    const aggregatedContent = await fetchAndAggregateM3U();

    // 设置响应标头
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'inline; filename="4gtv.txt"');

    // 发送 M3U 数据
    res.send(aggregatedContent);
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
