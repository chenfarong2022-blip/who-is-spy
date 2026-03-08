// 谁是卧底 - 玩家端逻辑
let roomId = null;
let playerId = null;
let playerNumber = 0;
let myWord = "";
let myPinyin = "";
let isSpy = false;
let wordVisible = false;
let supabase = null;

// 从 URL 获取房间 ID
function getRoomIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('room');
}

// 初始化 Supabase
async function initSupabase() {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  
  // Supabase 配置
  const SUPABASE_URL = 'https://txuucznameseahopirko.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4dXVjem5hbWVzZWFob3BpcmtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTQxNTQsImV4cCI6MjA4ODUzMDE1NH0.eh73ANUcQCsI686wHyWMbxIxo2LS_0I06lwR2Jd3P0s';
  
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabase;
}

// 玩家加入房间
async function joinRoom() {
  roomId = getRoomIdFromUrl();
  
  // 调试信息
  console.log('当前 URL:', window.location.href);
  console.log('Room ID from URL:', roomId);
  
  if (!roomId) {
    // 显示调试信息而不是直接跳转
    const debugMsg = `无效的房间链接\nInvalid room link\n\n当前 URL: ${window.location.href}\nRoom ID: ${roomId}`;
    alert(debugMsg);
    // 不自动跳转，让用户看到错误
    return;
  }
  
  try {
    if (!supabase) {
      await initSupabase();
    }
    
    // 检查房间是否存在
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();
    
    if (roomError || !room) {
      throw new Error('房间不存在 Room not found');
    }
    
    if (room.status === 'playing') {
      // 游戏已开始，获取玩家信息
      await getPlayerInfo();
      return;
    }
    
    // 创建玩家记录
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('id, player_number')
      .eq('room_id', roomId)
      .order('player_number', { ascending: false })
      .limit(1)
      .single();
    
    const newPlayerNumber = existingPlayer ? existingPlayer.player_number + 1 : 1;
    
    const { data: newPlayer, error: playerError } = await supabase
      .from('players')
      .insert({
        room_id: roomId,
        player_number: newPlayerNumber,
        joined_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (playerError) throw playerError;
    
    playerId = newPlayer.id;
    playerNumber = newPlayerNumber;
    
    // 显示等待页面
    showWaiting();
    
  } catch (error) {
    console.error('加入房间失败:', error);
    // 演示模式
    joinRoomDemo();
  }
}

// 玩家加入房间（演示模式）
async function joinRoomDemo() {
  roomId = roomId || 'demo_' + Math.random().toString(36).substring(2, 8);
  
  console.log('演示模式 - 尝试从 Supabase 获取房间数据，Room ID:', roomId);
  
  try {
    // 尝试从 Supabase 获取房间数据
    if (!supabase) {
      await initSupabase();
    }
    
    // 获取房间信息
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();
    
    if (roomError || !room) {
      console.log('房间不存在，使用随机词语');
      // 房间不存在，使用随机词语
      useRandomWords();
      return;
    }
    
    // 房间存在，使用房主设置的词语
    civilianWord = room.civilian_word;
    spyWord = room.spy_word;
    playerCount = room.player_count;
    spyCount = room.spy_count;
    
    console.log('找到房间:', room);
    
    // 获取或创建玩家记录
    let playerData = null;
    
    // 尝试从 localStorage 获取 playerId
    const storedPlayerId = localStorage.getItem('playerId_' + roomId);
    
    if (storedPlayerId) {
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('id', storedPlayerId)
        .single();
      
      if (existingPlayer) {
        playerData = existingPlayer;
        console.log('找到现有玩家:', playerData);
      }
    }
    
    if (!playerData) {
      // 创建新玩家记录
      const { data: players } = await supabase
        .from('players')
        .select('player_number')
        .eq('room_id', roomId)
        .order('player_number', { ascending: false })
        .limit(1);
      
      const newPlayerNumber = players && players.length > 0 ? players[0].player_number + 1 : 1;
      
      // 随机分配身份
      const { data: allPlayers } = await supabase
        .from('players')
        .select('id')
        .eq('room_id', roomId);
      
      const currentPlayerCount = allPlayers ? allPlayers.length : 0;
      const isSpy = currentPlayerCount < spyCount; // 前 spyCount 个玩家是卧底
      
      const word = isSpy ? spyWord : civilianWord;
      const pinyin = getPinyin(word);
      
      const { data: newPlayer, error: insertError } = await supabase
        .from('players')
        .insert({
          room_id: roomId,
          player_number: newPlayerNumber,
          role: isSpy ? 'spy' : 'civilian',
          word: word,
          pinyin: pinyin,
          has_viewed: false
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      playerData = newPlayer;
      localStorage.setItem('playerId_' + roomId, playerData.id);
      
      console.log('创建新玩家:', playerData);
    }
    
    // 设置玩家数据
    playerId = playerData.id;
    playerNumber = playerData.player_number;
    myWord = playerData.word;
    myPinyin = playerData.pinyin;
    isSpy = playerData.role === 'spy';
    
    console.log('玩家数据 - 编号:', playerNumber, '词语:', myWord, '身份:', isSpy ? '卧底' : '平民');
    
  } catch (error) {
    console.error('Supabase 获取失败，使用随机词语:', error);
    useRandomWords();
  }
  
  // 直接显示玩家页面
  showPlayerPage();
}

// 使用随机词语（后备方案）
function useRandomWords() {
  playerNumber = Math.floor(Math.random() * 8) + 1;
  
  const wordPairs = [
    { civilian: "牛奶", spy: "豆浆" },
    { civilian: "苹果", spy: "香蕉" },
    { civilian: "咖啡", spy: "茶" },
    { civilian: "微信", spy: "QQ" },
    { civilian: "电影", spy: "电视剧" }
  ];
  
  const pair = wordPairs[Math.floor(Math.random() * wordPairs.length)];
  const isSpyDemo = Math.random() > 0.8;
  
  myWord = isSpyDemo ? pair.spy : pair.civilian;
  myPinyin = getPinyin(myWord);
  isSpy = isSpyDemo;
  
  console.log('随机词语 - 玩家:', playerNumber, '词语:', myWord, '身份:', isSpy ? '卧底' : '平民');
}

// 获取玩家信息
async function getPlayerInfo() {
  if (!supabase) return;
  
  // 这里应该通过某种方式识别玩家（比如 localStorage 存储 playerId）
  const storedPlayerId = localStorage.getItem('playerId_' + roomId);
  
  if (storedPlayerId) {
    playerId = storedPlayerId;
    
    const { data: player, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();
    
    if (error || !player) {
      alert('找不到玩家信息\nPlayer not found');
      return;
    }
    
    playerNumber = player.player_number;
    myWord = player.word;
    myPinyin = player.pinyin;
    isSpy = player.role === 'spy';
    
    showPlayerPage();
  }
}

// 显示等待页面
function showWaiting() {
  // 演示模式：不显示等待页面，直接显示玩家页面
  if (!supabase) {
    showPlayerPage();
    return;
  }
  
  // Supabase 模式：显示等待页面
  document.getElementById('player-page').classList.remove('active');
  document.getElementById('waiting-page').classList.add('active');
  
  waitForGameStart();
}

// 等待游戏开始
async function waitForGameStart() {
  if (!supabase) return;
  
  const { data: room, error } = await supabase
    .from('rooms')
    .select('status')
    .eq('id', roomId)
    .single();
  
  if (error) return;
  
  if (room.status === 'playing') {
    await getPlayerInfo();
  } else {
    // 继续等待
    setTimeout(waitForGameStart, 2000);
  }
}

// 显示玩家页面
function showPlayerPage() {
  document.getElementById('waiting-page').classList.remove('active');
  document.getElementById('player-page').classList.add('active');
  
  document.getElementById('player-num').textContent = playerNumber;
  
  // 保存 playerId 到 localStorage
  if (playerId) {
    localStorage.setItem('playerId_' + roomId, playerId);
  }
}

// 切换词语显示
function toggleWord() {
  const content = document.getElementById('word-content');
  const hidden = document.getElementById('word-hidden');
  
  // 如果已经显示，不要隐藏（防止误触）
  if (wordVisible) {
    return;
  }
  
  // 显示词语
  content.classList.add('visible');
  hidden.classList.add('hidden');
  
  // 确保词语已设置
  if (!myWord) {
    // 演示模式：如果没有词语，随机生成一个
    const wordPairs = [
      { civilian: "牛奶", spy: "豆浆" },
      { civilian: "苹果", spy: "香蕉" },
      { civilian: "咖啡", spy: "茶" },
      { civilian: "微信", spy: "QQ" },
      { civilian: "电影", spy: "电视剧" }
    ];
    const pair = wordPairs[Math.floor(Math.random() * wordPairs.length)];
    myWord = pair.civilian;
    myPinyin = getPinyin(myWord);
  }
  
  document.getElementById('player-word').textContent = myWord;
  document.getElementById('player-pinyin').textContent = myPinyin;
  
  wordVisible = true;
}

// 确认记住词语
async function confirmWord() {
  if (!wordVisible) {
    alert('请先查看你的词语\nPlease view your word first');
    return;
  }
  
  try {
    if (supabase && playerId) {
      await supabase
        .from('players')
        .update({ has_viewed: true })
        .eq('id', playerId);
    }
    
    // 演示模式：显示简单提示，保持当前页面
    if (!supabase) {
      // 轻微提示，不遮挡界面
      const toast = document.createElement('div');
      toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#22c55e;color:white;padding:12px 24px;border-radius:8px;font-size:0.9rem;z-index:1000;';
      toast.textContent = '✅ 已确认 | Ready';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
      return;
    }
    
    // Supabase 模式：显示游戏提示
    alert('记住你的词语了吗？\n游戏即将开始！\n\nRemember your word?\nGame is about to start!');
    
  } catch (error) {
    console.error('确认失败:', error);
  }
}

// 页面加载完成
window.addEventListener('DOMContentLoaded', () => {
  joinRoom();
});
