# TukuPay

<p align="center">
  <img src="https://tuku.money/assets/tuku-coop-t-hh2nXK.png" alt="TukuPay Logo" width="120" height="120">
</p>

<p align="center">
  <strong>A Modern Fintech Mobile Payment Solution</strong>
</p>

<p align="center">
  <em>Simplifying payments, empowering communities</em>
</p>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Core Modules](#core-modules)
- [Security](#security)
- [Configuration](#configuration)
- [Development](#development)
- [Contributing](#contributing)

---

## 🎯 Overview

**TukuPay** is a comprehensive mobile payment application built with Flutter, designed to provide users with seamless financial transactions, bulk payments, fundraising capabilities, SMS communications, and merchant integrations. The app follows modern fintech standards with a focus on security, user experience, and scalability.

### Key Highlights

- 🔐 **Secure Authentication** - Multi-factor authentication with biometrics support
- 💳 **Multi-Wallet Management** - Create and manage multiple wallets
- 💸 **Instant Payments** - Send and receive money instantly
- 📱 **Bulk Operations** - Bulk payments and SMS services
- 🎯 **Fundraising** - Create and manage fundraising campaigns
- 🏪 **Merchant Integration** - Connect with merchants and churches
- 🤖 **AI-Powered** - BankGPT integration for intelligent banking assistance

---

## ✨ Features

### 💰 Wallet Management
- Create multiple wallets (Personal, Business, Shared)
- Real-time balance tracking
- Wallet-to-wallet transfers
- Add signatories for shared wallets
- Set primary wallet for quick transactions

### 💸 Money Transfers
- **Tuku Send** - Instant transfers to other TukuPay users
- **Bank Transfers** - Send money to bank accounts
- **M-Pesa Integration** - Seamless M-Pesa deposits and withdrawals
- **Card Top-ups** - Fund wallets via debit/credit cards

### 📊 Bulk Operations
- **Bulk Pay** - Pay multiple recipients simultaneously
- **Bulk SMS** - Send personalized messages to contacts and groups
- **SMS Credits Management** - Purchase and track SMS credits
- **Sender ID Management** - Custom sender IDs for business messaging

### 🎗️ Fundraising
- Create fundraising campaigns with goals and deadlines
- Track contributions and pledges in real-time
- Public and private fundraisers
- Analytics and reporting
- Share campaigns via checkout links

### 🏪 Merchants & Churches
- Discover and install merchant apps
- Church giving and tithing management
- Project contributions
- Teaching materials and resources

### 📱 Point of Sale (POS)
- STK Push payments
- Transaction history
- POS settings and configuration
- Real-time payment notifications

### 🤖 BankGPT Integration
- AI-powered banking assistant
- Secure token-based authentication
- Seamless iframe integration

### 📋 Transaction Management
- Comprehensive transaction history
- Filter by date range, type, and status
- Download transactions as PDF
- Detailed transaction receipts

### 👤 Profile & Settings
- KYC verification (Individual & Business)
- Contact management
- Group management for bulk operations
- Banking details management
- Security settings

---

## 🚀 Getting Started

### Prerequisites

- Flutter SDK `^3.6.1`
- Dart SDK
- Android Studio / VS Code
- Android SDK (for Android development)
- Xcode (for iOS development on macOS)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/albatomuch/tuku.git
   cd tuku
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Generate Isar database schemas**
   ```bash
   dart run build_runner build
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   ROOT=https://api.tuku.money
   # Add other environment variables as needed
   ```

5. **Run the application**
   ```bash
   # Development
   flutter run
   
   # Release build
   flutter run --release
   ```

### Building for Production

```bash
# Android APK
flutter build apk --split-per-abi

# Android App Bundle
flutter build appbundle --release

# iOS
flutter build ios --release
```

---

## 🏗️ Architecture

TukuPay follows a clean architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        PRESENTATION                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Screens   │  │   Widgets   │  │     Providers       │  │
│  │    (UI)     │  │ (Components)│  │  (State Management) │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                         DOMAIN                               │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │        Models           │  │       Repository        │   │
│  │   (Business Entities)   │  │    (Data Contracts)     │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                          DATA                                │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │        Services         │  │       Endpoints         │   │
│  │    (API Integration)    │  │   (API Configuration)   │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                       LOCAL DATA                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │    Isar Database        │  │   Secure Storage        │   │
│  │   (Local Persistence)   │  │   (Sensitive Data)      │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### State Management

TukuPay uses **Provider** for state management, offering:
- Reactive UI updates
- Separation of business logic from UI
- Easy testing and maintenance

---

## 📁 Project Structure

```
lib/
├── main.dart                    # Application entry point
├── app_theme.dart               # Global theme configuration
├── routes.dart                  # Route definitions
├── route_tracker.dart           # Navigation tracking
│
├── constants/                   # App constants & configurations
│   ├── colors.dart
│   ├── dimensions.dart
│   └── shadows.dart
│
├── endpoints/                   # API endpoint configurations
│   ├── auth.dart
│   ├── wallets.dart
│   ├── payment_endpoints.dart
│   └── ...
│
├── models/                      # Data models
│   ├── auth/
│   ├── wallet/
│   ├── transactions/
│   ├── fundraisers/
│   └── ...
│
├── providers/                   # State management
│   ├── auth_provider.dart
│   ├── wallet_provider.dart
│   ├── transactions_provider.dart
│   └── ...
│
├── repository/                  # Data repositories
│
├── screens/                     # UI screens
│   ├── auth/
│   ├── home/
│   ├── wallet/
│   ├── transactions/
│   ├── bulk_pay/
│   ├── bulk_sms/
│   ├── fundraiser/
│   └── ...
│
├── services/                    # API services
│   ├── auth_service.dart
│   ├── wallet_service.dart
���   ├── payments_service.dart
│   ├── local/                   # Local data services
│   └── formatters/              # Data formatters
���
├── utils/                       # Utility functions
│   └── cached_auth_image_provider.dart
│
├── widgets/                     # Reusable UI components
│   ├── buttons/
│   ├── cards/
│   ├── sheets/
│   ├── dialogs/
│   ├── home/
│   ├── wallet/
│   ├── fundraiser/
│   └── ...
│
└── isolate/                     # Background processing
    └── kyc_worker.dart
```

---

## 🔧 Core Modules

### Authentication Module

Handles user authentication including:
- Phone number registration and verification
- Email verification
- Password management (login, reset, forgot)
- PIN setup and verification
- Biometric authentication
- Session management with auto-logout

### Wallet Module

Complete wallet management:
- Wallet CRUD operations
- Balance management
- Transaction history per wallet
- Signatory management for shared wallets
- Primary wallet selection

### Payments Module

Comprehensive payment processing:
- Wallet-to-wallet transfers
- Bank account transfers
- M-Pesa integration
- Card payments
- Payment validation and OTP verification

### Bulk Operations Module

Efficient batch processing:
- Contact and group management
- Bulk payment distribution
- Bulk SMS with template support
- Progress tracking and reporting

### Fundraising Module

Full-featured fundraising platform:
- Campaign creation and management
- Contribution tracking
- Pledge management
- Public/private visibility
- Analytics dashboard

### KYC Module

Identity verification:
- Individual KYC
- Business KYC
- Document capture with camera
- Status tracking

---

## 🔐 Security

TukuPay implements multiple security layers:

### Authentication Security
- **JWT Tokens** - Secure API authentication
- **Refresh Tokens** - Automatic token renewal
- **Session Timeout** - Auto-logout after inactivity (3 minutes)
- **PIN Protection** - 4-digit PIN for transactions
- **Biometric Auth** - Fingerprint/Face ID support

### Data Security
- **Flutter Secure Storage** - Encrypted storage for sensitive data
- **Isar Database** - Local encrypted database
- **HTTPS** - All API communications encrypted
- **Token Refresh Mechanism** - Automatic token refresh on API calls

### Transaction Security
- **OTP Verification** - For high-value transactions
- **Multi-signatory Approval** - For shared wallets
- **Transaction PIN** - Required for all monetary operations

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with the following:

```env
# API Configuration
ROOT=https://api.tuku.money

# Optional: Testing
TEST_ROOT=https://test.api.tuku.money
```

### Theme Customization

Modify `lib/app_theme.dart` to customize:
- Primary and secondary colors
- Typography
- Component styles
- Dark/Light mode

### Platform Configuration

#### Android (`android/app/build.gradle`)
- Minimum SDK: 21
- Target SDK: Latest stable
- Permissions: Internet, Camera, Contacts, SMS

#### iOS (`ios/Runner/Info.plist`)
- Camera usage description
- Contacts usage description
- Biometric usage description

---

## 💻 Development

### Code Style

Follow Flutter/Dart best practices:
- Use `flutter analyze` for linting
- Follow naming conventions
- Document public APIs
- Keep widgets focused and reusable

### Testing

```bash
# Run unit tests
flutter test

# Run integration tests
flutter test integration_test/
```

### Debugging

```bash
# Run with verbose logging
flutter run --verbose

# Enable WebView debugging (Android)
# Already configured in main.dart
```

### Generating Code

For Isar database schemas:
```bash
dart run build_runner build --delete-conflicting-outputs
```

---

## 📚 Additional Documentation

Additional documentation can be found in the `/docs` directory:

- **[Developer Guide](./docs/DEVELOPER_GUIDE.md)** - Technical guide for developers including architecture, patterns, and best practices
- **[API Documentation](./docs/API_DOCUMENTATION.md)** - Complete API endpoint reference with request/response examples
- **[Widget Catalog](./docs/WIDGET_CATALOG.md)** - Catalog of reusable UI components with usage examples
- **[Feature Guide](./docs/FEATURE_GUIDE.md)** - Detailed documentation for each feature module

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Message Convention

```
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore
```

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 📞 Support

For support and inquiries:
- **Email**: support@tuku.money
- **Website**: https://tuku.money

---

<p align="center">
  Built with ❤️ using Flutter
</p>

<p align="center">
  <strong>TukuPay</strong> - Simplifying Payments, Empowering Communities
</p>

