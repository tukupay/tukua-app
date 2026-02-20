import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';

import '../../constants/constants.dart';
import '../widget.dart';

/// Input section for SMS credits amount with calculate button
class SmsCreditsInput extends StatelessWidget {
  const SmsCreditsInput({
    super.key,
    required this.controller,
    required this.onCalculate,
    required this.isLoading,
  });

  final TextEditingController controller;
  final VoidCallback onCalculate;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return Container(
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: HexColor('#E8F5E9'),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  HugeIcons.strokeRoundedMail01,
                  size: 18,
                  color: HexColor(AppColors.primaryGreen),
                ),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('SMS Credits', style: Blacks.tinyBolderPoppins),
                  const SizedBox(height: 2),
                  Text(
                    'Enter the amount you want',
                    style: Grays.tinySemiGrotesk.copyWith(fontSize: 11),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Input field with styled container
          Container(
            decoration: BoxDecoration(
              color: HexColor('#F8FAF9'),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: HexColor('#E8ECE9')),
            ),
            child: TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              style: Blacks.regularBoldCodeNext.copyWith(fontSize: 18),
              decoration: InputDecoration(
                hintText: '1000',
                hintStyle: Grays.tinyPoppinsHint.copyWith(fontSize: 18),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 16,
                ),
                prefixIcon: Padding(
                  padding: const EdgeInsets.only(left: 16, right: 8),
                  child: Icon(
                    HugeIcons.strokeRoundedCalculator,
                    color: HexColor(AppColors.darkerGray2),
                    size: 20,
                  ),
                ),
                prefixIconConstraints: const BoxConstraints(minWidth: 44),
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Calculate button
          SizedBox(
            width: double.infinity,
            child: isLoading
                ? const Center(child: WaveDots())
                : ElevatedButton(
                    onPressed: onCalculate,
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
                        Icon(HugeIcons.strokeRoundedCalculator01, size: 18),
                        const SizedBox(width: 8),
                        const Text(
                          'CALCULATE COST',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

