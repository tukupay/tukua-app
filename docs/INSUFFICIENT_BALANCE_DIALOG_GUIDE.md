# Insufficient Balance Dialog - Usage Guide

## Overview

A reusable, sleek dialog component that appears when a user attempts to make a transaction but doesn't have sufficient balance in their selected wallet. It provides two options:

1. **Change Wallet** - Opens a wallet selector to choose another wallet with sufficient funds
2. **Top Up Wallet** - Navigates to the wallet top-up page with the current wallet preselected

## Features

- ✨ Modern, clean UI with gradient effects and smooth animations
- 💰 Shows current balance, required amount, and shortage clearly
- 🔄 Seamless wallet switching without losing transaction context
- ⚡ Quick navigation to top-up flow with preselected wallet
- 📱 Fully responsive and reusable across the entire app

## Components Created

### 1. `InsufficientBalanceDialog` 
Location: `lib/widgets/shared/insufficient_balance_dialog.dart`

Main dialog component that displays the insufficient balance message and action options.

### 2. `WalletSelectorSheet`
Location: `lib/widgets/shared/wallet_selector_sheet.dart`

Bottom sheet component for selecting a different wallet with optional filtering by balance.

## Usage

### Basic Usage

```dart
// Check if wallet has insufficient balance
if (walletBalance < requiredAmount) {
  await InsufficientBalanceDialog.show(
    context: context,
    currentWallet: selectedWallet,
    requiredAmount: transactionAmount,
    onWalletChanged: (newWallet) {
      // Update your provider/state with the new wallet
      provider.selectWallet(newWallet);
    },
  );
  return; // Stop further processing
}
```

### Examples

#### 1. Bulk Pay (Already Implemented)
```dart
// lib/screens/bulk_pay/bulk_pay_amount.dart
if (walletBalance < bulkPay.totalAmount) {
  await InsufficientBalanceDialog.show(
    context: context,
    currentWallet: bulkPay.selectedWallet!,
    requiredAmount: bulkPay.totalAmount,
    onWalletChanged: (newWallet) {
      bulkPay.setSelectedWallet(newWallet);
    },
  );
  return;
}
```

#### 2. Bank Send (Already Implemented)
```dart
// lib/screens/send_moneys/bank_send.dart
if ((payments.selectedSourceWallet?.balance ?? 0) < double.parse(amount.text)) {
  await InsufficientBalanceDialog.show(
    context: context,
    currentWallet: payments.selectedSourceWallet!,
    requiredAmount: double.parse(amount.text),
    onWalletChanged: (newWallet) {
      payments.selectSourceWallet(newWallet);
    },
  );
  return;
}
```

#### 3. M-Pesa Send (Already Implemented)
```dart
// lib/screens/send_moneys/mpesa_send.dart
if ((payments.selectedSourceWallet?.balance ?? 0) < double.parse(amountController.text)) {
  await InsufficientBalanceDialog.show(
    context: context,
    currentWallet: payments.selectedSourceWallet!,
    requiredAmount: double.parse(amountController.text),
    onWalletChanged: (newWallet) {
      payments.selectSourceWallet(newWallet);
    },
  );
  return;
}
```

## Parameters

### InsufficientBalanceDialog.show()

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `context` | `BuildContext` | Yes | Build context for showing the dialog |
| `currentWallet` | `FullWallet` | Yes | The wallet that has insufficient balance |
| `requiredAmount` | `double` | Yes | The amount needed for the transaction |
| `onWalletChanged` | `Function(FullWallet)?` | No | Callback when user selects a different wallet |
| `onTopUp` | `VoidCallback?` | No | Callback when user chooses to top up (optional) |

### WalletSelectorSheet

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `currentWallet` | `FullWallet?` | `null` | Currently selected wallet (will be highlighted) |
| `showOnlyActive` | `bool` | `true` | Only show active wallets |
| `minBalance` | `double?` | `null` | Filter wallets by minimum balance requirement |

## Customization

### Using WalletSelectorSheet Standalone

You can also use the wallet selector sheet independently:

```dart
final selectedWallet = await showModalBottomSheet<FullWallet>(
  context: context,
  isScrollControlled: true,
  backgroundColor: Colors.transparent,
  builder: (context) => WalletSelectorSheet(
    currentWallet: currentWallet,
    showOnlyActive: true,
    minBalance: 1000.0, // Only show wallets with at least 1000
  ),
);

if (selectedWallet != null) {
  // Use the selected wallet
  provider.selectWallet(selectedWallet);
}
```

### Filtering Options

The wallet selector automatically:
- ✅ Shows only active wallets (if `showOnlyActive: true`)
- ✅ Filters by minimum balance (if `minBalance` is provided)
- ✅ Highlights the currently selected wallet
- ✅ Shows primary wallet badge
- ✅ Disables wallets with insufficient balance visually

## User Flow

1. User attempts transaction with insufficient balance
2. Dialog appears showing:
   - Current wallet name and balance
   - Required transaction amount
   - Amount shortage (deficit)
3. User has 3 options:
   - **Change Wallet**: Opens wallet selector → User picks new wallet → Dialog closes → Transaction can proceed
   - **Top Up Wallet**: Navigates to wallet top-up page → User adds funds → Returns to complete transaction
   - **Cancel**: Closes dialog → Returns to transaction screen

## Design Patterns

### Colors Used
- **Warning Orange**: `#FF6F00` - For insufficient balance alerts
- **Success Green**: `AppColors.primaryGreen` - For action buttons
- **Light Backgrounds**: `#F8FAF9`, `#E8F5E9` - For cards and containers
- **Border Colors**: `#E8ECE9` - For subtle borders

### Icons
- `HugeIcons.strokeRoundedWalletNotFound02` - Main dialog icon
- `HugeIcons.strokeRoundedWallet03` - Change wallet button
- `HugeIcons.strokeRoundedArrowUpDouble` - Top up button
- `HugeIcons.strokeRoundedWallet02` - Wallet items

## Best Practices

### ✅ Do's
- Always check balance before showing the dialog
- Provide the `onWalletChanged` callback to handle wallet changes
- Ensure wallet provider is accessible in context
- Use `await` when showing the dialog to handle async operations

### ❌ Don'ts
- Don't show dialog without checking balance first
- Don't proceed with transaction after dialog without re-validating
- Don't forget to return after showing dialog to stop transaction flow
- Don't hardcode wallet selection logic - use the callback

## Integration Checklist

When integrating into a new payment flow:

- [ ] Import the dialog: `import 'package:tuku/widgets/widget.dart';`
- [ ] Check wallet balance before transaction
- [ ] Call `InsufficientBalanceDialog.show()` when insufficient
- [ ] Provide `onWalletChanged` callback to update state
- [ ] Add `await` keyword before the dialog call
- [ ] Add `return` after dialog to stop transaction
- [ ] Test wallet switching functionality
- [ ] Test top-up navigation and return flow

## Future Enhancements

Potential improvements for future iterations:

- 🔔 Add notification when wallet is topped up
- 💡 Suggest optimal wallet based on transaction history
- 📊 Show transaction fees breakdown
- 🎯 Quick filter by balance range
- 🔄 Remember last used wallet preference
- 📱 Support for multi-currency wallets

## Support

For issues or questions about this component:
1. Check this documentation first
2. Review existing implementations in the codebase
3. Test in isolation using the standalone wallet selector
4. Contact the development team if issues persist

---

**Last Updated**: February 7, 2026  
**Version**: 1.0.0  
**Maintainer**: Development Team

