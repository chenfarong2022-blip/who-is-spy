# 谁是卧底 - Who Is Spy

🎭 一款简洁优雅的谁是卧底发牌应用，支持手机扫码加入游戏。

## ✨ 功能特点

- 📱 **移动端优先** - 完美适配手机屏幕
- 📷 **扫码加入** - 房主创建房间，玩家扫码即入
- 🎲 **随机词语** - 内置 150+ 经典词对，一键随机
- 🀄 **中文 + 拼音** - 每个词语自动显示拼音
- 👁️ **隐藏/显示** - 点击卡片查看身份，保护隐私
- 🌐 **中英双语** - 所有界面元素双语标注
- 💡 **游戏提示** - 简洁规则说明，新手友好
- 🗄️ **Supabase** - 实时数据库，多人同步

## 🚀 快速开始

### 1. 配置 Supabase

1. 访问 [supabase.com](https://supabase.com) 创建账户
2. 创建新项目 (Create new project)
3. 进入项目设置 → API，复制：
   - Project URL
   - anon public key
4. 在 SQL Editor 运行以下 SQL：

```sql
-- 创建房间表
CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  player_count INTEGER NOT NULL,
  spy_count INTEGER NOT NULL,
  civilian_word TEXT NOT NULL,
  spy_word TEXT NOT NULL,
  status TEXT DEFAULT 'waiting',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建玩家表
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
  player_number INTEGER NOT NULL,
  role TEXT,
  word TEXT,
  pinyin TEXT,
  has_viewed BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, player_number)
);

-- 启用实时订阅
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;

-- 创建索引
CREATE INDEX idx_players_room_id ON players(room_id);
CREATE INDEX idx_rooms_status ON rooms(status);
```

5. 打开 `app.js` 和 `player.js`，替换：
   ```javascript
   const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
   const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
   ```

### 2. 本地测试

直接双击打开 `index.html` 即可体验（演示模式，无需 Supabase）。

### 3. 部署上线

#### 方式 A: Vercel（推荐）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 进入项目目录
cd who-is-spy

# 部署
vercel
```

#### 方式 B: Netlify

1. 将代码推送到 GitHub
2. 在 Netlify 导入仓库
3. 设置发布目录为根目录
4. 点击 Deploy

#### 方式 C: GitHub Pages

1. 将代码推送到 GitHub
2. 进入仓库 Settings → Pages
3. 选择 main 分支，保存
4. 访问 `https://yourname.github.io/repo/who-is-spy/`

## 📖 使用说明

### 房主流程

1. 打开应用，设置玩家人数和卧底数量
2. 输入或随机生成平民词和卧底词
3. 点击"创建房间 Create Room"
4. 分享二维码给其他玩家
5. 等待所有玩家加入后，点击"开始游戏"

### 玩家流程

1. 扫描房主分享的二维码
2. 进入房间等待
3. 游戏开始后，点击卡片查看自己的词语
4. 记住词语后点击"我记住了"
5. 开始描述和投票环节

## 🎮 游戏规则

1. **平民**：拿到相同词语，找出卧底
2. **卧底**：拿到不同词语，伪装自己
3. **描述**：每人用一句话描述自己的词语，不能直接说出来
4. **投票**：每轮投票淘汰一人
5. **胜利条件**：
   - 平民淘汰所有卧底 → 平民胜
   - 卧底存活到最后 → 卧底胜

## 📁 文件结构

```
who-is-spy/
├── index.html          # 房主页面
├── player.html         # 玩家页面
├── style.css           # 样式文件
├── app.js              # 房主端逻辑
├── player.js           # 玩家端逻辑
├── words.js            # 词语库（150+ 词对）
├── supabase.js         # Supabase 配置说明
└── README.md           # 本文件
```

## 🛠️ 技术栈

- **前端**: HTML5 + CSS3 + Vanilla JavaScript
- **数据库**: Supabase (PostgreSQL + Realtime)
- **二维码**: QRCode.js
- **部署**: Vercel / Netlify / GitHub Pages

## 📝 更新日志

### v1.0.0 (2026-03-08)
- ✨ 初始版本发布
- ✨ 150+ 经典词对
- ✨ 中英双语界面
- ✨ 移动端优化
- ✨ Supabase 实时同步

## 🎨 自定义

### 添加新词对

编辑 `words.js`，在 `WORD_PAIRS` 数组中添加：

```javascript
{ civilian: "你的词", spy: "卧底词" },
```

并在 `PINYIN_MAP` 中添加拼音：

```javascript
"你的词": "nǐ de cí",
"卧底词": "wò dǐ cí"
```

### 修改主题色

编辑 `style.css`，修改 CSS 变量：

```css
:root {
  --primary: #6366f1;      /* 主色调 */
  --secondary: #ec4899;    /* 辅助色 */
  --background: #0f172a;   /* 背景色 */
  --card-bg: #1e293b;      /* 卡片背景 */
}
```

## 📄 许可证

MIT License - 自由使用，随意修改

## 🙏 致谢

感谢小王子殿下的创意与支持！👑

---

**🎭 享受游戏，找出卧底！**
