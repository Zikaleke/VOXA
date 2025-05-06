# Architecture Overview

## Overview

This repository contains a full-stack messaging application (TeleClone) built with a React frontend and Express.js backend. The application provides real-time communication features including conversations, groups, channels, and calls. It follows a modern web application architecture with a clear separation between client and server components.

## System Architecture

The system follows a client-server architecture with the following main components:

1. **Frontend**: React-based SPA (Single Page Application) with a component-based architecture using Shadcn UI components.
2. **Backend**: Express.js server that handles API requests, authentication, and WebSocket connections.
3. **Database**: PostgreSQL database (via Neon's serverless Postgres) with Drizzle ORM for database interactions.
4. **Real-time Communication**: WebSocket-based real-time messaging system for instant communication.

### Architecture Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│   React Client  │<────│  Express Server  │<────│  PostgreSQL DB  │
│                 │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        ▲                      ▲
        │                      │
        ▼                      ▼
┌─────────────────┐     ┌──────────────────┐
│                 │     │                  │
│ WebSocket Conn. │<────│  WebSocket Serv. │
│                 │     │                  │
└─────────────────┘     └──────────────────┘
```

## Key Components

### Frontend

- **Framework**: React with TypeScript
- **State Management**: Mix of React Context and React Query
- **Routing**: Wouter (lightweight router)
- **UI Components**: Custom components built on top of Radix UI primitives using Shadcn UI approach
- **Styling**: Tailwind CSS with a custom theme configuration
- **Build Tool**: Vite

The frontend is organized into the following structure:
- `client/src/components`: UI components, including reusable UI primitives
- `client/src/contexts`: Context providers for global state (Auth, Conversations, Socket)
- `client/src/hooks`: Custom React hooks
- `client/src/lib`: Utility functions and services
- `client/src/pages`: Page components that correspond to routes
- `client/src/types`: TypeScript type definitions

### Backend

- **Framework**: Express.js with TypeScript
- **Authentication**: JWT-based authentication with token storage
- **Real-time Communication**: WebSocket server using the 'ws' library
- **File Uploads**: Multer for handling multipart/form-data
- **Database Access**: Drizzle ORM for type-safe database operations

The backend is organized into the following structure:
- `server/index.ts`: Main entry point that sets up the Express application
- `server/routes.ts`: API route definitions
- `server/auth.ts`: Authentication logic and middleware
- `server/storage.ts`: Data access layer using Drizzle ORM
- `server/websocket.ts`: WebSocket server for real-time communication
- `server/vite.ts`: Development server configuration for Vite

### Database

- **Engine**: PostgreSQL (via Neon's serverless offering)
- **ORM**: Drizzle ORM with a schema-first approach
- **Migration**: Drizzle Kit for schema migrations

The database schema includes entities for:
- Users and authentication
- Conversations and messages
- Groups and channels
- Media files and reactions
- Calls and notifications

### Authentication Flow

1. User registers with email, username, and password
2. Email verification code is sent
3. User verifies email with code
4. JWT token is issued upon login
5. Token is stored in localStorage and used for API authentication
6. WebSocket connections are authenticated using the same token

## Data Flow

### Request Flow

1. **Client Request**: The React client makes API requests to the Express server
2. **Authentication**: Requests are authenticated using JWT middleware
3. **Data Access**: Server accesses the database through Drizzle ORM
4. **Response**: Server sends back JSON responses
5. **Client State Update**: Client updates local state using React Query or Context

### Real-time Communication Flow

1. **Connection**: Client establishes WebSocket connection
2. **Authentication**: Connection is authenticated using JWT
3. **Subscription**: Client subscribes to relevant topics (conversations, etc.)
4. **Message Exchange**: Messages are exchanged in real-time between clients
5. **State Update**: UI is updated based on received messages

## External Dependencies

### Frontend Dependencies

- **@radix-ui**: UI primitives for accessible components
- **@tanstack/react-query**: Data fetching and caching
- **class-variance-authority**: Component styling utility
- **clsx**: Conditional class name utility
- **wouter**: Lightweight routing library
- **zod**: Schema validation

### Backend Dependencies

- **@neondatabase/serverless**: Serverless Postgres client
- **bcryptjs**: Password hashing
- **drizzle-orm**: Database ORM
- **jsonwebtoken**: JWT authentication
- **multer**: File upload handling
- **ws**: WebSocket server

## Deployment Strategy

The application is designed to be deployed on Replit, as evidenced by the `.replit` configuration file. The deployment process includes:

1. **Build Process**: 
   - Frontend: Vite builds the React application
   - Backend: esbuild bundles the server code
   - Combined build output is placed in the `dist` directory

2. **Runtime Environment**:
   - Node.js 20 runtime
   - Environment variables for database connection and JWT secrets

3. **Database**:
   - Neon serverless PostgreSQL database
   - Connection via environment variables

4. **Start Command**:
   - Production: `NODE_ENV=production node dist/index.js`
   - Development: `tsx server/index.ts`

5. **Port Configuration**:
   - Local port: 5000
   - External port: 80

## Development Workflow

1. **Local Development**:
   - `npm run dev`: Starts the development server
   - `npm run check`: TypeScript type checking
   - `npm run db:push`: Updates the database schema
   - `npm run db:seed`: Seeds the database with initial data

2. **Database Migrations**:
   - Schema defined in `shared/schema.ts`
   - Migrations managed by Drizzle Kit

3. **Building for Production**:
   - `npm run build`: Builds both client and server for production

## Security Considerations

1. **Authentication**: JWT-based with secure token handling
2. **Password Security**: bcrypt for password hashing
3. **Input Validation**: Zod schemas for request validation
4. **CORS**: Managed by Express middleware
5. **Rate Limiting**: Not explicitly implemented in the current codebase