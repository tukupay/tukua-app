import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import '../../constants/constants.dart';
import '../../models/models.dart';
import '../../widgets/widget.dart';

class BankSend extends StatefulWidget {
  const BankSend({super.key});

  @override
  State<BankSend> createState() => _BankSendState();
}

class _BankSendState extends State<BankSend> {
  final accNumber = TextEditingController();
  final accName = TextEditingController();
  final branch = TextEditingController();
  final amount = TextEditingController();
  bool showAcc = false;
  bool showManualEntry = false;
  bool _insufficientBalance = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await Provider.of<BankingProvider>(context, listen: false).getAvailableBanks();
      await Provider.of<BankingProvider>(context, listen: false).getFavourites();

      final wallets = Provider.of<WalletProvider>(context, listen: false);
      final payments = Provider.of<PaymentsProvider>(context, listen: false);
      if (payments.selectedSourceWallet == null && wallets.userWallets.isNotEmpty) {
        payments.autoSelectPrimaryWallet(wallets.userWallets, isSource: true, isDestination: false);
      }
    });
  }

  @override
  void dispose() {
    accNumber.dispose();
    accName.dispose();
    branch.dispose();
    amount.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      onPopInvokedWithResult: (bool b, res) {
        Provider.of<BankingProvider>(context, listen: false).resetFavBank();
      },
      child: Consumer4<PaymentsProvider, WalletProvider, BankingProvider, ProfileProvider>(
        builder: (_, payments, wallets, banking, profile, __) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Source wallet section
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

              const SizedBox(height: 20),

              // My Saved Banks section
              if (banking.userBanks.isNotEmpty) ...[
                UserBankSelectorCard(
                  selectedBank: banking.selectedFav,
                  userBanks: banking.userBanks,
                  onSelected: (FullBank selectedBank) {
                    banking.selectFavBank(selectedBank);
                    // Auto-fill fields
                    if (selectedBank.accountNumber != null) {
                      accNumber.text = selectedBank.maskedAccountNumber ?? '';
                    }
                    if (selectedBank.accountName != null) {
                      accName.text = selectedBank.accountName!;
                    }
                    if (selectedBank.branch != null) {
                      branch.text = selectedBank.branch!;
                    }
                    if (selectedBank.bankName != null) {
                      payments.selectDestinationBankName(selectedBank.bankName!);
                    }
                    Fluttertoast.cancel();
                    Fluttertoast.showToast(msg: "Selected ${selectedBank.bankName}");
                  },
                  label: 'Select Saved Bank',
                  sheetTitle: 'My Bank Accounts',
                  sheetSubtitle: 'Choose from your saved bank accounts',
                ),

                const SizedBox(height: 16),

                // Divider with "OR" text
                Row(
                  children: [
                    Expanded(child: Divider(color: Colors.grey.shade300)),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        'OR',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade500,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    Expanded(child: Divider(color: Colors.grey.shade300)),
                  ],
                ),

                const SizedBox(height: 16),
              ],

              // New Bank Details section - collapsible when user has saved banks
              if (banking.userBanks.isNotEmpty) ...[
                GestureDetector(
                  onTap: () {
                    setState(() => showManualEntry = !showManualEntry);
                    if (showManualEntry) {
                      // Clear saved bank selection when opening manual entry
                      banking.resetFavBank();
                      accNumber.clear();
                      accName.clear();
                      branch.clear();
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                    decoration: BoxDecoration(
                      color: HexColor(AppColors.primaryGreen).withOpacity(0.05),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: HexColor(AppColors.primaryGreen).withOpacity(0.2),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          HugeIcons.strokeRoundedCreditCard,
                          color: HexColor(AppColors.primaryGreen),
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Enter New Bank Details',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: HexColor(AppColors.primaryGreen),
                                ),
                              ),
                              Text(
                                'Send to a new bank account manually',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey.shade600,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Icon(
                          showManualEntry
                              ? HugeIcons.strokeRoundedArrowUp01
                              : HugeIcons.strokeRoundedArrowDown01,
                          color: HexColor(AppColors.primaryGreen),
                          size: 20,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
              ],

              // Manual bank entry fields - always visible if no saved banks, collapsible otherwise
              if (banking.userBanks.isEmpty || showManualEntry) ...[
                // Bank selector
                BankSelectorCard(
                  selectedBankName: banking.selectedFav == null ? payments.destinationBankName : null,
                  availableBanks: banking.availableBanks,
                  onSelected: (String bank) {
                    // Clear saved bank selection when manually selecting
                    banking.resetFavBank();
                    accNumber.clear();
                    accName.clear();
                    branch.clear();
                    payments.selectDestinationBankName(bank);
                  },
                  label: 'Select Bank',
                  sheetTitle: 'Select Bank',
                  sheetSubtitle: 'Choose the recipient bank',
                ),
                const SizedBox(height: 12),

                // Account number
                LabeledField(
                    suffixIcon: banking.selectedFav != null
                        ? GestureDetector(
                            onTap: () {
                              setState(() => showAcc = !showAcc);
                              if (showAcc) {
                                accNumber.text = banking.selectedFav!.accountNumber ?? '';
                              } else {
                                accNumber.text = banking.selectedFav?.maskedAccountNumber ?? '';
                              }
                            },
                            child: Icon(
                              showAcc ? Icons.visibility_off : Icons.visibility,
                              color: HexColor(AppColors.primaryGreen),
                            ),
                          )
                        : null,
                    controller: accNumber,
                    label: 'Account Number',
                    hint: '0123456789',
                    isNumber: true,
                    canGoNext: true,
                    enabled: true,
                    prefixIcon: Icon(
                      HugeIcons.strokeRoundedCreditCard,
                      color: HexColor(AppColors.primaryGreen),
                      size: 18,
                    ),
                  ),
                const SizedBox(height: 12),

                // Account name & branch row
                Row(
                  children: [
                    Expanded(
                      child: LabeledField(
                        controller: accName,
                        label: 'Account Name',
                        hint: 'John Doe',
                        canGoNext: true,
                        enabled: true,
                        prefixIcon: Icon(
                          HugeIcons.strokeRoundedUser,
                          color: HexColor(AppColors.primaryGreen),
                          size: 18,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: LabeledField(
                        canGoNext: true,
                        controller: branch,
                        label: 'Branch',
                        hint: 'Main Branch',
                        enabled: true,
                        prefixIcon: Icon(
                          HugeIcons.strokeRoundedBuilding06,
                          color: HexColor(AppColors.primaryGreen),
                          size: 18,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
              ],
              // Amount
              LabeledField(
                  controller: amount,
                  label: 'Amount (KSH)',
                  hint: '0',
                  canGoNext: true,
                  isNumber: true,
                  enabled: true,
                  hasError: _insufficientBalance,
                  errorText: _insufficientBalance ? 'Insufficient balance in selected wallet' : null,
                  changed: (val) {
                    final amt = double.tryParse(val ?? '') ?? 0;
                    final balance = payments.selectedSourceWallet?.balance ?? 0;
                    setState(() {
                      _insufficientBalance = amt > 0 && balance < amt;
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
                  tapped: () => _handleProceed(payments, banking, profile),
                ),
              ),

              const SizedBox(height: 16),

              // Info note
              InfoNote(
                text: 'Bank transfers may take 1-2 business days to process',
              ),
            ],
          );
        },
      ),
    );
  }

  void _handleProceed(
    PaymentsProvider payments,
    BankingProvider banking,
    ProfileProvider profile,
  ) async {
    Fluttertoast.cancel();

    if (payments.selectedSourceWallet == null) {
      Fluttertoast.showToast(msg: "Select which wallet you plan to send from");
      return;
    }
    if (payments.destinationBankName == null) {
      Fluttertoast.showToast(msg: "Please select a bank");
      return;
    }
    if (accNumber.text.isEmpty) {
      Fluttertoast.showToast(msg: "Please enter a bank account number");
      return;
    }
    if (accName.text.isEmpty) {
      Fluttertoast.showToast(msg: "Please enter an account name");
      return;
    }
    if (amount.text.isEmpty) {
      Fluttertoast.showToast(msg: "Please enter an amount");
      return;
    }
    if ((payments.selectedSourceWallet?.balance ?? 0) < double.parse(amount.text)) {
      setState(() => _insufficientBalance = true);
      Fluttertoast.showToast(msg: "Insufficient balance in selected wallet");
      return;
    }

    final paymentRequest = PaymentRequest(
      transactionData: TransactionData(
        transactionType: Strings.bankTransfer,
        amount: double.parse(amount.text),
        bankAccountId: banking.selectedFav?.id,
        bankName: banking.selectedFav == null ? payments.destinationBankName : null,
        accountNumber: banking.selectedFav == null ? accNumber.text : null,
        accountName: banking.selectedFav == null ? accName.text : null,
        branch: banking.selectedFav == null ? branch.text : null,
      ),
      paymentSource: PaymentSource(
        paymentMethod: Strings.tuku,
        sourceWalletId: payments.selectedSourceWallet!.id,
      ),
    );
    payments.setPendingRequest(paymentRequest);
    await payments.processTransaction(context, profile.user?.requiresPinSetup ?? true);
  }
}
