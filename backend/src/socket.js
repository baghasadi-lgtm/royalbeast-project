let io = null;

export const initSocket = (socketServer) => {
  io = socketServer;

  io.on('connection', (socket) => {
    socket.on('join:kapster', (kapsterId) => {
      if (kapsterId) socket.join(`kapster:${kapsterId}`);
    });

    socket.on('join:admin', () => {
      socket.join('admin:orders');
    });

    socket.on('join:queue', (queueNumber) => {
      if (queueNumber) {
        socket.join(`queue:${queueNumber}`);
        socket.join('queue:public');
      }
    });

    socket.on('leave:queue', (queueNumber) => {
      if (queueNumber) socket.leave(`queue:${queueNumber}`);
    });

    socket.on('disconnect', () => {});
  });

  return io;
};

export const getIO = () => io;

export const emitNewOrder = (kapsterId, payload) => {
  if (!io) return;
  if (kapsterId) {
    io.to(`kapster:${kapsterId}`).emit('new_order', payload);
  }
  io.to('admin:orders').emit('new_order', payload);
  io.to('queue:public').emit('queue_update', payload);
};

export const emitOrderStatus = (payload) => {
  if (!io) return;
  const { kapsterId, queueNumber, status } = payload;

  if (kapsterId) {
    io.to(`kapster:${kapsterId}`).emit('order_status', payload);
  }
  if (queueNumber) {
    io.to(`queue:${queueNumber}`).emit('order_status', payload);
  }
  io.to('queue:public').emit('queue_update', payload);
};

export const emitOrderPayment = (payload) => {
  if (!io) return;
  io.emit('order_payment', payload);
};
