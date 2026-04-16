# 🏗️ Scalable Job Importer Architecture

## System Overview
The Job Importer is a distributed system designed to ingest job postings from external RSS/XML feeds, process them asynchronously, and provide real-time observability through a web dashboard.

## 🚀 Tech Stack
- **Frontend**: Next.js (App Router), Tailwind CSS, Lucide Icons.
- **Backend**: Node.js (Express), TypeScript.
- **Database**: MongoDB (Mongoose) - chosen for its flexible schema and high write-per-second capabilities.
- **Queue System**: BullMQ (Redis) - chosen for reliable background processing, automatic retries, and high concurrency.
- **Real-time**: Socket.IO - for live dashboard updates without polling.
- **Scheduler**: Node-Cron (1-hour intervals).

## 🛠️ Key Components
...
- **Tier 2: `job-upsert-queue`**:
  - Responsibility: Atomic upsert of a single job record.
  - Concurrency: Environment-configurable (default 20). This allows the system to saturate database IOPS and handle large bursts without blocking the main event loop.

### 2. Idempotent Upsert Logic
...
### 3. Observability & Tracking
Every import cycle creates an `ImportLog` document.
- **Real-time Updates**: Workers emit Socket.IO events on every state change, providing a "live" feel to the admin dashboard.
- **Live Counters**: We use MongoDB's `$inc` (Atomic Increment) in the Job Upsert Worker to update counters safely.
- **Pagination & Filtering**: The history API supports page-based retrieval and status filtering to handle thousands of logs efficiently.

## 📈 Scalability Considerations
...
## 🔄 Data Flow
1. **Cron/Manual Trigger** → `import-queue`
2. **Import Worker** → Fetch XML → Parse → Dispatch N jobs to `job-upsert-queue`.
3. **Job Upsert Worker** → DB Upsert → Increment `ImportLog` stats → **Emit Socket Event**.
4. **Dashboard** → **Listen for Socket Events** → Update UI in real-time.
