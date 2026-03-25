# MERN Chat App

**Student:** JEAN MARIE DANIEL VIANNEY GUEDEGBE — GOMYCODE

A full-stack real-time chat application built with MongoDB, Express, React, and Node.js. Includes authentication, real-time messaging, forum, and profile management.

---

## Features

- **Auth** — Register, login, logout, email verification, forgot/reset password, change password
- **Real-time chat** — 1-on-1 and group messaging powered by Socket.io
- **Typing indicators** — Live typing status
- **Forum** — Create, edit, delete posts with comments, likes, categories, tags, pagination
- **Profile** — View/edit profile, avatar, bio, friends list
- **Security** — JWT (HTTP-only cookies), bcrypt, helmet, rate limiting, input sanitization

---

## Project Structure

```
mern-chat/
├── server/
│   ├── config/         db.js, socket.js
│   ├── controllers/    authController, userController, chatController, forumController
│   ├── middleware/      auth.js, errorHandler.js
│   ├── models/          User.js, Chat.js, ForumPost.js
│   ├── routes/          authRoutes, userRoutes, chatRoutes, messageRoutes, forumRoutes
│   ├── utils/           email.js, jwt.js
│   ├── app.js
│   ├── server.js
│   └── web.config      (Azure IIS config)
└── client/
    ├── src/
    │   ├── context/     authStore.js, chatStore.js (Zustand)
    │   ├── hooks/       useSocket.js
    │   ├── pages/       LoginPage, RegisterPage, ChatPage, ProfilePage, ForumPage...
    │   ├── components/  Layout
    │   ├── utils/       api.js (Axios)
    │   ├── App.jsx
    │   └── main.jsx
    └── vite.config.js   (builds into server/public)
```

---

## Local Development

### Prerequisites

- Node.js >= 18
- MongoDB Atlas account (or local MongoDB)
- Gmail account with App Password (for emails)

### 1. Clone and install

```bash
git clone https://github.com/daniel10027/mern-chat.git
cd mern-chat
npm run install:all
```

### 2. Configure server environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

MONGO_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/mern-chat

JWT_SECRET=your_secret_key_min_32_chars
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=MERN Chat <your@gmail.com>
```

### 3. Run development servers

```bash
# From root — runs both server and client
npm run dev

# Or separately:
cd server && npm run dev     # http://localhost:5000
cd client && npm run dev     # http://localhost:3000
```

---

## Deployment on Microsoft Azure

### Step 1 — Set Up MongoDB Atlas

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and create a free account
2. Create a new **M0 Free** cluster
3. Under **Database Access** → create a user with read/write permissions
4. Under **Network Access** → Add IP `0.0.0.0/0` (allow all — Azure uses dynamic IPs)
5. Click **Connect** → **Drivers** → copy the connection string:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/mern-chat
   ```

---

### Step 2 — Build the React Frontend

```bash
cd client
npm run build
```

This compiles the React app into `server/public/` (configured in `vite.config.js`). The Express server will serve these static files in production.

---

### Step 3 — Create Azure Web App

1. Go to [https://portal.azure.com](https://portal.azure.com)
2. Click **Create a resource** → **Web** → **Web App**
3. Fill in the form:

| Field | Value |
|-------|-------|
| Subscription | Your subscription |
| Resource Group | Create new: `mern-chat-rg` |
| Name | `mern-chat-yourname` (must be globally unique) |
| Publish | Code |
| Runtime stack | Node 18 LTS |
| Operating System | Linux |
| Region | West Europe (or closest to you) |
| Pricing plan | B1 Basic (minimum for production) |

4. Click **Review + Create** → **Create**

---

### Step 4 — Configure Environment Variables on Azure

1. In your Web App → **Settings** → **Configuration** → **Application settings**
2. Click **New application setting** for each variable:

| Name | Value |
|------|-------|
| `NODE_ENV` | `production` |
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A long random string (32+ chars) |
| `JWT_EXPIRES_IN` | `7d` |
| `JWT_COOKIE_EXPIRES_IN` | `7` |
| `CLIENT_URL` | `https://mern-chat-yourname.azurewebsites.net` |
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `587` |
| `EMAIL_USER` | Your Gmail address |
| `EMAIL_PASS` | Your Gmail App Password |
| `EMAIL_FROM` | `MERN Chat <your@gmail.com>` |

3. Click **Save** and **Continue**

---

### Step 5 — Deploy via GitHub Actions (Recommended)

**5a. Push your code to GitHub**

```bash
# From the mern-chat root
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mern-chat.git
git push -u origin main
```

**5b. Set up GitHub Actions deployment**

In Azure Web App → **Deployment Center**:
1. Source: **GitHub**
2. Authorize and select your repository and `main` branch
3. Azure automatically creates `.github/workflows/main_mern-chat.yml`

The workflow will run on every push to `main`:
- Install server dependencies
- Build the React client (into `server/public`)
- Deploy to Azure

**Custom GitHub Actions workflow** — replace the auto-generated one with:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Azure

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install server dependencies
        run: cd server && npm install

      - name: Install client dependencies
        run: cd client && npm install

      - name: Build React client
        run: cd client && npm run build

      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v3
        with:
          app-name: 'mern-chat-yourname'
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: './server'
```

**5c. Add the publish profile secret**

1. In Azure Web App → **Overview** → **Get publish profile** → download the file
2. In GitHub → **Settings** → **Secrets** → **Actions** → **New repository secret**
3. Name: `AZURE_WEBAPP_PUBLISH_PROFILE` — paste the file content

---

### Step 6 — Deploy via Local Git (Alternative)

1. In Azure Web App → **Deployment Center** → Source: **Local Git**
2. Copy the Git Clone URL shown
3. Deploy:

```bash
cd server
git init
git add .
git commit -m "deploy"
git remote add azure https://YOUR_APP.scm.azurewebsites.net/YOUR_APP.git
git push azure main
# Enter Azure credentials when prompted
```

---

### Step 7 — Configure Startup Command

In Azure Web App → **Configuration** → **General settings**:

- **Startup Command:** `node server.js`

---

### Step 8 — Enable WebSockets (required for Socket.io)

In Azure Web App → **Configuration** → **General settings**:

- **Web sockets:** On ✅

Save and restart the app.

---

### Step 9 — Test Your Deployment

Visit `https://mern-chat-yourname.azurewebsites.net`

Test all functionality:
- Register a new account
- Verify email (check inbox)
- Login / logout
- Start a chat
- Create a forum post
- Update your profile
- Reset password flow

**View logs if something fails:**
```bash
az webapp log tail --name mern-chat-yourname --resource-group mern-chat-rg
```

---

## API Reference

### Auth

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/register | — | Create account |
| POST | /api/auth/login | — | Login |
| POST | /api/auth/logout | — | Logout |
| GET | /api/auth/me | ✅ | Get current user |
| GET | /api/auth/verify-email/:token | — | Verify email |
| POST | /api/auth/forgot-password | — | Send reset email |
| POST | /api/auth/reset-password/:token | — | Reset password |
| PATCH | /api/auth/change-password | ✅ | Change password |

### Users

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/users?search= | Search users |
| GET | /api/users/friends | Get my friends |
| GET | /api/users/:id | Get user by ID |
| PATCH | /api/users/profile | Update my profile |
| POST | /api/users/:id/friend | Add/remove friend |

### Chats & Messages

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/chats | Access or create 1-on-1 chat |
| GET | /api/chats | Get all my chats |
| POST | /api/chats/group | Create group chat |
| POST | /api/messages | Send a message |
| GET | /api/messages/:chatId | Get messages |
| DELETE | /api/messages/:id | Delete a message |

### Forum

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/forum | List posts (filter, search, paginate) |
| GET | /api/forum/:id | Get single post |
| POST | /api/forum | Create post |
| PATCH | /api/forum/:id | Update post |
| DELETE | /api/forum/:id | Delete post |
| POST | /api/forum/:id/like | Toggle like |
| POST | /api/forum/:id/comments | Add comment |
| DELETE | /api/forum/:id/comments/:cid | Delete comment |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Zustand, React Query |
| Backend | Node.js, Express 4 |
| Database | MongoDB Atlas, Mongoose |
| Real-time | Socket.io |
| Auth | JWT, bcryptjs, HTTP-only cookies |
| Email | Nodemailer (Gmail SMTP) |
| Security | Helmet, cors, express-rate-limit |