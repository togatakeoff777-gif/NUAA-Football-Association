# 使用说明

此文件包用于交给 Codex 继续开发现有项目。

## 操作步骤

1. 解压本文件包。
2. 将 `public/images/` 中的两张图片复制到你现有项目的同一路径：
   - `public/images/huqu-fa-wechat-qr.jpg`
   - `public/images/nuaa-emblem.jpg`
3. 将 `CODEX_TASK_HOME_V2.md` 复制到项目根目录。
4. 在 Codex 中选择当前 `NUAA-Football-Association` 项目。
5. 发送以下指令：

```text
请阅读项目根目录中的 CODEX_TASK_HOME_V2.md，并严格按该任务书完成第二轮开发。先检查现有代码，不要无理由推倒重建。完成后运行 npm run lint 和 npm run build，并按任务书要求汇报。完成本轮后停止，等待我验收。
```

注意：本轮只做本地原型与演示功能，不接入管理员账号、数据库或足球中国接口。
