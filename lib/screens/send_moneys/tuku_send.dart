import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
import '../../models/models.dart';

class TukuSend extends StatefulWidget {
  const TukuSend({super.key});

  @override
  State<TukuSend> createState() => _TukuSendState();
}

class _TukuSendState extends State<TukuSend> {
  final destinationController = TextEditingController();
  final amountController = TextEditingController();
  bool _insufficientBalance = false;

  // Store provider reference for cleanup
  WalletProvider? _walletProvider;


  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Auto-select primary wallet if available
      final wallets = Provider.of<WalletProvider>(context, listen: false);
      final payments = Provider.of<PaymentsProvider>(context, listen: false);

      // Reset previous search results
      wallets.resetSearch();

      if (payments.selectedSourceWallet == null && wallets.userWallets.isNotEmpty) {
        payments.autoSelectPrimaryWallet(wallets.userWallets, isSource: true, isDestination: false);
      }
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _walletProvider ??= Provider.of<WalletProvider>(context, listen: false);
  }

  // --- Validation Functions ---
  bool _isWalletAlias(String val) => RegExp(r'^[a-zA-Z][a-zA-Z0-9]{5}$').hasMatch(val);
  bool _isPhoneNumber(String val) => RegExp(r'^07\d{8}$').hasMatch(val);

  Future<void> _validateDestination(String val) async {
    Fluttertoast.cancel();
    Provider.of<WalletProvider>(context, listen: false).resetSearch();

    // Check for invalid lengths first
    if (val.startsWith('07') && val.length > 10) {
      Fluttertoast.showToast(msg: 'Error: Phone number cannot be more than 10 digits');
      return;
    }

    if (!val.startsWith('07') && val.length > 6) {
      Fluttertoast.showToast(msg: 'Error: Wallet alias cannot be more than 6 characters');
      return;
    }

    // Proceed with search if format is valid
    if (_isWalletAlias(val) || _isPhoneNumber(val)) {
      await Provider.of<WalletProvider>(context, listen: false).searchWallets(val);
    } else {
      if (val.length == 6 || val.length == 10) {
        Fluttertoast.showToast(msg: 'Error: Invalid format');
      }
    }
  }

  @override
  void dispose() {
    destinationController.dispose();
    amountController.dispose();
    // Reset search state after frame completes to avoid calling notifyListeners during dispose
    final provider = _walletProvider;
    if (provider != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        provider.resetSearch();
      });
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer3<PaymentsProvider, WalletProvider, ProfileProvider>(
      builder: (_, payments, wallets, profile, __) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            wallets.userWallets.isEmpty
                ? EmptyAccountsHint()
                : WalletSelectorCard(
                    selectedWallet: payments.selectedSourceWallet,
                    wallets: wallets.userWallets,
                    onSelected: (wallet) {
                      payments.selectSourceWallet(wallet);
                    },
                    label: 'Select source wallet',
                    sheetTitle: 'Source Wallet',
                    sheetSubtitle: 'Funds will be deducted from this wallet',
                    isSource: true,
                  ),

            const SizedBox(height: 24),

            // Favourite wallets
            FavouriteWallets(
              onWalletSelected: (wallet) {
                Fluttertoast.cancel();
                Fluttertoast.showToast(msg: "Selected ${wallet.name}");
                if (wallet.walletAlias != null && wallet.walletAlias!.isNotEmpty) {
                  destinationController.text = wallet.walletAlias!;
                  _validateDestination(wallet.walletAlias!);
                } else if (wallet.phoneNumber != null && wallet.phoneNumber!.isNotEmpty) {
                  final phone = convertToLocalKenyanFormat(wallet.phoneNumber!)!;
                  destinationController.text = phone;
                  _validateDestination(phone);
                }
              },
            ),

            const SizedBox(height: 24),

            // Destination input
            LabeledField(
                controller: destinationController,
                label: 'Phone | Wallet Number',
                hint: '6-10 characters',
                changed: (val) async {
                  if (val != null && val.isNotEmpty) {
                    await _validateDestination(val);
                  } else {
                    Provider.of<WalletProvider>(context, listen: false).resetSearch();
                  }
                },
                canGoNext: true,
                enabled: true,
                prefixIcon: Icon(
                  HugeIcons.strokeRoundedUser,
                  color: HexColor(AppColors.primaryGreen),
                  size: 18,
                ),
              ),

            // Search result indicator
            const SizedBox(height: 8),
            _SearchResultIndicator(wallets: wallets),

            const SizedBox(height: 16),

            // Amount input
            LabeledField(
                controller: amountController,
                label: 'Amount (KSH)',
                hint: '0',
                isNumber: true,
                enabled: true,
                hasError: _insufficientBalance,
                errorText: _insufficientBalance ? 'Insufficient balance in selected wallet' : null,
                changed: (val) {
                  final amount = double.tryParse(val ?? '') ?? 0;
                  final balance = payments.selectedSourceWallet?.balance ?? 0;
                  setState(() {
                    _insufficientBalance = amount > 0 && balance < amount;
                  });
                },
                prefixIcon: Icon(
                  HugeIcons.strokeRoundedMoney03,
                  color: _insufficientBalance ? const Color(0xFFE53935) : HexColor(AppColors.primaryGreen),
                  size: 18,
                ),
              ),

            const SizedBox(height: 32),

            // Proceed button
            Center(
              child: AuthButton(
                text: 'Send Money',
                tapped: () => _handleProceed(payments, profile),
              ),
            ),

            const SizedBox(height: 16),

            // Info note
            InfoNote(
              text: 'Send directly to any TukuPay wallet instantly',
            ),
          ],
        );
      },
    );
  }

  void _handleProceed(PaymentsProvider payments, ProfileProvider profile) async {
    Fluttertoast.cancel();

    if (payments.selectedSourceWallet == null) {
      Fluttertoast.showToast(msg: "Select which wallet you plan to send from");
      return;
    }
    if (amountController.text.isEmpty) {
      Fluttertoast.showToast(msg: "Please enter an amount");
      return;
    }
    if ((payments.selectedSourceWallet?.balance ?? 0) < double.parse(amountController.text)) {
      setState(() => _insufficientBalance = true);
      Fluttertoast.showToast(msg: "Insufficient balance in selected wallet");
      return;
    }

    final destination = destinationController.text;
    String? destinationPhone;
    String? destinationAlias;

    if (_isWalletAlias(destination)) {
      destinationAlias = destination;
    } else if (_isPhoneNumber(destination)) {
      destinationPhone = destination;
    } else {
      Fluttertoast.showToast(
        msg: "Invalid destination format. Use a 6-character wallet alias or a 10-digit phone number.",
      );
      return;
    }

    final paymentRequest = PaymentRequest(
      transactionData: TransactionData(
        transactionType: payments.selectedType?.type ?? Strings.userTransfer,
        amount: double.parse(amountController.text),
        destinationPhone: destinationPhone,
        destinationAlias: destinationAlias,
        transferMethod: payments.selectedMethod!.method,
      ),
      paymentSource: PaymentSource(
        paymentMethod: Strings.tuku,
        sourceWalletId: payments.selectedSourceWallet!.id,
      ),
    );
    payments.setPendingRequest(paymentRequest);
    await payments.processTransaction(context, profile.user?.requiresPinSetup ?? true);
    Provider.of<WalletProvider>(context, listen: false).resetSearch();
  }
}

/// Search result indicator
class _SearchResultIndicator extends StatelessWidget {
  final WalletProvider wallets;

  const _SearchResultIndicator({required this.wallets});

  @override
  Widget build(BuildContext context) {
    if (wallets.searching) {
      return Padding(
        padding: const EdgeInsets.all(8.0),
        child: Row(
          children: [
            SizedBox(
              height: 16,
              width: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: HexColor(AppColors.primaryGreen),
              ),
            ),
            const SizedBox(width: 8),
            Text('Searching...', style: Grays.smallestPoppinsHint),
          ],
        ),
      );
    }

    if (wallets.searchResult == null) return const SizedBox();

    if (wallets.searchResult?.error != null) {
      return Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: HexColor(AppColors.red).withAlpha(15),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: HexColor(AppColors.red).withAlpha(30)),
        ),
        child: Row(
          children: [
            Icon(HugeIcons.strokeRoundedAlertCircle, size: 16, color: HexColor(AppColors.red)),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                wallets.searchResult!.error ?? 'Recipient not found',
                style: Reds.tinySemiRoboto,
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: HexColor(AppColors.primaryGreen).withAlpha(15),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: HexColor(AppColors.primaryGreen).withAlpha(30)),
      ),
      child: Row(
        children: [
          Icon(HugeIcons.strokeRoundedCheckmarkCircle01, size: 16, color: HexColor(AppColors.primaryGreen)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Wallet found: ${wallets.searchResult!.name ?? 'Verified'}',
              style: Greens.smallBoldJakarta,
            ),
          ),
        ],
      ),
    );
  }
}
