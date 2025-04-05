import requests
from datetime import datetime

url = "https://ispip.clang.cn/all_cn_ipv6.txt"

try:
    # 下载IP列表
    response = requests.get(url)
    response.raise_for_status()
    
    # 处理内容
    processed = ["payload:\n"]
    for line in response.text.splitlines():
        if line.strip():  # 忽略空行
            processed.append(f"  - IP-CIDR6,{line}\n")
    
    # 写入文件
    with open("allcnipv6.list", "w", encoding="utf-8") as f:
        f.writelines(processed)
        
    print(f"更新成功，共处理 {len(processed)-1} 条记录")
except Exception as e:
    print(f"更新失败: {str(e)}")
    raise
