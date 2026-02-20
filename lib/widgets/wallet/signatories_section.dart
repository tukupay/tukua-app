import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/wallet/signatory_actions_card.dart';
import 'package:tuku/widgets/wallet/signatory_form_sheet.dart';
import 'package:tuku/widgets/widget.dart';

/// Complete signatories section for wallet details page
class SignatoriesSection extends StatelessWidget {
  final FullWallet? wallet;
  final VoidCallback? onRefresh;

  const SignatoriesSection({
    super.key,
    required this.wallet,
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final signatoriesCount = wallet?.signatoriesCount ?? 0;
    final signatories = wallet?.signatories ?? [];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: HexColor(AppColors.primaryGreen).withValues(alpha: 0.05),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: HexColor(AppColors.primaryGreen).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    HugeIcons.strokeRoundedUserMultiple,
                    color: HexColor(AppColors.primaryGreen),
                    size: 20,
                  ),
                ),
                Spaces.smallSideSpace,
                Expanded(
                  child: Text(
                    'Wallet Signatories ($signatoriesCount)',
                    style: Blacks.regularBoldCodeNext,
                  ),
                ),
                // Add signatory button
                _AddSignatoryButton(
                  walletId: wallet?.id ?? 0,
                  onSuccess: onRefresh,
                ),
              ],
            ),
          ),

          // Content
          Padding(
            padding: const EdgeInsets.all(16),
            child: signatoriesCount <= 0
                ? _EmptySignatories(
                    walletId: wallet?.id ?? 0,
                    onSuccess: onRefresh,
                  )
                : Column(
                    children: List.generate(
                      signatoriesCount,
                      (index) {
                        final signatory = signatories[index];
                        return Padding(
                          padding: EdgeInsets.only(
                            bottom: index < signatoriesCount - 1 ? 12 : 0,
                          ),
                          child: SignatoryActionsCard(
                            signatory: signatory,
                            walletId: wallet?.id ?? 0,
                            onEdit: () => SignatoryFormSheet.show(
                              context,
                              walletId: wallet?.id ?? 0,
                              existingSignatory: signatory,
                              onSuccess: onRefresh,
                            ),
                            onRemoved: onRefresh,
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

/// Button to add new signatory
class _AddSignatoryButton extends StatelessWidget {
  final int walletId;
  final VoidCallback? onSuccess;

  const _AddSignatoryButton({
    required this.walletId,
    this.onSuccess,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => SignatoryFormSheet.show(
        context,
        walletId: walletId,
        onSuccess: onSuccess,
      ),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: HexColor(AppColors.primaryGreen),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              HugeIcons.strokeRoundedUserAdd01,
              color: Colors.white,
              size: 16,
            ),
            const SizedBox(width: 4),
            Text('Invite', style: Whites.smallBoldRoboto),
          ],
        ),
      ),
    );
  }
}

/// Empty state when no signatories
class _EmptySignatories extends StatelessWidget {
  final int walletId;
  final VoidCallback? onSuccess;

  const _EmptySignatories({
    required this.walletId,
    this.onSuccess,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24),
      alignment: Alignment.center,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              shape: BoxShape.circle,
            ),
            child: Icon(
              HugeIcons.strokeRoundedUserMultiple02,
              color: Colors.grey.shade400,
              size: 40,
            ),
          ),
          Spaces.smallTopSpace,
          Text(
            'No signatories yet',
            style: Blacks.regularBoldCodeNext,
          ),
          Spaces.tinyTopSpace,
          Text(
            'Add signatories to manage this wallet',
            style: Grays.smallestPoppinsHint,
            textAlign: TextAlign.center,
          ),
          Spaces.mediumTopSpace,
          InkWell(
            onTap: () => SignatoryFormSheet.show(
              context,
              walletId: walletId,
              onSuccess: onSuccess,
            ),
            borderRadius: BorderRadius.circular(10),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              decoration: BoxDecoration(
                color: HexColor(AppColors.primaryGreen).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: HexColor(AppColors.primaryGreen).withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    HugeIcons.strokeRoundedUserAdd01,
                    color: HexColor(AppColors.primaryGreen),
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Invite Signatory',
                    style: Greens.regularSemiRoboto,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

