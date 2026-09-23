# 🚀 PAYCORE — Full-Stack API Banking & Payment Orchestration Engine

[![Database](https://img.shields.io/badge/Database-MySQL%208.0%20%7C%20SQLite-00758F.svg)](https://www.mysql.com/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.12-009688.svg)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript%20%2B%20Vite-61DAFB.svg)](https://react.dev/)
[![Design](https://img.shields.io/badge/UI%2FUX-Cashfree%20Light%20Theme-0066FF.svg)](https://www.cashfree.com/)
[![Tests](https://img.shields.io/badge/Tests-8%2F8%20Passing%20(100%25)-brightgreen.svg)]()

**PAYCORE** is a high-performance financial infrastructure and payment orchestration platform engineered following **Cashfree** and **Stripe** architectural standards. It provides instant UPI AutoPay 2.0 recurring mandates, 24x7 bank disbursals, multi-mode payment intents, double-entry financial ledger accounting, rule-based fraud detection, GST-compliant invoicing with PDF generation, cryptographic HMAC SHA-256 webhooks, and an interactive merchant console with 3D visualizers.

---

## 🌟 Core Platform Highlights

- ⚡ **Interactive 3D Hero Experience**: Real-time 3D particle constellation canvas with dynamic cursor parallax and tilting holographic metallic card.
- 💳 **Cashfree-Inspired Modern Light Theme**: High-contrast, accessibility-first design system (`#0066FF` brand blue, `#00D284` mint green, `#6851FF` indigo accent, `#F8FAFC` background).
- 🏦 **Double-Entry Financial Ledger**: Strictly balances debits and credits ($\sum \text{Debits} == \sum \text{Credits}$) across `CUSTOMER_CLEARING`, `MERCHANT_PAYABLE`, and `PLATFORM_REVENUE` with integer minor units (paise/cents).
- 🔄 **Strict Payment State Machine**: Enforces non-reversible lifecycle transitions: `REQUIRES_PAYMENT_METHOD` → `PROCESSING` → `SUCCEEDED` / `FAILED` → `REFUNDED`.
- 💸 **24x7 Instant Bank Payouts**: Disburse funds instantly across IMPS, NEFT, and RTGS with automated UTR tracking and double-entry balance locks.
- 🔁 **RBI-Compliant UPI AutoPay 2.0**: Native e-mandates with automated 24-hour pre-debit notifications and recurring billing cycles.
- 📄 **GST Compliance & Invoicing**: Itemized CGST, SGST, and IGST calculations with dynamic downloadable PDF invoices.
- 🛡️ **Risk & Dispute Shield**: Built-in chargeback defense rebuttal workflows and transaction velocity scoring.
- 🔐 **Dual Auth (Google OAuth 2.0 & Email/OTP)**: Official Google Sign-In with real token validation, phone OTP verification, and Formik + Yup schema validation on all inputs.
- 🚀 **Sub-Second Lazy Loading**: Route-level dynamic code splitting via `React.lazy()` and `<Suspense>` with a custom high-performance loader.

---

## 🏗️ System Architecture

```text
                                [ Client / Customer ]
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
      [ Hosted Checkout Session ]                      [ Merchant Application ]
       (/checkout/:sessionId)                           (Bearer sk_test_...)
                  │                                               │
                  └───────────────────────┬───────────────────────┘
                                          ▼
      ┌────────────────────────────────────────────────────────────────────────┐
      │                        PAYCORE REST API v1.0                           │
      │   (FastAPI + JWT Auth + Google OAuth 2.0 + Idempotency-Key Engine)     │
      └───────────────────────────────────┬────────────────────────────────────┘
                                          │
                     ┌────────────────────┴────────────────────┐
                     ▼                                         ▼
      ┌──────────────────────────────┐          ┌──────────────────────────────┐
      │    Payment State Machine     │          │      Risk & Fraud Engine     │
      │   (Strict Transition Rules)  │          │    (Rule-based Scoring)      │
      └──────────────┬───────────────┘          └──────────────┬───────────────┘
                     │                                         │
                     └────────────────────┬────────────────────┘
                                          ▼
                               ┌──────────────────────┐
                               │    Payment Router    │
                               └──────────┬───────────┘
                                          ▼
                         ┌──────────────────────────────────┐
                         │   Pluggable Payment Providers    │
                         ├──────────────────────────────────┤
                         │ • SandboxProvider (Simulations)  │
                         │ • UPI AutoPay 2.0 Mandate Engine │
                         │ • IMPS 24x7 Disbursal Rail       │
                         └────────────────┬─────────────────┘
                                          │
                     ┌────────────────────┴────────────────────┐
                     ▼                                         ▼
      ┌──────────────────────────────┐          ┌──────────────────────────────┐
      │   Double-Entry SQL Ledger    │          │    Webhook Delivery Engine   │
      │  (MySQL 8.0 / Async SQLite)  │          │   (HMAC SHA-256 Signatures)  │
      └──────────────────────────────┘          └──────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Backend Framework** | [FastAPI](https://fastapi.tiangolo.com/) (Python 3.12, Async/Await) |
| **ASGI Server** | [Uvicorn](https://www.uvicorn.org/) with multi-worker support |
| **Database & ORM** | [MySQL 8.0](https://www.mysql.com/) & [aiosqlite](https://github.com/omnilib/aiosqlite) with [SQLAlchemy 2.0](https://www.sqlalchemy.org/) |
| **Data Validation** | [Pydantic v2](https://docs.pydantic.dev/) & [email-validator](https://github.com/JoshData/python-email-validator) |
| **Security & Auth** | Argon2 / Bcrypt, PyJWT (HMAC-SHA256), Google OAuth token verification |
| **Frontend Framework** | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite 8](https://vitejs.dev/) |
| **Styling & Icons** | Vanilla CSS + [Tailwind CSS v4](https://tailwindcss.com/) + [Lucide React](https://lucide.dev/) |
| **Charts & Analytics** | [Recharts](https://recharts.org/) |
| **Testing** | [Pytest](https://docs.pytest.org/) & [pytest-asyncio](https://github.com/pytest-dev/pytest-asyncio) |

---

## ⚡ Quick Start (Single Command Run)

### 1. Clone the Repository
```bash
git clone https://github.com/chandan-me/PAYCORE.git
cd PAYCORE
```

### 2. Environment Configuration
Copy the sample environment file to `.env`:
```bash
cp .env.example .env
```
*(Optional: Add your Google OAuth credentials to `.env` if testing real Google Login).*

```ini
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3. Launch the Platform
Start both the **FastAPI Backend (Port 8000)** and **Vite Frontend (Port 5173)** with one command:

```bash
python run.py
```
*On Windows, you can also double-click `run.bat`.*

- **Frontend Application**: `http://localhost:5173`
- **Backend API & Swagger Docs**: `http://localhost:8000/docs`
- **Developer API Reference**: `http://localhost:5173/docs/api`

---

## 🧪 Running Automated Tests

Run the full async backend test suite (covering dispute workflows, full payment lifecycles, refunds, PDF invoices, payment links, state machine validation, payouts, and subscriptions):

```bash
cd backend
python -m pytest tests/ -v
```

**Expected output:**
```text
tests/test_disputes.py::test_dispute_evidence_and_resolution PASSED      [ 12%]
tests/test_end_to_end_flow.py::test_full_payment_and_refund_lifecycle PASSED [ 25%]
tests/test_invoices_payment_links.py::test_invoice_creation_and_pdf PASSED [ 37%]
tests/test_invoices_payment_links.py::test_payment_link_flow PASSED      [ 50%]
tests/test_payment_state_machine.py::test_valid_transitions PASSED       [ 62%]
tests/test_payment_state_machine.py::test_invalid_transitions PASSED     [ 75%]
tests/test_settlements_payouts.py::test_settlement_and_payout_flow PASSED [ 87%]
tests/test_subscriptions.py::test_subscription_lifecycle PASSED          [100%]
======================== 8 passed in 1.75s =========================
```

---

## 🔑 Default Sandbox Accounts

| Role | Email | Password |
|---|---|---|
| **Platform Administrator** | `admin@paycore.dev` | `Admin@12345` |
| **Merchant Administrator** | `merchant@paycore.dev` | `Merchant@12345` |

---

## 📖 API Documentation & Quick cURL

### Create a Payment Intent
```bash
curl -X POST http://localhost:8000/v1/payment_intents \
  -H "Authorization: Bearer sk_test_acmedemo987654321" \
  -H "Idempotency-Key: order_10001" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 249900,
    "currency": "INR",
    "description": "Pro Annual Plan Subscription"
  }'
```

### Disburse an Instant Bank Payout (24x7 IMPS)
```bash
curl -X POST http://localhost:8000/v1/payouts \
  -H "Authorization: Bearer sk_test_acmedemo987654321" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 4500000,
    "currency": "INR",
    "beneficiary_name": "Acme Global Corp",
    "account_number": "918237461234",
    "ifsc": "HDFC0000123",
    "transfer_mode": "IMPS"
  }'
```

---

## 📜 License
This project is open source and available under the [MIT License](LICENSE).
