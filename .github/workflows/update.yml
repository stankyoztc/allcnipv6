name: Daily IPv6 Update

on:
  schedule:
    - cron: '0 0 * * *'  # 每天UTC时间00:00运行
  workflow_dispatch:  # 允许手动触发

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        persist-credentials: false

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.x'

    - name: Run update script
      run: |
        python update_script.py
        
    - name: Commit changes
      run: |
        git config --global user.name "GitHub Actions"
        git config --global user.email "actions@github.com"
        git add allcnipv6.list
        git commit -m "每日自动更新IPv6列表 $(date +'%Y-%m-%d')" || echo "没有变化无需提交"
        git push origin main

    - name: Clean up other files
      run: |
        # 保留必要文件
        git ls-files | grep -v -E "allcnipv6.list|.github/workflows/update.yml|update_script.py" | xargs git rm -f
        git commit -m "清理非必要文件" || echo "无需清理"
        git push origin main
