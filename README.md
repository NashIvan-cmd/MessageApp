## Project Focus

This project goes beyond basic CRUD operations to explore and apply advanced concepts and best practices in modern web development, including:

- **Real-time communication** with WebSockets  
- **Enhanced error message UI** for improved user experience and debugging  
- **Authorization** and authentication strategies, including:  
  - Custom JWT validation middleware  
  - Role-based access control (RBAC)  
- **Centralized error handling middleware** for consistent and maintainable error management  
- **Request logging** using Winston or Morgan for detailed monitoring and troubleshooting  
- **Rate limiting middleware** to protect against spam, abuse, and DDoS attacks  

The goal is to build a robust, secure, and scalable application while deepening practical knowledge in middleware architecture, security, and real-time features.

So far I have learned that socket.io have 
- listen -> socket.on('event', data) -> handles incoming events from server to frontend
- emit -> socket.emit('event', data) -> sends event and data to the server
- broadcast -> socket.broadcast.emit('event', data) -> sends to everyone to client side except yourself
- global -> io.emit('event', ...) -> sends to everyone including you
