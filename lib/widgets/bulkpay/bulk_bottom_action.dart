import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';

/// Bottom action bar for bulk pay
class BulkPayBottomAction extends StatelessWidget {
  const BulkPayBottomAction({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer2<BulkPayProvider, DeviceContactProvider>(
      builder: (context, bulkPay, deviceContactsProvider, _) {
        final bool hasRecipients = bulkPay.selectedContacts.isNotEmpty ||
                                   bulkPay.selectedGroup != null;

        if (!hasRecipients && deviceContactsProvider.filteredContacts.isEmpty) {
          return const SizedBox.shrink();
        }

        return Container(
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
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Recipients summary chip
                if (hasRecipients)
                  Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: HexColor('#E8F5E9'),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(HugeIcons.strokeRoundedCheckmarkCircle01,
                            color: HexColor(AppColors.primaryGreen), size: 16),
                        const SizedBox(width: 8),
                        Text(
                          '${bulkPay.selectedContacts.length} recipient${bulkPay.selectedContacts.length != 1 ? 's' : ''} selected',
                          style: TextStyle(
                            color: HexColor(AppColors.primaryGreen),
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),

                // Action buttons
                Row(
                  children: [
                    if (hasRecipients) ...[
                      Expanded(
                        flex: 2,
                        child: OutlinedButton(
                          onPressed: () {
                            Provider.of<BulkPayProvider>(context, listen: false)
                                .resetSelected();
                          },
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            side: BorderSide(color: HexColor(AppColors.darkerGray2)),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: Text(
                            'Clear',
                            style: TextStyle(
                              color: HexColor(AppColors.darkerGray2),
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                    ],
                    Expanded(
                      flex: 3,
                      child: ElevatedButton(
                        onPressed: () {
                          Fluttertoast.cancel();
                          if (bulkPay.selectedWallet == null) {
                            Fluttertoast.showToast(
                                msg: "Please select a source wallet.");
                            return;
                          } else if (bulkPay.selectedContacts.isEmpty) {
                            Fluttertoast.showToast(
                                msg: "Please select some recipients");
                          } else {
                            Navigator.pushNamed(context, Routes.bulkAmount);
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
                            const Icon(HugeIcons.strokeRoundedArrowRight01,
                                size: 18),
                            const SizedBox(width: 8),
                            const Text(
                              'SET AMOUNTS',
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
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
