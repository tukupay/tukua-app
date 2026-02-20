import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';

/// Types of signatory requests
enum SignatoryRequestType {
  transactionApproval,
  signatoryInvitation,
}

/// Card for displaying signatory requests (approvals or invitations)
class SignatoryRequestCard extends StatelessWidget {
  final SignatoryRequestType type;
  final String walletName;
  final String? transactionType;
  final double? amount;
  final String? role;
  final String requestedBy;
  final DateTime requestedAt;
  final VoidCallback? onApprove;
  final VoidCallback? onReject;
  final bool isHistory;
  final String? historyStatus;

  const SignatoryRequestCard({
    super.key,
    required this.type,
    required this.walletName,
    this.transactionType,
    this.amount,
    this.role,
    required this.requestedBy,
    required this.requestedAt,
    this.onApprove,
    this.onReject,
    this.isHistory = false,
    this.historyStatus,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Provider.of<SignatoryProvider>(context, listen: false).selectRequest(
          {
            'wallet_name': walletName,
            'type': type == SignatoryRequestType.transactionApproval ? transactionType : 'invitation',
            'amount': amount,
            'role': role,
            'requested_by': requestedBy,
            'requested_at': requestedAt,
          },
          isHistory: isHistory,
          historyStatus: historyStatus,
        );
        Navigator.pushNamed(context, Routes.signatoryInfo);
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: GlassMorphism.standard(
          borderRadius: (16),
          borderColor: isHistory
              ? (historyStatus == 'approved'
              ? HexColor(AppColors.primaryGreen).withAlpha(50)
              : HexColor(AppColors.red).withAlpha(50))
              : HexColor(AppColors.lightGray),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header row
            Row(
              children: [
                // Icon
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: _getIconBackgroundColor(),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    _getIcon(),
                    color: _getIconColor(),
                    size: 22,
                  ),
                ),
                Spaces.smallSideSpace,
                // Title & Subtitle
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _getTitle(),
                        style: Blacks.smallestBolderPoppins,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        walletName,
                        style: Grays.smallestPoppinsHint,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                // Status or Amount
                if (isHistory)
                  _buildStatusBadge()
                else if (amount != null)
                  _buildAmountBadge(),
              ],
            ),
            Spaces.smallTopSpace,
            // Divider
            Container(
              height: 1,
              color: HexColor(AppColors.lightestGray),
            ),
            Spaces.smallTopSpace,
            // Details row
            Row(
              children: [
                // Requested by
                Expanded(
                  child: _buildDetailItem(
                    icon: HugeIcons.strokeRoundedUser,
                    label: 'From',
                    value: requestedBy,
                  ),
                ),
                // Role (for invitations)
                if (type == SignatoryRequestType.signatoryInvitation && role != null)
                  Expanded(
                    child: _buildDetailItem(
                      icon: HugeIcons.strokeRoundedUserSettings01,
                      label: 'Role',
                      value: _capitalizeFirst(role!),
                    ),
                  ),
                // Transaction type (for approvals)
                if (type == SignatoryRequestType.transactionApproval && transactionType != null)
                  Expanded(
                    child: _buildDetailItem(
                      icon: HugeIcons.strokeRoundedExchange01,
                      label: 'Type',
                      value: _capitalizeFirst(transactionType!),
                    ),
                  ),
                // Time
                _buildDetailItem(
                  icon: HugeIcons.strokeRoundedClock02,
                  label: 'Time',
                  value: _formatTime(requestedAt),
                ),
              ],
            ),
            // Action buttons (only if not history)
            if (!isHistory) ...[
              Spaces.smallTopSpace,
              Row(
                children: [
                  // Reject button
                  Expanded(
                    child: _ActionButton(
                      label: type == SignatoryRequestType.signatoryInvitation
                          ? 'Decline'
                          : 'Reject',
                      icon: HugeIcons.strokeRoundedCancel01,
                      isNegative: true,
                      onTap: onReject,
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Approve button
                  Expanded(
                    child: _ActionButton(
                      label: type == SignatoryRequestType.signatoryInvitation
                          ? 'Accept'
                          : 'Approve',
                      icon: HugeIcons.strokeRoundedCheckmarkCircle01,
                      isNegative: false,
                      onTap: onApprove,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _getTitle() {
    if (type == SignatoryRequestType.signatoryInvitation) {
      return 'Signatory Invitation';
    } else {
      return 'Transaction Approval';
    }
  }

  IconData _getIcon() {
    if (type == SignatoryRequestType.signatoryInvitation) {
      return HugeIcons.strokeRoundedUserAdd01;
    } else {
      return HugeIcons.strokeRoundedExchange01;
    }
  }

  Color _getIconColor() {
    if (isHistory) {
      return historyStatus == 'approved'
          ? HexColor(AppColors.primaryGreen)
          : HexColor(AppColors.red);
    }
    return HexColor(AppColors.primaryGreen);
  }

  Color _getIconBackgroundColor() {
    if (isHistory) {
      return historyStatus == 'approved'
          ? HexColor(AppColors.lightFadedGreen)
          : HexColor(AppColors.red).withAlpha(25);
    }
    return HexColor(AppColors.lightFadedGreen);
  }

  Widget _buildStatusBadge() {
    final isApproved = historyStatus == 'approved';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: isApproved
            ? HexColor(AppColors.lightFadedGreen)
            : HexColor(AppColors.red).withAlpha(25),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isApproved
                ? HugeIcons.strokeRoundedCheckmarkCircle01
                : HugeIcons.strokeRoundedCancel01,
            size: 14,
            color: isApproved ? HexColor(AppColors.primaryGreen) : HexColor(AppColors.red),
          ),
          const SizedBox(width: 4),
          Text(
            _capitalizeFirst(historyStatus ?? ''),
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: isApproved ? HexColor(AppColors.primaryGreen) : HexColor(AppColors.red),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAmountBadge() {
    final formatter = NumberFormat('#,##0', 'en_US');
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: HexColor(AppColors.fadedOrange),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        'KES ${formatter.format(amount)}',
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: HexColor(AppColors.primaryOrange),
        ),
      ),
    );
  }

  Widget _buildDetailItem({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: Colors.grey.shade500),
        const SizedBox(width: 4),
        Flexible(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 9,
                  color: Colors.grey.shade500,
                ),
              ),
              Text(
                value,
                style: Blacks.tinyRubik,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _capitalizeFirst(String text) {
    if (text.isEmpty) return text;
    return text[0].toUpperCase() + text.substring(1).toLowerCase();
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }
}

/// Action button for approve/reject
class _ActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isNegative;
  final VoidCallback? onTap;

  const _ActionButton({
    required this.label,
    required this.icon,
    required this.isNegative,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = isNegative ? HexColor(AppColors.red) : HexColor(AppColors.primaryGreen);
    final bgColor = isNegative
        ? HexColor(AppColors.red).withAlpha(25)
        : HexColor(AppColors.lightFadedGreen);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withAlpha(50)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}


