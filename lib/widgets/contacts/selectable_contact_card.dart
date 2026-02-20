import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/models/models.dart';
import '../../constants/constants.dart';

/// Reusable contact card with selection capability
/// Used in BulkSMS and BulkPay contact selection screens
class SelectableContactCard extends StatelessWidget {
  final DeviceContact contact;
  final int? index; // Optional index for numbered display
  final bool isSelected;
  final VoidCallback onToggle;
  final bool showSelectLabel; // Show "Select" text beside checkbox

  const SelectableContactCard({
    super.key,
    required this.contact,
    required this.isSelected,
    required this.onToggle,
    this.index,
    this.showSelectLabel = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: Paddings.tinyVertical,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Optional index number
          if (index != null) ...[
            Text('${index! + 1}.', style: Blacks.regularBoldCodeNext),
            Spaces.smallSideSpace,
          ],

          // Avatar with initials
          Container(
            alignment: Alignment.center,
            height: 50,
            width: 50,
            decoration: BoxDecoration(
              color: HexColor(AppColors.primaryOrange),
              shape: BoxShape.circle,
            ),
            child: Text(
              createInitials(contact.fullName),
              style: Whites.mediumSemiRoboto,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Spaces.smallSideSpace,

          // Contact info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  contact.fullName,
                  style: Blacks.regularSemiRoboto,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  contact.phoneNumber ?? '--',
                  style: Grays.tinyPoppinsHint,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),

          // Selection area
          Row(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              if (showSelectLabel)
                Text('Select', style: Oranges.tinyPoppins),
              Checkbox(
                value: isSelected,
                onChanged: (_) => onToggle(),
                activeColor: HexColor(AppColors.primaryGreen),
                fillColor: isSelected
                    ? null
                    : WidgetStatePropertyAll(HexColor(AppColors.lightGray)),
                checkColor: isSelected
                    ? null
                    : HexColor(AppColors.primaryOrange),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

