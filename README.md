# 🚀 PAYCORE — Production-Grade Custom Payment Service Platform

**PAYCORE** is a custom payment orchestration service platform built architecturally similar to Stripe and Razorpay. It provides merchant onboarding, customer accounts, dual-mode payment intents (`TEST` vs `LIVE`), double-entry financial ledger accounting, rule-based risk engines, provider abstraction adapters, hosted customer checkout, HMAC SHA-256 webhooks, idempotency payload caching, and full analytics dashboards.

---

## 🌟 Key Platform Features

- 🏦 **Double-Entry Financial Ledger**: Immutable journal accounting ($\sum \text{Debits} == \sum \text{Credits}$) across `CUSTOMER_CLEARING`, `MERCHANT_PAYABLE`, and `PLATFORM_REVENUE` accounts. Zero floating-point rounding errors using positive integer minor units (`149900` = ₹1,499.00).
- 🔄 **Strict Payment State Machine**: Enforces non-reversible state transitions (`REQUIRES_PAYMENT_METHOD` → `PROCESSING` → `SUCCEEDED` / `FAILED` → `REFUNDED` / `PARTIALLY_REFUNDED`).
- ⚡ **Dual Environment Mode (`TEST` vs `LIVE`)**: Interactive mode switcher persisting per merchant, per API key, per payment intent, and per transaction directly in PostgreSQL.
- 🔌 **Provider Abstraction Layer**: Pluggable `PaymentProvider` interface featuring a `SandboxPaymentProvider` that simulates card successes (`4242...`), insufficient funds (`4000...0002`), timeouts, UPI VPAs, refunds, and disputes.
- 🔐 **Razorpay-Style Auth & Google OAuth 2.0**: Split-screen design with Google One-Tap / Account Chooser modal, mobile phone OTP verification (`+91`), password strength meter, and business GSTIN validation.
- 🛡️ **Risk & Fraud Scoring Engine**: Evaluates payment velocity, transaction size thresholds, and suspicious patterns before routing payments.
- 🔔 **HMAC SHA-256 Webhook Delivery**: Signs webhook events with `X-Paycore-Signature` headers, tracking delivery status, latency, and automated retry logs.
- 🔑 **API Key Management**: Secure hashing of secret (`sk_test_...`) and publishable (`pk_test_...`) keys using SHA-256 + salt.
- 🛒 **Hosted Checkout Experience**: Customer checkout portal at `/checkout/:sessionId` supporting Cards, UPI, and Net Banking.

---

## 🏗️ System Architecture

```text
[ Merchant Application ]
       │  (Bearer sk_test_... / Idempotency-Key)
       ▼
┌─────────────────────────────────────────────────────────────┐
│                       PAYCORE API                           │
│  (FastAPI + JWT Auth + Google OAuth + OTP + Idempotency)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────┐             ┌───────────────────────┐
│ Payment State Machine │             │      Risk Engine      │
│  (Strict Transitions) │             │ (Rule Fraud Scoring)  │
└───────────┬───────────┘             └───────────┬───────────┘
                               │
                               ▼
                   ┌───────────────────────┐
                   │    Payment Router     │
                   └───────────┬───────────┘
                               ▼
                 ┌──────────────────────────┐
                 │ PaymentProvider (ABC)    │
                 ├──────────────────────────┤
                 │ SandboxPaymentProvider   │ ──► (Simulates Card / UPI /
                 │ LicensedAcquirer (Future)│      Insufficient Funds)
                 └─────────────┬────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌─────────────────────────┐             ┌─────────────────────────┐
│ PostgreSQL Ledger       │             │ Webhook Engine          │
│ (Clearing, Payable, Fee)│             │ (HMAC SHA-256 Signature)│
└─────────────────────────┘             └─────────────────────────┘
```

---

## 🛠️ Tech Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0 (Async), Pydantic v2, Pytest, Uvicorn, Passlib (Argon2 / Bcrypt), PyJWT.
- **Database**: PostgreSQL 16 (via `asyncpg` & `psycopg2`).
- **Frontend**: React 18, Vite 8, TypeScript, Tailwind CSS v4, Lucide React, Recharts, React Router DOM v6.
- **DevOps**: Docker, Docker Compose, Git.

---

## ⚙️ Installation & Setup Guide

### 1. Prerequisites

Ensure you have the following installed on your machine:
- **Git**: [Download Git](https://git-scm.com/)
- **Python**: `v3.10+` (Python 3.12 recommended)
- **Node.js**: `v18+` & `npm`
- **PostgreSQL**: `v14+` running locally on port `5432`

---

### 2. Clone the Repository

```bash
git clone https://github.com/chandan-me/PAYCORE.git
cd PAYCORE
```

---

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Ensure your PostgreSQL connection string in `.env` is correct:
```env
APP_ENV=development
DEBUG=true
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/paycore
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=paycore_super_secret_jwt_key_2026_change_in_production_32bytes
PAYCORE_ENCRYPTION_KEY=paycore_secret_encryption_key_32b
WEBHOOK_SIGNING_SECRET=whsec_paycore_live_webhook_signature_secret_key
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:8000
SANDBOX_ENABLED=true
```

---

### 4. Backend Setup & Startup

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI server (it automatically creates the PostgreSQL `paycore` database & seeds initial demo records):
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

   The backend will be live at `http://127.0.0.1:8000` (OpenAPI Swagger docs at `http://127.0.0.1:8000/docs`).

---

### 5. Frontend Setup & Startup

1. Open a new terminal tab and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Launch the Vite development server:
   ```bash
   npm run dev
   ```

   The frontend will be live at `http://localhost:5173`.

---

## 🐳 Docker Setup (Alternative)

If you prefer running the entire stack via Docker:

```bash
docker-compose up --build
```

This starts PostgreSQL, Redis, FastAPI Backend (`:8000`), and React Frontend (`:5173`).

---

## 🔑 Pre-Seeded Logins & Sandbox Testing

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Demo Merchant** | `demo@paycore.io` | `password123` | Full Merchant Dashboard & API Keys |
| **Platform Admin** | `admin@paycore.io` | `admin123` | Platform Metrics, Reconciliation & Audit Logs |

### Sandbox Test Card Credentials
- **Success Card**: `4242 4242 4242 4242` | Exp: `12/30` | CVV: `123`
- **Insufficient Funds**: `4000 0000 0000 0002`
- **Expired Card**: `4000 0000 0000 0003`
- **Gateway Timeout**: `4000 0000 0000 0004`
- **UPI VPA Success**: `user@okbank` or `success@upi`
- **UPI VPA Failure**: `fail@upi`

---

## 🧪 Running Unit & Integration Tests

Run the backend Pytest suite anytime:

```bash
cd backend
python -m pytest tests/
```
