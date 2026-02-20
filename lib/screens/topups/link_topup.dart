import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

class LinkTopUp extends StatefulWidget {
  const LinkTopUp({super.key});

  @override
  State<LinkTopUp> createState() => _LinkTopUpState();
}

class _LinkTopUpState extends State<LinkTopUp> {
  final amountController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final wallets = Provider.of<WalletProvider>(context, listen: false);
      final payments = Provider.of<PaymentsProvider>(context, listen: false);
      if (payments.selectedDestinationWallet == null && wallets.userWallets.isNotEmpty) {
        payments.autoSelectPrimaryWallet(wallets.userWallets, isSource: false, isDestination: true);
      }
    });
  }

  @override
  void dispose() {
    amountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer3<PaymentsProvider, WalletProvider, CheckoutProvider>(
      builder: (_, payments, wallets, checkout, __) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            wallets.userWallets.isEmpty
                ? EmptyAccountsHint()
                : WalletSelectorCard(
                    selectedWallet: payments.selectedDestinationWallet,
                    wallets: wallets.userWallets,
                    onSelected: (wallet) {
                      payments.selectDestinationWallet(wallet);
                    },
                    label: 'Select destination wallet',
                    sheetTitle: 'Top Up Wallet',
                    sheetSubtitle: 'Where funds will be deposited',
                    isSource: false,
                  ),

            const SizedBox(height: 24),

            LabeledField(
                label: 'Amount (KSH)',
                hint: '500',
                isNumber: true,
                controller: amountController,
                enabled: true,
                prefixIcon: Icon(
                  HugeIcons.strokeRoundedMoney03,
                  color: HexColor(AppColors.primaryGreen),
                  size: 18,
                ),
              ),

            // Hint for changeable amount
            Padding(
              padding: const EdgeInsets.only(top: 8, left: 2),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    HugeIcons.strokeRoundedInformationCircle,
                    size: 14,
                    color: HexColor(AppColors.fadedGreen),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text.rich(
                      TextSpan(
                        children: [
                          TextSpan(
                            text: 'Tip: ',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: HexColor(AppColors.fadedGreen),
                            ),
                          ),
                          TextSpan(
                            text: 'Enter ',
                            style: TextStyle(
                              fontSize: 11,
                              color: HexColor(AppColors.darkerGray2),
                            ),
                          ),
                          TextSpan(
                            text: '0',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: HexColor(AppColors.primaryGreen),
                            ),
                          ),
                          TextSpan(
                            text: ' to let the recipient choose any amount',
                            style: TextStyle(
                              fontSize: 11,
                              color: HexColor(AppColors.darkerGray2),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Generated link display
            if (checkout.checkoutResp != null) ...[
              SectionHeader(
                icon: HugeIcons.strokeRoundedLink04,
                title: 'Generated Link',
                subtitle: 'Share this link with anyone to receive payment',
              ),
              const SizedBox(height: 12),
              _GeneratedLinkCard(checkout: checkout),
              const SizedBox(height: 20),
            ] else ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: HexColor('#F8FAF9'),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: HexColor('#E8ECE9')),
                ),
                child: Row(
                  children: [
                    Icon(
                      HugeIcons.strokeRoundedLink04,
                      color: Colors.grey.shade400,
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Your generated link will appear here',
                        style: Grays.smallestPoppinsHint,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ],

            // Generate button
            checkout.generatingLink
                ? const Center(child: WaveDots())
                : Center(
                  child: AuthButton(
                      text: 'GENERATE PAYMENT LINK',
                      tapped: () => _handleGenerate(payments, checkout),
                    ),
                ),

            const SizedBox(height: 16),

            // Info note
            InfoNote(
              text: 'Anyone with this link can pay to your wallet using M-Pesa or Card',
            ),
          ],
        );
      },
    );
  }

  void _handleGenerate(PaymentsProvider payments, CheckoutProvider checkout) async {
    Fluttertoast.cancel();

    if (payments.selectedDestinationWallet == null) {
      Fluttertoast.showToast(msg: "Select a wallet");
      return;
    }
    if (amountController.text.isEmpty) {
      Fluttertoast.showToast(msg: "Enter an amount (or 0 for a changeable amount)");
      return;
    }

    final request = CheckoutRequest(
      linkType: payments.selectedType?.type ?? Strings.walletTopUp,
      walletId: payments.selectedDestinationWallet!.id!,
      amount: double.parse(amountController.text),
    );

    showAdaptiveDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AiAnalysisAlert(
        icon: HugeIcons.strokeRoundedLink04,
        action: 'Generating...',
      ),
    );

    await Provider.of<CheckoutProvider>(context, listen: false).createCheckoutLink(request);
    Navigator.pop(context);

    if (checkout.checkoutResp?.error == null) {
      await showGeneralDialog(
        context: context,
        barrierDismissible: false,
        pageBuilder: (context, anim1, anim2) => const SizedBox(),
        transitionDuration: const Duration(milliseconds: 400),
        transitionBuilder: (context, anim1, anim2, child) {
          return SlideTransition(
            position: Tween(
              begin: const Offset(1, 0),
              end: const Offset(0, 0),
            ).animate(anim1),
            child: SuccessAlert(
              title: "Link Generated!",
              content: "Your payment link is ready to share",
              buttonText: "Copy & Share",
              tapped: () async {
                Fluttertoast.cancel();
                await Clipboard.setData(ClipboardData(
                  text: "Hey 👋! Use this link to top up my wallet 👉 ${checkout.checkoutResp!.checkoutLinkUrl ?? 'url not found!'}. Thanks!",
                ));
                Fluttertoast.showToast(msg: "Copied! You can now share with anyone");
                Navigator.pop(context);
                Navigator.pop(context);
                checkout.reset();
              },
              anim1: anim1,
            ),
          );
        },
      );
    }
  }
}

/// Generated link card with copy functionality
class _GeneratedLinkCard extends StatelessWidget {
  final CheckoutProvider checkout;

  const _GeneratedLinkCard({required this.checkout});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: HexColor(AppColors.primaryGreen).withAlpha(15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: HexColor(AppColors.primaryGreen).withAlpha(40),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              checkout.checkoutResp!.checkoutLinkUrl ?? 'Error generating link',
              style: Greens.smallBoldInter,
              overflow: TextOverflow.ellipsis,
              maxLines: 2,
            ),
          ),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: () async {
              Fluttertoast.cancel();
              await Clipboard.setData(ClipboardData(
                text: checkout.checkoutResp!.checkoutLinkUrl ?? '',
              ));
              Fluttertoast.showToast(msg: "Copied to clipboard");
            },
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: HexColor(AppColors.primaryGreen),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                HugeIcons.strokeRoundedCopy01,
                color: Colors.white,
                size: 18,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

