/// Example usage of InsufficientFundsAlert
///
/// This widget can be used anywhere in the app where you need to handle
/// insufficient wallet balance scenarios.
///
/// EXAMPLE 1: Simple usage
/// ```dart
/// await InsufficientFundsAlert.show(
///   context: context,
///   currentWallet: selectedWallet,
///   requiredAmount: transactionAmount,
///   onWalletChanged: (newWallet) {
///     // Handle wallet change
///     setState(() {
///       selectedWallet = newWallet;
///     });
///   },
///   onTopUp: () {
///     // Navigate to top up page
///     Navigator.pushNamed(context, '/topUp', arguments: selectedWallet);
///   },
/// );
/// ```
///
/// EXAMPLE 2: In a transaction flow with provider
/// ```dart
/// Future<void> _validateAndProceed() async {
///   final walletProvider = Provider.of<WalletProvider>(context, listen: false);
///   final currentWallet = walletProvider.selectedWallet;
///   final amount = double.parse(amountController.text);
///
///   // Check if wallet has sufficient balance
///   if ((currentWallet?.balance ?? 0) < amount) {
///     await InsufficientFundsAlert.show(
///       context: context,
///       currentWallet: currentWallet!,
///       requiredAmount: amount,
///       onWalletChanged: (newWallet) {
///         // Update the selected wallet in provider
///         Provider.of<WalletProvider>(context, listen: false)
///             .selectWallet(newWallet);
///         Fluttertoast.showToast(msg: 'Wallet changed successfully');
///       },
///       onTopUp: () {
///         // Navigate to wallet top up with pre-selected wallet
///         Navigator.push(
///           context,
///           MaterialPageRoute(
///             builder: (context) => AccountTopup(
///               preSelectedWallet: currentWallet,
///             ),
///           ),
///         );
///       },
///     );
///     return; // Stop the transaction flow
///   }
///
///   // Proceed with transaction if balance is sufficient
///   _processTransaction();
/// }
/// ```
///
/// EXAMPLE 3: For bulk payment scenario
/// ```dart
/// Future<void> _validateBulkPayment() async {
///   final bulkPayProvider = Provider.of<BulkPayProvider>(context, listen: false);
///   final sourceWallet = bulkPayProvider.sourceWallet;
///   final totalAmount = bulkPayProvider.totalAmount;
///
///   if ((sourceWallet?.balance ?? 0) < totalAmount) {
///     await InsufficientFundsAlert.show(
///       context: context,
///       currentWallet: sourceWallet!,
///       requiredAmount: totalAmount,
///       onWalletChanged: (newWallet) {
///         // Update source wallet
///         Provider.of<BulkPayProvider>(context, listen: false)
///             .setSourceWallet(newWallet);
///       },
///       onTopUp: () {
///         // Navigate to top up
///         Navigator.pushNamed(
///           context,
///           '/walletTopup',
///           arguments: {'wallet': sourceWallet},
///         );
///       },
///     );
///     return;
///   }
///
///   // Continue with bulk payment
///   _processBulkPayment();
/// }
/// ```
///
/// FEATURES:
/// - Shows current wallet balance
/// - Shows required amount
/// - Calculates and displays shortfall
/// - Allows wallet change via UniversalWalletSelector
/// - Allows top up with custom navigation
/// - Reusable across the entire app
/// - Follows app's design system

