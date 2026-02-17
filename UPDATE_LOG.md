# Frontend Update Log

## [v1.2.0] — 2026-02-15: Force Exit & Delete User

### What Changed

#### ⛔ Force Exit (Kick) Active Users

- Admins can now **force-exit any user** who is currently attending a quiz
- The user's session is immediately ended, score is calculated from submitted answers, and they are marked as **"disqualified"**
- Available in both **Dashboard** (Active Users table) and **Results** page

#### 🗑️ Delete User Records

- Admins can **permanently delete** a user and all associated records (answers, quiz sessions, user entry)
- Confirmation dialog prevents accidental deletions
- Available in both **Dashboard** (Active Users table) and **Results** page

#### 🟢 Active Users Panel (Dashboard)

- New **"Active Users (Currently Attending)"** section on the Dashboard
- Shows real-time info: name, register ID, college, batch, answer progress, tab switches, time remaining
- Auto-refreshes every 5 seconds
- **Kick** and **Delete** buttons available per user
- Filters by selected batch

### New API Endpoints

- `GET /api/admin/active-users?batch_id=X` — List users currently taking the quiz
- `PUT /api/admin/force-exit/:userId` — Force-exit a user and mark as disqualified
- `DELETE /api/admin/user/:userId` — Permanently delete user and all records

### Files Modified

- `backend/routes/admin.js` — Added endpoints 22, 23, 24
- `frontend/src/pages/admin/Dashboard.jsx` — Active users table with kick/delete actions
- `frontend/src/pages/admin/Results.jsx` — Added kick/delete buttons per row

---

## [v1.1.0] — 2026-02-15: Question Shuffling & Random Selection

### What Changed

#### 🎲 Random Question Selection from Pool

- Each batch now has a configurable **"# Questions"** field
- When creating a batch, admins can set how many questions each student receives
- Questions are **randomly selected** from the full question pool for that round
- Setting `0` means all questions in the pool are used (default behavior)

#### 🔀 Per-User Question Shuffling

- Every student gets their questions in a **unique random order**
- Uses Fisher-Yates shuffle algorithm for true randomness
- The shuffled order is stored server-side per session — refreshing the page preserves the same order
- Prevents students from sharing answers by question number

#### 🛠 Admin Dashboard Updates

- **New field** in "Create New Batch" form: **# Questions** — sets how many random questions each student gets
- **New column** in the batches table: **Questions** — shows the configured question count per batch
- The grid layout has been updated to accommodate the new field

### How It Works (Technical)

1. **Batch Creation** — Admin sets `num_questions` (e.g., 20 out of 50 in pool)
2. **Quiz Start** (`POST /api/student/start`) — Server randomly picks `num_questions` from the question pool, shuffles them, and stores the order as `question_order` in `quiz_sessions`
3. **Fetch Questions** (`GET /api/student/questions`) — Returns questions in the user's unique shuffled order
4. **Backward Compatible** — Existing sessions without `question_order` fall back to fetching all questions in default order

### Database Changes

- `batches` table: Added `num_questions INT DEFAULT 0`
- `quiz_sessions` table: Added `question_order TEXT` (stores comma-separated question IDs in shuffled order)

### Files Modified

- `backend/db/schema.sql` — Added new columns
- `backend/routes/admin.js` — Batch creation & listing include `num_questions`
- `backend/routes/student.js` — Random selection + shuffle logic in `/start` and `/questions`
- `frontend/src/pages/admin/Dashboard.jsx` — New input field & table column for `num_questions`
