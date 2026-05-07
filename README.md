# 🎓 AceAI StudyHub Portal

**AceAI StudyHub** is a powerful, AI-integrated collaborative learning platform designed to make remote studying more engaging, structured, and effective. Students can join live video study rooms, collaborate on shared resources, and get real-time guidance from a dedicated AI teacher.

---

## ✨ Key Features

- **🤖 AI Teacher (Gemini Powered)**: Get instant help within study rooms. The AI can answer questions, provide step-by-step guidance, and generate session summaries.
- **📹 Multi-Peer Video Rooms**: High-quality, real-time video and audio collaboration using WebRTC.
- **📚 Global Study Materials**: A centralized repository to browse, search, and download study resources shared by the community.
- **🏆 Gamification System**: Earn badges and points for active participation, sharing resources, and helping others.
- **🏛️ Community Forum**: A space to ask questions, share insights, and discuss topics with peers.
- **📅 Study Scheduler**: Organize and join upcoming study sessions with automated reminders.

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS & Shadcn/UI
- **Icons**: Lucide React
- **State Management**: React Context API
- **Real-time**: WebRTC & WebSockets

### Backend

- **Framework**: Django & Django REST Framework
- **Asynchronous**: Django Channels (ASGI)
- **Database**: MySQL (Production) / SQLite (Development)
- **AI Integration**: Google Gemini API
- **Authentication**: JWT-based secure auth

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- MySQL Server

### 1. Clone the Repository

```bash
git clone https://github.com/Mallesh-1124/Virtual_Study_Groups.git
cd Virtual_Study_Groups
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```

**Configure Environment Variables:**
Create a `.env` file in the `backend/` directory (use `.env.example` as a template):

```env
SECRET_KEY=your_secret_key
DEBUG=True
DB_NAME=virtual_study_group
DB_USER=root
DB_PASSWORD=your_password
GEMINI_API_KEY=your_gemini_key
```

**Run Migrations & Seed Data:**

```bash
python manage.py migrate
python seed_badges.py
python manage.py runserver
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the portal.

---

## 🐳 Docker Deployment

The project is containerized for production readiness.

**Backend:**

```bash
cd backend
docker build -t vsg-backend .
```

**Frontend:**

```bash
cd frontend
docker build -t vsg-frontend .
```

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙌 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
