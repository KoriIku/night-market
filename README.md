# 我的钱怎么就花完了？

一个可以走进去的夜市：先逛，再猜自己花掉了多少。

网页轻量小游戏，纯 Three.js，无打包器。100 块是心理参照而不是消费上限：全程不显示余额，买多少都不会被拦，最后靠「猜花销」的误差结算称号。

## 玩法

1. 在夜市里逛一圈，想象你打算花掉 100 块。
2. 走近摊位点单，大小份、加料、称重都会悄悄把价格推上去。
3. 逛够了点「买够了」，最后猜一次今晚一共花了多少。
4. 结算页给出实际花费、你的预估、相差百分比和称号，可以保存成图片。

## 本地运行

```powershell
npm install
npm run dev          # http://localhost:5173/
npm run check        # 所有模块语法检查
```

`npm run dev` 起的是零依赖静态服务器（`serve.mjs`）。页面本身不需要构建：Three.js 已经 vendor 到 `vendor/`，通过 import map 直接加载。

## 目录

- `index.html` 页面骨架与 UI 容器
- `src/main.js` 启动、状态、主循环、开始与结算流程
- `src/ui.js` 摊位面板、猜花销、结算页
- `src/shareCard.js` 结算页导出分享图（Canvas 2D，无第三方依赖）
- `src/data.js` 摊位、菜单、价格与格式化工具
- `src/toon.js` 三渲二材质与描边
- `src/character.js` 主角与走路/提袋动画
- `src/world/` 街区、摊位、灯光、蒸汽与装饰
- `src/audio.js` 程序化音效
- `scripts/` 截图、画面采样与调试脚本（Playwright，开发用）

## 部署

站点是纯静态的，托管仓库根目录即可。本项目通过 GitHub Pages 发布，地址在仓库的 Settings → Pages 里可以看到。

## 设计文档

- `docs/design.md` 设计备忘
- `docs/tech.md` 技术备忘（渲染管线、目录职责、已知取舍）
- `docs/prompt-night-market.md` 场景生成提示词
- `docs/references.md` 参考与灵感记录
