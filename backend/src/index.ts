import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { availableParallelism } from 'node:os';
import cluster from 'node:cluster';
import { createAdapter, setupPrimary } from '@socket.io/cluster-adapter';
import { disconnect } from 'node:process';


const db = await open({ 
  filename: 'chat.db',
  driver: sqlite3.Database
});

await db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_offset TEXT UNIQUE,
      content TEXT
  );
`);

if (cluster.isPrimary) {
  const numCPUs = availableParallelism();

  const arr = [];
  // create one worker per core
  for (let i = 0; i < 3; i++) {
    cluster.fork({
      PORT: 3001 + i
    });
  }

  setupPrimary();
} else {
  const app = express();
  app.use(cors());
  app.use(express.json());
  const httpServer = createServer(app);
  const io = new Server(httpServer, { 
    connectionStateRecovery: {},
    adapter: createAdapter()
  });

  const __dirname = dirname(fileURLToPath(import.meta.url));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

const onlineUsersArr: any  = [];
const port = process.env.PORT || 3001;
io.on("connection", async (socket) => {
  socket.emit('connectGiveNickname', port);
  onlineUsersArr.push(port);
  onlineUsersArr.forEach((element: any) => {
    console.log(element);
  });
  io.emit('chat message', `User connected ${port}`);
  io.emit('online users', onlineUsersArr);
  // Nickname for now is equal to the port

  socket.on('disconnect', () => {
    console.log('a user disconnected: ', port);
    io.emit('chat message', `User Disconnected ${port}`);
    onlineUsersArr.forEach((element: any) => {
      const index = onlineUsersArr.indexOf(port);

      const x = onlineUsersArr.splice(index, 1);
      console.log(x);
    });
    console.log("New array of online users", onlineUsersArr);

    socket.broadcast.emit('disconnected', port);
  });

  socket.on('chat message', async (msg) => {
    let result;
    try {
      result = await db.run('INSERT INTO messages (content) VALUES (?)', msg);
    } catch (error) {
      console.error('Erorr trying db run', error);
      return
    }
    
    console.log('message', msg);
    io.emit('chat message', msg, result.lastID);
  });

  socket.on('typing', (socketId) => { 
    socket.broadcast.emit('typing', `${socketId} is typing`);
    // console.log(`${socketId} is typing`);
  })

   if (!socket.recovered) {
    // if the connection state recovery was not successful
    try {
      await db.each('SELECT id, content FROM messages WHERE id > ?',
        [socket.handshake.auth.serverOffset || 0],
        (_err, row) => {
          socket.emit('chat message', row.content, row.id);
        }
      )
    } catch (e) {
      // something went wrong
    }
  }
  });

  httpServer.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
  });
}



// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });
