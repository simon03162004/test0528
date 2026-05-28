# 編排指南 (Orchestration Guidelines)

## 動態指派模式
主代理人（Orchestrator）應遵循以下模式來靈活協作四大角色：

1. **需求與規劃階段**: 優先指派 `PM`。PM 負責分析需求，構思加值亮點，並將計畫條列於 `task.md`。
2. **實作階段**: 指派 `Engineer`。Engineer 根據 `task.md` 進行編碼，負責技術實踐，並將進度與細節更新至 `functions.md`。Engineer 是唯一具備寫入權限的角色。
3. **審查與重構階段**: 在工程師完成一個模組後，指派 `Inspector`。Inspector 專注於架構與 SOLID 原則，提出重構藍圖，若有問題則退回給 Engineer 修正，並將經驗寫入 `debug.md`。
4. **測試與反饋階段**: 系統成型後，指派 `Heavy User`。Heavy User 負責極端數據與壓力測試，提供強烈的 UX 吐槽。問題將彙整後，由 Orchestrator 重新啟動工作流（ PM -> Engineer ）。

## 協作守則
- 各角色之間互不直接修改對方的文件，所有檔案變更必須由 Engineer 代理執行，或透過記錄檔傳遞。
- 每一個循環結束後，Orchestrator 應確保 `logs` 目錄下的文件已同步更新。