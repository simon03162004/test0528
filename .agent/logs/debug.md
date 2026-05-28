# 除錯與避坑指南 (Debug & Pitfalls)

> 由 Inspector 與 Engineer 主導，記錄經典設計陷阱與檢討報告。

## 已知設計陷阱與應對策略
1. **彈窗高度溢出切斷**: 
   - *現象*: 在小螢幕下，毛玻璃卡片或彈窗內容過多時，會被視窗邊緣切斷，無法滾動。
   - *對策*: 確保容器使用 `max-height: 100vh; overflow-y: auto;` 並妥善處理 padding，Inspector 需特別留意邊界高度。
2. **定時器阻礙退出**: 
   - *現象*: JS 中未清除的 `setInterval` 會導致狀態機錯亂或記憶體洩漏。
   - *對策*: 嚴格遵守 `rule.md` 中的 `unref` 原則，所有定時器在組件銷毀或重置時必須明確 `clearInterval`。
3. **CSS 選取器斜線跳脫失效**:
   - *現象*: 在動態生成 DOM 且 id 包含特殊字元時，原生 querySelector 會報錯。
   - *對策*: 使用 `CSS.escape()` 處理動態 id，或盡量避免使用特殊字元作為選擇器。

## Inspector 檢討報告
*(待網頁實作完成後填寫)*