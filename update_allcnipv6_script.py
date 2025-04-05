import requests
from pathlib import Path

url = "https://ispip.clang.cn/all_cn_ipv6.txt"
output_file = "ipv6-rules.txt"

try:
    response = requests.get(url)
    response.raise_for_status()
    
    # 处理数据
    lines = ["payload:"]  # 添加首行
    for line in response.text.splitlines():
        if line.strip():  # 跳过空行
            lines.append(f"  - IP-CIDR6,{line.strip()}")

    # 写入文件
    Path(output_file).write_text("\n".join(lines))
    print(f"成功更新 {len(lines)-1} 条IPv6规则")

except Exception as e:
    print(f"更新失败: {str(e)}")
    raise  # 抛出错误使Action失败
