# 🚗 DriveMate AI – Smart Vehicle Management System

**An intelligent web-based platform for vehicle management, maintenance tracking, mileage monitoring, fuel management, document validity tracking, and Smart FASTag management.**

---

## 📌 Project Overview

DriveMate AI is a web-based vehicle management platform designed to simplify and organize vehicle-related activities through a centralized dashboard.

The system helps vehicle owners manage multiple vehicles, monitor maintenance schedules, calculate mileage, track fuel consumption, manage expenses, maintain FASTag information, and store important vehicle documents.

It also provides document validity monitoring for Insurance, Driving Licence, Pollution Under Control (PUC), and Fitness Certificates. The system checks expiry dates and identifies documents that are approaching expiry or have already expired.

The main objective is to make vehicle management easier, more organized, and efficient through a user-friendly digital platform.

## 🎯 Project Objectives

- Provide a centralized platform to manage multiple vehicles.
- Track vehicle maintenance and service schedules.
- Calculate and monitor vehicle mileage.
- Maintain fuel consumption records.
- Monitor vehicle-related expenses.
- Manage FASTag details and balance information.
- Digitally store important vehicle documents.
- Track document validity and expiry dates.
- Identify expired and overdue vehicle documents.
- Improve vehicle management through timely reminders and notifications.

## ✨ Key Features

### 🚘 1. Vehicle Management
- Add and manage multiple vehicles, including cars and bikes.
- Maintain individual vehicle information.
- View vehicle details through a centralized dashboard.

### 🔧 2. Vehicle Maintenance Tracking
- Record vehicle service and maintenance history.
- Maintain service dates and odometer readings.
- Track upcoming maintenance schedules.
- Monitor service intervals based on date and distance.
- Help vehicle owners avoid missing scheduled maintenance.

### ⛽ 3. Fuel Management
- Record fuel purchases and fuel quantities.
- Maintain fuel filling history.
- Monitor fuel consumption.
- Track fuel-related expenses.

### 📊 4. Mileage Tracking
- Calculate mileage using distance travelled and fuel filled.
- Monitor vehicle mileage over multiple fuel entries.
- Maintain mileage history for individual vehicles.
- Analyze fuel efficiency over time.

### 💰 5. Expense Management
- Maintain vehicle-related expense records.
- Track fuel, service, repair, and other maintenance expenses.
- Monitor overall vehicle expenditure.

### 🏷️ 6. Smart FASTag Management
- Maintain FASTag information for vehicles.
- Monitor available FASTag balance.
- Identify low-balance situations.
- Help users monitor their toll payment readiness.

### 📄 7. Vehicle Document Management

Store and manage important vehicle documents digitally.

Supported document categories:

- **Insurance Certificate:** Maintain insurance information and policy validity.
- **Driving Licence:** Store licence details and monitor validity dates.
- **PUC Certificate:** Track Pollution Under Control certificate details and expiry.
- **Fitness Certificate:** Maintain vehicle fitness information and validity.

**Document Validity Monitoring:**

- Store document issue dates and expiry dates.
- Automatically compare expiry dates with the current date.
- Display whether a document is valid, expiring soon, or expired.
- Identify overdue documents after their validity period ends.
- Help users keep important vehicle documents up to date.

| Document Status | Description |
|---|---|
| Valid | Document is within its validity period. |
| Expiring Soon | Document expiry date is approaching. |
| Expires Today | Document reaches its expiry date today. |
| Expired / Overdue | Document validity period has ended. |

### 🔔 8. Reminders and Notifications
- Provide reminders for upcoming vehicle maintenance.
- Help users monitor document expiry dates.
- Highlight important vehicle-related alerts.
- Support timely action for maintenance and document renewal.

### 🔐 9. User Authentication
- User authentication through Supabase.
- Secure access to the application.
- User-specific vehicle management.

### 🌐 10. User-Friendly Interface
- Organized dashboard for vehicle information.
- Easy navigation between different management sections.
- Responsive web application interface.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| React.js | Frontend development |
| Vite | Development server and build tool |
| JavaScript | Application functionality |
| HTML5 | Webpage structure |
| CSS3 | Styling and layout |
| Supabase | Backend services, database, and authentication |
| Git | Version control |
| GitHub | Source code hosting |

## 🏗️ Project Structure

```text
DriveMate_AI/
│
├── public/                 # Public assets
│
├── src/                    # React application source code
│
├── supabase/               # Supabase-related files
│
├── .env.example            # Environment variable template
├── .gitignore              # Git ignored files
├── index.html              # Application entry point
├── package.json            # Project dependencies
├── package-lock.json       # Dependency lock file
└── vite.config.js          # Vite configuration
```

## ⚙️ Installation and Setup

Follow these steps to run DriveMate AI locally.

### Prerequisites

Make sure the following tools are installed:

- Node.js
- npm
- Git
- Visual Studio Code (recommended)

### Step 1: Clone the Repository

```bash
git clone https://github.com/navyaavidi8305-star/DriveMate_AI.git
```

### Step 2: Navigate to the Project Directory

```bash
cd DriveMate_AI
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Configure Environment Variables

Create a `.env` file in the project root directory using `.env.example` as a reference.

Add the required Supabase project URL and publishable/anonymous key using the exact variable names expected by the application.

**Security Note:** Never upload your actual `.env` file, Supabase service-role keys, or other private credentials to GitHub.

### Step 5: Start the Development Server

```bash
npm run dev
```

Open the local URL displayed in the terminal to access the application.

## 🔮 Future Enhancements

- AI-powered predictive vehicle maintenance.
- Intelligent fuel consumption analysis.
- Advanced vehicle health monitoring.
- Automated maintenance recommendations.
- Advanced document expiry notifications.
- Detailed vehicle expense analytics.
- Enhanced mileage prediction and reporting.
- Smart vehicle usage insights.

## 🌟 Project Benefits

- Simplifies vehicle management through a centralized platform.
- Helps users monitor maintenance schedules.
- Improves awareness of fuel consumption and mileage.
- Organizes important vehicle documents digitally.
- Helps prevent missed document renewals through expiry tracking.
- Provides better visibility into vehicle-related expenses.
- Makes vehicle information easier to access and manage.

## 👩‍💻 Developer

**Developed by AVN**

GitHub: [navyaavidi8305-star](https://github.com/navyaavidi8305-star)

**Project Repository:** [DriveMate AI – GitHub](https://github.com/navyaavidi8305-star/DriveMate_AI)

## 📄 License

This project is developed for educational and portfolio purposes.