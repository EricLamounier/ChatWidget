(() => {
  const wsURL = (window.ChatWidgetConfig && window.ChatWidgetConfig.server) || 'ws://localhost:3001';
  const socket = new WebSocket(wsURL);
  let isOnline = false; // Variável para controlar o status online/offline

  const style = document.createElement('style');
  style.innerHTML = `
    .chat-messages::-webkit-scrollbar { width: 6px; }
    .chat-messages::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 3px; }
    .chat-messages::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 3px; }
    .chat-messages::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
    
    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 6px;
    }
    
    .online {
      background-color: #10B981;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
    }
    
    .offline {
      background-color: #F59E0B;
      box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.3);
    }
    
    .chat-button-tooltip {
      position: absolute;
      bottom: 100%;
      right: 0;
      margin-bottom: 10px;
      background: #1E40AF;
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      white-space: nowrap;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: none;
    }
    
    .chat-button-tooltip:after {
      content: '';
      position: absolute;
      top: 100%;
      right: 12px;
      border-width: 5px;
      border-style: solid;
      border-color: #1E40AF transparent transparent transparent;
    }
    
    #chatButton:hover .chat-button-tooltip {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);

  const container = document.createElement('div');
  container.innerHTML = `
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://unpkg.com/lucide@latest/dist/lucide.min.css" rel="stylesheet">

    <div id="chatWidget" class="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <div id="chatWindow" class="hidden mb-4 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col transform transition-all duration-300 ease-in-out">
        <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square-text">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                <path d="M13 8H7"/>
                <path d="M17 12H7"/>
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-sm flex items-center">
                <span id="statusIndicator" class="status-indicator ${isOnline ? 'online' : 'offline'}"></span>
                Suporte Online
              </h3>
              <p id="statusMessage" class="text-xs text-blue-100">${isOnline ? 'Estamos aqui para ajudar' : 'Estamos offline no momento'}</p>
            </div>
          </div>
          <button id="closeChat" class="text-white hover:text-blue-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
        <div id="chatMessages" class="chat-messages flex-1 overflow-y-auto p-4 bg-gray-50"></div>
        <div class="p-4 border-t border-gray-200 bg-white">
          <div class="flex space-x-2">
            <input type="text" id="messageInput" placeholder="Digite sua mensagem..."
              class="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
            <button id="sendMessage" class="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-send-horizontal">
                <path d="M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z"/>
                <path d="M6 12h16"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      <button id="chatButton"
        class="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all flex items-center justify-center relative">
        <div class="chat-button-tooltip">Abrir atendimento</div>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square-text">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <path d="M13 8H7"/>
          <path d="M17 12H7"/>
        </svg>
      </button>
    </div>
  `;
  document.body.appendChild(container);

  const chatButton = document.getElementById('chatButton');
  const chatWindow = document.getElementById('chatWindow');
  const closeChat = document.getElementById('closeChat');
  const messageInput = document.getElementById('messageInput');
  const sendMessage = document.getElementById('sendMessage');
  const chatMessages = document.getElementById('chatMessages');
  const statusIndicator = document.getElementById('statusIndicator');
  const statusMessage = document.getElementById('statusMessage');

  // Função para atualizar o status
  function updateStatus(online) {
    isOnline = online;
    statusIndicator.className = `status-indicator ${online ? 'online' : 'offline'}`;
    statusMessage.textContent = online ? 'Estamos aqui para ajudar' : 'Estamos offline no momento';
  }

  // Simulação de mudança de status (substitua por lógica real)
  socket.onopen = () => {
    updateStatus(true); // Online quando a conexão é estabelecida
  };

  socket.onclose = () => {
    updateStatus(false); // Offline quando a conexão é perdida
  };

  function toggleChat() {
    chatWindow.classList.toggle('hidden');
    if (!chatWindow.classList.contains('hidden')) {
      chatWindow.style.transform = 'translateY(0) scale(1)';
      setTimeout(() => messageInput.focus(), 200);
    } else {
      chatWindow.style.transform = 'translateY(20px) scale(0.95)';
    }
  }

  function addMessage(msg, fromUser = true) {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex mb-3 ' + (fromUser ? 'justify-end' : 'justify-start');

    const bubble = document.createElement('div');
    bubble.className = (fromUser
      ? 'bg-blue-600 text-white rounded-tr-none'
      : 'bg-white text-gray-800 border rounded-tl-none') +
      ' max-w-xs px-4 py-2 rounded-lg text-sm shadow';
      
    bubble.textContent = msg;
    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  socket.onmessage = (event) => {
    try {
      const { sender, message } = JSON.parse(event.data);
      if (sender === 'admin') {
        addMessage(message, false);
      }
    } catch (e) {
      console.error('[ChatWidget] Erro ao processar mensagem:', e);
    }
  };

  sendMessage.onclick = () => {
    const msg = messageInput.value.trim();
    if (!msg) return;
    addMessage(msg, true);
    socket.send(JSON.stringify({ sender: 'user', message: msg }));
    messageInput.value = '';
  };

  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage.click();
  });

  chatButton.onclick = toggleChat;
  closeChat.onclick = toggleChat;

  // Adiciona mensagem inicial quando o chat é aberto pela primeira vez
  chatButton.addEventListener('click', function firstClick() {
    if (chatMessages.children.length === 0) {
      addMessage(isOnline ? 
        'Olá! Como podemos ajudar você hoje?' : 
        'No momento nosso atendimento está offline. Deixe sua mensagem e responderemos assim que possível.', 
        false
      );
    }
    chatButton.removeEventListener('click', firstClick);
  }, { once: true });
})();