<div align="center">

# 🎓 SkillSync

### Connect • Learn • Grow

**A next-generation mentorship platform that bridges the gap between learners and experts.**

[![Next.js](https://img.shields.io/badge/Next.js-14.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.0-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--time-010101?style=for-the-badge&logo=socket.io)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)



## SkillSync Landing Page
<img width="1895" height="907" alt="Screenshot 2025-11-25 235116" src="https://github.com/user-attachments/assets/430c4658-341f-4f2d-b8a1-c9435877e8d4" />


</div>

## 🌟 Overview

**SkillSync** is a modern, full-stack mentorship platform designed to revolutionize how people learn and share knowledge. Whether you're a student seeking guidance or a mentor eager to share your expertise, SkillSync creates meaningful connections that foster growth and learning.

### 💡 The Problem We Solve

In today's fast-paced world, finding the right mentor or student is challenging. Traditional platforms lack:
- **Real-time Communication** - Delayed responses hinder learning momentum
- **Organized Content Sharing** - Scattered resources make learning inefficient  
- **Skill-Based Matching** - Generic connections don't align with specific learning goals
- **Progress Tracking** - No way to measure growth or provide feedback

### ✨ Our Solution

SkillSync addresses these challenges with:
- 🔗 **Smart Matching** - Connect based on specific skills and expertise
- 💬 **Real-Time Chat** - Instant messaging powered by Socket.io
- 📚 **Learning Spaces** - Organized hubs for sharing notes, resources, and files
- ⭐ **Review System** - Rate mentors and build trust within the community
- 🔔 **Smart Notifications** - Stay updated on messages, connections, and new content

## 🚀 Features

<table>
<tr>
<td width="50%">

### 👨‍🎓 For Students

- **Browse & Connect**
  - Search mentors by skills, ratings, or availability
  - Advanced filtering and sorting options
  - View mentor profiles with expertise and reviews

- **Learning Management**
  - Access skill-based learning groups
  - View and download shared materials
  - Track progress with multiple mentors

- **Communication**
  - Real-time chat with mentors
  - Notification system for important updates
  - Message history and unread indicators

- **Feedback System**
  - Leave reviews and ratings
  - Help others find quality mentors
  - Build a learning portfolio

</td>
<td width="50%">

### 👨‍🏫 For Mentors

- **Student Management**
  - Accept/decline connection requests
  - View student profiles and learning goals
  - Track active mentorships

- **Content Sharing**
  - Create skill-based learning groups
  - Upload notes, resources, and files
  - Organize materials with tags and categories

- **Communication Hub**
  - Chat with multiple students
  - Broadcast updates to learning groups
  - Manage conversations efficiently

- **Reputation Building**
  - Receive student reviews and ratings
  - Earn "Top Rated" badges
  - Showcase expertise and impact

</td>
</tr>
</table>

## 🎨 User Interface

<div align="center">

## Student Dashboard
<img width="1900" height="900" alt="Screenshot 2025-11-26 221111" src="https://github.com/user-attachments/assets/c0942455-0b94-4ca7-96c6-f84172c93576" />

## Mentor Dashboard  
<img width="1896" height="908" alt="Screenshot 2025-11-26 221258" src="https://github.com/user-attachments/assets/2d40b7e0-5a54-44f3-990b-565cc725d56d" />


### Real-Time Chat
![Chat Interface](https://via.placeholder.com/800x450/10b981/ffffff?text=Real-Time+Chat)

### Review System
![Review System](https://via.placeholder.com/800x450/f59e0b/ffffff?text=Review+%26+Rating+System)

</div>

## 🏗️ Architecture

### System Architecture Diagram

```mermaid
graph TB
    subgraph Client["Client Layer"]
        A["Next.js Frontend<br/>React Components"]
    end
    
    subgraph Application["Application Layer"]
        B["Next.js API Routes<br/>REST Endpoints"]
        C["Socket.io Server<br/>WebSocket Handler"]
    end
    
    subgraph Data["Data Layer"]
        D["Prisma ORM<br/>Query Builder"]
        E[("PostgreSQL<br/>Database")]
    end
    
    subgraph External["External Services"]
        F["File Storage<br/>Uploads & Assets"]
        G["Authentication<br/>JWT/Sessions"]
    end
    
    A -->|HTTP/HTTPS| B
    A -->|WebSocket| C
    B -->|Queries| D
    C -->|Real-time Events| D
    D -->|SQL| E
    
    F -.->|Static Assets| A
    G -.->|Auth Tokens| B
    
    style A fill:#6366f1,stroke:#4f46e5,color:#fff,stroke-width:2px
    style B fill:#8b5cf6,stroke:#7c3aed,color:#fff,stroke-width:2px
    style C fill:#10b981,stroke:#059669,color:#fff,stroke-width:2px
    style D fill:#f59e0b,stroke:#d97706,color:#fff,stroke-width:2px
    style E fill:#ef4444,stroke:#dc2626,color:#fff,stroke-width:2px
    style F fill:#06b6d4,stroke:#0891b2,color:#fff,stroke-width:2px
    style G fill:#ec4899,stroke:#db2777,color:#fff,stroke-width:2px
```

### Data Flow Architecture

```mermaid
sequenceDiagram
    participant U as User Browser
    participant N as Next.js App
    participant A as API Routes
    participant S as Socket.io
    participant P as Prisma ORM
    participant D as PostgreSQL
    
    U->>N: Request Page
    N->>A: Fetch Data (HTTP)
    A->>P: Query Database
    P->>D: Execute SQL
    D-->>P: Return Data
    P-->>A: Format Response
    A-->>N: Send JSON
    N-->>U: Render Page
    
    U->>S: Connect WebSocket
    S->>P: Subscribe to Events
    U->>S: Send Message
    S->>P: Save Message
    P->>D: Insert Record
    S-->>U: Broadcast to Recipients
```

### 🛠️ Technology Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | Next.js 14 (App Router), React 18, CSS Modules, React Hot Toast |
| **Backend** | Next.js API Routes, Prisma ORM, PostgreSQL, Socket.io |
| **Real-time** | Socket.io for WebSocket connections, Event-driven architecture |
| **Database** | PostgreSQL 14+, Prisma migrations, Relational data modeling |
| **Authentication** | NextAuth.js, JWT tokens, Session management |
| **File Handling** | Multipart form data, Local file storage, Download API |
| **Deployment** | Vercel (Frontend), Railway/Heroku (Database), Docker support |

### Key Components

#### Frontend Architecture
```
Next.js App Router
├── Pages (RSC - React Server Components)
├── Client Components (Interactive UI)
├── API Route Handlers
└── WebSocket Client Context
```

#### Backend Architecture
```
API Layer
├── RESTful Endpoints
├── Socket.io Server
├── Prisma Client
└── Database Connection Pool
```

#### Database Schema Highlights
- **Users**: Student & Mentor profiles with skills
- **Connections**: Many-to-many mentor-student relationships
- **Messages**: Real-time chat history with read receipts
- **SkillGroups**: Learning spaces for content sharing
- **Notes**: File attachments and learning materials
- **Reviews**: Rating and feedback system

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/skillsync.git
cd skillsync

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Configure your .env.local file
DATABASE_URL="postgresql://user:password@localhost:5432/skillsync"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Run database migrations
npx prisma migrate dev
npx prisma generate

# Seed the database (optional)
npx prisma db seed

# Start the development server
npm run dev
```

Visit `http://localhost:3000` to see your application running! 🎉

## 🗂️ Project Structure

```
skillsync/
├── app/
│   ├── api/                    # API routes
│   │   ├── connections/        # Connection management
│   │   ├── messages/           # Chat functionality
│   │   ├── reviews/            # Review system
│   │   ├── skill-groups/       # Learning groups
│   │   └── users/              # User management
│   ├── components/             # Reusable components
│   │   ├── ChatWindow.js       # Real-time chat
│   │   ├── LearningSpace.js    # Content sharing
│   │   └── icons.js            # SVG icons
│   ├── context/                # React Context
│   │   └── SocketContext.js    # WebSocket management
│   ├── dashboard/              # Dashboard pages
│   │   ├── student/            # Student interface
│   │   └── mentor/             # Mentor interface
│   └── lib/                    # Utilities
│       └── prisma.js           # Database client
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Database migrations
├── public/
│   └── uploads/                # User-uploaded files
└── server.js                   # Socket.io server
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/skillsync"

# Authentication
NEXTAUTH_SECRET="your-super-secret-key-change-this"
NEXTAUTH_URL="http://localhost:3000"

# Socket.io (if using separate server)
SOCKET_PORT=3001

# File Upload
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_FILE_TYPES=".pdf,.doc,.docx,.txt,.jpg,.png"
```

### Database Schema

Our database uses **Prisma ORM** with PostgreSQL. Key models include:

- **User** - Student and mentor profiles
- **Skill** - Skills taxonomy
- **Connection** - Mentor-student relationships
- **Message** - Chat messages
- **SkillGroup** - Learning groups
- **Note** - Shared learning materials
- **Review** - Ratings and feedback

## 📚 API Documentation

### Authentication

```javascript
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
```

### Users

```javascript
GET    /api/users              // List all users
GET    /api/users/:id          // Get user profile
PATCH  /api/users/:id          // Update user
```

### Connections

```javascript
GET    /api/connections?userId=:id       // Get connections
POST   /api/connections                  // Create connection
PATCH  /api/connections/:id              // Update status
```

### Messages

```javascript
GET    /api/messages?connectionId=:id   // Get chat history
POST   /api/messages                     // Send message
```

### Reviews

```javascript
GET    /api/reviews?mentorId=:id        // Get mentor reviews
POST   /api/reviews                      // Submit review
```

### Skill Groups

```javascript
GET    /api/skill-groups?mentorId=:id   // Get mentor's groups
POST   /api/skill-groups                 // Create group
GET    /api/skill-groups/:id             // Get group details
```

## 🔌 WebSocket Events

SkillSync uses Socket.io for real-time features:

### Client → Server

```javascript
socket.emit('join-room', { userId, connectionId });
socket.emit('send-message', { connectionId, message });
socket.emit('typing', { connectionId });
```

### Server → Client

```javascript
socket.on('message-notification', (data) => { /* New message */ });
socket.on('connection-update', (data) => { /* Status change */ });
socket.on('note-added', (data) => { /* New learning material */ });
```

## 🎯 Usage Examples

### For Students

1. **Sign up** and select skills you want to learn
2. **Browse mentors** using search and filters
3. **Send connection requests** to mentors
4. **Chat in real-time** once connected
5. **Access learning materials** from skill groups
6. **Leave reviews** to help the community

### For Mentors

1. **Sign up** and showcase your expertise
2. **Review connection requests** from students
3. **Create skill groups** for organized teaching
4. **Upload learning materials** (notes, files, resources)
5. **Chat with students** to answer questions
6. **Build your reputation** through reviews

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Generate test coverage
npm run test:coverage
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Docker

```bash
# Build image
docker build -t skillsync .

# Run container
docker run -p 3000:3000 skillsync
```

### Environment Setup

1. Set up PostgreSQL database
2. Configure environment variables
3. Run migrations: `npx prisma migrate deploy`
4. Start the application

## 🤝 Contributing

We love contributions! Here's how you can help:

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Coding Standards

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

### Areas We Need Help

- 🐛 Bug fixes
- ✨ New features
- 📝 Documentation improvements
- 🎨 UI/UX enhancements
- 🌍 Internationalization
- ♿ Accessibility improvements

## 🗺️ Roadmap

### Version 2.0 (Q1 2025)

- [ ] Video call integration
- [ ] Calendar scheduling system
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] AI-powered mentor recommendations

### Version 2.5 (Q2 2025)

- [ ] Group learning sessions
- [ ] Certification system
- [ ] Payment integration for premium features
- [ ] Multi-language support
- [ ] Progressive Web App (PWA)

### Version 3.0 (Q3 2025)

- [ ] Whiteboard collaboration
- [ ] Course creation platform
- [ ] Community forums
- [ ] Gamification and achievements
- [ ] API for third-party integrations

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 SkillSync

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## 🙏 Acknowledgments

[Next.js](https://nextjs.org/) - The React framework for production  
[Prisma](https://www.prisma.io/) - Next-generation ORM  
[Socket.io](https://socket.io/) - Real-time engine  
[React Hot Toast](https://react-hot-toast.com/) - Notification system  
All our amazing [contributors](https://github.com/yourusername/skillsync/graphs/contributors)

### 💝 Show Your Support

If you find SkillSync helpful, please consider:

⭐ Starring the repository  
🐛 Reporting bugs  
💡 Suggesting new features  
📢 Sharing with others

**Made with ❤️ by Upasana**

[Back to Top ⬆](#-skillsync)
