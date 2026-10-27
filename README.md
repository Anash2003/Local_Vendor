# 🏡 Oorkaran (ஊர்க்காரன்)
### Connecting Local Service Providers with Customers

Oorkaran is a web-based local service booking platform that connects customers with local service providers. It allows customers to discover services, explore vendors, book services, and share feedback, while vendors can manage their services and bookings through a dedicated dashboard.

The platform also includes an **Admin Dashboard** for managing vendors, customers, bookings, categories, services, and other platform activities.

The goal of Oorkaran is to make finding and booking trusted local services easier, more convenient, and more organized.

---

## 📌 Table of Contents

- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [User Roles](#-user-roles)
- [Technology Stack](#-technology-stack)
- [Project Architecture](#-project-architecture)
- [Project Structure](#-project-structure)
- [Installation and Setup](#-installation-and-setup)
- [Running the Application](#-running-the-application)
- [API Configuration](#-api-configuration)
- [Security](#-security)
- [Future Enhancements](#-future-enhancements)
- [Learning Outcomes](#-learning-outcomes)
- [Author](#-author)

---

## 📖 Project Overview

Finding reliable local service providers can be difficult when customers have to search for different services across multiple platforms.

Oorkaran addresses this problem by providing a centralized platform where customers can discover local vendors and book services according to their needs.

The application follows a **React frontend and Django backend architecture**. The frontend provides an interactive user interface, while the backend handles business logic, database operations, authentication, and API requests.

### Project Objectives

- Connect customers with local service providers.
- Make service discovery and booking more convenient.
- Allow vendors to manage their services and customer bookings.
- Provide an administrative interface for platform management.
- Maintain booking information and customer feedback in a centralized system.
- Improve the accessibility of local services through a user-friendly web application.

---

## ✨ Key Features

### 👤 Customer Module

- Customer registration and login.
- Browse available service categories.
- Explore services and service providers.
- Search for relevant services.
- View vendor profiles and available service information.
- Book services from vendors.
- View personal booking details and booking status.
- Cancel eligible pending bookings.
- Rate vendors and submit feedback.

### 🛠️ Vendor Module

- Vendor registration and login.
- Vendor account approval workflow.
- Manage vendor profile information.
- Add and manage offered services.
- Manage service pricing and visiting charges where supported.
- View customer bookings.
- Accept or reject booking requests.
- Manage availability, weekly holidays, and unavailable dates where supported.

### 🛡️ Admin Module

- Secure administrator login.
- View platform statistics.
- Manage vendor accounts and approval workflows.
- Manage customer accounts.
- Monitor and manage bookings.
- Manage service categories and services.
- Review customer ratings and feedback.
- Provide administrative account management according to assigned permissions.

> **Note:** The availability of individual features depends on the current implementation and backend configuration.

---

## 👥 User Roles

Oorkaran supports three primary user roles.

| Role | Responsibilities |
|---|---|
| Customer | Discover services, explore vendors, make bookings, and submit reviews. |
| Vendor | Manage service offerings, maintain availability, and respond to bookings. |
| Administrator | Manage platform users, vendors, bookings, categories, services, and other administrative activities. |

---

## 💻 Technology Stack

### Frontend

- **React.js** — Building reusable and interactive user interfaces.
- **JavaScript** — Implementing application logic and interactions.
- **HTML5** — Structuring application pages.
- **CSS3** — Styling and responsive layouts.
- **Bootstrap** — Responsive layouts and reusable UI components.
- **Axios** — Communicating with the backend through HTTP requests.
- **React Router** — Navigation between application pages.

### Backend

- **Python** — Backend programming language.
- **Django** — Web framework for backend logic and database operations.
- **Django REST Framework** — Creating REST APIs for frontend communication.
- **Session Authentication** — Managing authenticated sessions where configured.

### Database

- **SQLite / PostgreSQL** — Database options used during development and configuration.

### Development Tools

- Visual Studio Code
- Git
- GitHub
- Postman

---

## 🏗️ Project Architecture

Oorkaran follows a client-server architecture.

```text
┌──────────────────────────────┐
│       React Frontend         │
│                              │
│ Customer Interface           │
│ Vendor Dashboard             │
│ Admin Dashboard              │
└──────────────┬───────────────┘
               │
               │ HTTP Requests / REST APIs
               │
┌──────────────▼───────────────┐
│       Django Backend         │
│                              │
│ Authentication               │
│ Business Logic               │
│ API Endpoints                │
│ Permission Validation        │
└──────────────┬───────────────┘
               │
               │ Database Operations
               │
┌──────────────▼───────────────┐
│          Database            │
│                              │
│ Users, Vendors, Services,    │
│ Categories, Bookings,        │
│ Ratings and Related Records  │
└──────────────────────────────┘
```

### How It Works

1. Users interact with the React frontend.
2. The frontend sends HTTP requests to the Django backend.
3. Django processes the requests and validates the required information and permissions.
4. The backend reads or updates the database.
5. Django returns an API response.
6. React updates the interface based on the response.

---

## 📂 Project Structure

The following is a simplified representation of the frontend structure.

```text
Oorkaran/
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   │   ├── images/
│   │   │   └── icons/
│   │   │
│   │   ├── Components/
│   │   │   ├── common/
│   │   │   ├── customer/
│   │   │   ├── vendor/
│   │   │   └── admin/
│   │   │
│   │   ├── pages/
│   │   │   ├── Home/
│   │   │   ├── auth/
│   │   │   ├── customer/
│   │   │   ├── vendor/
│   │   │   └── admin/
│   │   │
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── main.jsx
│   │   └── Routing.jsx
│   │
│   └── package.json
│
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── [Django project package]/
│   └── [Django application package]/
│
├── .gitignore
└── README.md
```

> **Important:** This is an illustrative structure. Adjust the folder names to match your actual repository before publishing.

---

## ⚙️ Installation and Setup

Follow these steps to run Oorkaran locally.

### Prerequisites

Install the following before starting:

- Python
- Node.js and npm
- Git
- Visual Studio Code or another code editor

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Navigate to the project directory:

```bash
cd Oorkaran
```

### 2. Set Up the Backend

Navigate to your Django backend directory.

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment.

**Windows:**

```bash
venv\Scripts\activate
```

**macOS / Linux:**

```bash
source venv/bin/activate
```

Install the required Python packages:

```bash
pip install -r requirements.txt
```

If your project does not yet contain a `requirements.txt` file, create one from the activated environment after confirming that it contains only the packages your project needs:

```bash
pip freeze > requirements.txt
```

### 3. Configure the Database

Check your Django `settings.py` file and configure the database you intend to use.

Apply database migrations:

```bash
python manage.py migrate
```

If your application requires a Django superuser for administration, create one:

```bash
python manage.py createsuperuser
```

Follow the prompts to set up the administrator account.

### 4. Start the Django Backend

Run:

```bash
python manage.py runserver
```

The development server will usually be available at:

```text
http://127.0.0.1:8000/
```

### 5. Set Up the Frontend

Open a new terminal and navigate to the React frontend directory.

```bash
cd frontend
```

Install the dependencies:

```bash
npm install
```

### 6. Start the React Frontend

Run:

```bash
npm run dev
```

Open the local frontend address printed by Vite in your terminal. It is commonly:

```text
http://localhost:5173/
```

**Keep both the Django backend and React frontend running while using the application.**

---

## 🔌 API Configuration

The React frontend communicates with the Django backend through HTTP APIs.

During local development, the backend base URL is configured as:

```javascript
const API_BASE_URL = "http://127.0.0.1:8000";
```

Ensure that the frontend API configuration matches the address and port on which Django is running.

### Important Configuration Notes

- Configure Django CORS settings to allow requests from your frontend development origin.
- Configure CSRF settings correctly for session-authenticated requests.
- Include credentials in frontend requests when required by the authentication setup.
- Keep development and production configuration separate.
- Update the API base URL when deploying the application.

---

## 🔐 Security

Security is an important part of a customer-vendor booking platform.

Oorkaran's backend should enforce the following practices:

- Validate incoming API data on the server.
- Verify authentication before allowing protected operations.
- Enforce role-based permissions in Django.
- Restrict administrative actions to authorized accounts.
- Protect session-authenticated requests against CSRF.
- Avoid exposing passwords, secret keys, database credentials, or private configuration in the repository.
- Use environment variables for sensitive production configuration.
- Use HTTPS when deploying the application publicly.

**Important:** Frontend checks alone do not provide security. Django must validate permissions for every protected API request.

---

## 🚀 Future Enhancements

Potential future improvements include:

- Online payment integration.
- Email and SMS booking notifications.
- Advanced vendor search and filtering.
- Location-based service discovery.
- Vendor availability calendar improvements.
- Enhanced customer and vendor dashboards.
- Booking analytics and reports.
- Automated testing and deployment.
- Production deployment with a managed database.

---

## 🎓 Learning Outcomes

This project provides practical experience with:

- Developing a full-stack web application.
- Building responsive interfaces using React and Bootstrap.
- Creating REST APIs using Django REST Framework.
- Connecting a frontend application to a backend.
- Performing database operations through Django models.
- Implementing authentication and permission checks.
- Managing customer bookings and vendor workflows.
- Debugging API requests and handling errors.
- Using Git and GitHub for source-code management.

---

## 👨‍💻 Author

**Developed as a full-stack web development project.**

**Project Name:** Oorkaran (ஊர்க்காரன்)  
**Project Type:** Full-Stack Web Application  
**Frontend:** React.js  
**Backend:** Django REST Framework  
**Database:** SQLite / PostgreSQL, depending on configuration

---

## 📄 License

A license has not been specified yet. If you intend to make the project open source, consider adding an appropriate license file, such as the MIT License, after deciding how others may use your code.

---

⭐ If you find this project interesting, consider starring the repository!
