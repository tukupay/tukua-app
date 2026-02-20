import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../../constants/constants.dart';
import '../../../models/models.dart';

/// Unified method selection card used across all bottom sheets
class MethodCard extends StatelessWidget {
  final PaymentMethod method;
  final bool isSelected;
  final VoidCallback onTap;
  final IconData? fallbackIcon;

  const MethodCard({
    super.key,
    required this.method,
    required this.isSelected,
    required this.onTap,
    this.fallbackIcon,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: isSelected ? _selectedGradient : null,
          color: isSelected ? null : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected
                ? HexColor(AppColors.primaryGreen)
                : HexColor('#E8ECE9'),
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected ? [_selectedShadow] : null,
        ),
        child: Row(
          children: [
            _buildIcon(),
            const SizedBox(width: 14),
            _buildInfo(),
            _buildIndicator(),
          ],
        ),
      ),
    );
  }

  Widget _buildIcon() {
    return Container(
      height: 48,
      width: 48,
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: isSelected
            ? HexColor(AppColors.primaryGreen).withAlpha(20)
            : HexColor('#F5F7F6'),
        borderRadius: BorderRadius.circular(12),
      ),
      child: method.iconUrl != null
          ? Image.network(
              method.iconUrl!,
              fit: BoxFit.contain,
              errorBuilder: (_, __, ___) => _fallbackIconWidget,
            )
          : _fallbackIconWidget,
    );
  }

  Widget get _fallbackIconWidget => Icon(
        fallbackIcon ?? HugeIcons.strokeRoundedCreditCard,
        color: HexColor(AppColors.primaryGreen),
        size: 24,
      );

  Widget _buildInfo() {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            method.name,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: isSelected
                  ? HexColor(AppColors.primaryGreen)
                  : Colors.black87,
            ),
          ),
          if (method.description != null) ...[
            const SizedBox(height: 2),
            Text(
              method.description!,
              style: Grays.tinyPoppinsHint,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildIndicator() {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      height: 24,
      width: 24,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: isSelected ? HexColor(AppColors.primaryGreen) : Colors.transparent,
        border: Border.all(
          color: isSelected
              ? HexColor(AppColors.primaryGreen)
              : HexColor('#D0D5D1'),
          width: 2,
        ),
      ),
      child: isSelected
          ? const Icon(Icons.check, color: Colors.white, size: 16)
          : null,
    );
  }

  LinearGradient get _selectedGradient => LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          HexColor(AppColors.primaryGreen).withAlpha(15),
          HexColor(AppColors.primaryGreen).withAlpha(8),
        ],
      );

  BoxShadow get _selectedShadow => BoxShadow(
        color: HexColor(AppColors.primaryGreen).withAlpha(20),
        blurRadius: 8,
        offset: const Offset(0, 2),
      );
}

