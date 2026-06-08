# POE – Portfolio of Evidence Management System

A full-stack web application for managing student portfolios, unit registrations, grading, and exam repositories across TVET institutions.

## Project Structure

```
POE/
├── backend/        # Django REST Framework API
│   ├── academic/   # Courses, units, semesters, gradebook, exams
│   ├── users/      # Authentication, profiles, roles
│   ├── poe_core/   # Portfolio logic
│   ├── notifications/
│   └── utils/      # PDF generation helpers
│
└── frontend/       # React + Vite SPA
    ├── src/
    │   ├── pages/  # Role-based pages (admin, instructor, student)
    │   ├── components/
    │   └── context/
    └── public/
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Vanilla CSS |
| Backend | Django 4 + Django REST Framework |
| Auth | JWT (SimpleJWT) |
| Database | MySQL (production) / SQLite (dev) |
| PDF | ReportLab |
| File storage | Django media files |

## Roles

- **Admin** – full system management, grading criteria, exam audit
- **Instructor** – gradebook, exam repository, unit registration approvals
- **Student** – unit registration, portfolio, provisional results, exam downloads
- **CDACC / Manager / Director** – audit views

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` in the project root and configure:
- `SECRET_KEY`
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- `ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
