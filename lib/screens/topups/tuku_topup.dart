import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

class TukuTopUp extends StatefulWidget {
  const TukuTopUp({super.key});

  @override
  State<TukuTopUp> createState() => _TukuTopUpState();
}

class _TukuTopUpState extends State<TukuTopUp> {
  final amountController = TextEditingController();
  bool _insufficientBalance = false;

  // Track whether we're using searched wallet or own wallet
  WalletSearchResult? _searchedSourceWallet;

  // Store provider reference for cleanup
  late WalletProvider _walletProvider;

  @override
  void initState() {
    super.initState();
    // Reset destination wallet to ensure user manually selects it
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<PaymentsProvider>(context, listen: false).resetDestinationWallet();
      _walletProvider = Provider.of<WalletProvider>(context, listen: false);
    });
  }

  @override
  void dispose() {
    // Reset search after frame completes to avoid calling notifyListeners during dispose
    final provider = _walletProvider;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      provider.resetSearch();
    });
    amountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer4<PaymentsProvider, WalletProvider, FundraiserProvider, ProfileProvider>(
      builder: (_, payment, wallets, fundraisers, profile, __) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Source wallet selection - either from own wallets or search for user
            wallets.userWallets.isEmpty
                ? EmptyAccountsHint()
                : SourceWalletTabs(
                    selectedWallet: payment.selectedSourceWallet,
                    userWallets: wallets.userWallets,
                    onWalletSelected: (wallet) {
                      Fluttertoast.cancel();
                      setState(() {
                        _searchedSourceWallet = null; // Clear searched wallet
                      });
                      payment.selectSourceWallet(wallet);
                    },
                    onSearchedWalletSelected: (searchedWallet) {
                      setState(() {
                        _searchedSourceWallet = searchedWallet;
                        payment.resetSourceWallet(); // Clear own wallet selection
                      });
                    },
                  ),

            const SizedBox(height: 12),

            // Destination wallet - only show if source is selected
            if (payment.selectedSourceWallet != null || _searchedSourceWallet != null) ...[
              wallets.userWallets.isEmpty
                  ? EmptyAccountsHint()
                  : WalletSelectorCard(
                selectedWallet: payment.selectedDestinationWallet,
                // Filter out the source wallet from destination options
                wallets: wallets.userWallets
                    .where((w) => w.id != payment.selectedSourceWallet?.id)
                    .toList(),
                onSelected: (wallet) {
                  payment.selectDestinationWallet(wallet);
                },
                label: 'Select destination wallet',
                sheetTitle: 'Destination Wallet',
                sheetSubtitle: 'Select wallet to receive funds',
                isSource: false,
              ),
            ] else ...[
              // Hint to select source wallet first
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: HexColor(AppColors.primaryGreen).withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: HexColor(AppColors.primaryGreen).withValues(alpha: 0.2),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      HugeIcons.strokeRoundedInformationCircle,
                      color: HexColor(AppColors.primaryGreen),
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Select source wallet first to choose destination',
                        style: TextStyle(
                          color: HexColor(AppColors.primaryGreen),
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 12),

            LabeledField(
                label: 'Amount (KSH)',
                hint: '0',
                controller: amountController,
                isNumber: true,
                enabled: true,
                hasError: _insufficientBalance,
                errorText: _insufficientBalance ? 'Insufficient balance in source wallet' : null,
                changed: (val) {
                  final amount = double.tryParse(val ?? '') ?? 0;
                  final balance = payment.selectedSourceWallet?.balance ?? 0;
                  final hasSource = payment.selectedSourceWallet != null;
                  setState(() {
                    _insufficientBalance = hasSource && amount > 0 && balance < amount;
                  });
                },
                prefixIcon: Icon(
                  HugeIcons.strokeRoundedMoney03,
                  color: _insufficientBalance ? const Color(0xFFE53935) : HexColor(AppColors.primaryGreen),
                  size: 18,
                ),
              ),

            const SizedBox(height: 24),

            // Proceed button
            Center(
              child: AuthButton(
                text: 'Transfer Funds',
                tapped: () => _handleProceed(payment, profile),
              ),
            ),

            const SizedBox(height: 16),

            // Info note
            InfoNote(
              text: 'Instant transfer between your wallets with zero fees',
            ),
          ],
        );
      },
    );
  }

  void _handleProceed(PaymentsProvider payment, ProfileProvider profile) async {
    Fluttertoast.cancel();

    if (payment.selectedDestinationWallet == null) {
      Fluttertoast.showToast(msg: "Please select which wallet to top up");
      return;
    }

    // Check if user selected own wallet or searched for a user
    if (payment.selectedSourceWallet == null && _searchedSourceWallet == null) {
      Fluttertoast.showToast(msg: "Please select a wallet to top up from");
      return;
    }

    if (amountController.text.isEmpty) {
      Fluttertoast.showToast(msg: "Enter an amount");
      return;
    }

    // Check balance for own wallet transfer
    if (payment.selectedSourceWallet != null &&
        (payment.selectedSourceWallet!.balance ?? 0) < double.parse(amountController.text.trim())) {
      setState(() => _insufficientBalance = true);
      Fluttertoast.showToast(msg: "Insufficient balance in source wallet");
      return;
    }

    PaymentRequest paymentRequest;

    if (_searchedSourceWallet != null) {
      // Request funds from searched user's wallet (they will need to approve)
      // Using destination fields to identify the source user wallet
      paymentRequest = PaymentRequest(
        transactionData: TransactionData(
          transactionType: payment.selectedType?.type ?? Strings.walletTopUp,
          destinationWalletId: payment.selectedDestinationWallet!.id,
          amount: double.parse(amountController.text.trim()),
          transferMethod: Strings.tuku,
        ),
        paymentSource: PaymentSource(
          paymentMethod: Strings.tuku, // Transfer from another TukuPay user
          // Use the searched wallet's ID if available, otherwise use alias
          sourceWalletId: _searchedSourceWallet!.id,
        ),
      );
    } else {
      // Transfer from own wallet
      paymentRequest = PaymentRequest(
        transactionData: TransactionData(
          transactionType: payment.selectedType?.type ?? Strings.walletTopUp,
          destinationWalletId: payment.selectedDestinationWallet!.id,
          amount: double.parse(amountController.text.trim()),
        ),
        paymentSource: PaymentSource(
          paymentMethod: payment.selectedMethod!.method,
          sourceWalletId: payment.selectedSourceWallet!.id,
        ),
      );
    }

    payment.setPendingRequest(paymentRequest);
    await payment.processTransaction(context, profile.user?.requiresPinSetup ?? true);

    // Reset searched wallet state after processing
    _walletProvider.resetSearch();
    setState(() {
      _searchedSourceWallet = null;
    });
  }
}
