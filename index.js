const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

let clients = [];
const PORT = 3001;

wss.on('connection', (ws) => {
  console.log('[WS] Cliente conectado');
  clients.push(ws);
  
  ws.send(JSON.stringify({type: 1, message: 'Olá, como podemos te ajudar?', options: [{option: 'Falar com atendente', id: 1}, {option: 'Outro', id: 1}]}))

  ws.on('message', (message) => {
    const json = JSON.parse(message.toString());
	console.log('[WS] Mensagem recebida:', json);

    // Broadcast para todos os outros clientes
    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({type: 0, message: json.message}));
      }
    });
  });

  ws.on('close', () => {
    console.log('[WS] Cliente desconectado');
    clients = clients.filter((client) => client !== ws);
  });
});

// 🔧 Rota HTTP para enviar mensagem para todos conectados
app.post('/send-message', (req, res) => {
  const { sender = 'admin', message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Mensagem não informada' });
  }

  const payload = JSON.stringify({ sender, message });
  console.log('[HTTP] Enviando mensagem via WebSocket:', payload);

  let count = 0;

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
		  type: 1,
		  message: 'teste',
		  options: [
		  {option: 'op1', id: 1},
		  {option: 'op2', id: 2}
		  ]
	  }));
      count++;
    }
  });

  res.json({ status: 'Mensagem enviada', clientsOnline: count });
});

app.get('/check', (req, res) => {
	res.status(200).json({status: 'ativo'})
})

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
