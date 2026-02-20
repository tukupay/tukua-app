import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import '../../models/models.dart';
import '../../routes.dart';

class BulkPayCompletion extends StatelessWidget {
  const BulkPayCompletion({super.key});

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'success':
        return HexColor(AppColors.primaryGreen);
      case 'partial_success':
        return HexColor(AppColors.primaryOrange);
      default:
        return HexColor(AppColors.red);
    }
  }

  IconData _getStatusIcon(String? status) {
    switch (status) {
      case 'success':
        return HugeIcons.strokeRoundedCheckmarkCircle01;
      case 'partial_success':
        return HugeIcons.strokeRoundedHourglassOff;
      default:
        return HugeIcons.strokeRoundedAlert01;
    }
  }

  String _getStatusTitle(String? status, int recipientCount) {
    switch (status) {
      case 'success':
        return 'Payment Successful!';
      case 'partial_success':
        return 'Partial Success';
      default:
        return 'Payment Failed';
    }
  }

  String _getStatusMessage(String? status, int recipientCount) {
    switch (status) {
      case 'success':
        return 'Successfully sent to $recipientCount recipient${recipientCount != 1 ? 's' : ''}';
      case 'partial_success':
        return 'Some payments could not be completed';
      default:
        return 'Transaction could not be completed';
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return PopScope(
      canPop: false,
      child: Scaffold(
        backgroundColor: HexColor('#F8FAF9'),
        body: Consumer<BulkPayProvider>(
          builder: (_, bulkPay, __) {
            final status = bulkPay.bulkPayResponse?.status;
            final statusColor = _getStatusColor(status);

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
                    const SizedBox(height: 60),

                    // Scrollable Content
                    Expanded(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Column(
                          children: [
                            // Status Icon
                            Container(
                              padding: const EdgeInsets.all(24),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: statusColor,
                                boxShadow: [
                                  BoxShadow(
                                    color: statusColor.withAlpha(76),
                                    blurRadius: 30,
                                    offset: const Offset(0, 10),
                                  ),
                                ],
                              ),
                              child: Icon(
                                _getStatusIcon(status),
                                size: 64,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 24),

                            // Status Title
                            Text(
                              _getStatusTitle(status, bulkPay.selectedContacts.length),
                              style: Blacks.largeSemiPoppins.copyWith(fontSize: 24),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 8),

                            // Status Message
                            Text(
                              bulkPay.bulkPayResponse?.message ?? _getStatusMessage(status, bulkPay.selectedContacts.length),
                              style: Grays.regularPoppins.copyWith(fontSize: 14),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 32),

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
                                  _buildSummaryRow(
                                    icon: HugeIcons.strokeRoundedMoneyBag01,
                                    label: 'Total Amount',
                                    value: 'KSH ${formatThousands(amount: bulkPay.bulkPayResponse?.amount?.toDouble() ?? 0, noDecimal: true)}',
                                    valueColor: AppColors.primaryGreen,
                                    isLarge: true,
                                  ),
                                  const SizedBox(height: 16),
                                  Container(height: 1, color: HexColor('#E8ECE9')),
                                  const SizedBox(height: 16),
                                  _buildSummaryRow(
                                    icon: HugeIcons.strokeRoundedCalendar03,
                                    label: 'Completed At',
                                    value: formatDate(bulkPay.bulkPayResponse?.createdAt ?? DateTime.now()),
                                  ),
                                  const SizedBox(height: 12),
                                  _buildSummaryRow(
                                    icon: HugeIcons.strokeRoundedClock01,
                                    label: 'Time',
                                    value: formatTime(bulkPay.bulkPayResponse?.createdAt ?? DateTime.now()),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 24),

                            // Recipients List Header
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: HexColor('#E8F5E9'),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Icon(
                                    HugeIcons.strokeRoundedUserMultiple02,
                                    size: 18,
                                    color: HexColor(AppColors.primaryGreen),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Text('Payment Details', style: Blacks.regularBoldCodeNext),
                              ],
                            ),
                            const SizedBox(height: 12),

                            // Recipients Status List
                            if (bulkPay.bulkPayResponse?.transferResults != null)
                              ListView.separated(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: bulkPay.bulkPayResponse!.transferResults!.length,
                                separatorBuilder: (_, __) => const SizedBox(height: 10),
                                itemBuilder: (context, index) {
                                  TransferResult result = bulkPay.bulkPayResponse!.transferResults![index];
                                  final isSuccess = result.status == 'success';

                                  return Container(
                                    padding: const EdgeInsets.all(14),
                                    decoration: BoxDecoration(
                                      color: isSuccess
                                          ? HexColor('#E8F5E9')
                                          : HexColor('#FFEBEE'),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: isSuccess
                                            ? HexColor(AppColors.primaryGreen).withAlpha(51)
                                            : HexColor(AppColors.red).withAlpha(51),
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(10),
                                          decoration: BoxDecoration(
                                            color: isSuccess
                                                ? HexColor(AppColors.primaryGreen)
                                                : HexColor(AppColors.red),
                                            borderRadius: BorderRadius.circular(10),
                                          ),
                                          child: Text(
                                            createInitials(result.phoneNumber ?? 'U'),
                                            style: Whites.smallBoldRoboto,
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                result.phoneNumber ?? 'Unknown',
                                                style: Blacks.smallestBoldPoppins,
                                              ),
                                              if (result.message != null && !isSuccess) ...[
                                                const SizedBox(height: 2),
                                                Text(
                                                  result.message!,
                                                  style: Reds.tinyInter.copyWith(fontSize: 10),
                                                ),
                                              ],
                                            ],
                                          ),
                                        ),
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.end,
                                          children: [
                                            Text(
                                              'KSH ${formatThousands(amount: result.amount?.toDouble() ?? 0, noDecimal: true)}',
                                              style: (isSuccess ? Greens.smallBoldJakarta : Reds.regularSemiInter).copyWith(fontSize: 13),
                                            ),
                                            const SizedBox(height: 4),
                                            Icon(
                                              isSuccess
                                                  ? HugeIcons.strokeRoundedCheckmarkCircle01
                                                  : HugeIcons.strokeRoundedCancelCircle,
                                              color: isSuccess
                                                  ? HexColor(AppColors.primaryGreen)
                                                  : HexColor(AppColors.red),
                                              size: 18,
                                            ),
                                          ],
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
                            onPressed: () {
                              bulkPay.resetSelected();
                              Navigator.of(context).popUntil((route) => route.settings.name == Routes.home || route.isFirst);
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
                            child: const Text(
                              'DONE',
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 14,
                                letterSpacing: 0.5,
                              ),
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
      ),
    );
  }

  Widget _buildSummaryRow({
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
