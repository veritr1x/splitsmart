# SplitSmart - Expense Sharing App

A mobile platform independent app for splitting expenses among friends, roommates, or any group.

## Features

- User authentication (register, login)
- Create and manage expense groups
- Add and manage expenses within groups
- Split expenses equally or unevenly among group members
- Track balances between users
- Settle up with other users

## Tech Stack

### Backend
- Node.js with Express
- SQLite database
- JWT authentication

### Frontend
- React Native for cross-platform mobile support

## Getting Started

### Prerequisites
- Node.js (v14+ recommended)
- npm or yarn
- React Native development environment

### Installation

1. Clone the repository
```
git clone https://github.com/veritr1x/splitsmart
cd splitsmart
```

2. Install backend dependencies
```
cd backend
npm install
```

3. Install frontend dependencies
```
cd ../frontend
npm install
```

### Running the Application

1. Start the backend server
```
cd backend
npm run dev
```

2. Start the React Native app
```
cd frontend
npm start
```

3. Launch on Android or iOS
```
npm run android
# or
npm run ios
```

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login a user
- GET /api/auth/me - Get current user

### Users
- GET /api/users/:userId - Get user by ID
- GET /api/users/search - Search users by username or email
- PUT /api/users - Update user profile
- GET /api/users/groups - Get user's groups
- POST /api/users/groups - Create a new group
- POST /api/users/groups/:groupId/members - Add user to group

### Expenses
- GET /api/expenses/group/:groupId - Get all expenses for a group
- POST /api/expenses - Create new expense
- GET /api/expenses/:expenseId - Get expense details
- PUT /api/expenses/:expenseId - Update expense
- DELETE /api/expenses/:expenseId - Delete expense
- POST /api/expenses/settle - Settle expenses between users

## License

MIT 