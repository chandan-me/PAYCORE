# 🚀 PAYCORE — Enterprise API Banking & Payment Orchestration Engine

[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-00D284.svg)](https://github.com/chandan-me/PAYCORE)
[![CI / CD](https://github.com/chandan-me/PAYCORE/actions/workflows/ci.yml/badge.svg)](https://github.com/chandan-me/PAYCORE/actions)
[![Database](https://img.shields.io/badge/Database-MySQL%208.0%20%7C%20PostgreSQL%20%7C%20SQLite-00758F.svg)](https://www.mysql.com/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.12-009688.svg)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript%20%2B%20Vite%208-61DAFB.svg)](https://react.dev/)
[![Design System](https://img.shields.io/badge/UI%2FUX-Cashfree%20Light%20Theme-0066FF.svg)](https://www.cashfree.com/)
[![Tests](https://img.shields.io/badge/Tests-8%2F8%20Passing%20(100%25)-brightgreen.svg)]()
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

**PAYCORE** is an enterprise-grade API banking and payment orchestration infrastructure engineered following **Cashfree Payments** and **Stripe** architectural standards. Built for global scalability, high-concurrency transaction throughput, zero-downtime multi-rail routing, double-entry financial ledger accounting, and seamless developer integration.

---

## 🌟 Platform Capabilities & Cashfree Parity

| Feature Category | Capabilities & Specifications | Cashfree Benchmark |
|---|---|---|
| **Payment Gateway (PG)** | 120+ Payment Modes (Cards, UPI, Netbanking, Wallets, EMI), 3DS2 Dynamic Auth, Dual Mode (`TEST` / `LIVE`) | Instant Collect & Checkout |
| **Instant 24x7 Payouts** | Sub-second bank disbursals via IMPS, NEFT, RTGS & UPI VPA with automated UTR tracking & balance reservation | Cashfree Payouts |
| **UPI AutoPay 2.0** | Recurring mandate creation, automated 24-hour pre-debit notifications, execution lifecycle | Cashfree Subscriptions |
| **Merchant KYC & Onboarding** | Multi-step portal: GSTIN auto-lookup via Govt GSTN, ₹1.00 Penny Drop bank account verification, Director KYC | Cashfree Merchant Onboarding |
| **Smart Payment Links** | Single/Multi-use payment links, WhatsApp & SMS triggers, expiry windows, branded hosted payment pages | Cashfree Payment Links |
| **GST Invoicing Engine** | Itemized CGST, SGST, IGST calculations, HSN/SAC codes, dynamic PDF generation & download | Cashfree Invoicing |
| **Double-Entry Ledger** | Strict debits = credits balance ($\sum \text{Debits} == \sum \text{Credits}$) with integer minor units (paise/cents) | Core Banking Ledger |
| **Dispute & Risk Shield** | Chargeback lifecycles (`UNDER_REVIEW`, `EVIDENCE_SUBMITTED`, `WON`, `LOST`), velocity risk scoring | Cashfree Risk & Shield |
| **Developer Tools** | Interactive Developer Simulator, idempotency payload cache, cryptographic HMAC SHA-256 webhooks | Developer Suite |
| **UI / UX Experience** | 3D dynamic hero animation, Cashfree Light Theme (`#0066FF`, `#00D284`, `#F8FAFC`), Toast Notifications | Modern Fintech Portal |

---

## 🏗️ High-Level System Architecture

```text
                                  [ Web / Mobile Client ]
                                             │
                   ┌─────────────────────────┴─────────────────────────┐
                   ▼                                                   ▼
       [ Hosted Checkout Pages ]                           [ Merchant Backend Apps ]
        (/checkout/:sessionId)                               (Bearer sk_live_...)
                   │                                                   │
                   └─────────────────────────┬─────────────────────────┘
                                             ▼
       ┌───────────────────────────────────────────────────────────────────────────┐
       │                        PAYCORE API Gateway v1.0                           │
       │    (FastAPI + JWT Auth + Google OAuth 2.0 + Idempotency Engine + CORS)     │
       └─────────────────────────────────────┬─────────────────────────────────────┘
                                             │
                      ┌──────────────────────┴──────────────────────┐
                      ▼                                             ▼
       ┌──────────────────────────────┐              ┌──────────────────────────────┐
       │    Payment State Machine     │              │     Risk & Velocity Engine   │
       │  (Strict Lifecycle Manager)  │              │    (Rule-based Fraud Check)  │
       └──────────────┬───────────────┘              └──────────────┬───────────────┘
                      │                                             │
                      └──────────────────────┬──────────────────────┘
                                             ▼
                                ┌─────────────────────────┐
                                │ Dynamic Payment Router  │
                                └────────────┬────────────┘
                                             ▼
                          ┌─────────────────────────────────────┐
                          │    Pluggable Banking & PG Rails     │
                          ├─────────────────────────────────────┤
                          │ • Card & Netbanking Gateway Rail    │
                          │ • UPI AutoPay 2.0 Recurring Rail    │
                          │ • 24x7 IMPS / NEFT Disbursal Rail   │
                          │ • Sandbox Interactive Simulator     │
                          └──────────────────┬──────────────────┘
                                             │
                      ┌──────────────────────┴──────────────────────┐
                      ▼                                             ▼
       ┌──────────────────────────────┐              ┌──────────────────────────────┐
       │   Double-Entry SQL Ledger    │              │    Webhook Delivery Engine   │
       │  (MySQL 8.0 / Async SQLite)  │              │   (HMAC SHA-256 Signatures)  │
       └──────────────────────────────┘              └──────────────────────────────┘
```

---

## 🛠️ Technology Stack

- **Backend**: Python 3.12, FastAPI, Uvicorn, SQLAlchemy 2.0 (Async), Pydantic v2, PyJWT, ReportLab
- **Frontend**: React 18, TypeScript, Vite 8, Lucide React, Recharts, Formik + Yup
- **Databases**: MySQL 8.0 / PostgreSQL (Production), SQLite Async (Development/Testing)
- **Security**: Argon2 / Bcrypt password hashing, HMAC SHA-256 webhook signatures, PCI-DSS SAQ-A compliance architecture
- **Design System**: Cashfree Light Design System (`#0066FF` brand blue, `#00D284` mint green, `#F8FAFC` background)

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Git

### 2. Clone & Setup
```bash
git clone https://github.com/chandan-me/PAYCORE.git
cd PAYCORE
cp .env.example .env
```

### 3. Launch Development Server
Run the full platform with a single command:
```bash
python run.py
```
*(On Windows, you can also double-click `run.bat`)*

- **Merchant Portal & Landing**: [http://localhost:5173](http://localhost:5173)
- **Interactive REST API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Developer API Reference**: [http://localhost:5173/docs/api](http://localhost:5173/docs/api)

---

## 🌐 Production Deployment Guide (To The World)

To deploy **PAYCORE** for real-world production use across the internet, follow the enterprise deployment strategies below.

### Method 1: Docker Compose (Single or Multi-Node Server)

Create a production `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    restart: always
    environment:
      MYSQL_DATABASE: paycore
      MYSQL_USER: paycore_user
      MYSQL_PASSWORD: ${DB_PASSWORD}
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
    ports:
      - "3306:3306"
    networks:
      - paycore-net

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    environment:
      DATABASE_URL: mysql+aiomysql://paycore_user:${DB_PASSWORD}@db:3306/paycore
      JWT_SECRET: ${JWT_SECRET}
      APP_ENV: production
      CORS_ORIGINS: "https://yourdomain.com,https://api.yourdomain.com"
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
    depends_on:
      - db
    ports:
      - "8000:8000"
    networks:
      - paycore-net

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: always
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    networks:
      - paycore-net

volumes:
  db_data:

networks:
  paycore-net:
    driver: bridge
```

Launch production cluster:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

### Method 2: Nginx Reverse Proxy with Free SSL (Let's Encrypt / Certbot)

Sample `/etc/nginx/sites-available/paycore.conf`:

```nginx
# API & Webhook Subdomain
server {
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend Merchant Portal & Checkout
server {
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/paycore/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable SSL certificate with Certbot:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

---

### Method 3: Cloud Deployment (AWS / GCP / Render / Railway)

1. **Backend (Container / Cloud Run / App Runner)**:
   - Command: `uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4`
   - Set environment variables for `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`.
2. **Frontend (Vercel / Netlify / AWS CloudFront + S3)**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Set environment variable `VITE_API_URL=https://api.yourdomain.com`

---

## 🔑 Default Sandbox Credentials

| Account Role | Email Address | Password | Permissions |
|---|---|---|---|
| **Platform Administrator** | `admin@paycore.dev` | `Admin@12345` | Global oversight, system ledgers, all merchants |
| **Merchant Administrator** | `merchant@paycore.dev` | `Merchant@12345` | Payments, payouts, API keys, KYC onboarding |

---

## 🧪 Automated Testing Suite

PAYCORE comes with a 100% passing test suite:

```bash
cd backend
python -m pytest tests/ -v
```

**Test Coverage Highlights:**
- `test_end_to_end_flow.py`: Full payment authorization, capture, and partial/full refund lifecycle
- `test_disputes.py`: Chargeback creation, evidence submission, and rebuttal arbitration
- `test_settlements_payouts.py`: 24x7 IMPS disbursals, UTR tracking, and ledger balance locks
- `test_subscriptions.py`: UPI AutoPay 2.0 recurring mandate creation and auto-debit triggers
- `test_invoices_payment_links.py`: GST invoicing calculations and PDF generation
- `test_payment_state_machine.py`: Non-reversible state transition enforcement

---

## 📖 API Reference & Code Examples

### 1. Initialize a Payment Intent
```bash
curl -X POST https://api.yourdomain.com/v1/payment_intents \
  -H "Authorization: Bearer sk_live_your_secret_key" \
  -H "Idempotency-Key: order_tx_88921" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 249900,
    "currency": "INR",
    "description": "Annual SaaS Enterprise Subscription",
    "customer": {
      "email": "customer@example.com",
      "phone": "+919876543210",
      "name": "Rajesh Sharma"
    }
  }'
```

### 2. Disburse 24x7 Bank Payout (IMPS / NEFT)
```bash
curl -X POST https://api.yourdomain.com/v1/payouts \
  -H "Authorization: Bearer sk_live_your_secret_key" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1500000,
    "currency": "INR",
    "beneficiary_name": "Acme Technologies Pvt Ltd",
    "account_number": "918237461234",
    "ifsc": "HDFC0000123",
    "transfer_mode": "IMPS"
  }'
```

### 3. Verify Webhook Signature (Python / HMAC-SHA256)
```python
import hmac
import hashlib

def verify_paycore_signature(payload_bytes: bytes, signature_header: str, secret: str) -> bool:
    expected = hmac.new(secret.encode('utf-8'), payload_bytes, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature_header)
```

---

## 📜 Compliance & Security Architecture

- **PCI-DSS Level 1 Ready**: Card PAN and CVV data are tokenized client-side and never touch persistent merchant databases.
- **Double-Entry Ledger Integrity**: Every transaction records strict balancing debit and credit entries down to the exact paisa/cent.
- **Idempotency Guard**: Guarantees that network retries with identical `Idempotency-Key` headers will never result in duplicate charges.
- **Cryptographic Signatures**: Webhook payloads are signed with HMAC-SHA256 using merchant-specific rotating secret keys.

---

## 📄 License
This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.
