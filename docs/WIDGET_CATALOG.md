# TukuPay Widget Catalog

This document catalogs the reusable UI components available in the TukuPay application.

---

## Table of Contents

1. [Buttons](#buttons)
2. [Cards](#cards)
3. [Input Fields](#input-fields)
4. [Bottom Sheets](#bottom-sheets)
5. [Dialogs](#dialogs)
6. [Loading States](#loading-states)
7. [Lists & Tiles](#lists--tiles)
8. [Navigation](#navigation)
9. [Forms](#forms)
10. [Utility Widgets](#utility-widgets)

---

## Buttons

### SheetButton

A full-width button typically used at the bottom of sheets and forms.

**Location:** `lib/widgets/buttons/sheet_button.dart`

**Usage:**
```dart
SheetButton(
  label: 'Continue',
  onPressed: () => _handleContinue(),
  isLoading: _isProcessing,
)
```

**Props:**
| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `label` | `String` | Yes | Button text |
| `onPressed` | `VoidCallback?` | No | Tap handler (null disables button) |
| `isLoading` | `bool` | No | Show loading indicator |
| `color` | `Color?` | No | Background color override |

---

### PrimaryButton

Primary action button with app theme colors.

**Location:** `lib/widgets/buttons/primary_button.dart`

**Usage:**
```dart
PrimaryButton(
  text: 'Submit',
  onPressed: _submit,
  enabled: _isFormValid,
)
```

---

### SecondaryButton

Secondary/outline style button.

**Location:** `lib/widgets/buttons/secondary_button.dart`

**Usage:**
```dart
SecondaryButton(
  text: 'Cancel',
  onPressed: () => Navigator.pop(context),
)
```

---

### ActionButton

Compact action button with icon support.

**Location:** `lib/widgets/buttons/action_button.dart`

**Usage:**
```dart
ActionButton(
  icon: Icons.add,
  label: 'Add',
  onTap: _addItem,
)
```

---

## Cards

### WalletCard

Displays wallet information with balance.

**Location:** `lib/widgets/cards/wallet_card.dart`

**Usage:**
```dart
WalletCard(
  wallet: walletModel,
  isSelected: _selectedWalletId == wallet.id,
  onTap: () => _selectWallet(wallet),
)
```

---

### TransactionCard

Displays transaction summary in a list.

**Location:** `lib/widgets/cards/transaction_card.dart`

**Usage:**
```dart
TransactionCard(
  transaction: txn,
  onTap: () => _viewDetails(txn),
)
```

---

### ContactCard

Displays contact with avatar and selection state.

**Location:** `lib/widgets/cards/contact_card.dart`

**Usage:**
```dart
ContactCard(
  contact: contact,
  isSelected: _selectedContacts.contains(contact),
  onTap: () => _toggleSelection(contact),
  showCheckbox: true,
)
```

---

### FundraiserCard

Displays fundraiser campaign summary.

**Location:** `lib/widgets/fundraiser/fundraiser_card.dart`

**Usage:**
```dart
FundraiserCard(
  fundraiser: campaign,
  onTap: () => _openFundraiser(campaign),
)
```

---

### MerchantCard

Displays merchant with install/uninstall action.

**Location:** `lib/widgets/merchants/merchant_card.dart`

**Usage:**
```dart
MerchantCard(
  merchant: merchant,
  isInstalled: _installedIds.contains(merchant.id),
  onInstall: () => _installMerchant(merchant),
  onUninstall: () => _uninstallMerchant(merchant),
)
```

---

## Input Fields

### CustomTextField

Styled text input with validation support.

**Location:** `lib/widgets/inputs/custom_text_field.dart`

**Usage:**
```dart
CustomTextField(
  controller: _emailController,
  label: 'Email Address',
  hint: 'Enter your email',
  keyboardType: TextInputType.emailAddress,
  validator: (value) => _validateEmail(value),
  prefixIcon: Icons.email,
)
```

---

### AmountInput

Formatted currency input field.

**Location:** `lib/widgets/inputs/amount_input.dart`

**Usage:**
```dart
AmountInput(
  controller: _amountController,
  currency: 'KES',
  onChanged: (value) => _updateAmount(value),
  maxAmount: 100000,
)
```

---

### PhoneInput

Phone number input with country code.

**Location:** `lib/widgets/inputs/phone_input.dart`

**Usage:**
```dart
PhoneInput(
  controller: _phoneController,
  countryCode: '+254',
  onChanged: (value) => _updatePhone(value),
)
```

---

### PinInput

PIN entry field using Pinput.

**Location:** `lib/widgets/inputs/pin_input.dart`

**Usage:**
```dart
PinInput(
  length: 4,
  onCompleted: (pin) => _verifyPin(pin),
  obscureText: true,
)
```

---

### SearchField

Search input with debounce support.

**Location:** `lib/widgets/inputs/search_field.dart`

**Usage:**
```dart
SearchField(
  hint: 'Search contacts...',
  onChanged: (query) => _searchContacts(query),
  debounceMs: 300,
)
```

---

## Bottom Sheets

### WalletSelectorSheet

Bottom sheet for wallet selection.

**Location:** `lib/widgets/sheets/wallet_selector_sheet.dart`

**Usage:**
```dart
showModalBottomSheet(
  context: context,
  builder: (context) => WalletSelectorSheet(
    wallets: wallets,
    selectedWallet: _selectedWallet,
    onSelect: (wallet) {
      setState(() => _selectedWallet = wallet);
      Navigator.pop(context);
    },
  ),
);
```

---

### TopUpMethodSheet

Shows available top-up methods.

**Location:** `lib/widgets/sheets/top_up_method_sheet.dart`

**Usage:**
```dart
void _showTopUpMethods() {
  showModalBottomSheet(
    context: context,
    builder: (context) => TopUpMethodSheet(
      onMethodSelected: (method) => _processTopUp(method),
    ),
  );
}
```

---

### SendMethodSheet

Shows available send money methods.

**Location:** `lib/widgets/sheets/send_method_sheet.dart`

---

### ConfirmationSheet

Generic confirmation sheet with details.

**Location:** `lib/widgets/sheets/confirmation_sheet.dart`

**Usage:**
```dart
showModalBottomSheet(
  context: context,
  builder: (context) => ConfirmationSheet(
    title: 'Confirm Transfer',
    details: {
      'Amount': 'KES 500.00',
      'Recipient': 'John Doe',
      'Fee': 'KES 0.00',
    },
    onConfirm: () => _executeTransfer(),
  ),
);
```

---

## Dialogs

### InsufficientBalanceDialog

Shows when wallet balance is insufficient.

**Location:** `lib/widgets/dialogs/insufficient_balance_dialog.dart`

**Usage:**
```dart
showDialog(
  context: context,
  builder: (context) => InsufficientBalanceDialog(
    requiredAmount: 1000.00,
    availableBalance: 500.00,
    onChangeWallet: () => _showWalletSelector(),
    onTopUp: () => _navigateToTopUp(),
  ),
);
```

---

### ConfirmationDialog

Generic confirmation dialog.

**Location:** `lib/widgets/dialogs/confirmation_dialog.dart`

**Usage:**
```dart
showDialog(
  context: context,
  builder: (context) => ConfirmationDialog(
    title: 'Delete Wallet',
    message: 'Are you sure you want to delete this wallet?',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    isDestructive: true,
    onConfirm: () => _deleteWallet(),
  ),
);
```

---

### AlertInfoDialog

Information alert dialog.

**Location:** `lib/widgets/dialogs/alert_info_dialog.dart`

**Usage:**
```dart
showDialog(
  context: context,
  builder: (context) => AlertInfoDialog(
    title: 'OTP Sent',
    message: 'An OTP has been sent to your phone number.',
    onDismiss: () => Navigator.pop(context),
  ),
);
```

---

## Loading States

### LoadingIndicator

Centered loading spinner.

**Location:** `lib/widgets/shared/loading_indicator.dart`

**Usage:**
```dart
if (isLoading) {
  return LoadingIndicator();
}
```

---

### ShimmerLoading

Skeleton loading placeholder.

**Location:** `lib/widgets/shared/shimmer_loading.dart`

**Usage:**
```dart
if (isLoading) {
  return ShimmerLoading(
    height: 100,
    width: double.infinity,
    borderRadius: 12,
  );
}
```

---

### WalletCardSkeleton

Skeleton for wallet card loading state.

**Location:** `lib/widgets/skeletons/wallet_card_skeleton.dart`

---

### TransactionListSkeleton

Skeleton for transaction list loading.

**Location:** `lib/widgets/skeletons/transaction_list_skeleton.dart`

---

## Lists & Tiles

### ContactTile

Contact list item with actions.

**Location:** `lib/widgets/tiles/contact_tile.dart`

**Usage:**
```dart
ContactTile(
  contact: contact,
  trailing: IconButton(
    icon: Icon(Icons.delete),
    onPressed: () => _deleteContact(contact),
  ),
)
```

---

### TransactionTile

Transaction list item.

**Location:** `lib/widgets/tiles/transaction_tile.dart`

---

### SettingsTile

Settings menu item.

**Location:** `lib/widgets/tiles/settings_tile.dart`

**Usage:**
```dart
SettingsTile(
  icon: Icons.notifications,
  title: 'Notifications',
  subtitle: 'Manage notification preferences',
  onTap: () => _openNotificationSettings(),
)
```

---

## Navigation

### CustomAppBar

Styled app bar with optional actions.

**Location:** `lib/widgets/navigation/custom_app_bar.dart`

**Usage:**
```dart
Scaffold(
  appBar: CustomAppBar(
    title: 'My Wallets',
    actions: [
      IconButton(
        icon: Icon(Icons.add),
        onPressed: _addWallet,
      ),
    ],
  ),
)
```

---

### TopUpAppBar

Specialized app bar for top-up flows.

**Location:** `lib/widgets/topups/topup_app_bar.dart`

**Usage:**
```dart
TopUpAppBar(
  title: 'Top Up Wallet',
  description: 'Add funds to your wallet',
)
```

---

### BottomNavBar

Main bottom navigation bar.

**Location:** `lib/widgets/navigation/bottom_nav_bar.dart`

---

## Forms

### TransactionValidation

Transaction confirmation with PIN input.

**Location:** `lib/widgets/shared/transaction_validation.dart`

**Usage:**
```dart
TransactionValidation(
  amount: 500.00,
  recipient: 'John Doe',
  onValidated: (pin) => _processPayment(pin),
)
```

---

### TransactionOTP

OTP verification for transactions.

**Location:** `lib/widgets/shared/transaction_otp.dart`

---

### PinRequest

PIN setup and validation.

**Location:** `lib/widgets/auth/pin_request.dart`

---

## Utility Widgets

### EmptyState

Empty state placeholder.

**Location:** `lib/widgets/shared/empty_state.dart`

**Usage:**
```dart
if (items.isEmpty) {
  return EmptyState(
    icon: Icons.inbox,
    title: 'No Transactions',
    message: 'Your transactions will appear here',
    actionLabel: 'Make a Payment',
    onAction: () => _navigateToPayment(),
  );
}
```

---

### ErrorState

Error state with retry.

**Location:** `lib/widgets/shared/error_state.dart`

**Usage:**
```dart
if (hasError) {
  return ErrorState(
    message: 'Failed to load data',
    onRetry: () => _loadData(),
  );
}
```

---

### Avatar

User avatar with initials fallback.

**Location:** `lib/widgets/shared/avatar.dart`

**Usage:**
```dart
Avatar(
  name: 'John Doe',
  imageUrl: user.profilePicture,
  size: 48,
)
```

---

### Badge

Notification/status badge.

**Location:** `lib/widgets/shared/badge.dart`

**Usage:**
```dart
Badge(
  count: 5,
  child: Icon(Icons.notifications),
)
```

---

### AmountDisplay

Formatted amount with currency.

**Location:** `lib/widgets/shared/amount_display.dart`

**Usage:**
```dart
AmountDisplay(
  amount: 5000.00,
  currency: 'KES',
  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
)
```

---

### DateRangePicker

Date range selection.

**Location:** `lib/widgets/shared/date_range_picker.dart`

**Usage:**
```dart
DateRangePicker(
  startDate: _startDate,
  endDate: _endDate,
  onChanged: (start, end) {
    setState(() {
      _startDate = start;
      _endDate = end;
    });
    _loadTransactions();
  },
)
```

---

## Home Widgets

### HomeBanner

Alert banners on home screen.

**Location:** `lib/widgets/home/home_banner.dart`

**Usage:**
```dart
HomeBanner(
  type: BannerType.warning,
  title: 'Complete KYC',
  message: 'Verify your identity to unlock all features',
  action: 'Complete Now',
  onAction: () => _navigateToKyc(),
)
```

---

### ToolsCard

Tool/feature card on home screen.

**Location:** `lib/widgets/home/tools_card.dart`

---

### QuickActionButton

Quick action buttons on home.

**Location:** `lib/widgets/home/quick_action_button.dart`

---

## Best Practices

### Creating New Widgets

1. **Location**: Place widgets in appropriate subdirectory under `lib/widgets/`
2. **Naming**: Use descriptive, consistent naming (e.g., `wallet_card.dart`)
3. **Props**: Document all properties with types and defaults
4. **Const**: Use `const` constructors where possible
5. **Keys**: Accept optional `Key` parameter

### Widget Template

```dart
import 'package:flutter/material.dart';
import 'package:tuku/constants/constants.dart';

class MyWidget extends StatelessWidget {
  final String title;
  final VoidCallback? onTap;
  final bool isActive;

  const MyWidget({
    Key? key,
    required this.title,
    this.onTap,
    this.isActive = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isActive ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          title,
          style: TextStyle(
            color: isActive ? Colors.white : AppColors.textPrimary,
          ),
        ),
      ),
    );
  }
}
```

---

## Theming

All widgets should use theme colors from `AppColors` and dimensions from `AppDimensions`:

```dart
import 'package:tuku/constants/colors.dart';
import 'package:tuku/constants/dimensions.dart';

// Colors
AppColors.primary
AppColors.secondary
AppColors.success
AppColors.error
AppColors.warning
AppColors.textPrimary
AppColors.textSecondary
AppColors.surface
AppColors.background

// Dimensions
AppDimensions.paddingSm
AppDimensions.paddingMd
AppDimensions.paddingLg
AppDimensions.radiusSm
AppDimensions.radiusMd
AppDimensions.radiusLg
```

---

## Glassmorphism Effects

For glass/blur effects, use the constants:

```dart
import 'package:tuku/constants/shadows.dart';

// Apply glass effect
Container(
  decoration: BoxDecoration(
    color: AppColors.glassBackground,
    borderRadius: BorderRadius.circular(16),
    boxShadow: AppShadows.glassShadow,
  ),
)
```

