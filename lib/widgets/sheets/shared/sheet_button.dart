import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/profile_provider.dart';

/// Unified sheet button with modern gradient design
class SheetButton extends StatelessWidget {
  final VoidCallback? tapped;
  final bool enabled;
  final String text;
  final bool hasIcon;
  final bool fullWidth;
  final bool checkKyc;

  const SheetButton({
    super.key,
    this.tapped,
    required this.enabled,
    required this.text,
    this.hasIcon = true,
    this.fullWidth = true,
    this.checkKyc = true,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer<ProfileProvider>(
      builder: (_, profile, __) {
        return GestureDetector(
          onTap: () {
            if (checkKyc && profile.user?.profileImg == null) {
              Fluttertoast.showToast(msg: Strings.finishKycHint);
              return;
            }
            if (enabled && tapped != null) tapped!();
          },
          child: Container(
            width: fullWidth ? double.infinity : null,
            padding: EdgeInsets.symmetric(
              vertical: 16,
              horizontal: fullWidth ? 0 : 32,
            ),
            decoration: BoxDecoration(
              gradient: enabled ? _gradient : null,
              color: enabled ? null : HexColor('#E8ECE9'),
              borderRadius: BorderRadius.circular(14),
              boxShadow: enabled ? [_shadow] : null,
            ),
            child: Row(
              mainAxisSize: fullWidth ? MainAxisSize.max : MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  text,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: enabled ? Colors.white : Colors.grey,
                  ),
                ),
                if (hasIcon) ...[
                  const SizedBox(width: 8),
                  Icon(
                    HugeIcons.strokeRoundedArrowRight01,
                    color: enabled ? Colors.white : Colors.grey,
                    size: 20,
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  LinearGradient get _gradient => LinearGradient(
        colors: [
          HexColor(AppColors.primaryGreen),
          HexColor(AppColors.fadedGreen),
        ],
      );

  BoxShadow get _shadow => BoxShadow(
        color: HexColor(AppColors.primaryGreen).withAlpha(40),
        blurRadius: 12,
        offset: const Offset(0, 4),
      );
}
