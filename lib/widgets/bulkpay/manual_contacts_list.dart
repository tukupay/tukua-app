import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

/// Widget to display manually inputted phone numbers
class ManualContactsList extends StatelessWidget {
  const ManualContactsList({super.key});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Consumer<BulkPayProvider>(
      builder: (_, bulkPay, __) {
        // Filter only manual entries (where phoneNumber == fullName)
        final manualContacts = bulkPay.selectedContacts.where((c) {
          return c.deviceContact != null &&
              c.deviceContact!.phoneNumber == c.deviceContact!.fullName;
        }).toList();

        if (manualContacts.isEmpty) {
          return Padding(
            padding: Paddings.smallVertical,
            child: Center(
              child: Text(
                'No manual entries added yet',
                style: Grays.regularSemiInter,
              ),
            ),
          );
        }

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: HexColor(AppColors.primaryGreen).withAlpha(51),
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: HexColor(AppColors.primaryGreen).withAlpha(20),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.phone_android_rounded,
                        color: HexColor(AppColors.primaryGreen),
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Manual Entries',
                        style: Blacks.tinyBolderPoppins,
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: HexColor('#E8F5E9'),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: HexColor(AppColors.primaryGreen).withAlpha(51),
                      ),
                    ),
                    child: Text(
                      '${manualContacts.length} ${manualContacts.length == 1 ? 'Contact' : 'Contacts'}',
                      style: TextStyle(
                        color: HexColor(AppColors.primaryGreen),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              ListView.separated(
                primary: false,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemBuilder: (context, index) {
                  // Find the actual index in selectedContacts
                  final contact = manualContacts[index];
                  final actualIndex = bulkPay.selectedContacts.indexOf(contact);

                  return RecipientAmountCard(
                    contact: contact,
                    index: actualIndex,
                    showIndex: true,
                    amount: contact.amountToSend,
                    inputEnabled: true,
                  );
                },
                separatorBuilder: (context, index) => Divider(
                  height: 24,
                  thickness: 1,
                  color: Colors.grey.shade200,
                ),
                itemCount: manualContacts.length,
              ),
            ],
          ),
        );
      },
    );
  }
}
