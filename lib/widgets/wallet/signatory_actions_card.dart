import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

/// Card displaying a single wallet signatory with edit/remove actions
class SignatoryActionsCard extends StatelessWidget {
  final WalletSignatory signatory;
  final int walletId;
  final VoidCallback? onEdit;
  final VoidCallback? onRemoved;

  const SignatoryActionsCard({
    super.key,
    required this.signatory,
    required this.walletId,
    this.onEdit,
    this.onRemoved,
  });

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'active':
        return HexColor(AppColors.primaryGreen);
      case 'pending':
        return HexColor(AppColors.primaryOrange);
      case 'removed':
        return HexColor(AppColors.red);
      default:
        return Colors.grey;
    }
  }

  IconData _getRoleIcon(String role) {
    switch (role.toLowerCase()) {
      case 'admin':
        return HugeIcons.strokeRoundedUserStar01;
      case 'signatory':
        return HugeIcons.strokeRoundedUserCheck01;
      case 'viewer':
        return HugeIcons.strokeRoundedView;
      default:
        return HugeIcons.strokeRoundedUserCircle;
    }
  }

  void _showRemoveConfirmation(BuildContext context) {
    showAdaptiveDialog(
      context: context,
      builder: (dialogContext) => ConfirmAlert(
        text: 'Remove ${signatory.fullName} from this wallet?',
        pressed: () async {
          // Capture navigator and provider before any async operations
          final navigator = Navigator.of(dialogContext);
          final provider = Provider.of<SignatoryProvider>(dialogContext, listen: false);
          final signatoryName = signatory.fullName;

          navigator.pop(); // Close confirm dialog

          showAdaptiveDialog(
            context: navigator.context,
            barrierDismissible: false,
            builder: (ctx) => AiAnalysisAlert(
              icon: HugeIcons.strokeRoundedUserBlock01,
              action: 'Removing Signatory',
            ),
          );

          await provider.removeSignatory(walletId);

          navigator.pop(); // Pop loading

          if (provider.removeSuccess) {
            onRemoved?.call();
            _showResultDialogWithNavigator(
              navigator: navigator,
              success: true,
              title: 'Signatory Removed',
              message: '$signatoryName has been removed from this wallet.',
            );
          } else if (provider.removeError != null) {
            _showResultDialogWithNavigator(
              navigator: navigator,
              success: false,
              title: 'Remove Failed',
              message: provider.removeError!,
            );
          }
        },
      ),
    );
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

  PopupMenuItem<String> _buildMenuItem({
    required String value,
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return PopupMenuItem<String>(
      value: value,
      child: Row(
        children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(width: 12),
          Text(label, style: Blacks.smallestBolderPoppins.copyWith(color: color)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: HexColor('#F8FAF9'),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row with avatar and actions
          Row(
            children: [
              // Avatar with role icon
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: HexColor(AppColors.primaryGreen).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  _getRoleIcon(signatory.role),
                  color: HexColor(AppColors.primaryGreen),
                  size: 22,
                ),
              ),
              Spaces.smallSideSpace,
              // Name and role
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(signatory.fullName, style: Blacks.regularBoldCodeNext),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: _getStatusColor(signatory.status)
                                .withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            signatory.role.toUpperCase(),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: _getStatusColor(signatory.status),
                            ),
                          ),
                        ),
                        Spaces.tinySideSpace,
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: _getStatusColor(signatory.status)
                                .withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            signatory.status.toUpperCase(),
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w500,
                              color: _getStatusColor(signatory.status),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              // Action menu
              PopupMenuButton<String>(
                icon: Icon(
                  HugeIcons.strokeRoundedMoreVertical,
                  color: Colors.grey.shade600,
                  size: 20,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 4,
                onSelected: (value) {
                  switch (value) {
                    case 'edit':
                      onEdit?.call();
                      break;
                    case 'role':
                      RoleUpdateSheet.show(
                        context,
                        walletId: walletId,
                        signatory: signatory,
                        onSuccess: onRemoved, // Uses same refresh callback
                      );
                      break;
                    case 'remove':
                      _showRemoveConfirmation(context);
                      break;
                  }
                },
                itemBuilder: (context) => [
                  _buildMenuItem(
                    value: 'edit',
                    icon: HugeIcons.strokeRoundedUserEdit01,
                    label: 'Edit Details',
                    color: HexColor(AppColors.primaryGreen),
                  ),
                  _buildMenuItem(
                    value: 'role',
                    icon: HugeIcons.strokeRoundedUserSettings01,
                    label: 'Change Role',
                    color: HexColor(AppColors.primaryOrange),
                  ),
                  const PopupMenuDivider(),
                  _buildMenuItem(
                    value: 'remove',
                    icon: HugeIcons.strokeRoundedUserBlock01,
                    label: 'Remove',
                    color: HexColor(AppColors.red),
                  ),
                ],
              ),
            ],
          ),
          const Divider(height: 20),
          // Contact details
          _DetailRow(
            icon: HugeIcons.strokeRoundedCall,
            label: 'Phone',
            value: signatory.phoneNumber,
          ),
          const SizedBox(height: 6),
          _DetailRow(
            icon: HugeIcons.strokeRoundedMail01,
            label: 'Email',
            value: signatory.email ?? 'Not provided',
          ),
        ],
      ),
    );
  }
}


class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 14, color: Colors.grey.shade600),
        const SizedBox(width: 8),
        Text('$label: ', style: Grays.smallestPoppinsHint),
        Expanded(
          child: Text(
            value,
            style: Blacks.smallestBolderPoppins,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

