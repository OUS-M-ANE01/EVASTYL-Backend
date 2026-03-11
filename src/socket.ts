import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';

interface ConnectedUser {
  userId: string;
  socketId: string;
  role: 'admin' | 'user';
}

const connectedUsers: Map<string, ConnectedUser> = new Map();

export const initializeSocket = (server: HTTPServer) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`✅ Socket connecté: ${socket.id}`);

    // Connexion d'un utilisateur
    socket.on('user:connect', ({ userId, role }: { userId: string; role: 'admin' | 'user' }) => {
      connectedUsers.set(userId, {
        userId,
        socketId: socket.id,
        role,
      });

      // Joindre la room admin si c'est un admin
      if (role === 'admin') {
        socket.join('admin-room');
        console.log(`👤 Admin ${userId} connecté à admin-room`);
      }

      console.log(`👤 Utilisateur connecté: ${userId} (${role})`);
      
      // Envoyer la liste des utilisateurs connectés aux admins
      io.to('admin-room').emit('users:online', {
        count: connectedUsers.size,
        users: Array.from(connectedUsers.values()),
      });
    });

    // Déconnexion
    socket.on('disconnect', () => {
      // Trouver et supprimer l'utilisateur déconnecté
      for (const [userId, user] of connectedUsers.entries()) {
        if (user.socketId === socket.id) {
          connectedUsers.delete(userId);
          console.log(`👤 Utilisateur déconnecté: ${userId}`);
          
          // Notifier les admins
          io.to('admin-room').emit('users:online', {
            count: connectedUsers.size,
            users: Array.from(connectedUsers.values()),
          });
          break;
        }
      }
      console.log(`❌ Socket déconnecté: ${socket.id}`);
    });
  });

  return io;
};

// Fonctions utilitaires pour émettre des événements depuis les controllers
export const emitToAdmins = (io: Server, event: string, data: any) => {
  io.to('admin-room').emit(event, data);
};

export const emitToUser = (io: Server, userId: string, event: string, data: any) => {
  const user = connectedUsers.get(userId);
  if (user) {
    io.to(user.socketId).emit(event, data);
  }
};

export const emitToAll = (io: Server, event: string, data: any) => {
  io.emit(event, data);
};

export default initializeSocket;
