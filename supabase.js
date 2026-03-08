// Supabase 配置模块
// 请殿下按照以下步骤配置：

// 1. 访问 https://supabase.com 创建账户
// 2. 创建新项目 (Create new project)
// 3. 进入项目设置 → API，复制以下两个值：
//    - Project URL (项目 URL)
//    - anon public (匿名密钥)
// 4. 将这两个值填入 app.js 和 player.js 中的对应位置

// 5. 在 SQL Editor 中运行以下 SQL 创建表结构：

/*
-- 创建房间表
CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  player_count INTEGER NOT NULL,
  spy_count INTEGER NOT NULL,
  civilian_word TEXT NOT NULL,
  spy_word TEXT NOT NULL,
  status TEXT DEFAULT 'waiting', -- waiting, playing, finished
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建玩家表
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
  player_number INTEGER NOT NULL,
  role TEXT, -- civilian, spy
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
*/

// 6. 设置 Row Level Security (可选，开发阶段可跳过)
// 在 Authentication → Policies 中添加允许匿名读写 rooms 和 players 表的策略

// 7. 部署到 Vercel/Netlify:
//    - 将整个 who-is-spy 文件夹上传到 GitHub
//    - 在 Vercel/Netlify 导入仓库
//    - 设置环境变量（如果需要）
//    - 获取部署后的 URL

// 8. 享受游戏！🎮

// 导出空对象（此文件主要用于说明）
export const supabaseConfig = {
  url: 'https://YOUR_PROJECT.supabase.co',
  anonKey: 'YOUR_ANON_KEY'
};
