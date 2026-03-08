// 谁是卧底 - 房主端逻辑
let roomId = null;
let playerCount = 5;
let spyCount = 1;
let civilianWord = "";
let spyWord = "";
let players = [];
let supabase = null;

// 初始化 Supabase
async function initSupabase() {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');

  // Supabase 配置
  const SUPABASE_URL = 'https://txuucznameseahopirko.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4dXVjem5hbWVzZWFob3BpcmtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTQxNTQsImV4cCI6MjA4ODUzMDE1NH0.eh73ANUcQCsI686wHyWMbxIxo2LS_0I06lwR2Jd3P0s';

  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabase;
}

// 调整玩家人数
function adjustPlayers(delta) {
  playerCount = Math.max(3, Math.min(20, playerCount + delta));
  document.getElementById('player-count').textContent = playerCount;
  updateSpyLimit();
}

// 调整卧底人数
function adjustSpies(delta) {
  const maxSpies = Math.floor(playerCount / 3);
  spyCount = Math.max(1, Math.min(maxSpies, spyCount + delta));
  document.getElementById('spy-count').textContent = spyCount;
}

// 更新卧底人数上限
function updateSpyLimit() {
  const maxSpies = Math.floor(playerCount / 3);
  if (spyCount > maxSpies) {
    spyCount = maxSpies;
    document.getElementById('spy-count').textContent = spyCount;
  }
}

// 创建房间
async function createRoom() {
  civilianWord = document.getElementById('civilian-word').value.trim();
  spyWord = document.getElementById('spy-word').value.trim();

  if (!civilianWord || !spyWord) {
    alert('请输入词语\nPlease enter words');
    return;
  }

  if (civilianWord === spyWord) {
    alert('平民词和卧底词不能相同\nCivilian and spy words must be different');
    return;
  }

  // 生成房间 ID
  roomId = 'room_' + Math.random().toString(36).substring(2, 10);

  try {
    // 初始化 Supabase
    if (!supabase) {
      await initSupabase();
    }

    // 创建房间记录
    const { error } = await supabase
      .from('rooms')
      .insert({
        id: roomId,
        player_count: playerCount,
        spy_count: spyCount,
        civilian_word: civilianWord,
        spy_word: spyWord,
        status: 'waiting',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.warn('Supabase 错误，使用演示模式:', error);
      throw error;
    }

    // 切换到等待页面
    showLobby();

  } catch (error) {
    console.log('使用演示模式（无需数据库）');
    // 演示模式：不使用 Supabase 时
    showLobbyDemo();
  }
}

// 显示大厅（演示模式）
function showLobbyDemo() {
  document.getElementById('setup-page').classList.remove('active');
  document.getElementById('lobby-page').classList.add('active');
  
  const displayRoomId = roomId || 'demo_' + Math.random().toString(36).substring(2, 8);
  document.getElementById('room-id-display').textContent = displayRoomId;
  document.getElementById('total-players').textContent = playerCount;

  // 生成二维码 URL
  const baseUrl = window.location.href.replace('index.html', 'player.html');
  const roomUrl = baseUrl + '?room=' + displayRoomId;
  
  console.log('生成二维码 URL:', roomUrl);
  
  // 生成二维码
  try {
    QRCode.toCanvas(document.getElementById('qrcode'), roomUrl, {
      width: 200,
      margin: 2
    }, function(error) {
      if (error) {
        console.error('二维码生成失败:', error);
        document.getElementById('qrcode').innerHTML = '<p style="color:#6366f1;text-align:center;">📱 扫码功能演示<br>URL: ' + roomUrl.substring(0, 50) + '...</p>';
      }
    });
  } catch (e) {
    console.error('QRCode 库未加载:', e);
    document.getElementById('qrcode').innerHTML = '<p style="color:#6366f1;text-align:center;padding:20px;">🎮 演示模式<br>房间号：' + displayRoomId + '</p>';
  }
  
  // 模拟玩家加入
  simulatePlayersJoining();
}

// 显示大厅
function showLobby() {
  document.getElementById('setup-page').classList.remove('active');
  document.getElementById('lobby-page').classList.add('active');

  document.getElementById('room-id-display').textContent = roomId;
  document.getElementById('total-players').textContent = playerCount;

  // 生成二维码
  const roomUrl = window.location.origin + window.location.pathname.replace('index.html', 'player.html') + '?room=' + roomId;
  QRCode.toCanvas(document.getElementById('qrcode'), roomUrl, {
    width: 200,
    margin: 2
  });

  // 监听玩家加入
  listenForPlayers();
}

// 监听玩家加入
async function listenForPlayers() {
  if (!supabase) return;

  // 实时订阅
  supabase
    .channel('room:' + roomId)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` },
      () => {
        updatePlayerCount();
      }
    )
    .subscribe();

  // 初始加载
  updatePlayerCount();
}

// 更新玩家数量
async function updatePlayerCount() {
  if (!supabase) return;

  const { data, error } = await supabase
    .from('players')
    .select('id')
    .eq('room_id', roomId);

  if (error) return;

  const count = data ? data.length : 0;
  document.getElementById('joined-count').textContent = count;

  // 启用开始按钮
  const startBtn = document.getElementById('start-btn');
  if (count >= playerCount) {
    startBtn.disabled = false;
    startBtn.textContent = '开始游戏 Start Game';
  } else {
    startBtn.disabled = true;
    startBtn.textContent = `等待玩家 Waiting (${count}/${playerCount})`;
  }
}

// 模拟玩家加入（演示用）
function simulatePlayersJoining() {
  let count = 0;
  const interval = setInterval(() => {
    count++;
    document.getElementById('joined-count').textContent = count;

    if (count >= playerCount) {
      clearInterval(interval);
      document.getElementById('start-btn').disabled = false;
      document.getElementById('start-btn').textContent = '开始游戏 Start Game';
    }
  }, 1500);
}

// 开始游戏
async function startGame() {
  try {
    // 分配身份
    const assignments = assignRoles(playerCount, spyCount);

    if (!supabase) {
      // 演示模式
      startGameDemo(assignments);
      return;
    }

    // 保存玩家身份
    const { data: playersData } = await supabase
      .from('players')
      .select('id, player_number')
      .eq('room_id', roomId)
      .order('player_number');

    if (playersData) {
      for (let i = 0; i < playersData.length; i++) {
        const player = playersData[i];
        const isSpy = assignments[i] === 'spy';
        const word = isSpy ? spyWord : civilianWord;
        const pinyin = getPinyin(word);

        await supabase
          .from('players')
          .update({
            role: isSpy ? 'spy' : 'civilian',
            word: word,
            pinyin: pinyin,
            has_viewed: false
          })
          .eq('id', player.id);
      }
    }

    // 更新房间状态
    await supabase
      .from('rooms')
      .update({ status: 'playing' })
      .eq('id', roomId);

    // 显示结果页面（房主可见）
    showResult();

  } catch (error) {
    console.error('开始游戏失败:', error);
    startGameDemo(assignRoles(playerCount, spyCount));
  }
}

// 开始游戏（演示模式）
function startGameDemo(assignments) {
  // 在实际应用中，这里会通知所有玩家
  alert('游戏已开始！\n请让玩家扫码查看身份。\n\nGame started!\nPlayers can scan QR to view their words.');
  showResult();
}

// 分配角色
function assignRoles(totalPlayers, spyCount) {
  const roles = Array(totalPlayers).fill('civilian');

  // 随机分配卧底
  const spyIndices = new Set();
  while (spyIndices.size < spyCount) {
    spyIndices.add(Math.floor(Math.random() * totalPlayers));
  }

  spyIndices.forEach(index => {
    roles[index] = 'spy';
  });

  return roles;
}

// 显示结果
function showResult() {
  document.getElementById('lobby-page').classList.remove('active');
  document.getElementById('result-page').classList.add('active');

  document.getElementById('civilian-result').textContent = civilianWord + ' ' + getPinyin(civilianWord);
  document.getElementById('spy-result').textContent = spyWord + ' ' + getPinyin(spyWord);
}

// 新游戏
function newGame() {
  document.getElementById('result-page').classList.remove('active');
  document.getElementById('setup-page').classList.add('active');

  // 重置表单
  randomWords();
  playerCount = 5;
  spyCount = 1;
  document.getElementById('player-count').textContent = playerCount;
  document.getElementById('spy-count').textContent = spyCount;
}

// 页面加载完成
window.addEventListener('DOMContentLoaded', () => {
  // 初始化拼音显示
  const civilianInput = document.getElementById('civilian-word');
  const spyInput = document.getElementById('spy-word');

  civilianInput.addEventListener('input', () => {
    document.getElementById('civilian-pinyin').textContent = getPinyin(civilianInput.value.trim());
  });

  spyInput.addEventListener('input', () => {
    document.getElementById('spy-pinyin').textContent = getPinyin(spyInput.value.trim());
  });
});
