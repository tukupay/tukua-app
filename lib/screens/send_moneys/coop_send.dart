import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../constants/constants.dart';
import '../../routes.dart';
import '../../widgets/widget.dart';

class CoopSend extends StatelessWidget {
  const CoopSend({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section header
        _SectionHeader(
          icon: HugeIcons.strokeRoundedBank,
          title: 'Co-op Bank Transfer',
          subtitle: 'Send to Co-op Bank account',
        ),
        const SizedBox(height: 16),

        // Account number input
        _InputCard(
          child: Row(
            children: [
              Expanded(
                child: LabeledField(
                  label: 'COOP Account No.',
                  hint: '0-10 characters',
                  isNumber: true,
                  enabled: true,
                  prefixIcon: Icon(
                    HugeIcons.strokeRoundedCreditCard,
                    color: HexColor(AppColors.primaryGreen),
                    size: 18,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              _IconButton(
                icon: HugeIcons.strokeRoundedCamera01,
                onTap: () => Fluttertoast.showToast(msg: 'Coming soon'),
              ),
              const SizedBox(width: 8),
              _IconButton(
                icon: HugeIcons.strokeRoundedQrCode,
                onTap: () => Fluttertoast.showToast(msg: 'Coming soon'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Account name & branch
        Row(
          children: [
            Expanded(
              child: _InputCard(
                child: LabeledField(
                  label: 'Account Name',
                  hint: 'John Doe',
                  enabled: true,
                  prefixIcon: Icon(
                    HugeIcons.strokeRoundedUser,
                    color: HexColor(AppColors.primaryGreen),
                    size: 18,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _InputCard(
                child: LabeledField(
                  label: 'Branch',
                  hint: 'Thika Branch',
                  enabled: true,
                  prefixIcon: Icon(
                    HugeIcons.strokeRoundedBuilding06,
                    color: HexColor(AppColors.primaryGreen),
                    size: 18,
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Amount
        _InputCard(
          child: LabeledField(
            label: 'Amount (KSH)',
            hint: '0',
            isNumber: true,
            enabled: true,
            prefixIcon: Icon(
              HugeIcons.strokeRoundedMoney03,
              color: HexColor(AppColors.primaryGreen),
              size: 18,
            ),
          ),
        ),

        const SizedBox(height: 32),

        // Proceed button
        AuthButton(
          text: 'PROCEED',
          tapped: () {
            Navigator.pushNamed(context, Routes.transactionOtp);
          },
        ),
      ],
    );
  }
}

/// Section header
class _SectionHeader extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _SectionHeader({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: HexColor(AppColors.primaryGreen).withAlpha(20),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 16, color: HexColor(AppColors.primaryGreen)),
        ),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Blacks.smallestBoldPoppins),
            Text(subtitle, style: Grays.tinyPoppinsHint),
          ],
        ),
      ],
    );
  }
}

/// Input card wrapper
class _InputCard extends StatelessWidget {
  final Widget child;

  const _InputCard({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(8),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: child,
    );
  }
}

/// Icon button
class _IconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _IconButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: HexColor(AppColors.primaryGreen).withAlpha(20),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, size: 20, color: HexColor(AppColors.primaryGreen)),
      ),
    );
  }
}
