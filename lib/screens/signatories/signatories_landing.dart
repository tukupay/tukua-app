import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import '../../widgets/widget.dart';

/// Main signatories landing page with tabs for managing signatory requests
class SignatoriesLanding extends StatefulWidget {
  const SignatoriesLanding({super.key});

  @override
  State<SignatoriesLanding> createState() => _SignatoriesLandingState();
}

class _SignatoriesLandingState extends State<SignatoriesLanding>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text('Signatories', style: Blacks.regularBoldCodeNext),
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
        child: Column(
          children: [
            Spaces.smallTopSpace,
            // Tab Bar
            Container(
              margin: Paddings.smallHorizontal,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: AppShadows.light,
              ),
              child: TabBar(
                controller: _tabController,
                labelColor: HexColor(AppColors.primaryGreen),
                unselectedLabelColor: Colors.grey.shade600,
                indicatorSize: TabBarIndicatorSize.label,
                indicator: UnderlineTabIndicator(
                  borderSide: BorderSide(
                    color: HexColor(AppColors.primaryGreen),
                    width: 2.5,
                  ),
                  insets: const EdgeInsets.symmetric(horizontal: 16),
                ),
                labelStyle: Blacks.smallestBolderPoppins,
                unselectedLabelStyle: Grays.smallestPoppinsHint,
                tabs: const [
                  Tab(text: 'Pending'),
                  Tab(text: 'Invitations'),
                  Tab(text: 'History'),
                ],
              ),
            ),
            Spaces.smallTopSpace,
            // Tab Content
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  // Pending Requests (Transactions to approve)
                  _PendingRequestsTab(),
                  // Invitations (Accept/Reject to be signatory)
                  _InvitationsTab(),
                  // History
                  _HistoryTab(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Tab for pending transaction approvals
class _PendingRequestsTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<SignatoryProvider>(
      builder: (_, signatory, __) {
        final pendingRequests = signatory.pendingRequests;

        if (pendingRequests.isEmpty) {
          return _buildEmptyState(
            icon: HugeIcons.strokeRoundedCheckList,
            title: 'No Pending Requests',
            subtitle: 'Transaction requests requiring your approval will appear here',
          );
        }

        return ListView.builder(
          padding: Paddings.smallAllSides,
          itemCount: pendingRequests.length,
          itemBuilder: (context, index) {
            final request = pendingRequests[index];
            return SignatoryRequestCard(
              type: SignatoryRequestType.transactionApproval,
              walletName: request['wallet_name'],
              transactionType: request['type'],
              amount: request['amount'],
              requestedBy: request['requested_by'],
              requestedAt: request['requested_at'],
              onApprove: () {
                // TODO: Approve transaction
              },
              onReject: () {
                // TODO: Reject transaction
              },
            );
          },
        );
      },
    );
  }
}

/// Tab for signatory invitations
class _InvitationsTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<SignatoryProvider>(
      builder: (_, signatory, __) {
        final invitations = signatory.pendingInvitations;

        if (invitations.isEmpty) {
          return _buildEmptyState(
            icon: HugeIcons.strokeRoundedMailOpen01,
            title: 'No Invitations',
            subtitle: 'When someone invites you to be a wallet signatory, it will appear here',
          );
        }

        return ListView.builder(
          padding: Paddings.smallAllSides,
          itemCount: invitations.length,
          itemBuilder: (context, index) {
            final invitation = invitations[index];
            return SignatoryRequestCard(
              type: SignatoryRequestType.signatoryInvitation,
              walletName: invitation['wallet_name'],
              role: invitation['role'],
              requestedBy: invitation['invited_by'],
              requestedAt: invitation['invited_at'],
              onApprove: () {
                // TODO: Accept invitation
              },
              onReject: () {
                // TODO: Decline invitation
              },
            );
          },
        );
      },
    );
  }
}

/// Tab for history of approved/rejected requests
class _HistoryTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<SignatoryProvider>(
      builder: (_, signatory, __) {
        final historyItems = signatory.history;

        if (historyItems.isEmpty) {
          return _buildEmptyState(
            icon: HugeIcons.strokeRoundedClock02,
            title: 'No History',
            subtitle: 'Your approved and rejected requests will appear here',
          );
        }

        return ListView.builder(
          padding: Paddings.smallAllSides,
          itemCount: historyItems.length,
          itemBuilder: (context, index) {
            final item = historyItems[index];
            final isApproved = item['status'] == 'approved';

            return SignatoryRequestCard(
              type: item['type'] == 'invitation'
                  ? SignatoryRequestType.signatoryInvitation
                  : SignatoryRequestType.transactionApproval,
              walletName: item['wallet_name'],
              transactionType: item['type'] == 'invitation' ? null : item['type'],
              amount: item['amount'],
              role: item['role'],
              requestedBy: item['requested_by'],
              requestedAt: item['processed_at'],
              isHistory: true,
              historyStatus: isApproved ? 'approved' : 'rejected',
            );
          },
        );
      },
    );
  }
}

Widget _buildEmptyState({
  required IconData icon,
  required String title,
  required String subtitle,
}) {
  return Center(
    child: Padding(
      padding: Paddings.smallAllSides,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: HexColor(AppColors.lightFadedGreen),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              size: 48,
              color: HexColor(AppColors.primaryGreen),
            ),
          ),
          Spaces.mediumTopSpace,
          Text(title, style: Blacks.regularBoldCodeNext),
          Spaces.smallTopSpace,
          Text(
            subtitle,
            style: Grays.smallestPoppinsHint,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    ),
  );
}
