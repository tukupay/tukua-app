import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../providers/providers.dart';
import '../../widgets/widget.dart';

/// Example: Integrating InsufficientFundsAlert in a transaction page
/// This demonstrates the recommended pattern for checking wallet balance
/// before processing any transaction.

class TransactionPageExample extends StatefulWidget {
  const TransactionPageExample({super.key});

  @override
  State<TransactionPageExample> createState() => _TransactionPageExampleState();
}

class _TransactionPageExampleState extends State<TransactionPageExample> {
  final TextEditingController amountController = TextEditingController();
  FullWallet? selectedWallet;

  /// Step 1: Validate balance before proceeding
  Future<void> _validateAndProceed() async {
    final amount = double.tryParse(amountController.text);

    if (amount == null || amount <= 0) {
      Fluttertoast.showToast(msg: 'Enter a valid amount');
      return;
    }

    if (selectedWallet == null) {
      Fluttertoast.showToast(msg: 'Select a wallet first');
      return;
    }

    final balance = selectedWallet!.balance ?? 0.0;

    // Step 2: Check if balance is sufficient
    if (balance < amount) {
      // Show insufficient funds alert
      await InsufficientFundsAlert.show(
        context: context,
        currentWallet: selectedWallet!,
        requiredAmount: amount,
        onWalletChanged: (newWallet) {
          // User selected a different wallet
          setState(() {
            selectedWallet = newWallet;
          });
          Fluttertoast.showToast(
            msg: 'Wallet changed to ${newWallet.name ?? 'Wallet ${newWallet.id}'}',
          );
        },
      );
      return; // Don't proceed with transaction
    }

    // Step 3: Balance is sufficient, proceed with transaction
    _processTransaction(amount);
  }

  /// Process the actual transaction
  Future<void> _processTransaction(double amount) async {
    // Show loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(),
      ),
    );

    // Simulate API call
    await Future.delayed(const Duration(seconds: 2));

    if (mounted) {
      Navigator.pop(context); // Close loading

      // Show success
      Fluttertoast.showToast(msg: 'Transaction successful!');
      Navigator.pop(context); // Close the page
    }
  }

  /// Navigate to wallet top up page with pre-selected wallet
  void _navigateToTopUp() {
    // Example navigation - adjust to your app's routing
    Navigator.pushNamed(
      context,
      '/topUp',
      arguments: selectedWallet,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Transaction Example')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // Wallet selector (simplified for example)
            if (selectedWallet != null) ...[
              Text('Wallet: ${selectedWallet!.name ?? 'Wallet ${selectedWallet!.id}'}'),
              Text('Balance: KES ${selectedWallet!.balance?.toStringAsFixed(2) ?? '0.00'}'),
            ] else
              const Text('No wallet selected'),

            const SizedBox(height: 20),

            // Amount input
            TextField(
              controller: amountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Amount',
                prefixText: 'KES ',
              ),
            ),

            const SizedBox(height: 20),

            // Submit button
            ElevatedButton(
              onPressed: _validateAndProceed,
              child: const Text('Proceed'),
            ),
          ],
        ),
      ),
    );
  }
}

/// Example: Using with Provider pattern (Bulk Payment)
class BulkPaymentExample extends StatelessWidget {
  const BulkPaymentExample({super.key});

  Future<void> _processBulkPayment(BuildContext context) async {
    final bulkPayProvider = Provider.of<BulkPayProvider>(context, listen: false);
    final sourceWallet = bulkPayProvider.selectedWallet;
    final totalAmount = bulkPayProvider.totalAmount;

    // Validate wallet exists
    if (sourceWallet == null) {
      Fluttertoast.showToast(msg: 'Select a source wallet');
      return;
    }

    // Check balance
    final balance = sourceWallet.balance ?? 0.0;
    if (balance < totalAmount) {
      await InsufficientFundsAlert.show(
        context: context,
        currentWallet: sourceWallet,
        requiredAmount: totalAmount.toDouble(),
        onWalletChanged: (newWallet) {
          // Update provider with new wallet
          Provider.of<BulkPayProvider>(context, listen: false)
              .selectWallet(newWallet);
        },
      );
      return;
    }

    // Proceed with bulk payment...
    Fluttertoast.showToast(msg: 'Processing bulk payment...');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Bulk Payment')),
      body: Center(
        child: ElevatedButton(
          onPressed: () => _processBulkPayment(context),
          child: const Text('Process Payment'),
        ),
      ),
    );
  }
}

/// Example: Fundraiser contribution with validation
class ContributionExample extends StatelessWidget {
  final FundraiserResponse fundraiser;
  final double contributionAmount;

  const ContributionExample({
    super.key,
    required this.fundraiser,
    required this.contributionAmount,
  });

  Future<void> _contribute(BuildContext context) async {
    final fundraiserProvider = Provider.of<FundraiserProvider>(context, listen: false);
    final contributionWallet = fundraiserProvider.contributionWallet;

    if (contributionWallet == null) {
      Fluttertoast.showToast(msg: 'Select a wallet to contribute from');
      return;
    }

    // Validate balance
    final balance = contributionWallet.balance ?? 0.0;
    if (balance < contributionAmount) {
      await InsufficientFundsAlert.show(
        context: context,
        currentWallet: contributionWallet,
        requiredAmount: contributionAmount,
        onWalletChanged: (newWallet) {
          Provider.of<FundraiserProvider>(context, listen: false)
              .setContributionWallet(newWallet);
        },
      );
      return;
    }

    // Process contribution...
    Fluttertoast.showToast(msg: 'Processing contribution...');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Contribute')),
      body: Center(
        child: ElevatedButton(
          onPressed: () => _contribute(context),
          child: Text('Contribute KES ${contributionAmount.toStringAsFixed(2)}'),
        ),
      ),
    );
  }
}

