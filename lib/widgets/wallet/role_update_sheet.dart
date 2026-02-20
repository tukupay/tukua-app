import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

/// Bottom sheet for updating signatory role only
class RoleUpdateSheet extends StatefulWidget {
  final int walletId;
  final WalletSignatory signatory;
  final VoidCallback? onSuccess;

  const RoleUpdateSheet({
    super.key,
    required this.walletId,
    required this.signatory,
    this.onSuccess,
  });

  /// Show the role update sheet
  static Future<void> show(
    BuildContext context, {
    required int walletId,
    required WalletSignatory signatory,
    VoidCallback? onSuccess,
  }) {
    return showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => RoleUpdateSheet(
        walletId: walletId,
        signatory: signatory,
        onSuccess: onSuccess,
      ),
    );
  }

  @override
  State<RoleUpdateSheet> createState() => _RoleUpdateSheetState();
}

class _RoleUpdateSheetState extends State<RoleUpdateSheet> {
  late String _selectedRole;

  final List<Map<String, dynamic>> _roles = [
    {
      'value': 'admin',
      'label': 'Admin',
      'icon': HugeIcons.strokeRoundedUserStar01,
      'description': 'Full access to manage wallet',
    },
    {
      'value': 'signatory',
      'label': 'Signatory',
      'icon': HugeIcons.strokeRoundedUserCheck01,
      'description': 'Can approve transactions',
    },
    {
      'value': 'viewer',
      'label': 'Viewer',
      'icon': HugeIcons.strokeRoundedView,
      'description': 'Can only view wallet details',
    },
  ];

  @override
  void initState() {
    super.initState();
    _selectedRole = widget.signatory.role.toLowerCase();
  }

  Future<void> _updateRole() async {
    if (_selectedRole == widget.signatory.role.toLowerCase()) {
      Navigator.pop(context);
      return;
    }

    // Capture values before popping (context becomes invalid after pop)
    final navigator = Navigator.of(context);
    final provider = Provider.of<SignatoryProvider>(context, listen: false);
    final signatoryName = widget.signatory.fullName;

    navigator.pop(); // Close sheet

    // Show loading
    showAdaptiveDialog(
      context: navigator.context,
      barrierDismissible: false,
      builder: (ctx) => AiAnalysisAlert(
        icon: HugeIcons.strokeRoundedUserSettings01,
        action: 'Updating Role',
      ),
    );

    await provider.updateRole(
      widget.walletId,
      widget.signatory.id,
      _selectedRole,
    );

    navigator.pop(); // Pop loading

    if (provider.updateResponse?.error == null) {
      widget.onSuccess?.call();
      _showResultDialogWithNavigator(
        navigator: navigator,
        success: true,
        title: 'Role Updated',
        message: '$signatoryName is now a ${_selectedRole.toUpperCase()}.',
      );
    } else {
      _showResultDialogWithNavigator(
        navigator: navigator,
        success: false,
        title: 'Update Failed',
        message: provider.updateResponse?.error ?? 'Something went wrong.',
      );
    }
  }

  void _showResultDialogWithNavigator({
    required NavigatorState navigator,
    required bool success,
    required String title,
    required String message,
  }) {
    showGeneralDialog(
      context: navigator.context,
      pageBuilder: (context, anim1, anim2) => const SizedBox(),
      transitionDuration: const Duration(milliseconds: 400),
      transitionBuilder: (context, anim1, anim2, child) {
        return SlideTransition(
          position: Tween(
            begin: const Offset(1, 0),
            end: const Offset(0, 0),
          ).animate(anim1),
          child: SuccessAlert(
            icon: success
                ? HugeIcons.strokeRoundedCheckmarkCircle01
                : HugeIcons.strokeRoundedAlertCircle,
            title: title,
            content: message,
            tapped: () => Navigator.pop(context),
            anim1: anim1,
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Spaces.mediumTopSpace,

            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: HexColor(AppColors.primaryGreen).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    HugeIcons.strokeRoundedUserSettings01,
                    color: HexColor(AppColors.primaryGreen),
                    size: 24,
                  ),
                ),
                Spaces.smallSideSpace,
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Update Role', style: Blacks.mediumSemiPoppins),
                      Text(
                        widget.signatory.fullName,
                        style: Grays.smallestPoppinsHint,
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Icon(
                    HugeIcons.strokeRoundedCancel01,
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
            ),
            Spaces.mediumTopSpace,

            // Role Options
            ...List.generate(_roles.length, (index) {
              final role = _roles[index];
              final isSelected = _selectedRole == role['value'];
              final isCurrent = widget.signatory.role.toLowerCase() == role['value'];

              return GestureDetector(
                onTap: () => setState(() => _selectedRole = role['value']),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? HexColor(AppColors.primaryGreen).withValues(alpha: 0.1)
                        : Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected
                          ? HexColor(AppColors.primaryGreen)
                          : Colors.grey.shade300,
                      width: isSelected ? 2 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? HexColor(AppColors.primaryGreen).withValues(alpha: 0.2)
                              : Colors.grey.shade200,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          role['icon'],
                          color: isSelected
                              ? HexColor(AppColors.primaryGreen)
                              : Colors.grey.shade600,
                          size: 20,
                        ),
                      ),
                      Spaces.smallSideSpace,
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  role['label'],
                                  style: isSelected
                                      ? Greens.regularSemiRoboto
                                      : Blacks.regularBoldCodeNext,
                                ),
                                if (isCurrent) ...[
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: HexColor(AppColors.primaryOrange)
                                          .withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      'CURRENT',
                                      style: TextStyle(
                                        fontSize: 9,
                                        fontWeight: FontWeight.w600,
                                        color: HexColor(AppColors.primaryOrange),
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                            Text(
                              role['description'],
                              style: Grays.smallestPoppinsHint,
                            ),
                          ],
                        ),
                      ),
                      if (isSelected)
                        Icon(
                          HugeIcons.strokeRoundedCheckmarkCircle02,
                          color: HexColor(AppColors.primaryGreen),
                          size: 22,
                        ),
                    ],
                  ),
                ),
              );
            }),

            Spaces.mediumTopSpace,

            // Update Button
            AuthButton(
              text: 'UPDATE ROLE',
              tapped: _updateRole,
            ),
            Spaces.smallTopSpace,
          ],
        ),
      ),
    );
  }
}

