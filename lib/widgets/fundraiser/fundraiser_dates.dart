import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import '../../constants/constants.dart';

class FundraiserDates extends StatelessWidget {
  const FundraiserDates({super.key});

  void _showDatePicker({
    required BuildContext context,
    required String title,
    required String subtitle,
    required DateTime? currentDate,
    required Function(DateTime) onDateSelected,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) {
          return Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Handle bar
                Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: HexColor('#E0E0E0'),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                // Title
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: HexColor('#FFF3E0'),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        HugeIcons.strokeRoundedCalendar02,
                        color: HexColor('#FB8C00'),
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(title, style: Blacks.regularBoldCodeNext),
                          const SizedBox(height: 2),
                          Text(subtitle, style: Grays.tinyPoppinsHint),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: Icon(
                        HugeIcons.strokeRoundedCancel01,
                        color: HexColor(AppColors.darkerGray2),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // Calendar
                CalendarDatePicker(
                  currentDate: DateTime.now(),
                  initialDate: currentDate ?? DateTime.now(),
                  firstDate: DateTime.now(),
                  lastDate: DateTime(DateTime.now().year + 2),
                  onDateChanged: (date) {
                    onDateSelected(date);
                    setState(() {});
                  },
                ),
                // Selected date display
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: currentDate != null
                        ? HexColor(AppColors.primaryGreen).withAlpha(15)
                        : HexColor('#FFF3E0'),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        currentDate != null
                            ? HugeIcons.strokeRoundedCheckmarkCircle01
                            : HugeIcons.strokeRoundedInformationCircle,
                        size: 16,
                        color: currentDate != null
                            ? HexColor(AppColors.primaryGreen)
                            : HexColor('#FB8C00'),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        currentDate != null
                            ? 'Selected: ${formatDate(currentDate)}'
                            : 'Please select a date',
                        style: TextStyle(
                          color: currentDate != null
                              ? HexColor(AppColors.primaryGreen)
                              : HexColor('#FB8C00'),
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                // Confirm button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
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
                      'CONFIRM',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ),
                SizedBox(height: MediaQuery.of(context).viewInsets.bottom + 10),
              ],
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<FundraiserProvider>(
      builder: (_, fundraiserProvider, __) {
        return Row(
          children: [
            // Start Date
            Expanded(
              child: _buildDateSelector(
                context: context,
                label: 'Start Date',
                date: fundraiserProvider.startDate,
                onTap: () => _showDatePicker(
                  context: context,
                  title: 'Start Date',
                  subtitle: 'When does your fundraiser begin?',
                  currentDate: fundraiserProvider.startDate,
                  onDateSelected: (date) {
                    Provider.of<FundraiserProvider>(context, listen: false)
                        .setStartDate(date);
                  },
                ),
              ),
            ),
            const SizedBox(width: 12),
            // End Date
            Expanded(
              child: _buildDateSelector(
                context: context,
                label: 'End Date',
                date: fundraiserProvider.endDate,
                onTap: () => _showDatePicker(
                  context: context,
                  title: 'End Date',
                  subtitle: 'When does your fundraiser end?',
                  currentDate: fundraiserProvider.endDate,
                  onDateSelected: (date) {
                    Provider.of<FundraiserProvider>(context, listen: false)
                        .setEndDate(date);
                  },
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildDateSelector({
    required BuildContext context,
    required String label,
    required DateTime? date,
    required VoidCallback onTap,
  }) {
    final hasDate = date != null;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        decoration: BoxDecoration(
          color: hasDate
              ? HexColor(AppColors.primaryGreen).withAlpha(15)
              : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: hasDate
                ? HexColor(AppColors.primaryGreen).withAlpha(80)
                : HexColor('#E8ECE9'),
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: hasDate
                    ? HexColor(AppColors.primaryGreen).withAlpha(25)
                    : HexColor('#FFF3E0'),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Icon(
                HugeIcons.strokeRoundedCalendar03,
                size: 14,
                color: hasDate
                    ? HexColor(AppColors.primaryGreen)
                    : HexColor('#FB8C00'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: Grays.smallestPoppinsHint.copyWith(fontSize: 10),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    hasDate ? formatDate(date) : 'Select',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: hasDate
                          ? HexColor(AppColors.darkerGray2)
                          : HexColor('#9E9E9E'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
