import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/widget.dart';

class BulkPayValidation extends StatelessWidget {
  const BulkPayValidation({super.key});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Scaffold(
      backgroundColor: HexColor('#F8FAF9'),
      body: Consumer<BulkPayProvider>(
        builder: (_, bulkPay, __) {
          return Container(
            height: size.height,
            width: size.width,
            decoration: BoxDecoration(
              image: DecorationImage(
                image: AssetImage(Strings.imageAsset('bg.png')),
                fit: BoxFit.cover,
              ),
            ),
            child: Container(
              decoration: BoxDecoration(
                image: DecorationImage(
                  image: AssetImage(Strings.imageAsset('gradient2.png')),
                  fit: BoxFit.cover,
                ),
              ),
              child: Column(
                children: [
                  // Custom App Bar
                  SafeArea(
                    bottom: false,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: Row(
                        children: [
                          GestureDetector(
                            onTap: () => Navigator.pop(context),
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: HexColor('#F0F4F3'),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(HugeIcons.strokeRoundedArrowLeft01,
                                  color: HexColor(AppColors.darkerGray2), size: 20),
                            ),
                          ),
                          const Spacer(),
                          Column(
                            children: [
                              Text('Review & Confirm', style: Blacks.mediumSemiRubik),
                              Text('Verify transaction details',
                                  style: Grays.smallestPoppinsHint.copyWith(fontSize: 10)),
                            ],
                          ),
                          const Spacer(),
                          const SizedBox(width: 36),
                        ],
                      ),
                    ),
                  ),

                  // Scrollable Content
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Column(
                        children: [
                          const SizedBox(height: 8),
                          // Success Icon Header
                          Container(
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: LinearGradient(
                                colors: [
                                  HexColor(AppColors.primaryGreen),
                                  HexColor(AppColors.fadedGreen),
                                ],
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: HexColor(AppColors.primaryGreen).withAlpha(76),
                                  blurRadius: 20,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                            ),
                            child: const Icon(
                              HugeIcons.strokeRoundedUserMultiple,
                              size: 48,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Title & Description
                          Text(
                            'Bulk Payment Ready',
                            style: Blacks.largeSemiPoppins.copyWith(fontSize: 22),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Send to ${bulkPay.selectedContacts.length} recipient${bulkPay.selectedContacts.length != 1 ? 's' : ''} in one transaction',
                            style: Grays.regularPoppins.copyWith(fontSize: 14),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 24),

                          // Transaction Summary Card
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: Colors.white.withAlpha(100),
                              border: Border.all(color: HexColor(AppColors.lightGray)),
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withAlpha(10),
                                  blurRadius: 12,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Column(
                              children: [
                                _buildInfoRow(
                                  icon: HugeIcons.strokeRoundedWallet02,
                                  label: 'Source Wallet',
                                  value: bulkPay.selectedWallet?.name ?? 'Wallet Name',
                                ),
                                const SizedBox(height: 16),
                                _buildInfoRow(
                                  icon: HugeIcons.strokeRoundedMoneySecurity,
                                  label: 'Current Balance',
                                  value: 'KSH ${formatThousands(amount: bulkPay.selectedWallet?.balance ?? 0, noDecimal: true)}',
                                ),
                                const SizedBox(height: 16),
                                Container(
                                  height: 1,
                                  color: HexColor('#E8ECE9'),
                                ),
                                const SizedBox(height: 16),
                                _buildInfoRow(
                                  icon: HugeIcons.strokeRoundedMoneyBag01,
                                  label: 'Total Amount',
                                  value: 'KSH ${formatThousands(amount: bulkPay.totalAmount.toDouble(), noDecimal: true)}',
                                  valueColor: AppColors.primaryGreen,
                                  isLarge: true,
                                ),
                                const SizedBox(height: 16),
                                _buildInfoRow(
                                  icon: HugeIcons.strokeRoundedBank,
                                  label: 'Bank Charges',
                                  value: 'KSH 0.00',
                                  valueColor: AppColors.red,
                                ),
                                const SizedBox(height: 16),
                                _buildInfoRow(
                                  icon: HugeIcons.strokeRoundedUserMultiple02,
                                  label: 'Recipients',
                                  value: '${bulkPay.selectedContacts.length} contact${bulkPay.selectedContacts.length != 1 ? 's' : ''}',
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Recipients List Header
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: HexColor('#E8F5E9'),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(HugeIcons.strokeRoundedUser,
                                    size: 18, color: HexColor(AppColors.primaryGreen)),
                              ),
                              const SizedBox(width: 12),
                              Text('Payment Breakdown', style: Blacks.regularBoldCodeNext),
                            ],
                          ),
                          const SizedBox(height: 12),

                          // Recipients List
                          ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: bulkPay.selectedContacts.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (context, index) {
                              BulkPayContact contact = bulkPay.selectedContacts[index];
                              return Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: HexColor('#F8FAF9'),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: HexColor('#E8ECE9')),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          colors: [
                                            HexColor(AppColors.primaryGreen),
                                            HexColor(AppColors.fadedGreen),
                                          ],
                                        ),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Text(
                                        createInitials(contact.name),
                                        style: Whites.smallBoldRoboto,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(contact.name, style: Blacks.smallestBoldPoppins),
                                          const SizedBox(height: 2),
                                          Text(contact.phone ?? '', style: Grays.smallestPoppinsHint),
                                        ],
                                      ),
                                    ),
                                    Text(
                                      'KSH ${formatThousands(amount: contact.amountToSend.toDouble(), noDecimal: true)}',
                                      style: Greens.regularBoldCodeNext.copyWith(fontSize: 14),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                          const SizedBox(height: 80),
                        ],
                      ),
                    ),
                  ),

                  // Bottom Action Button
                  Container(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withAlpha(15),
                          blurRadius: 10,
                          offset: const Offset(0, -2),
                        ),
                      ],
                    ),
                    child: SafeArea(
                      top: false,
                      child: SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () async {
                            // Processing alert
                            showAdaptiveDialog(
                              context: context,
                              barrierDismissible: false,
                              builder: (context) => AiAnalysisAlert(
                                icon: HugeIcons.strokeRoundedUserMultiple,
                                action: 'Processing Payment...',
                              ),
                            );

                            await Provider.of<BulkPayProvider>(context, listen: false).bulkSend(
                              sourceWalletId: bulkPay.selectedWallet!.id!,
                              destinationType: Strings.mpesa,
                            );

                            Navigator.pop(context);

                            final response = Provider.of<BulkPayProvider>(context, listen: false).bulkPayResponse;
                            if (response?.error == null) {
                              Navigator.pushNamed(context, Routes.bulkPayCompletion);
                            } else {
                              Fluttertoast.showToast(msg: response!.error!);
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: HexColor(AppColors.primaryGreen),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            elevation: 0,
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(HugeIcons.strokeRoundedCheckmarkCircle01, size: 18),
                              const SizedBox(width: 8),
                              const Text(
                                'CONFIRM & SEND',
                                style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 14,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
    String? valueColor,
    bool isLarge = false,
  }) {
    return Row(
      children: [
        Icon(icon, size: 18, color: HexColor(AppColors.darkerGray2)),
        const SizedBox(width: 10),
        Expanded(
          child: Text(label, style: Grays.regularPoppins.copyWith(fontSize: 13)),
        ),
        Text(
          value,
          style: (isLarge ? Blacks.regularBoldCodeNext : Blacks.smallestBoldPoppins).copyWith(
            color: valueColor != null ? HexColor(valueColor) : null,
            fontSize: isLarge ? 16 : 13,
          ),
        ),
      ],
    );
  }
}
