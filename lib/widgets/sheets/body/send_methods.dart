import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/routes.dart';

import '../../../providers/providers.dart';
import '../../widget.dart';

class SendMethods extends StatelessWidget {
  final bool isChanging;

  const SendMethods({
    super.key,
    this.isChanging = false,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer3<PaymentsProvider, FundraiserProvider, WalletProvider>(
      builder: (_, payments, fundraisers, wallets, __) {
        final sendMethods = payments.paymentMethods
            .where((el) => el.method != Strings.card)
            .toList();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader('Choose how you want to send money'),
            payments.loadingMethods
                ? const RadioOptionSkeleton(items: 3)
                : _buildMethodsList(
                    methods: sendMethods,
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
                final fundraiserWallet = wallets.userWallets
                    .where((w) => w.id == fundraisers.selectedFundraiser?.walletId)
                    .firstOrNull;
                if (fundraiserWallet != null) {
                  payments.selectSourceWallet(fundraiserWallet);
                }
                Navigator.pushNamed(context, Routes.accountSend);
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
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.zero,
      itemCount: methods.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final method = methods[index];
        final isSelected = selectedMethod?.method == method.method;

        return MethodCard(
          method: method,
          isSelected: isSelected,
          onTap: () => onSelect(method),
          fallbackIcon: HugeIcons.strokeRoundedMoneySend01,
        );
      },
    );
  }
}
