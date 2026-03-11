# Personal Expenses Tracker (PET)


## 📖 Project Overview

**Personal Expenses Tracker (PET)** is a **full-stack web application** designed to help individuals **track, visualize, and manage their personal finances** securely.  

The system provides:  

- User authentication and authorization (secure login/logout with JWT)  
- Transaction management (add, edit, delete income/expenses)  
- Real-time dashboards and charts (D3.js visualization)  
- Monthly and category-based expense reports  
- Persistent and secure data storage (MySQL)  

PET is ideal for anyone who wants **a clear, visual, and automated way to manage daily finances**.  

---

## 🛠️ Technologies Used

**Frontend:**  
- HTML5  
- CSS3  
- JavaScript (Vanilla + D3.js)  

**Backend:**  
- Node.js (Express.js)  
- Middleware for authentication (JWT, Bcrypt)  
- RESTful APIs  

**Database:**  
- MySQL (Relational Database)  

**Tools:**  
- Visual Studio Code  
- Postman (API testing)  
- Git/GitHub  

---

## ⚙️ Features

### 1. User Authentication
- Register a new account with unique username & password  
- Login/logout with JWT-based session management  
- Secure password storage using Bcrypt  

### 2. Transaction Management
- Add income or expense transactions  
- Edit or delete existing transactions  
- Validate transaction input (amount > 0)  

### 3. Dashboard & Visualization
- Monthly summary: Total Income, Total Expense, Net Balance  
- Pie chart: Expense breakdown by category  
- Bar chart: Comparison of income vs. expense for last 6 months  
- Dynamic updates: charts refresh immediately on new transactions  

### 4. Database Management
- All transactions linked to registered users via foreign key  
- ON DELETE CASCADE ensures data consistency  
- SQL queries abstracted in `db.js` for security and modularity  

---

## 📁 Project Structure

```bash
PERSONAL_EXPENSES_TRACKER/
│
├── Backend/
│   ├── database/db.js
│   ├── middleware/auth.js
│   ├── routes/
│   │   ├── users.js
│   │   ├── transactions.js
│   │   └── reports.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── Frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── node_modules/
├── package-lock.json
└── README.md
