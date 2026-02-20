import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';

class SmsOverview extends StatelessWidget {
  const SmsOverview({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer2<BulkSmsProvider, CheckoutProvider>(
      builder: (_, bulkSmsProvider, checkouts, __) {
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
                        HugeIcons.strokeRoundedMail01,
                        color: HexColor(AppColors.primaryGreen),
                        size: 20,
                      ),
                    ),
                    Spaces.smallSideSpace,
                    Expanded(
                      child: Text('SMS Overview', style: Blacks.regularBoldCodeNext),
                    ),
                  ],
                ),
              ),

              // Content
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Message Preview
                    Row(
                      children: [
                        Icon(
                          HugeIcons.strokeRoundedFileView,
                          size: 16,
                          color: Colors.grey.shade600,
                        ),
                        Spaces.smallSideSpace,
                        Text(
                          'Message Preview',
                          style: Grays.smallRoboto,
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: HexColor('#F8FAF9'),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: Text(
                        bulkSmsProvider.newSms?.message ?? 'Message',
                        style: Blacks.regularSemiRoboto,
                      ),
                    ),

                    // Payment Link (if included)
                    if (bulkSmsProvider.includePaymentLink == true) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: HexColor(AppColors.primaryOrange).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: HexColor(AppColors.primaryOrange).withValues(alpha: 0.3),
                          ),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(
                              HugeIcons.strokeRoundedLink01,
                              color: HexColor(AppColors.primaryOrange),
                              size: 20,
                            ),
                            Spaces.smallSideSpace,
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Payment Link Attached',
                                    style: TextStyle(
                                      color: HexColor(AppColors.primaryOrange),
                                      fontWeight: FontWeight.w600,
                                      fontSize: 13,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    checkouts.checkoutResp?.checkoutLinkUrl ?? 'Generating...',
                                    style: Grays.smallRoboto.copyWith(
                                      decoration: TextDecoration.underline,
                                      fontSize: 11,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // Build detail row helper
  Widget _buildDetailRow(String label, String value, IconData icon) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          icon,
          size: 16,
          color: Colors.grey.shade600,
        ),
        Spaces.smallSideSpace,
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: Grays.smallRoboto),
              const SizedBox(height: 2),
              Text(value, style: Blacks.regularBoldCodeNext),
            ],
          ),
        ),
      ],
    );
  }
}
