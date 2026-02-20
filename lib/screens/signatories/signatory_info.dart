import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../constants/constants.dart';
import '../../providers/providers.dart';
import '../../widgets/widget.dart';

/// Detailed view for a signatory request (for approval or invitation)
class SignatoryInfo extends StatelessWidget {
  const SignatoryInfo({super.key});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Consumer<SignatoryProvider>(
      builder: (_, signatoryProvider, __) {
    final request = signatoryProvider.selectedRequest;
    final bool isHistory = signatoryProvider.isSelectedHistory;
    final String? historyStatus = signatoryProvider.selectedHistoryStatus;
    final bool isInvitation = request?['type'] == 'invitation' || (request?['role'] != null && request?['amount'] == null);
    final bool isPending = !isHistory;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.arrow_back, color: Colors.black),
        ),
        title: Text(
          isInvitation ? 'Invitation Details' : 'Approval Request',
          style: Blacks.regularBoldCodeNext,
        ),
        centerTitle: true,
        actions: [
          NotificationsBell(),
          Spaces.smallSideSpace,
        ],
      ),
      body: Container(
        height: size.height,
        width: size.width,
        decoration: BoxDecoration(
          image: DecorationImage(
            image: AssetImage(Strings.imageAsset('bg.png')),
            fit: BoxFit.cover,
          ),
        ),
        child: SingleChildScrollView(
          padding: Paddings.smallAllSides,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Request Type Card
              _buildRequestTypeCard(isInvitation, isHistory: isHistory, historyStatus: historyStatus),
              Spaces.mediumTopSpace,

              // Request Details
              _buildDetailsCard(request),
              Spaces.mediumTopSpace,

              // Wallet Info
              _buildWalletInfoCard(request),
              Spaces.mediumTopSpace,

              // Requester Info
              _buildRequesterCard(request),
              Spaces.mediumTopSpace,

              // Action Buttons (only if pending, not already approved/rejected)
              if (isPending && historyStatus != 'approved' && historyStatus != 'rejected')
                _buildActionButtons(context, isInvitation),
            ],
          ),
        ),
      ),
    );
      },
    );
  }

  Widget _buildRequestTypeCard(bool isInvitation, {bool isHistory = false, String? historyStatus}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            HexColor(AppColors.primaryGreen),
            HexColor(AppColors.fadedGreen),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppShadows.greenMedium,
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(50),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              isInvitation
                  ? HugeIcons.strokeRoundedUserAdd01
                  : HugeIcons.strokeRoundedExchange01,
              color: Colors.white,
              size: 28,
            ),
          ),
          Spaces.smallSideSpace,
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isInvitation ? 'Signatory Invitation' : 'Transaction Approval',
                  style: Whites.smallBoldRoboto,
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.white.withAlpha(50),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    isHistory ? (historyStatus?.toUpperCase() ?? 'PROCESSED') : 'PENDING',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailsCard(Map<String, dynamic>? request) {
    final role = request?['role'] ?? 'Signatory';
    final requestedAt = request?['requested_at'] ?? request?['invited_at'] ?? DateTime.now();
    final amount = request?['amount'];
    final type = request?['type'];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: GlassMorphism.standard(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                HugeIcons.strokeRoundedFile02,
                size: 18,
                color: HexColor(AppColors.primaryGreen),
              ),
              const SizedBox(width: 8),
              Text('Request Details', style: Blacks.smallestBolderPoppins),
            ],
          ),
          Spaces.smallTopSpace,
          Container(
            height: 1,
            color: HexColor(AppColors.lightestGray),
          ),
          Spaces.smallTopSpace,
          if (type != null && type != 'invitation')
            _buildDetailRow('Type', type.toString().toUpperCase()),
          if (amount != null)
            _buildDetailRow('Amount', 'KSH ${formatThousands(amount: (amount as num).toDouble())}'),
          _buildDetailRow('Role', role.toString()),
          _buildDetailRow('Permissions', 'Can approve transactions'),
          _buildDetailRow('Requested', DateFormat('MMM dd, yyyy • HH:mm').format(requestedAt)),
          _buildDetailRow('Expires', DateFormat('MMM dd, yyyy').format((requestedAt as DateTime).add(const Duration(days: 7)))),
        ],
      ),
    );
  }

  Widget _buildWalletInfoCard(Map<String, dynamic>? request) {
    final walletName = request?['wallet_name'] ?? 'Wallet';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: GlassMorphism.standard(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                HugeIcons.strokeRoundedWallet01,
                size: 18,
                color: HexColor(AppColors.primaryGreen),
              ),
              const SizedBox(width: 8),
              Text('Wallet Information', style: Blacks.smallestBolderPoppins),
            ],
          ),
          Spaces.smallTopSpace,
          Container(
            height: 1,
            color: HexColor(AppColors.lightestGray),
          ),
          Spaces.smallTopSpace,
          _buildDetailRow('Wallet Name', walletName),
          _buildDetailRow('Wallet Type', 'Joint Account'),
          _buildDetailRow('Current Signatories', '2 members'),
        ],
      ),
    );
  }

  Widget _buildRequesterCard(Map<String, dynamic>? request) {
    final requester = request?['requested_by'] ?? request?['invited_by'] ?? 'Unknown';
    final initials = requester.split(' ').map((n) => n.isNotEmpty ? n[0] : '').take(2).join().toUpperCase();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: GlassMorphism.standard(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                HugeIcons.strokeRoundedUser,
                size: 18,
                color: HexColor(AppColors.primaryGreen),
              ),
              const SizedBox(width: 8),
              Text('Requested By', style: Blacks.smallestBolderPoppins),
            ],
          ),
          Spaces.smallTopSpace,
          Container(
            height: 1,
            color: HexColor(AppColors.lightestGray),
          ),
          Spaces.smallTopSpace,
          Row(
            children: [
              Container(
                height: 50,
                width: 50,
                decoration: BoxDecoration(
                  color: HexColor(AppColors.lightFadedGreen),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    initials,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: HexColor(AppColors.primaryGreen),
                    ),
                  ),
                ),
              ),
              Spaces.smallSideSpace,
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(requester, style: Blacks.smallestBolderPoppins),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Grays.smallestPoppinsHint),
          Text(value, style: Blacks.smallestBolderPoppins),
        ],
      ),
    );
  }

  Widget _buildActionButtons(BuildContext context, bool isInvitation) {
    return Column(
      children: [
        // Decline/Reject button
        GestureDetector(
          onTap: () {
            // TODO: Handle decline/reject
            Navigator.pop(context);
          },
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 14),
            decoration: BoxDecoration(
              color: HexColor(AppColors.red).withAlpha(25),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: HexColor(AppColors.red).withAlpha(50)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  HugeIcons.strokeRoundedCancel01,
                  color: HexColor(AppColors.red),
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  isInvitation ? 'Decline Invitation' : 'Reject Request',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: HexColor(AppColors.red),
                  ),
                ),
              ],
            ),
          ),
        ),
        Spaces.smallTopSpace,
        // Accept/Approve button
        GestureDetector(
          onTap: () {
            // TODO: Handle accept/approve
            Navigator.pop(context);
          },
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 14),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  HexColor(AppColors.primaryGreen),
                  HexColor(AppColors.fadedGreen),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(12),
              boxShadow: AppShadows.greenLight,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  HugeIcons.strokeRoundedCheckmarkCircle01,
                  color: Colors.white,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  isInvitation ? 'Accept Invitation' : 'Approve Request',
                  style: Whites.smallBoldRoboto,
                ),
              ],
            ),
          ),
        ),
        Spaces.mediumTopSpace,
      ],
    );
  }
}
