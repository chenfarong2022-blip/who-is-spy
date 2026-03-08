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
function joinRoomDemo() {
  roomId = roomId || 'demo';
  playerNumber = Math.floor(Math.random() * 8) + 1;
  
  // 模拟分配词语
  const wordPairs = [
    { civilian: "牛奶", spy: "豆浆" },
    { civilian: "苹果", spy: "香蕉" },
    { civilian: "咖啡", spy: "茶" }
  ];
  
  const pair = wordPairs[Math.floor(Math.random() * wordPairs.length)];
  const isSpyDemo = Math.random() > 0.8; // 20% 概率是卧底
  
  myWord = isSpyDemo ? pair.spy : pair.civilian;
  myPinyin = getPinyin(myWord);
  isSpy = isSpyDemo;
  
  showPlayerPage();
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
  document.getElementById('player-page').classList.remove('active');
  document.getElementById('waiting-page').classList.add('active');
  
  // 等待房主开始游戏
  if (supabase) {
    waitForGameStart();
  } else {
    // 演示模式：2 秒后显示
    setTimeout(() => {
      showPlayerPage();
    }, 2000);
  }
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
  
  if (wordVisible) {
    content.classList.remove('visible');
    hidden.classList.remove('hidden');
  } else {
    content.classList.add('visible');
    hidden.classList.add('hidden');
    
    // 显示词语
    document.getElementById('player-word').textContent = myWord;
    document.getElementById('player-pinyin').textContent = myPinyin;
  }
  
  wordVisible = !wordVisible;
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
    
    // 显示游戏提示
    alert('记住你的词语了吗？\n游戏即将开始！\n\nRemember your word?\nGame is about to start!');
    
    // 可以跳转到游戏结束页面或保持当前页面
    // 在实际游戏中，这里会等待所有玩家确认后开始
    
  } catch (error) {
    console.error('确认失败:', error);
  }
}

// 页面加载完成
window.addEventListener('DOMContentLoaded', () => {
  joinRoom();
});
