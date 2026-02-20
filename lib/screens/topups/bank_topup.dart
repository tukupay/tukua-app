import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
import '../../widgets/widget.dart';

class BankTopUp extends StatelessWidget {
  const BankTopUp({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header section
        SectionHeader(
          icon: HugeIcons.strokeRoundedBank,
          title: 'Bank Deposit',
          subtitle: 'Transfer funds directly from your bank',
        ),
        const SizedBox(height: 20),

        // Info card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Colors.white,
                HexColor(AppColors.primaryGreen).withAlpha(10),
              ],
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: HexColor(AppColors.primaryGreen).withAlpha(30),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    HugeIcons.strokeRoundedInformationCircle,
                    color: HexColor(AppColors.primaryGreen),
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Account Information',
                    style: Blacks.smallestBoldPoppins,
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Bank details
              _AccountDetailCard(
                icon: HugeIcons.strokeRoundedBank,
                label: 'Bank Name',
                value: 'Cooperative Bank Of Kenya',
              ),
              const SizedBox(height: 12),
              _AccountDetailCard(
                icon: HugeIcons.strokeRoundedCreditCard,
                label: 'Account Number',
                value: '010712345678',
                copyable: true,
              ),
              const SizedBox(height: 12),
              _AccountDetailCard(
                icon: HugeIcons.strokeRoundedUser,
                label: 'Account Name',
                value: 'John Doe',
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),

        // Instructions
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: HexColor(AppColors.primaryOrange).withAlpha(15),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: HexColor(AppColors.primaryOrange).withAlpha(30),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    HugeIcons.strokeRoundedAlert02,
                    color: HexColor(AppColors.primaryOrange),
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Important',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: HexColor(AppColors.primaryOrange),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                '• Use your phone number as the reference\n'
                '• Transfers may take 1-2 business days\n'
                '• Contact support if funds don\'t reflect',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade700,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Account detail card with optional copy functionality
class _AccountDetailCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final bool copyable;

  const _AccountDetailCard({
    required this.icon,
    required this.label,
    required this.value,
    this.copyable = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: HexColor('#E8ECE9')),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: HexColor(AppColors.primaryGreen).withAlpha(15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 16, color: HexColor(AppColors.primaryGreen)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: Grays.tinyPoppinsHint),
                const SizedBox(height: 2),
                Text(value, style: Blacks.smallestBoldPoppins),
              ],
            ),
          ),
          if (copyable)
            GestureDetector(
              onTap: () async {
                await Clipboard.setData(ClipboardData(text: value));
                Fluttertoast.showToast(msg: "Copied to clipboard");
              },
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: HexColor(AppColors.primaryGreen).withAlpha(15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  HugeIcons.strokeRoundedCopy01,
                  size: 16,
                  color: HexColor(AppColors.primaryGreen),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
