/*
脚本引用 https://raw.githubusercontent.com/githubdulong/Script/master/jd_price.js
*/
// 2024-05-15 优化版
const DEBUG_MODE = false; // 调试开关

const safeParse = (data) => {
    try {
        return JSON.parse(data);
    } catch (e) {
        console.log(`JSON解析失败: ${e.message}`);
        return { err: true, msg: "数据解析失败" };
    }
};

const http = async (op) => {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
        const callback = (err, resp, data) => {
            if (DEBUG_MODE) {
                console.log(`请求耗时: ${Date.now() - startTime}ms`);
                console.log(`请求参数:`, op);
                console.log(`响应状态: ${resp?.status || '无状态'}`);
            }
            
            if (err) {
                console.log(`请求失败: ${err}`);
                return reject(err);
            }
            
            const parsedData = safeParse(data);
            if (parsedData.err) {
                return reject(new Error("无效响应数据"));
            }
            
            resolve(parsedData);
        };

        if (typeof $httpClient !== 'undefined') {
            $httpClient[op.method || 'get'](op, callback);
        } else if (typeof $task !== 'undefined') {
            $task.fetch(op).then(
                response => callback(null, response, response.body),
                err => callback(err)
            );
        } else {
            reject(new Error("无可用请求方法"));
        }
    });
};

// 日期处理强化
const toDate = (timestamp) => {
    try {
        const d = new Date(timestamp);
        return d.toISOString().split('T')[0].replace(/-/g, '.');
    } catch (e) {
        console.log(`日期转换失败: ${timestamp}`);
        return '日期无效';
    }
};

// 数字处理优化
const parseNumber = (input) => {
    const num = parseFloat(`${input}`.replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? 0 : num;
};

// 价格对比逻辑优化
const comparePrices = (current, history) => {
    const cur = parseNumber(current);
    const his = parseNumber(history);
    
    if (cur > his) return { symbol: '↑', diff: (cur - his).toFixed(2) };
    if (cur < his) return { symbol: '↓', diff: (his - cur).toFixed(2) };
    return { symbol: '●', diff: '0.00' };
};

// 表格生成优化
const generateTableHTML = (data) => {
    if (data.err) return `<div class="error-box">${data.msg}</div>`;

    const rows = data.atts.map(item => {
        const status = comparePrices(item.currentPrice, item.historyPrice);
        return `
            <tr class="price-row ${status.symbol !== '●' ? 'highlight' : ''}">
                <td>${item.type}</td>
                <td>${item.date}</td>
                <td class="price-cell">¥${item.currentPrice}</td>
                <td class="status-cell ${status.symbol === '↑' ? 'up' : 'down'}">
                    ${status.symbol}${status.diff}
                </td>
            </tr>
        `;
    }).join('');

    return `
        <div class="price-container">
            <h2 class="title">${data.groupName}</h2>
            <table class="price-table">
                <thead>
                    <tr>
                        <th>类型</th>
                        <th>日期</th>
                        <th>当前价格</th>
                        <th>价格变动</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
};

// 样式优化
const injectStyles = () => `
    <style>
        .price-container {
            margin: 15px;
            padding: 20px;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .title {
            color: #333;
            font-size: 18px;
            margin-bottom: 15px;
        }
        .price-table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 12px;
            text-align: center;
            border-bottom: 1px solid #eee;
        }
        th {
            background: #f8f8f8;
            color: #666;
        }
        .price-cell {
            color: #ff6000;
            font-weight: bold;
        }
        .status-cell.up { color: #f5222d; }
        .status-cell.down { color: #52c41a; }
        .highlight { background: #fffbe6; }
        .error-box {
            padding: 15px;
            background: #fff1f0;
            border: 1px solid #ffccc7;
            border-radius: 4px;
            color: #f5222d;
        }
    </style>
`;

// 数据处理优化
const processPriceData = (body) => {
    try {
        const rawData = JSON.parse(`[${body.single.jiagequshiyh}]`);
        const reversedData = rawData.reverse().slice(0, 180);
        
        const currentPrice = reversedData[0][1];
        const lowestPrice = Math.min(...reversedData.map(d => d[1]));
        
        return {
            groupName: '价格趋势分析',
            atts: [
                {
                    type: '当前价格',
                    date: toDate(reversedData[0][0]),
                    currentPrice: currentPrice.toFixed(2),
                    historyPrice: currentPrice
                },
                {
                    type: '30天最低',
                    date: toDate(reversedData.find(d => d[1] === lowestPrice)[0]),
                    currentPrice: currentPrice.toFixed(2),
                    historyPrice: lowestPrice
                },
                // 可扩展其他价格类型...
            ]
        };
    } catch (e) {
        console.log(`数据处理失败: ${e.message}`);
        return { err: true, msg: "数据解析异常" };
    }
};

// 主流程优化
const main = async () => {
    try {
        const productId = $request.url.match(/\d+/)?.[0];
        if (!productId) throw new Error("无效商品ID");
        
        const apiResponse = await http({
            method: "POST",
            url: "https://apapia-history.manmanbuy.com/ChromeWidgetServices/WidgetServices.ashx",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"
            },
            body: `methodName=getHistoryTrend&p_url=https://item.m.jd.com/product/${productId}.html`
        });
        
        const processedData = processPriceData(apiResponse);
        const tableHTML = generateTableHTML(processedData);
        const fullHTML = injectStyles() + tableHTML;
        
        $done({
            body: $response.body.replace('</body>', `${fullHTML}</body>`),
            headers: $response.headers
        });
        
    } catch (error) {
        console.log(`主流程错误: ${error.message}`);
        $done({});
    }
};

// 执行入口
main();
