# 技术备忘

## 硬约束

- 只用 Three.js（`0.186.1`，本地 vendor 进 `vendor/`，不走 CDN）。
- 无打包器、无框架：原生 ES Module + import map。
- 目标：中端手机流畅、首包小、draw call 少。

## 渲染管线

- `src/toon.js`：三渲二材质（三段渐变 + 环境项 + 边缘光 + 雾）、反壳描边材质，共用一套 uniforms。
- 静态街区按材质合并：结构（Lambert 风格的卡通材质）、自发光件、地面光池、招牌图集，各自一次 draw call。
- 动态：角色（每个部件 + 描边壳体）、蒸汽（单 Points）、灯笼光晕（单 Points）、地面路径（结算时）。
- 实测（桌面 1440×900，SwiftShader 软渲染）：27 draw calls、约 7.7 万三角形、391 点、6 张纹理。

## 目录职责

```
index.html          页面骨架与 UI 容器
serve.mjs           零依赖静态服务器（npm run dev）
vendor/             本地 three 构建
src/main.js         启动、状态、循环、UI 接线
src/toon.js         三渲二与描边材质
src/character.js    主角与走/吃动画
src/ui.js           DOM 面板：摊位、猜花销、小票
src/audio.js        程序化音效（底噪 / 滋滋声 / 硬币）
src/data.js         摊位、菜单、价格、找零面额
src/world/index.js  街区组装（底座、街道、灯串、摊位、建筑）
src/world/geometry.js  基础几何工具与合并
src/world/textures.js  程序化贴图与招牌图集
src/world/effects.js   蒸汽与灯光光晕
src/world/decorations.js  跨街灯串、灯笼与节庆挂旗
src/world/stall.js     单个摊位的造型与道具
src/world/surroundings.js  沿街立面、街道家具与地面细节
scripts/shot.mjs     Playwright 截图与性能采样
scripts/split-world.mjs  一次性拆分工具（历史用途）
```

## 验证方式

```powershell
npm run check          # 所有模块语法检查
npm run dev            # http://localhost:5173/
node scripts/shot.mjs  # 截图 + 采样 + FPS，输出到 shots/
```

- 采样使用 6 个画面区块做亮度统计，用于判断"是否黑屏/过暗"。
- FPS 是软件光栅（SwiftShader）结果，真机 GPU 会高很多；要看趋势而不是绝对值。

## 已知取舍

- 为控制 draw call，整条街的静态物件合并成极少数网格；代价是不能逐件做动画，需要动的物件要单独拆出来。
- 移动端像素比上限为 1.5，桌面为 1.8；新增装饰应先进入静态合并网格，避免增加 draw call。
- 透明光池是最容易吃填充率的部分，已限制尺寸与数量。
- 目前模型是程序化低模，想要"高精细建模"需要补充 Blender 环节或购买现成资产，再走同一条三渲二管线。
