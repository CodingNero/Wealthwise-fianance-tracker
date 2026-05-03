# 💸 Wealthwise — MERN Personal Finance Tracker

A full-stack personal finance tracker built with MongoDB, Express, React, and Node.js.

---

## ✨ Features

| Page | Features |
|------|----------|
| **Dashboard** | Monthly overview, income vs expenses chart, category donut, recent transactions, savings goals preview |
| **Transactions** | Add/edit/delete income & expenses, filter by category & type, pagination |
| **Budget** | Set per-category monthly budgets, live spending vs limit tracking, over-budget alerts |
| **Savings Goals** | Create goals with targets & deadlines, add contributions, progress tracking |
| **Analysis** | 6-month trends, bar/line/radar/doughnut charts, daily spending, category comparisons, insights |

---

## 🗂 Project Structure

```
wealthwise/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Expense.js
│   │   ├── Budget.js
│   │   └── SavingsGoal.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── expenses.js
│   │   ├── budgets.js
│   │   └── savings.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   └── Sidebar.js
│       ├── context/
│       │   └── AuthContext.js
│       ├── pages/
│       │   ├── AuthPage.js
│       │   ├── Dashboard.js
│       │   ├── Expenses.js
│       │   ├── Budget.js
│       │   ├── Savings.js
│       │   └── Analysis.js
│       ├── services/
│       │   └── api.js
│       ├── utils/
│       │   └── helpers.js
│       ├── App.js
│       ├── index.js
│       └── index.css
│
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB (local or Atlas)

### 1. Clone and install

```bash
# Install root dependencies
npm install

# Install all dependencies at once
npm run install-all

# OR manually:
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure backend environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/finance-tracker
JWT_SECRET=your_super_secret_key_here_change_this
CLIENT_URL=http://localhost:3000
```

For MongoDB Atlas, replace `MONGODB_URI` with your connection string.

### 3. Run the app

```bash
# From root — runs both backend and frontend
npm run dev

# OR separately:
npm run dev:backend   # http://localhost:5000
npm run dev:frontend  # http://localhost:3000
```

---

## 🔌 API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/me` | Update profile |

### Expenses
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/expenses` | List with filters & pagination |
| GET | `/api/expenses/summary` | Monthly summary & trends |
| POST | `/api/expenses` | Create transaction |
| PUT | `/api/expenses/:id` | Update transaction |
| DELETE | `/api/expenses/:id` | Delete transaction |

### Budgets
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/budgets` | Get budgets with live spending |
| POST | `/api/budgets` | Create/update budget |
| DELETE | `/api/budgets/:id` | Delete budget |

### Savings
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/savings` | Get all goals |
| POST | `/api/savings` | Create goal |
| PUT | `/api/savings/:id` | Update goal |
| POST | `/api/savings/:id/contribute` | Add contribution |
| DELETE | `/api/savings/:id` | Delete goal |

---

## 🛠 Tech Stack

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs password hashing

**Frontend**
- React 18
- Chart.js + react-chartjs-2 (Line, Bar, Doughnut, Radar)
- Axios for API calls
- Context API for auth state
- Custom CSS design system (dark theme, Syne + DM Sans fonts)

---

## 🎨 Design

- **Dark theme** — deep navy/charcoal palette
- **Typography** — Syne (headings) + DM Sans (body)
- **Accent** — violet `#7c6af7`
- **Fully responsive** — mobile-friendly sidebar

---

## 🌍 Deployment

### Backend (Railway / Render)
1. Set env vars: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`
2. Start command: `node server.js`

### Frontend (Vercel / Netlify)
1. Set `REACT_APP_API_URL=https://your-backend.railway.app/api`
2. Build command: `npm run build`

---

## 💡 Extending

- Add **recurring transactions** (model field already present)
- Add **email notifications** for budget alerts
- Add **CSV export** for transactions
- Add **multi-account** support
- Add **investment portfolio** tracking
