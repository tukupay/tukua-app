# TukuPay Feature Guide

This guide provides detailed information about each feature module in the TukuPay application.

---

## Table of Contents

1. [Authentication & Security](#authentication--security)
2. [Wallet Management](#wallet-management)
3. [Money Transfers](#money-transfers)
4. [Bulk Payments](#bulk-payments)
5. [Bulk SMS](#bulk-sms)
6. [Fundraising](#fundraising)
7. [Point of Sale (POS)](#point-of-sale-pos)
8. [Merchants](#merchants)
9. [BankGPT Integration](#bankgpt-integration)
10. [Signatories](#signatories)

---

## Authentication & Security

### Overview

TukuPay implements a comprehensive authentication system with multiple security layers to protect user accounts and transactions.

### Features

#### User Registration
- Phone number-based registration
- Email verification (optional)
- OTP verification via SMS
- Password strength requirements

#### Login Methods
- Phone number + Password
- PIN-based quick access
- Biometric authentication (fingerprint/face)

#### Security Features
- **Session Timeout**: Auto-logout after 3 minutes of inactivity
- **Idle Warning**: 30-second countdown before forced logout
- **4-digit PIN**: Required for all transactions
- **OTP Verification**: For high-value transactions
- **Token Refresh**: Automatic access token renewal

### Implementation Files

| File | Purpose |
|------|---------|
| `providers/auth_provider.dart` | Authentication state management |
| `services/auth_service.dart` | Auth API calls |
| `screens/auth/` | Auth UI screens |
| `widgets/auth/` | Auth-related widgets |

### User Flow

```
App Launch
    │
    ├─► First Time ──► Register ──► Verify OTP ──► KYC ──► PIN Setup ──► Home
    │
    └─► Returning User ──► Login ──► PIN/Biometric ──► Home
```

### Key Provider Methods

```dart
// AuthProvider
await auth.register(phone, email, password);
await auth.verifyPhoneOtp(otp);
await auth.login(phone, password);
await auth.setupPin(pin);
await auth.verifyPin(pin);
await auth.sendPinResetOtp();
await auth.resetPin(otp, newPin);
await auth.logout();
```

---

## Wallet Management

### Overview

Users can create and manage multiple wallets for different purposes (personal, business, shared).

### Features

- Create unlimited wallets
- Set primary wallet for quick transactions
- View wallet-specific transaction history
- Add signatories for shared wallets
- Link wallets to bank accounts

### Wallet Types

| Type | Description | Signatories |
|------|-------------|-------------|
| Personal | Individual wallet | No |
| Business | Business transactions | Optional |
| Shared | Multiple owners | Required |

### Implementation Files

| File | Purpose |
|------|---------|
| `providers/wallet_provider.dart` | Wallet state management |
| `services/wallet_service.dart` | Wallet API calls |
| `models/wallet/` | Wallet data models |
| `screens/wallet/` | Wallet UI screens |

### Key Provider Methods

```dart
// WalletProvider
await wallet.fetchWallets();
await wallet.createWallet(name, description);
await wallet.updateWallet(id, updates);
await wallet.setPrimaryWallet(walletId);
await wallet.searchUserByPhone(phone);
await wallet.searchUserByAlias(alias);
wallet.selectWallet(wallet);
wallet.resetSearch();
```

### User Flow

```
Wallets List ──► Create Wallet ──► Enter Details ──► Confirm ──► Success
      │
      └─► Wallet Details ──► View Transactions
                    │
                    └─► Edit/Delete
                    │
                    └─► Add Signatory
```

---

## Money Transfers

### Overview

TukuPay supports multiple money transfer methods for different use cases.

### Transfer Methods

#### 1. Tuku Send (Wallet-to-Wallet)
- Instant transfers to TukuPay users
- Search by phone number or alias
- No fees for internal transfers

#### 2. Bank Transfer
- Send to any bank account
- Support for multiple banks
- Real-time or scheduled transfers

#### 3. M-Pesa Integration
- Send to M-Pesa numbers
- STK Push for top-ups
- M-Pesa withdrawal

### Implementation Files

| File | Purpose |
|------|---------|
| `providers/payments_provider.dart` | Payment state |
| `services/payments_service.dart` | Payment API calls |
| `screens/send_moneys/` | Send money screens |
| `screens/topups/` | Top-up screens |

### Transfer Flow

```
Select Method ──► Enter Details ──► Confirm ──► Enter PIN ──► Success
                                        │
                                        └─► OTP (if high value)
```

### Key Provider Methods

```dart
// PaymentsProvider
await payments.sendToWallet(sourceWalletId, recipientPhone, amount, pin);
await payments.sendToBank(sourceWalletId, bankCode, accountNumber, amount, pin);
await payments.topUpViaMpesa(walletId, phone, amount);
await payments.checkStkStatus(checkoutRequestId);
```

---

## Bulk Payments

### Overview

Send payments to multiple recipients simultaneously, ideal for salaries, dividends, or group payments.

### Features

- Select recipients from contacts
- Select recipients from groups
- Manual phone number entry
- Set individual or uniform amounts
- Transaction history and reports

### Implementation Files

| File | Purpose |
|------|---------|
| `providers/bulk_pay_provider.dart` | Bulk pay state |
| `services/payments_service.dart` | Bulk pay API |
| `screens/bulk_pay/` | Bulk pay screens |
| `widgets/bulkpay/` | Bulk pay widgets |

### User Flow

```
Select Recipients ──► Set Amounts ──► Review ──► Confirm ──► PIN ──► Processing ──► Results
      │
      ├─► From Contacts
      │
      ├─► From Groups
      │
      └─► Manual Entry
```

### Recipient Selection Methods

1. **Device Contacts**: Import from phone contacts
2. **App Contacts**: Use saved TukuPay contacts
3. **Groups**: Select entire contact groups
4. **Manual Entry**: Enter phone numbers directly (comma-separated)

### Key Provider Methods

```dart
// BulkPayProvider
bulkPay.selectContact(contact);
bulkPay.selectGroup(group);
bulkPay.addManualRecipient(phone);
bulkPay.setAmount(recipientId, amount);
bulkPay.setUniformAmount(amount);
await bulkPay.processBulkPayment(sourceWalletId, pin);
bulkPay.resetState();
```

---

## Bulk SMS

### Overview

Send SMS messages to multiple recipients with custom sender IDs and templates.

### Features

- Send to contacts or groups
- Custom sender IDs
- Local sender ID support
- SMS credits management
- Delivery reports

### SMS Credits

| Package | Credits | Price (KES) |
|---------|---------|-------------|
| Starter | 100 | 150 |
| Basic | 500 | 700 |
| Pro | 1000 | 1,300 |
| Enterprise | 5000 | 6,000 |

### Implementation Files

| File | Purpose |
|------|---------|
| `providers/bulk_sms_provider.dart` | SMS state |
| `providers/credits_provider.dart` | Credits management |
| `providers/sender_ids_provider.dart` | Sender ID management |
| `services/sms_service.dart` | SMS API calls |
| `screens/bulk_sms/` | SMS screens |

### User Flow

```
Compose ──► Select Recipients ──► Preview ──► Send ──► Delivery Report
              │
              ├─► Contacts
              └─► Groups
```

### Sender ID Types

1. **My Number**: Send from your registered phone
2. **Custom Sender ID**: Registered alphanumeric ID
3. **Local Sender ID**: Device-based sending

### Key Provider Methods

```dart
// BulkSmsProvider
sms.setMessage(message);
sms.selectContacts(contacts);
sms.selectGroups(groups);
sms.setSenderId(senderId);
await sms.sendMessage();
await sms.getDeliveryStatus(messageId);

// CreditsProvider
await credits.getBalance();
await credits.purchaseCredits(amount, walletId, pin);

// SenderIdsProvider
await senderIds.fetchSenderIds();
await senderIds.requestSenderId(name, purpose);
```

---

## Fundraising

### Overview

Create and manage fundraising campaigns with goals, deadlines, and contributor tracking.

### Features

- Create public or private campaigns
- Set funding goals and deadlines
- Accept contributions and pledges
- Track progress in real-time
- Share via checkout links
- Analytics dashboard

### Campaign Statuses

| Status | Description |
|--------|-------------|
| `active` | Currently accepting contributions |
| `inactive` | Paused, not accepting contributions |
| `completed` | Goal reached or campaign ended |
| `cancelled` | Campaign cancelled |

### Implementation Files

| File | Purpose |
|------|---------|
| `providers/fundraiser_provider.dart` | Fundraiser state |
| `services/fundraiser_service.dart` | Fundraiser API |
| `models/fundraisers/` | Fundraiser models |
| `screens/fundraiser/` | Fundraiser screens |
| `widgets/fundraiser/` | Fundraiser widgets |

### User Flow

#### Creating Fundraiser
```
Create ──► Set Details ──► Set Goal ──► Set Dates ──► Select Wallet ──► Confirm ──► Share
```

#### Contributing
```
View Campaign ──► Select Amount ──► Choose Method ──► Enter PIN ──► Success
```

### Key Provider Methods

```dart
// FundraiserProvider
await fundraiser.getStatuses();
await fundraiser.getActiveFundraisers();
await fundraiser.getInactiveFundraisers();
await fundraiser.getCancelledFundraisers();
await fundraiser.getCompletedFundraisers();
await fundraiser.createFundraiser(data);
await fundraiser.updateFundraiser(id, updates);
await fundraiser.contribute(fundraiserId, walletId, amount, pin);
await fundraiser.pledge(fundraiserId, amount, fulfillmentDate);
await fundraiser.getContributions(fundraiserId);
await fundraiser.getPledges(fundraiserId);
```

---

## Point of Sale (POS)

### Overview

Accept payments via STK Push for merchants and businesses.

### Features

- Configure POS settings
- Receive payments via STK Push
- Transaction history
- Real-time notifications

### Implementation Files

| File | Purpose |
|------|---------|
| `providers/pos_provider.dart` | POS state |
| `services/pos_service.dart` | POS API |
| `screens/pos/` | POS screens |

### POS Settings

| Setting | Description |
|---------|-------------|
| Wallet | Receiving wallet |
| Business Name | Display name |
| Auto-confirm | Auto-confirm small amounts |

### User Flow

```
Setup POS ──► Configure Settings ──► Start Receiving
                                          │
                                          └─► Enter Amount ──► Customer Phone ──► STK Push ──► Confirm
```

### Key Provider Methods

```dart
// PosProvider
await pos.getSettings();
await pos.updateSettings(settings);
await pos.initiateStkPush(phone, amount, description);
await pos.checkPaymentStatus(checkoutRequestId);
await pos.getTransactions();
```

---

## Merchants

### Overview

Discover, install, and interact with merchant applications.

### Features

- Browse merchant store
- Install/uninstall merchants
- Quick access from home
- Merchant-specific features (church giving, etc.)

### Merchant Types

| Type | Features |
|------|----------|
| Church | Tithes, offerings, projects, teachings |
| Business | Product catalog, payments |
| NGO | Donations, projects |

### Implementation Files

| File | Purpose |
|------|---------|
| `providers/merchant_provider.dart` | Merchant state |
| `providers/church_provider.dart` | Church-specific |
| `screens/merchant/` | Merchant screens |
| `screens/church/` | Church screens |

### User Flow

```
Merchant Store ──► View Details ──► Install ──► Access Features
                                                      │
                                                      └─► Make Payments
                                                      │
                                                      └─► View Content
```

### Key Provider Methods

```dart
// MerchantProvider
await merchant.fetchMerchants();
await merchant.fetchInstalledMerchants();
await merchant.installMerchant(merchantId);
await merchant.uninstallMerchant(merchantId);

// ChurchProvider
await church.getOfferingTypes();
await church.getProjects();
await church.makeOffering(type, amount, walletId, pin);
await church.getTeachings();
```

---

## BankGPT Integration

### Overview

AI-powered banking assistant accessible via WebView with seamless authentication.

### Features

- Token-based authentication
- Session synchronization
- Back button handling
- Logout coordination

### Implementation Files

| File | Purpose |
|------|---------|
| `providers/webview_provider.dart` | WebView state |
| `services/bankgpt_service.dart` | BankGPT auth |
| `screens/gpt/` | BankGPT screen |

### Authentication Flow

```
Open BankGPT ──► Login via API ──► Load WebView ──► Send Token ──► Authenticated Session
```

### Token Exchange

```dart
// 1. Get access token from AuthProvider
final token = await auth.getAccessToken();

// 2. Login to BankGPT iframe-login endpoint
final response = await bankgpt.login(phone, password);

// 3. Send token to WebView
controller.runJavaScript('''
  window.postMessage({
    type: 'AUTH_TOKEN',
    payload: { token: '$accessToken' }
  }, '*');
''');
```

### Key Provider Methods

```dart
// WebviewProvider
await webview.initializeSession();
webview.handleMessage(message);
webview.sendToken(token);
webview.logout();
```

---

## Signatories

### Overview

Multi-signature approval for shared wallet transactions.

### Features

- Add signatories to wallets
- Approve pending transactions
- Accept/reject signatory invitations
- View approval history

### Implementation Files

| File | Purpose |
|------|---------|
| `providers/signatory_provider.dart` | Signatory state |
| `services/signatory_service.dart` | Signatory API |
| `screens/signatories/` | Signatory screens |

### Approval Flow

```
Transaction Initiated ──► Pending Approval ──► Signatory Reviews ──► Approve/Reject
```

### Key Provider Methods

```dart
// SignatoryProvider
await signatory.getPendingApprovals();
await signatory.getPendingInvitations();
await signatory.approveTransaction(transactionId, pin);
await signatory.rejectTransaction(transactionId, reason);
await signatory.acceptInvitation(invitationId);
await signatory.declineInvitation(invitationId);
```

---

## Transaction Limits

| Transaction Type | Min (KES) | Max (KES) | Daily Limit |
|------------------|-----------|-----------|-------------|
| Wallet Transfer | 10 | 150,000 | 300,000 |
| Bank Transfer | 100 | 150,000 | 300,000 |
| M-Pesa Deposit | 10 | 150,000 | 300,000 |
| M-Pesa Withdraw | 10 | 150,000 | 300,000 |
| Bulk Payment | 10 | 150,000 | 500,000 |

*Limits may vary based on KYC verification level.*

---

## Notifications

### Notification Types

| Type | Trigger |
|------|---------|
| Transaction | Money received/sent |
| Signatory | Approval required |
| Fundraiser | New contribution |
| System | App updates, security alerts |
| Promotional | Offers, new features |

### Implementation

```dart
// NotificationProvider
await notifications.fetch();
await notifications.markAsRead(id);
await notifications.markAllAsRead();
notifications.unreadCount;
```

---

## Error Handling

All modules implement consistent error handling:

```dart
try {
  await provider.performAction();
} on InsufficientBalanceException catch (e) {
  showInsufficientBalanceDialog(context, e.required, e.available);
} on AuthenticationException {
  Navigator.pushNamedAndRemoveUntil(context, Routes.login, (_) => false);
} on NetworkException {
  showErrorSnackbar(context, 'Check your internet connection');
} catch (e) {
  showErrorSnackbar(context, 'Something went wrong');
}
```

