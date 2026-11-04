# HaCasa Nova 简体中文语言包

给 [HaCasa Nova](https://github.com/damianeickhoff/HaCasa) 增加简体中文界面。

原版只内置荷兰语（原文）、英语、德语、西班牙语，中文用户看到的全是荷兰语。

## 效果

| 位置 | 原版 | 本补丁 |
|------|------|--------|
| 导航 | Kamers / Sensoren / Energie | 房间 / 传感器 / 能源 |
| 设置页 | Instellingen | 设置 |
| 按钮 | Annuleren / Opslaan | 取消 / 保存 |
| 关闭提示 | sluiten | 关闭 |
| 问候语 | Goedemorgen | 早上好 |

## 特性

- **1281 条词条**全覆盖，与官方英文表逐条对应
- **占位符零冲突**：`{n}`、`{name}`、`{room}`、`{h}` 等动态变量全部保留
- **自动跟随 HA 语言**：Home Assistant 语言设为「简体中文（zh-Hans）」后面板自动切换
- **可选择**：面板设置里语言下拉会出现「简体中文」，也可手动指定
- 修正了原版 5 处裸 `title=` 属性和 1 处嵌套引号导致的关闭按钮文字残留

## 目录结构

```
.
├── dist/
│   └── zh-dict.js        # 1281 条「荷兰语原文 → 中文」词典
├── scripts/
│   └── build-zh.js       # 补丁脚本：读取官方 JS，注入词典并修正属性
└── README.md
```

**本仓库不含 HaCasa 原版代码**，需要你自行从官方获取。

## 安装

### 1. 拿到官方文件

```bash
# HACS 安装后文件在：
#   /config/www/community/HaCasa/hacasa-nova.js
# 或从官方仓库下载：
#   https://github.com/damianeickhoff/HaCasa
```

把 `hacasa-nova.js` 放到本机任意位置，例如 `~/Downloads/hacasa-nova.js`。

### 2. 打补丁

```bash
git clone <本仓库>
cd hacasa-zh-patch

node scripts/build-zh.js ~/Downloads/hacasa-nova.js ./hacasa-nova-zh.js
```

输出会显示：

```
✓ 已注入 1281 条中文词条并注册 zh 语种
✓ 已修正 7 处硬编码/引号问题
  ✓ 包含简体中文
  ✓ zh 已注册
  ✓ 无 alt="sluiten" 残留

✓ 已写出 ./hacasa-nova-zh.js (966 KB)
```

### 3. 部署到 Home Assistant

```bash
# 备份原版
docker exec homeassistant sh -c \
  "cp /config/www/community/HaCasa/hacasa-nova.js \
      /config/www/community/HaCasa/hacasa-nova.js.bak"

# 覆盖（假设 HA 跑在 Docker 里，容器名 homeassistant）
docker cp ./hacasa-nova-zh.js homeassistant:/config/www/community/HaCasa/hacasa-nova.js

# 关键：删除 gzip 缓存，否则仍加载旧版
docker exec homeassistant sh -c \
  "rm -f /config/www/community/HaCasa/hacasa-nova.js.gz"
```

### 4. 刷新浏览器

强制刷新：macOS `Cmd+Shift+R`，Windows `Ctrl+Shift+R`。

如果还是英文/荷兰语，检查 Home Assistant 的**用户配置 → 语言**是否设为简体中文。

## 验证

```bash
# 一键校验：词条数 / 占位符冲突 / 空值
node -e "
const z = require('./dist/zh-dict.js');
const g = s => [...String(s).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');
const keys = Object.keys(z);
console.log('词条数:', keys.length);
console.log('占位符冲突:', keys.filter(k => g(k) !== g(z[k])).length);
console.log('空值:', keys.filter(k => !String(z[k]).trim()).length);
"
```

预期输出：

```
词条数: 1281
占位符冲突: 0
空值: 0
```

## 自定义译文

`dist/zh-dict.js` 的键是**荷兰语原文**（原版代码里所有文案的 key 都是荷兰语），改对应值即可：

```js
{
  "Aan": "开启",
  "Uit": "关闭",
  "{n} van {m} aan": "{n}/{m} 已开",
  "Vandaag {n} kWh verbruikt": "今日用电 {n} kWh"
}
```

改完重新跑 `build-zh.js` 生成新文件。

## 兼容性

- 基于 **HaCasa Nova v3**（单文件零依赖版）制作
- 上游更新后结构可能变化，脚本会检测锚点 `var no={de:ya,en:$a,es:Da};`，找不到会直接报错提示
- 不修改任何业务逻辑，只添加语言字典和修正 HTML 属性引号
- 脚本幂等：对已打过补丁的文件重复运行时不会二次注入

## 排错

| 现象 | 原因 | 解决 |
|------|------|------|
| 还是荷兰语 | 浏览器缓存旧模块 | 清缓存 + 强制刷新 |
| 还是荷兰语 | HA 语言不是中文 | 用户配置 → 语言 → 简体中文 |
| 关闭按钮显示 `sluiten` | 未运行最新脚本 | 重新打补丁，脚本已修此问题 |
| 脚本报「未找到语言表锚点」 | 上游改了代码结构 | 提 issue，需要更新锚点 |

## 免责声明

HaCasa Nova 原作者未声明开源许可证（license: None），默认保留所有权利。

本仓库**不包含**原版 `hacasa-nova.js`，只提供：
- 语言翻译数据（`zh-dict.js`）
- 用于本地修改的补丁脚本（`build-zh.js`）

请自行从[官方仓库](https://github.com/damianeickhoff/HaCasa)获取原始代码并遵守其使用条款。
生成的文件仅供个人本地部署使用，请勿公开再分发原项目代码。

如果这个语言包对你有帮助，建议也去原项目提 PR，让官方原生支持中文。

## 致谢

- [HaCasa](https://github.com/damianeickhoff/HaCasa) by damianeickhoff
- [Homio design](https://github.com/iamtherufus) by iamtherufus
