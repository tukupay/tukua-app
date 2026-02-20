import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/widget.dart';

class TopUpMethods extends StatelessWidget {
  final bool isChanging;
  final bool showLinkMethod;

  const TopUpMethods({
    super.key,
    this.isChanging = false,
    this.showLinkMethod = true,
  });

  @override
  Widget build(BuildContext context) {
    final linkMethod = PaymentMethod(
      method: Strings.link,
      name: "Payment Link",
      iconUrl: "https://cdn-icons-png.flaticon.com/128/455/455691.png",
      description: "Generate & share a link for others to pay you",
      requirements: ["Wallet Id, Amount"],
    );

    return Consumer3<PaymentsProvider, FundraiserProvider, WalletProvider>(
      builder: (_, payments, fundraiser, wallets, __) {
        final allMethods = [
          ...payments.paymentMethods,
          if (showLinkMethod) linkMethod,
        ];

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader('Choose how you want to add funds'),
            payments.loadingMethods
                ? const RadioOptionSkeleton()
                : _buildMethodsList(
                    methods: allMethods,
                    selectedMethod: payments.selectedMethod,
                    onSelect: (method) {
                      payments.selectMethod(method);
                      if (isChanging) Navigator.pop(context);
                    },
                  ),
            const SizedBox(height: 20),
            SheetButton(
              fullWidth: true,
              enabled: payments.selectedMethod != null,
              text: 'Continue',
              tapped: () {
                Navigator.pop(context);
                if (fundraiser.selectedFundraiser != null) {
                  final fundraiserWallet = wallets.userWallets
                      .where((w) => w.id == fundraiser.selectedFundraiser?.walletId)
                      .firstOrNull;
                  if (fundraiserWallet != null) {
                    payments.selectDestinationWallet(fundraiserWallet);
                  }
                }
                Navigator.pushNamed(context, Routes.accountTopUp);
              },
            ),
          ],
        );
      },
    );
  }

  Widget _buildHeader(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(
            HugeIcons.strokeRoundedInformationCircle,
            size: 16,
            color: HexColor(AppColors.primaryGreen),
          ),
          const SizedBox(width: 8),
          Text(text, style: Grays.smallestPoppinsHint),
        ],
      ),
    );
  }

  Widget _buildMethodsList({
    required List<PaymentMethod> methods,
    required PaymentMethod? selectedMethod,
    required void Function(PaymentMethod) onSelect,
  }) {
    return Column(
      children: methods.asMap().entries.map((entry) {
        final index = entry.key;
        final method = entry.value;
        final isSelected = selectedMethod?.method == method.method;

        return Padding(
          padding: EdgeInsets.only(bottom: index < methods.length - 1 ? 10 : 0),
          child: MethodCard(
            method: method,
            isSelected: isSelected,
            onTap: () => onSelect(method),
          ),
        );
      }).toList(),
    );
  }
}

