# Arcadia Eternity 内容包模板

一个可以直接修改、测试和打包的用户定义内容包。点击 GitHub 的 **Use this template → Create a new repository**，把它复制到自己的账号或组织下。

示例包含两只精灵（包内图片与远程 SWF 外观）、两个技能、一个持续两回合的减速印记、中英双语富文本，以及 TypeScript 效果：命中施加减速，重复施加刷新时间，印记到期或被移除时恢复速度。效果使用游戏现有的上下文和领域 API，运行在服务器／Node 宿主中。

## 快速开始

需要 **Node.js 24 和 npm**。SDK 和作者工具通过 GitHub Packages 发布，当前精确版本为 `4.0.0-preview.1`（`preview` 标签）。

```sh
git clone https://github.com/YOUR-NAME/YOUR-PACK.git
cd YOUR-PACK
npm login --scope=@arcadia-eternity --auth-type=legacy --registry=https://npm.pkg.github.com
npm install
npm run check
npm test
npm run demo
```

登录时密码填写 GitHub personal access token (classic)，至少需要 `read:packages` 和包读取权限。项目 `.npmrc` 只配置 scope，不保存凭据；普通第三方依赖从 npmjs.org 获取。GitHub 对公开 npm 包也要求认证，见 [官方说明](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)。

`npm run setup` 是 `npm install` 的别名。安装不再编译主仓库；工具通过 `@arcadia-eternity/content-dev` 提供 `arcadia-content` 命令。首次安装后提交 `package-lock.json`，后续使用 `npm ci`。

需要官方基础内容时可另行安装：

```sh
npm install --save-exact @arcadia-eternity/data-pack-base@4.0.0-preview.1
```

本模板的示例本身无需基础数据包。需要匹配未发布的本地宿主时，仍可选择源码安装器或已有开发 SDK：

```sh
npm run setup:source
npm run setup:source -- --sdk-dir /absolute/path/to/author-sdk
```

源码安装器根据 `arcadia-sdk.json` 的固定提交构建，支持 Linux／macOS；已有物料目录需要 `arcadia-author-sdk.json` 和其中的七个 SDK `.tgz`。本地开发物料与 registry 发布分别维护。

## 数据按文件组织

日常编辑的是 `data/` 下的独立文件：

```text
data/
  species/pet.yaml       # 精灵规则
  species/pet-swf.yaml   # 另一只精灵的规则
  skills/strike.yaml     # 攻击技能
  skills/rest.yaml       # 轻触技能
  marks/slow.yaml        # 减速印记
  presentations/main.yaml # 对象与资源的用途绑定
  resources/main.yaml     # 资源标识、类型和文件位置
assets/pets/*.png        # 本包图片
assets/marks/slow.png    # 印记图标
locales/zh-CN/*.yaml     # 中文名称与富文本
locales/en/*.yaml        # 英文翻译，使用相同局部 ID
src/effects.ts           # TypeScript 效果
debug/teams/*.yaml      # 可保存的演示与测试队伍
dist/presentation.json  # 构建生成的素材／语言索引
dist/content.json        # 构建生成，不提交、不手工编辑
```

JSON、YAML 都可以；默认每个对象一个文件，也支持单文件数组和分类目录下的子目录。新增内容时直接添加文件，不用维护集中索引。效果直接在 TypeScript 中定义，由技能和印记数据引用对应 ID；不用在 `package.json` 再维护 `arcadia.exports`，也不用额外写一份效果元数据。

`npm run build` 编译效果代码，并收集源数据生成加载器所需的 `dist/content.json`，同时生成 `dist/presentation.json` 的素材与语言索引。这是运行时产物，源数据仍按文件维护。记录按 ID 排序，移动文件或调整分组不会改变 ID 和输出顺序；重复 ID、缺失 ID、非法 JSON/YAML 会报告源文件路径，失败不会覆盖上一次成功生成的数据。

## 先改什么

| 文件                                                                                                   | 内容                                                     |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| [data/](data/)                                                                                         | 分类目录中的精灵、技能、印记及相互引用，每个对象独立文件 |
| [src/effects.ts](src/effects.ts)                                                                       | 效果逻辑：原生命中回调、参数和持续速度贡献               |
| [test/pack.test.mjs](test/pack.test.mjs)                                                               | 实际 npm 包在真实引擎中的场景断言                        |
| [arcadia.config.mjs](arcadia.config.mjs)                                                               | 选择 `debug/teams` 中的演示／测试队伍                    |
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

## 素材与富文本示例

| 示例                                       | 入口                                                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| 包内独立头像、立绘、静态战斗形象           | [data/presentations/main.yaml](data/presentations/main.yaml)                                                       |
| 远程图片、显式 SWF 播放器、包内图片回退    | [data/presentations/main.yaml](data/presentations/main.yaml)                                                       |
| 技能按需加载的远程音效                     | [data/resources/main.yaml](data/resources/main.yaml)                                                               |
| 印记图标、富文本中的名称／图标／悬浮引用   | [data/presentations/main.yaml](data/presentations/main.yaml)、[locales/zh-CN/skill.yaml](locales/zh-CN/skill.yaml) |
| 中英双语、当前威力／命中率、条件与复数文本 | [locales/zh-CN/](locales/zh-CN/)、[locales/en/](locales/en/)                                                       |

![包内默认战斗形象](assets/pets/frostling-battle.png) ![减速印记图标](assets/marks/slow.png)

默认演示队伍仍使用 `pet`；在组队时选择 `example-pack:pet-swf`，或把 `debug/teams/*.yaml` 中的 species 改为 `example-pack:pet-swf`，可试用远程外观。远程素材不随构建、打包或环境准备下载，客户端按用途加载，不建立素材缓存。`npm run demo` 是无界面的战斗演示，不播放图片、音效或 SWF。

具体字段、语言回退、动态印记文本、跨包资源和改名注意事项见 [素材与文本创作示例](docs/presentation.md)。

## 换成自己的包身份

在首次分享前执行，命令会遍历 JSON/YAML 源文件，同步改写本包的结构化内容引用，保留跨包引用和 YAML 注释。遇到共享的 YAML 别名时会展开为独立值，避免连带修改其他内容 ID：

```sh
npm run rename -- --name @your-scope/my-pack --project-id my-pack --namespace my-pack
npm test
```

npm 包名用于安装；`projectId`、namespace、局部 ID、`useId` 和绑定 key 决定游戏内容身份。发布或分享后不要随意修改稳定身份。也请更新 `package.json` 的 repository、描述和版本。`rename` 处理结构化引用；语言文本中的 `<mark>example-pack:slow</mark>` 需手动将 `example-pack` 改成新 namespace。

## 测试与演示

```sh
npm run check  # 检查 TypeScript 和源数据的语法／ID
npm test       # 编译、打包、在独立临时 npm 项目安装，然后运行真实战斗
npm run demo   # 完整的自动对战演示
npm run pack   # 生成可供服务器安装的 .tgz
```

测试覆盖未命中、命中、重复刷新、可修改参数、双局隔离、抑制、来源转移与移除、自然到期、受支持等待点的 JSON 保存／恢复，以及相同种子两场完整对战的一致性。它检查的是实际打包产物；内容包带上分文件源数据和生成的运行时数据；SDK 缓存、开发工具和测试不会进入内容包。通用工具自身的 JSON/YAML、重命名与安装回归在主仓库维护；模板只保留本包的行为测试。

GitHub Actions 从 GitHub Packages 安装精确 SDK 版本，执行相同检查，并上传内容包 `.tgz`。仓库可设置只读 `ARCADIA_PACKAGES_TOKEN` secret，或让工作流的 `GITHUB_TOKEN` 获得上游包读取权限。它不发布内容包，也不配置生产服务器准入。

## 交给服务器

在 Arcadia 的服务器项目中，把生成的 `.tgz` 作为标准 npm 依赖安装。服务器管理员随后执行检查、准入和环境准备，流程见下方 npm 内容包文档。`demo` 和测试中的 local-development 准入仅作用于各自的临时安装，不授权生产环境。浏览器连接相应服务器，不独立安装或执行效果代码。

模板默认 `private: true`。要发布到自己的 npm scope，先核对 `npm run pack` 的产物，更新包名、版本及发布元信息，再由自己移除 `private` 并执行 `npm publish`。npm 凭据由作者持有；模板不包含自动发布工作流。

## 对应 SDK 文档

以下链接固定到模板所用的上游源码版本：

- [Effect SDK：上下文、领域操作、参数、清理与失败语义](https://github.com/arcadia-eternity/arcadia-eternity/blob/8f0a38654c558f56bd9a0f052afc24709e5267a6/docs/v4/effect-sdk.md)
- [素材、语言与富文本合同](https://github.com/arcadia-eternity/arcadia-eternity/blob/8f0a38654c558f56bd9a0f052afc24709e5267a6/docs/v4/content-presentation.md)
- [npm 内容包、引用、安装、准入与固定环境](https://github.com/arcadia-eternity/arcadia-eternity/blob/8f0a38654c558f56bd9a0f052afc24709e5267a6/docs/v4/npm-content.md)
- [可选的选择、计算、capture/follow 与绑定工具](https://github.com/arcadia-eternity/arcadia-eternity/blob/8f0a38654c558f56bd9a0f052afc24709e5267a6/docs/v4/effect-authoring.md)

升级 SDK／开发工具时，修改 `package.json` 的精确版本，运行 `npm install` 更新锁文件，再运行类型检查和场景测试；活动对局仍应使用原来的固定环境。源码版本、SDK API 版本和实际构建身份分别表达不同的兼容信息。

## 分离的表现与资源（v2）

表现关联位于 `data/presentations/main.yaml`，资源定义位于 `data/resources/main.yaml`。规则只描述游戏内容，表现通过对象 ID 关联，图片与声音使用稳定资源 ID。移动素材时只更新资源定义的 `source`。见 [表现说明](docs/presentation.md)。

已发布 SDK 支持表现 v2；已有旧版本 SDK 的项目需要更新精确依赖并重新安装。
