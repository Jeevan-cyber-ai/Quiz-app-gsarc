# Full-Stack Quiz Application

Welcome to the **Full-Stack Quiz Application**! This project is a comprehensive platform designed for organizing, managing, and participating in quizzes. It is built using the highly scalable **MERN** stack (MongoDB, Express, React, Node.js).

The application is structured to serve two primary user roles:
1. **Admins:** Can create quiz events, upload questions, and monitor student performance.
2. **Students:** Can register, read instructions, take quizzes, and view their detailed results.

---

## 🏗 Project Architecture

The project is structured entirely as a monorepo containing both the `frontend/` and `backend/` directories. 

### 1. Frontend (`frontend/` directory)
The client-side application is a Single Page Application (SPA) built for a seamless user experience.
- **Framework:** React 19 powered by Vite for blazing-fast development and optimized production builds.
- **Styling:** Tailwind CSS 4 to ensure a beautiful, fully responsive, and highly customizable UI.
- **Routing:** React Router v7 for smooth navigation without page reloads.
- **Data Visualization:** Recharts for rendering insightful analytics and results.
- **Icons:** Lucide React for consistent, aesthetically pleasing iconography.

#### Key Frontend Pages:
- **`Login & Register:`** Secure user authentication interface.
- **`Admin Dashboard:`** The central command hub where administrators manage events, view questions, and analyze performance.
- **`Instructions:`** Details that students must review before attempting any quiz.
- **`Quiz:`** The core quiz-taking interface with active timers and question navigation.
- **`MyResultPage:`** Detailed breakdown of a student's quiz performance.

### 2. Backend (`backend/` directory)
The server-side application is a robust RESTful API that handles business logic, security, and data management.
- **Servers:** Node.js with Express.js.
- **Database:** MongoDB (via Mongoose) featuring structured models for `User`, `Questions`, and `Events`.
- **Authentication:** JSON Web Tokens (JWT) combined with `bcryptjs` for secure password hashing and authorization.
- **File Uploads & Parsing:** Utilizes `multer` for receiving files and `xlsx` for parsing uploaded Excel sheets directly into the database—perfect for bulk question importing.
- **Email Delivery:** Integrated `nodemailer` to automatically send out notifications or registration confirmations.
- **Middleware:** Employs standard best practices like CORS and custom environment configurations.

#### Key Backend Routes:
- **`authRoutes.js`:** Handles signups, logins, and token generation.
- **`adminRoutes.js`:** Protected routes that grant Admins the ability to upload questions, create events, and fetch aggregated data.
- **`studentRoutes.js`:** Protected routes catering specifically to fetching quiz data and submitting results.

---

## ⚡ Prerequisites

Before you start, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (Version 18 or above recommended)
- Your own MongoDB instance, or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster URI.

---

## 🛠 Installation & Setup

1. **Clone & Open:**
   Open this root directory (`my-quiz`) in your favorite code editor (e.g., VS Code).

2. **Install All Dependencies (Root Level):**
   The root directory contains a master `package.json` powered by `concurrently` that makes local development breezy. Install all packages across the root, frontend, and backend automatically:
   ```bash
   npm run install:all
   ```

3. **Configure Environment Variables:**
   You will need to set up local environment variables for the system to run correctly.
   - **Backend Environment:** 
     Inside the `backend/` folder, create a `.env` file. You will likely need variables such as:
     ```env
     PORT=5000
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_super_secret_jwt_key
     ```
   - **Frontend Environment (Optional):**
     If the frontend requires localized URLs (like `VITE_API_BASE_URL`), create a `.env` file in the `frontend/` folder.

---

## 🚀 Running the Application

To run both the server (Backend) and the client (Frontend) simultaneously you only need one terminal instance open at the root of the project.

```bash
npm run dev
```

What happens under the hood?
- **Backend:** Starts running the Express server (typically `http://localhost:5000`).
- **Frontend:** Starts the Vite development server (typically `http://localhost:5173`).

---

## 🔥 Features Summary
- **Bulk Question Uploading:** Admins can save immense time by uploading questions via `.xlsx` Excel files.
- **Role-Based Access Control:** Highly secure endpoints; Admins cannot access Student workflows and vice versa.
- **Live Timers & Restrictions:** Students have a bounded testing environment.
- **Advanced Anti-Cheat & Proxy Detection:**
  - Detects if students switch tabs or lose window focus.
  - Detects if the cursor leaves the window bounds.
  - Disables right-clicking, copying, pasting, and keyboard shortcuts used to open Developer Tools.
  - Logs violations and automatically terminates and submits the quiz if a maximum threshold is reached.
- **Actionable Insights:** Results are cleanly documented through interactive charts on the frontend.
- **Modern Security Rules:** User passwords are encrypted, and API endpoints are verified via JWT bearer tokens over HTTP.
