import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';

import '../../constants/constants.dart';

class SuccessAlert extends StatelessWidget {
  final IconData? icon;
  final String title;
  final String content;
  final void Function() tapped;
  final void Function()? altTap;
  final Animation<double> anim1;
  final String? buttonText;
  final String? altButtonText;
  final bool? isTwo;

  const SuccessAlert({
    super.key,
    this.icon,
    required this.title,
    required this.content,
    required this.tapped,
    this.altTap,
    required this.anim1,
    this.buttonText,
    this.altButtonText,
    this.isTwo = false,
  });

  @override
  Widget build(BuildContext context) {
    final isWarning = icon == Icons.warning_sharp || icon == Icons.warning;

    return SlideTransition(
      position: Tween(
        begin: const Offset(1, 0),
        end: const Offset(0, 0),
      ).animate(anim1),
      child: Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.symmetric(horizontal: 20),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(51),
                blurRadius: 30,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Icon Container
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isWarning
                      ? HexColor('#FFF3E0')
                      : HexColor('#E8F5E9'),
                ),
                child: Icon(
                  icon ?? HugeIcons.strokeRoundedCheckmarkCircle01,
                  color: isWarning
                      ? HexColor('#F57C00')
                      : HexColor(AppColors.primaryGreen),
                  size: 48,
                ),
              ),
              const SizedBox(height: 20),

              // Title
              Text(
                title,
                style: Blacks.mediumSemiPoppins.copyWith(fontSize: 18),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),

              // Content
              Text(
                content,
                style: Grays.regularPoppins.copyWith(fontSize: 14),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),

              // Buttons
              if (isTwo == true)
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: altTap,
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          side: BorderSide(
                            color: isWarning
                                ? HexColor('#F57C00')
                                : HexColor(AppColors.red),
                            width: 1.5,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Text(
                          altButtonText ?? 'Cancel',
                          style: TextStyle(
                            color: isWarning
                                ? HexColor('#F57C00')
                                : HexColor(AppColors.red),
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: tapped,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: isWarning
                              ? HexColor('#F57C00')
                              : HexColor(AppColors.primaryGreen),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 0,
                        ),
                        child: Text(
                          buttonText ?? 'Confirm',
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  ],
                )
              else
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: tapped,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: HexColor(AppColors.primaryGreen),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                    ),
                    child: Text(
                      buttonText ?? 'Done',
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
