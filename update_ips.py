import requests
from datetime import datetime

url = "https://ispip.clang.cn/all_cn_ipv6.txt"
output_file = "allcnipv6.list"

try:
    # 下载IP列表
    response = requests.get(url)
    response.raise_for_status()
    
    # 处理内容
    lines = ["  - IP-CIDR6," + line.strip() for line in response.text.splitlines() if line.strip()]
    
    # 添加payload头部
    content = "payload:\n" + "\n".join(lines)
    
    # 写入文件
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(content)
        
    print(f"文件更新成功，共处理 {len(lines)} 条记录")
    
except Exception as e:
    print(f"更新失败: {str(e)}")
    exit(1)
