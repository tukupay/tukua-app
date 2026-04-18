# TUKU PAY MOBILE APP

## Development Scope & Budget Revision Document

**Date:** April 2, 2026  
**Prepared For:** Client Review  
**Project:** TukuPay Flutter Mobile Application  

---

## 1. EXECUTIVE SUMMARY

This document outlines the original development scope, work completed to date, additional features implemented beyond the initial scope, and the revised budget reflecting the expanded functionality of the TukuPay mobile application.

---

## 2. ORIGINAL SCOPE (Initial Contract: KES 135,000)

| # | Module | Description | Priority | Fee (KES) |
|---|--------|-------------|----------|-----------|
| 1 | Authentication & Onboarding | Login, registration, MFA, password reset, onboarding wizard | 1 | 7,000 |
| 2 | KYC & Profile Management | KYC submission, photo upload, profile edits, status tracking | 1 | 8,000 |
| 3 | Wallet Management | Wallet list, balances, account linking/unlinking | 1 | 10,000 |
| 4 | Funds Transfer (FT) | W2W, W2Bank, Bank2W, MPESA, pay bill, till, POS, STK push | 1 | 20,000 |
| 5 | Virtual Cards | Create/delete cards, set limits, view reports | 2 | 8,000 |
| 6 | Statements & Reports | View and export transaction history | 2 | 6,000 |
| 7 | Bulk SMS | Top-up, sender ID, contacts, templates | 3 | 7,000 |
| 8 | Fundraiser Module | Create/manage fundraisers, fund workflows, WhatsApp reports | 2 | 15,000 |
| 9 | Bulk Pay | Batch payments, contact book, reports | 2 | 12,000 |
| 10 | Bills Module | Kenya Power, other utilities, custom bills | 3 | 5,000 |
| 11 | POS / STK Push | Payment requests via POS or STK push from mobile | 1 | 8,000 |
| 12 | General Integration & Testing | API integration for all modules, bug fixes, QA | 1 | 9,000 |
| | **ORIGINAL TOTAL** | | | **135,000** |

---

## 3. PAYMENTS RECEIVED TO DATE

| Month | Amount (KES) |
|-------|--------------|
| August 2025 | 35,000 |
| September 2025 | 5,000 |
| October 2025 | 15,000 |
| November 2025 | 15,000 |
| December 2025 | 15,000 |
| January 2026 | 5,000 |
| **Total Paid** | **90,000** |

**Outstanding Balance (Original Scope):** KES 45,000

---

## 4. COMPLETED WORK FROM ORIGINAL SCOPE

### ✅ Authentication & Onboarding (100% Complete)
- Phone number-based registration with OTP verification
- Multi-factor authentication (PIN + Biometrics)
- Password reset flow with email/SMS options
- Session management with auto-logout (3-minute idle timeout)
- Biometric authentication (fingerprint/face recognition)
- Token refresh mechanism

### ✅ KYC & Profile Management (100% Complete)
- Individual KYC: ID scanning, selfie capture
- Business KYC: Business name, KRA PIN upload
- Document camera integration for ID capture
- Profile photo upload and management
- Status tracking dashboard

### ✅ Wallet Management (100% Complete)
- Create unlimited wallets (Personal, Business, Shared)
- Real-time balance display
- Set primary wallet
- Wallet-to-wallet transfers
- Wallet alias search functionality
- Wallet transaction history

### ✅ Funds Transfer (100% Complete)
- Tuku Send (wallet-to-wallet)
- Bank transfers (multiple banks supported)
- M-Pesa integration (deposits & withdrawals)
- Pay Bill integration
- Till/Buy Goods payments
- STK Push for payments
- Transaction validation with PIN/OTP

### ✅ Statements & Reports (100% Complete)
- Transaction history with filtering
- Date range selection
- PDF statement generation
- Export functionality

### ✅ Bulk SMS (100% Complete)
- Send to individual contacts
- Send to contact groups
- Custom sender ID support
- SMS credits management
- SMS top-up via wallet
- Delivery reports
- Outbox with status tracking
- **NEW: Local SMS via device SIM card**

### ✅ Fundraiser Module (100% Complete)
- Create/manage fundraising campaigns
- Set goals and deadlines
- Accept contributions and pledges
- Progress tracking dashboard
- Checkout link generation
- Pledge payment tracking

### ✅ Bulk Pay (100% Complete)
- Select from app contacts
- Select from contact groups
- Manual phone entry
- Individual or uniform amounts
- Batch payment processing
- Transaction reports
- **NEW: Device contact integration**

### ✅ Bills Module (100% Complete)
- Kenya Power (KPLC) payments
- Other utility integrations

### ✅ POS / STK Push (100% Complete)
- POS configuration
- STK Push payment requests
- Payment status tracking
- Real-time notifications

### ✅ General Integration & Testing (100% Complete)
- Full API integration
- Error handling
- Bug fixes
- QA testing

---

## 5. NEW FEATURES IMPLEMENTED (BEYOND ORIGINAL SCOPE)

These features were not part of the initial scope and represent significant additional development work:

### 5.1 Device Contacts Integration
**Description:** Fetch and sync contacts directly from the user's phone for use across the application.

| Feature | Details |
|---------|---------|
| Contacts Management | Full phone contacts sync with permission handling |
| Contact Data | Name, phone number, search and filtering |
| Integration | Bulk Pay recipient selection, Bulk SMS recipient selection |
| User Experience | Progress indicator during sync, selection interface |

**Estimated Value:** KES 8,000

---

### 5.2 Local SMS via SIM Card
**Description:** Send SMS messages directly using the device's SIM card(s), bypassing cloud SMS services for cost savings.

| Feature | Details |
|---------|---------|
| SIM Detection | Automatically detects available SIM cards on device |
| SIM Selection | User can choose which SIM card to send from |
| Direct Sending | Messages sent directly from phone, no SMS credits needed |
| Integration | Bulk SMS module with "Local Sender ID" option |

**Estimated Value:** KES 10,000

---

### 5.3 SasaPay Onboarding Integration (In Progress)
**Description:** Integration with SasaPay payment platform for expanded payment options and SasaPay wallet creation.

| Feature | Status |
|---------|--------|
| **Individual Onboarding** | UI Started |
| - Confirmation screen (existing KYC details) | Pending |
| - OTP verification | Pending |
| - SasaPay wallet creation | Pending |
| - Wallet activation (KYC submission to SasaPay) | Pending |
| **Business Onboarding** | UI Started |
| - Confirmation screen (existing KYC details) | Pending |
| - Additional business fields (product type, country, etc.) | Pending |
| - OTP verification | Pending |
| - Additional business documents (CR-12, POA, POB, Director IDs) | Pending |
| - SasaPay wallet creation | Pending |
| **SasaPay Wallet Management** | Pending |
| - Check SasaPay status before adding wallets | Pending |
| - SasaPay wallet display and transactions | Pending |

**Current Status:** UI development started, pending full completion followed by API integration, testing, and SasaPay wallet creation.

**Estimated Value:** KES 12,000

---

### 5.4 Complete UI/UX Upgrade
**Description:** Full redesign and modernization of the entire application interface.

#### Redesigned Components:

| Category | Components Redesigned |
|----------|----------------------|
| **Buttons** | Primary buttons, secondary buttons, action buttons, sheet buttons |
| **Cards** | Wallet cards, transaction cards, contact cards, fundraiser cards, merchant cards |
| **Input Fields** | Text fields, amount inputs, phone inputs, PIN inputs, search fields |
| **Bottom Sheets** | Wallet selector, top-up methods, send methods, confirmation sheets, SIM selection |
| **Dialogs** | Insufficient balance, confirmation dialogs, alert dialogs |
| **Loading States** | Loading indicators, shimmer effects, skeleton screens |
| **Navigation** | App bars, bottom navigation |
| **Home Widgets** | Banners carousel, tools cards, quick actions, wallet display, recent transactions |
| **PIN System** | PIN dots, numeric keypad, transaction PIN, PIN reset flow |

#### UI Improvements:
- Modern glassmorphism effects
- Consistent color theming
- Custom typography throughout
- Smooth animations and transitions
- Modern iconography
- Responsive layouts
- Gradient backgrounds
- Shimmer loading states
- Improved form validation

#### Screens Redesigned:

| Module | Screens |
|--------|---------|
| **Home** | Main dashboard, wallet display, quick actions, recent transactions |
| **Authentication** | Login, Register, OTP, PIN setup/verify/reset |
| **Wallets** | Wallet list, wallet details, new wallet, transactions |
| **Transfers** | Send money, top-up, bank transfer, M-Pesa |
| **Bulk Pay** | Recipient selection, amount entry, preview, history |
| **Bulk SMS** | Compose, contacts/groups selection, preview, sender IDs |
| **Fundraiser** | Campaign list, create, details, contributions, pledges |
| **Profile** | Profile landing, device contacts, settings |
| **POS** | Configuration, payment request |
| **Notifications** | Notification list, bell indicator |

**Estimated Value:** KES 25,000

---

### 5.5 BankGPT Integration
**Description:** AI-powered banking assistant accessible within the app.

| Feature | Details |
|---------|---------|
| Authentication | Seamless login with existing credentials |
| Session Sync | Synchronized with main app session |
| Navigation | Proper back button handling |
| Integration | Full-screen assistant interface |

**Estimated Value:** KES 8,000

---

### 5.6 Merchant System
**Description:** Discover, install, and interact with merchant applications (Churches, Businesses, NGOs).

| Feature | Details |
|---------|---------|
| Merchant Store | Browse available merchants |
| Install/Uninstall | Add or remove merchants from home screen |
| Church Features | Tithes, offerings, projects, teachings |
| Quick Access | Installed merchants appear on home screen |

**Estimated Value:** KES 10,000

---

### 5.7 Signatories System
**Description:** Multi-signature approval system for shared wallet transactions.

| Feature | Details |
|---------|---------|
| Add Signatories | Invite users to co-manage wallets |
| Pending Approvals | Review transactions requiring approval |
| Accept/Reject | Approve or decline signatory invitations |
| Approval Workflow | Multi-step transaction authorization |

**Estimated Value:** KES 7,000

---

### 5.8 Checkout Links System
**Description:** Generate shareable payment links for fundraisers and collections.

| Feature | Details |
|---------|---------|
| Link Generation | Create payment links for any wallet |
| Link Sharing | Share via SMS, WhatsApp, etc. |
| Payment Tracking | Monitor payments received via links |
| Integration | Fundraisers, Bulk SMS with payment links |

**Estimated Value:** KES 5,000

---

## 6. BUDGET SUMMARY

### Original Contract
| Description | Amount (KES) |
|-------------|--------------|
| Original Scope | 135,000 |
| Payments Received | (90,000) |
| **Outstanding Balance** | **45,000** |

### Additional Features
| Feature | Estimated Value (KES) |
|---------|----------------------|
| Device Contacts Integration | 8,000 |
| Local SMS via SIM Card | 10,000 |
| SasaPay Onboarding (In Progress) | 12,000 |
| Complete UI/UX Upgrade | 25,000 |
| BankGPT Integration | 8,000 |
| Merchant System | 10,000 |
| Signatories System | 7,000 |
| Checkout Links System | 5,000 |
| **Additional Features Total** | **85,000** |

### Revised Total
| Description | Amount (KES) |
|-------------|--------------|
| Original Scope Outstanding | 45,000 |
| Additional Features | 85,000 |
| **Total Outstanding** | **130,000** |

---

## 7. NOTES

1. All original scope items have been completed and deployed.
2. Additional features were implemented to enhance user experience and meet evolving requirements.
3. The UI/UX upgrade represents a complete visual overhaul of all screens and components.
4. SasaPay onboarding is in progress — UI development started, pending full completion (Individual onboarding, Business onboarding, SasaPay wallet creation) followed by API integration and testing.

---

**Prepared By:** Albert Huthu  
**Date:** April 2, 2026

---

*This document is for internal review and budget reconciliation purposes.*
