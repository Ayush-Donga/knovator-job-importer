# 🚀 Scalable Job Importer

A high-performance system to import, process, and track jobs from external feeds using Node.js, Next.js, Redis, and MongoDB.

## ✨ Features
- **Queue-based Processing**: Uses BullMQ for reliable background tasks.
- **Two-Tier Worker System**: Scalable architecture for handling millions of records.
- **Real-time Tracking**: Dashboard to monitor import history, success rates, and failures.
- **Automated Sync**: Cron job scheduled to run every 1 hour.
- **Premium UI**: Modern dark-themed dashboard built with Next.js and Tailwind.

## 📋 Prerequisites
- **Node.js**: v18+
- **MongoDB**: Local or Atlas instance
- **Redis**: Local or Cloud instance

## 🛠️ Setup Instructions

### 1. Clone the repository
```bash
git clone <repository-url>
cd knovator-job-importer
```

### 2. Backend Setup
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/job-importer
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```
Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../client
npm install
```
Start the frontend:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## 🏗️ Architecture
For detailed technical decisions and system design, see [docs/architecture.md](./docs/architecture.md).

## 📝 Assignment Requirements Implemented
- [x] Job Source API Integration (Jobicy & HigherEdJobs RSS)
- [x] XML to JSON conversion
- [x] Queue-based background processing (BullMQ + Redis)
- [x] MongoDB Upsert logic (Avoid duplicates)
- [x] Import History Tracking (ImportLogs collection)
- [x] Admin UI for tracking (Next.js)
- [x] Clean, modular code structure
- [x] Documentation (README & Architecture)
