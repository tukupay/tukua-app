import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';

class BulkPayRecipientType extends StatelessWidget {
  const BulkPayRecipientType({super.key});


  void _showGroupSelector(BuildContext context, ContactsProvider contactProvider, BulkPayProvider bulkPay) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: HexColor('#E0E0E0'),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            // Title
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: HexColor('#E8F5E9'),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    HugeIcons.strokeRoundedUserGroup,
                    color: HexColor(AppColors.primaryGreen),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Text('Select Group', style: Blacks.regularBoldCodeNext),
                const Spacer(),
                // Add Group Button
                GestureDetector(
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.pushNamed(context, Routes.newGroup);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: HexColor(AppColors.primaryGreen),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(HugeIcons.strokeRoundedAdd01, color: Colors.white, size: 14),
                        const SizedBox(width: 4),
                        Text(
                          'New',
                          style: Whites.smallBoldRoboto.copyWith(fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            // Groups list
            if (contactProvider.groups.isEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(40),
                  child: Column(
                    children: [
                      Icon(
                        HugeIcons.strokeRoundedUserGroup,
                        size: 48,
                        color: HexColor('#E0E0E0'),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No groups yet',
                        style: Grays.regularPoppins,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Create a group to send to multiple people',
                        style: Grays.smallestPoppinsHint,
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                itemCount: contactProvider.groups.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final group = contactProvider.groups[index];
                  final isSelected = bulkPay.selectedGroup?.id == group.id;
                  return GestureDetector(
                    onTap: () async {
                      await bulkPay.selectGroup(group);
                      Navigator.pop(context);
                    },
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? HexColor(AppColors.primaryGreen).withAlpha(25)
                            : HexColor('#F8FAF9'),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected
                              ? HexColor(AppColors.primaryGreen)
                              : HexColor('#E8ECE9'),
                          width: isSelected ? 2 : 1,
                        ),
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
                            child: const Icon(
                              HugeIcons.strokeRoundedUserMultiple,
                              color: Colors.white,
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  group.name ?? 'Unnamed Group',
                                  style: Blacks.smallestBoldPoppins,
                                ),
                                if (group.contactCount != null) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    '${group.contactCount} member${group.contactCount != 1 ? 's' : ''}',
                                    style: Grays.smallestPoppinsHint,
                                  ),
                                ],
                              ],
                            ),
                          ),
                          if (isSelected)
                            Icon(
                              HugeIcons.strokeRoundedCheckmarkCircle01,
                              color: HexColor(AppColors.primaryGreen),
                              size: 24,
                            ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            SizedBox(height: MediaQuery.of(context).viewInsets.bottom + 20),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<ContactsProvider, BulkPayProvider>(
      builder: (_, contactProvider, bulkPay, __) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Group Selector
            Row(
              children: [
                Icon(
                  HugeIcons.strokeRoundedUserGroup,
                  size: 16,
                  color: HexColor(AppColors.darkerGray2),
                ),
                const SizedBox(width: 8),
                Text(
                  'Send to Group',
                  style: Blacks.smallestBoldPoppins.copyWith(
                    color: HexColor(AppColors.darkerGray2),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            GestureDetector(
              onTap: () => _showGroupSelector(context, contactProvider, bulkPay),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: HexColor('#F8FAF9'),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: bulkPay.selectedGroup != null
                        ? HexColor(AppColors.primaryGreen)
                        : HexColor('#E8ECE9'),
                    width: bulkPay.selectedGroup != null ? 1.5 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: bulkPay.selectedGroup != null
                            ? HexColor(AppColors.primaryGreen).withAlpha(25)
                            : HexColor('#E8F5E9'),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        HugeIcons.strokeRoundedUserMultiple,
                        size: 18,
                        color: HexColor(AppColors.primaryGreen),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            bulkPay.selectedGroup?.name ?? 'Select a group',
                            style: bulkPay.selectedGroup != null
                                ? Blacks.smallestBoldPoppins
                                : Grays.smallestPoppinsHint,
                          ),
                          if (bulkPay.selectedGroup?.contactCount != null) ...[
                            const SizedBox(height: 2),
                            Text(
                              '${bulkPay.selectedGroup!.contactCount} member${bulkPay.selectedGroup!.contactCount != 1 ? 's' : ''}',
                              style: Grays.smallestPoppinsHint.copyWith(fontSize: 10),
                            ),
                          ],
                        ],
                      ),
                    ),
                    Icon(
                      HugeIcons.strokeRoundedArrowDown01,
                      size: 16,
                      color: HexColor(AppColors.darkerGray2),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            // Or Divider
            Row(
              children: [
                Expanded(
                  child: Container(
                    height: 1,
                    color: HexColor('#E8ECE9'),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Text(
                    'OR',
                    style: Grays.smallestPoppinsHint.copyWith(
                      fontWeight: FontWeight.w600,
                      fontSize: 10,
                    ),
                  ),
                ),
                Expanded(
                  child: Container(
                    height: 1,
                    color: HexColor('#E8ECE9'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            // Individual Contacts Header
            Row(
              children: [
                Icon(
                  HugeIcons.strokeRoundedUser,
                  size: 16,
                  color: HexColor(AppColors.darkerGray2),
                ),
                const SizedBox(width: 8),
                Text(
                  'Send to Contacts',
                  style: Blacks.smallestBoldPoppins.copyWith(
                    color: HexColor(AppColors.darkerGray2),
                  ),
                ),
              ],
            ),
          ],
        );
      },
    );
  }
}
