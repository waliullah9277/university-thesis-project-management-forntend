# University Project and Thesis Management System - Frontend

A responsive role-based frontend for the **University Project and Thesis Management System**. This project is built using **HTML**, **Tailwind CSS**, and **JavaScript**, and communicates with the backend through REST APIs.

## Features

### Authentication

* Role-based login
* Profile page
* Change password
* Logout

### Super Admin

* Dashboard
* User Management
* Project Management
* Viva Management
* Evaluation Management
* Industrial Training Management
* Notice Management
* Profile

### Student

* Dashboard
* Team Management
* Project Submission
* Progress Report Submission
* View Project Feedback
* Industrial Training
* View Result
* Notices
* Notifications
* Profile

### Supervisor

* Dashboard
* Assigned Projects
* Review Progress Reports
* Industrial Training Supervision
* Notices
* Notifications
* Profile

### Examiner

* Dashboard
* Assigned Viva
* Evaluation
* Notices
* Notifications
* Profile

## Technologies Used

* HTML5
* Tailwind CSS
* JavaScript (ES6)
* Fetch API
* REST API

## Project Structure

```text
frontend/
│
├── assets/
│   ├── css/
│   ├── images/
│   └── js/
│
├── admin/
├── student/
├── supervisor/
├── examiner/
│
├── login.html
├── admin-login.html
├── student-login.html
├── supervisor-login.html
└── examiner-login.html
```

## Setup

1. Clone the repository.

```bash
git clone <repository-url>
```

2. Open the project folder.

3. Update the backend API URL inside:

```text
assets/js/api.js
```

Example:

```javascript
const API_BASE_URL = "http://127.0.0.1:8000";
```

4. Open the project using **VS Code Live Server** or any local web server.

## User Roles

* Super Admin
* Student
* Supervisor
* Examiner

Each role has its own dashboard and dedicated pages with role-based access.

## Main Modules

* Authentication
* User Management
* Team Management
* Project Management
* Progress Reports
* Viva Management
* Evaluation
* Industrial Training
* Notice Management
* Notification System
* Profile Management

## UI Features

* Responsive design
* Role-based dashboards
* Modern card-based layout
* Consistent navigation
* Reusable header and footer
* Tailwind CSS styling
* Mobile-friendly interface

## Browser Support

* Google Chrome
* Microsoft Edge
* Mozilla Firefox

## Status

Frontend development is feature-complete and integrated with the backend REST APIs.

## Developer

**Waliullah**

Department of Computer Science and Engineering (CSE)

Green University of Bangladesh
