# Arcadia Eternity 内容包模板

一个可以直接修改、测试和打包的用户定义内容包。点击 GitHub 的 **Use this template → Create a new repository**，把它复制到自己的账号或组织下。

示例包含一只精灵、两个技能、一个持续两回合的减速印记，以及 TypeScript 效果：命中施加减速，重复施加刷新时间，印记到期或被移除时恢复速度。效果使用游戏现有的上下文和领域 API，运行在服务器／Node 宿主中。

## 快速开始

需要 **Node.js 24、npm 和 Git**；当前 SDK 开发物料支持 Linux／macOS。

```sh
git clone https://github.com/YOUR-NAME/YOUR-PACK.git
cd YOUR-PACK
npm run setup
npm test
npm run demo
```

首次 `setup` 的小入口从固定上游提交载入安装器；所有安装逻辑都在主仓库，模板不复制脚本。安装器需要网络：按 [arcadia-sdk.json](arcadia-sdk.json) 中固定的提交获取引擎源码，使用固定的 pnpm 版本和上游锁文件构建 SDK，再安装本项目的开发依赖。源码、SDK 物料和安装记录放在被 Git 忽略的 `.arcadia/` 中；后续运行可复用已生成的 SDK。工具作为 `@arcadia-eternity/content-dev` 安装到本项目，提供 `arcadia-content` 命令；`build/check/rename/demo/pack` 都调用它。

**SDK 目前尚未正式发布到 npm。** 不要直接用 `npm install` 获取清单中的 Arcadia 目标版本，先运行 `npm run setup`。项目通过本地 tarball 安装 SDK；`package.json` 记录兼容目标，第三方依赖由 npm 正常获取。此开发安装不生成项目锁文件；部署内容包的服务器项目应单独维护标准 npm 锁文件。SDK 源码固定不等于所有宿主环境或未来第三方依赖字节都相同。

已经有与目标宿主匹配的 SDK 物料时，也可以：

```sh
npm run setup -- --sdk-dir /absolute/path/to/author-sdk
# 只有第三方依赖已进入 npm 缓存时才能离线安装：
npm exec --offline -- arcadia-content setup --sdk-dir /absolute/path/to/author-sdk --offline
```

物料目录需包含 `arcadia-author-sdk.json` 和列出的全部 `.tgz`，包括开发工具包。可在上游构建工具依赖图后运行 `node scripts/stage-author-sdk.mjs /new/sdk-dir` 生成。首次入口需要网络；安装过工具后，以上第二条命令才可完全离线运行。安装脚本核对 API 版本、SDK 产物校验和及安装后的构建身份；使用外部物料时，安装记录不会声称其来自模板固定的源码提交。

## 数据按文件组织

日常编辑的是 `data/` 下的独立文件：

```text
data/
  species/pet.yaml       # 精灵
  skills/strike.yaml     # 攻击技能
  skills/rest.yaml       # 休息技能
  marks/slow.yaml        # 减速印记
src/effects.ts           # TypeScript 效果
dist/content.json        # 构建生成，不提交、不手工编辑
```

JSON、YAML 都可以；默认每个对象一个文件，也支持单文件数组和分类目录下的子目录。新增内容时直接添加文件，不用维护集中索引。效果直接在 TypeScript 中定义，由技能和印记数据引用对应 ID；不用在 `package.json` 再维护 `arcadia.exports`，也不用额外写一份效果元数据。

`npm run build` 编译效果代码，并收集源数据生成加载器所需的 `dist/content.json`。这是运行时产物，源数据仍按文件维护。记录按 ID 排序，移动文件或调整分组不会改变 ID 和输出顺序；重复 ID、缺失 ID、非法 JSON/YAML 会报告源文件路径，失败不会覆盖上一次成功生成的数据。

## 先改什么

| 文件                                                                                                   | 内容                                                     |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| [data/](data/)                                                                                         | 分类目录中的精灵、技能、印记及相互引用，每个对象独立文件 |
| [src/effects.ts](src/effects.ts)                                                                       | 效果逻辑：原生命中回调、参数和持续速度贡献               |
| [test/pack.test.mjs](test/pack.test.mjs)                                                               | 实际 npm 包在真实引擎中的场景断言                        |
| [arcadia.config.mjs](arcadia.config.mjs)                                                               | 演示／测试队伍；通过传入的 namespace 引用本包内容        |
| [arcadia-sdk.json](arcadia-sdk.json)                                                                   | SDK 来源、固定提交和 API 兼容版本                        |
| [.agents/skills/arcadia-content-authoring/SKILL.md](.agents/skills/arcadia-content-authoring/SKILL.md) | 供编码助手使用的创作与验证指引                           |

简单效果直接使用注入的 SDK，与官方效果的写法一致：

```ts
defineCodeEffect({
  id: id('apply-slow'),
  sourceKind: 'skill',
  triggers: [EffectTrigger.OnHit],
  when: (context) => context.source === context.parent.skill,
  apply(context) {
    const target = context.parent.actualTarget
    if (target) target.addMark(new AddMarkContext(context, target, slow))
  },
})
```

`speed-penalty` 展示另一种已有写法：通过 `numberParam` 声明可被战斗效果修改的数值，通过 `follow` 和绑定贡献跟随参数，并在来源印记转移、抑制或销毁时管理生命周期。普通分支、循环、计算和复用直接使用 TypeScript。

## 换成自己的包身份

在首次分享前执行，命令会遍历 JSON/YAML 源文件，同步改写本包的结构化内容引用，保留跨包引用和 YAML 注释。遇到共享的 YAML 别名时会展开为独立值，避免连带修改其他内容 ID：

```sh
npm run rename -- --name @your-scope/my-pack --project-id my-pack --namespace my-pack
npm test
```

npm 包名用于安装；`projectId`、namespace、局部 ID、`useId` 和绑定 key 决定游戏内容身份。发布或分享后不要随意修改稳定身份。也请更新 `package.json` 的 repository、描述和版本。

## 测试与演示

```sh
npm run check  # 检查 TypeScript 和源数据的语法／ID
npm test       # 编译、打包、在独立临时 npm 项目安装，然后运行真实战斗
npm run demo   # 完整的自动对战演示
npm run pack   # 生成可供服务器安装的 .tgz
```

测试覆盖未命中、命中、重复刷新、可修改参数、双局隔离、抑制、来源转移与移除、自然到期、受支持等待点的 JSON 保存／恢复，以及相同种子两场完整对战的一致性。它检查的是实际打包产物；内容包带上分文件源数据和生成的运行时数据；SDK 缓存、开发工具和测试不会进入内容包。通用工具自身的 JSON/YAML、重命名与安装回归在主仓库维护；模板只保留本包的行为测试。

GitHub Actions 从固定上游提交构建 SDK，执行相同检查，并上传内容包 `.tgz`。它不发布 npm，也不配置生产服务器准入。

## 交给服务器

在 Arcadia 的服务器项目中，把生成的 `.tgz` 作为标准 npm 依赖安装。服务器管理员随后执行检查、准入和环境准备，流程见下方 npm 内容包文档。`demo` 和测试中的 local-development 准入仅作用于各自的临时安装，不授权生产环境。浏览器连接相应服务器，不独立安装或执行效果代码。

模板默认 `private: true`。要发布到自己的 npm scope，先核对 `npm run pack` 的产物，更新包名、版本及发布元信息，再由自己移除 `private` 并执行 `npm publish`。npm 凭据由作者持有；模板不包含自动发布工作流。

## 对应 SDK 文档

以下链接固定到模板所用的上游源码版本：

- [Effect SDK：上下文、领域操作、参数、清理与失败语义](https://github.com/arcadia-eternity/arcadia-eternity/blob/44de0b7a9d0adf7b36065be04d3e2fe76f667057/docs/v4/effect-sdk.md)
- [npm 内容包、引用、安装、准入与固定环境](https://github.com/arcadia-eternity/arcadia-eternity/blob/44de0b7a9d0adf7b36065be04d3e2fe76f667057/docs/v4/npm-content.md)
- [可选的选择、计算、capture/follow 与绑定工具](https://github.com/arcadia-eternity/arcadia-eternity/blob/44de0b7a9d0adf7b36065be04d3e2fe76f667057/docs/v4/effect-authoring.md)

升级 SDK／开发工具时，修改 `arcadia-sdk.json` 的固定提交，并重新运行 setup、类型检查和场景测试；活动对局仍应使用原来的固定环境。源码版本、SDK API 版本和实际构建身份分别表达不同的兼容信息。
