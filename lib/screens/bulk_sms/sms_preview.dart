import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/widget.dart';
import '../../models/models.dart';

class SmsPreview extends StatefulWidget {
  const SmsPreview({super.key});

  @override
  State<SmsPreview> createState() => _SmsPreviewState();
}

class _SmsPreviewState extends State<SmsPreview> {
  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Scaffold(
      backgroundColor: HexColor('#F8FAF9'),
      body: Consumer6<ProfileProvider, SenderIdsProvider, BulkSmsProvider,
          CreditsProvider, SmsProvider, PaymentsProvider>(
        builder: (_, profileProvider, senderIdsProvider, bulkSmsProvider,
            creditProvider, smsProvider, payments, __) {
          // Show loading state
          if (smsProvider.sendingSms) {
            return Center(
              child: Container(
                padding: Paddings.smallAllSides,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withAlpha(15),
                      blurRadius: 20,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const WaveDots(),
                    Spaces.smallTopSpace,
                    Text('Sending SMS...', style: Grays.regularSemiInter),
                  ],
                ),
              ),
            );
          }

          return Container(
            height: size.height,
            width: size.width,
            decoration: BoxDecoration(
              image: DecorationImage(
                image: AssetImage(Strings.imageAsset('bg.png')),
                fit: BoxFit.cover,
              ),
            ),
            child: CustomScrollView(
              slivers: [
                // Modern AppBar
                SliverAppBar(
                  expandedHeight: 160,
                  floating: false,
                  pinned: true,
                  backgroundColor: HexColor(AppColors.primaryGreen),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  iconTheme: const IconThemeData(color: Colors.white),
                  flexibleSpace: FlexibleSpaceBar(
                    titlePadding: const EdgeInsets.only(left: 60, bottom: 16),
                    title: Text(
                      'SMS Preview',
                      style: Whites.mediumBoldRoboto,
                    ),
                    background: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            HexColor(AppColors.primaryGreen),
                            HexColor(AppColors.primaryGreen)
                                .withValues(alpha: 0.8),
                          ],
                        ),
                      ),
                      child: Stack(
                        children: [
                          Positioned(
                            right: -50,
                            top: -50,
                            child: Container(
                              width: 200,
                              height: 200,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white.withValues(alpha: 0.1),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  actions: [
                    IconButton(
                      onPressed: () {
                        Navigator.pushNamed(context, Routes.smsHistory);
                      },
                      icon: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(
                          HugeIcons.strokeRoundedClock01,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                    ),
                    Spaces.smallSideSpace,
                  ],
                ),

                // Content
                SliverToBoxAdapter(
                  child: Padding(
                    padding: Paddings.smallHorizontal,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Spaces.smallTopSpace,

                        // SMS Overview Card
                        SmsOverview(),

                        Spaces.mediumTopSpace,

                        // Sender Info Card
                        _buildInfoCard(
                          icon: HugeIcons.strokeRoundedUser,
                          title: 'Sender Information',
                          child: Column(
                            children: [
                              _buildDetailRow(
                                'Name',
                                profileProvider.user?.type ==
                                        Strings.individualAcc
                                    ? '${profileProvider.user?.firstName} ${profileProvider.user?.lastName ?? profileProvider.user?.middleName}'
                                    : profileProvider.user?.businessName ??
                                        'Not Found',
                                HugeIcons.strokeRoundedUserCircle,
                              ),
                              const SizedBox(height: 12),
                              _buildDetailRow(
                                'Phone',
                                profileProvider.user?.phoneNumber ??
                                    'User Phone',
                                HugeIcons.strokeRoundedCall,
                              ),
                            ],
                          ),
                        ),

                        Spaces.mediumTopSpace,

                        // Recipients Card
                        _buildInfoCard(
                          icon: HugeIcons.strokeRoundedUserMultiple,
                          title: 'Recipients',
                          child: Column(
                            children: [
                              // For local sender, show all phone numbers from groups
                              if (bulkSmsProvider.selectedSenderId == Strings.localSenderId &&
                                  bulkSmsProvider.groupPhoneNumbers.isNotEmpty)
                                ...[
                                  _buildDetailRow(
                                    'From Groups',
                                    bulkSmsProvider.groupPhoneNumbers.length.toString(),
                                    HugeIcons.strokeRoundedUserGroup,
                                  ),
                                  const SizedBox(height: 12),
                                  Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: HexColor(AppColors.primaryGreen)
                                          .withValues(alpha: 0.05),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(
                                        color: HexColor(AppColors.primaryGreen)
                                            .withValues(alpha: 0.2),
                                      ),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Phone Numbers from Groups:',
                                          style: Grays.smallRoboto.copyWith(
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        Container(
                                          constraints: const BoxConstraints(maxHeight: 150),
                                          child: SingleChildScrollView(
                                            child: Wrap(
                                              spacing: 8,
                                              runSpacing: 8,
                                              children: bulkSmsProvider.groupPhoneNumbers
                                                  .map((phone) => Container(
                                                        padding: const EdgeInsets.symmetric(
                                                          horizontal: 8,
                                                          vertical: 4,
                                                        ),
                                                        decoration: BoxDecoration(
                                                          color: Colors.white,
                                                          borderRadius:
                                                              BorderRadius.circular(4),
                                                          border: Border.all(
                                                            color: HexColor(
                                                                    AppColors.primaryGreen)
                                                                .withValues(alpha: 0.3),
                                                          ),
                                                        ),
                                                        child: Text(
                                                          phone,
                                                          style: Grays.smallRoboto,
                                                        ),
                                                      ))
                                                  .toList(),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ]
                              // For API sender, show group count as before
                              else if (bulkSmsProvider.selectedGroups.isNotEmpty)
                                _buildDetailRow(
                                  'Groups',
                                  bulkSmsProvider.selectedGroups.length
                                      .toString(),
                                  HugeIcons.strokeRoundedUserGroup,
                                ),
                              if (bulkSmsProvider.selectedContacts.isNotEmpty)
                                ...[
                                  if (bulkSmsProvider.selectedSenderId == Strings.localSenderId &&
                                      bulkSmsProvider.groupPhoneNumbers.isNotEmpty)
                                    const SizedBox(height: 12),
                                  _buildDetailRow(
                                    'Contacts',
                                    bulkSmsProvider.selectedContacts.length
                                        .toString(),
                                    HugeIcons.strokeRoundedUser,
                                  ),
                                ],
                            ],
                          ),
                        ),

                        Spaces.mediumTopSpace,

                        // SMS Credits & Cost Card (only for API sending)
                        if (bulkSmsProvider.selectedSenderId != Strings.localSenderId)
                          _buildInfoCard(
                            icon: HugeIcons.strokeRoundedDollarCircle,
                            title: 'SMS Credits & Cost',
                            child: creditProvider.creditBalance?.smsBalance ==
                                        null ||
                                    creditProvider.creditBalance!.smsBalance == 0
                                ? Column(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(16),
                                        decoration: BoxDecoration(
                                          color: HexColor(AppColors.red)
                                              .withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(
                                            color: HexColor(AppColors.red)
                                                .withValues(alpha: 0.3),
                                          ),
                                        ),
                                        child: Row(
                                          children: [
                                            Icon(
                                              HugeIcons
                                                  .strokeRoundedAlertCircle,
                                              color: HexColor(AppColors.red),
                                              size: 24,
                                            ),
                                            Spaces.smallSideSpace,
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    'Insufficient Balance',
                                                    style: TextStyle(
                                                      color: HexColor(
                                                          AppColors.red),
                                                      fontWeight: FontWeight.w600,
                                                      fontSize: 14,
                                                    ),
                                                  ),
                                                  Text(
                                                    'Available: ${creditProvider.creditBalance?.smsBalance ?? 0} SMS',
                                                    style: Grays.smallRoboto,
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Spaces.smallTopSpace,
                                      SizedBox(
                                        width: double.infinity,
                                        child: ElevatedButton(
                                          onPressed: () {
                                            Provider.of<PaymentsProvider>(
                                                    context,
                                                    listen: false)
                                                .selectType(payments
                                                    .transactionTypes
                                                    .firstWhere((el) =>
                                                        el.type ==
                                                        Strings
                                                            .smsCreditsPurchase));
                                            Navigator.pushNamed(
                                                context, Routes.smsTopUp);
                                          },
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor:
                                                HexColor(AppColors.primaryGreen),
                                            foregroundColor: Colors.white,
                                            padding: const EdgeInsets.symmetric(
                                                vertical: 12),
                                            shape: RoundedRectangleBorder(
                                              borderRadius:
                                                  BorderRadius.circular(10),
                                            ),
                                          ),
                                          child: Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.center,
                                            children: [
                                              const Icon(
                                                  HugeIcons.strokeRoundedAdd01,
                                                  size: 18),
                                              const SizedBox(width: 8),
                                              Text(
                                                'Top Up Now',
                                                style: Whites.regularSemiRoboto,
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ],
                                  )
                                : Column(
                                    children: [
                                      _buildCostRow(
                                        'Balance',
                                        '${creditProvider.creditBalance?.smsBalance ?? 0} SMS',
                                        HugeIcons.strokeRoundedWallet03,
                                      ),
                                      const SizedBox(height: 12),
                                      _buildCostRow(
                                        'Cost',
                                        '${bulkSmsProvider.recipientCount} SMS',
                                        HugeIcons.strokeRoundedMoneySend01,
                                      ),
                                      const SizedBox(height: 12),
                                      Container(
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(
                                          color: HexColor(AppColors.primaryGreen)
                                              .withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(
                                            color:
                                                HexColor(AppColors.primaryGreen)
                                                    .withValues(alpha: 0.3),
                                          ),
                                        ),
                                        child: Row(
                                          children: [
                                            Icon(
                                              HugeIcons
                                                  .strokeRoundedCheckmarkCircle02,
                                              color: HexColor(
                                                  AppColors.primaryGreen),
                                              size: 20,
                                            ),
                                            Spaces.smallSideSpace,
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    'Remaining Balance',
                                                    style: Grays.smallRoboto,
                                                  ),
                                                  Text(
                                                    '${creditProvider.creditBalance!.smsBalance! - bulkSmsProvider.recipientCount} SMS',
                                                    style: Greens
                                                        .regularBoldCodeNext,
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                          ),

                        // Local SIM Airtime Notice (only for local sending)
                        if (bulkSmsProvider.selectedSenderId == Strings.localSenderId)
                          _buildInfoCard(
                            icon: Icons.sim_card_outlined,
                            title: 'SIM Card Airtime',
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: HexColor(AppColors.primaryOrange)
                                    .withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: HexColor(AppColors.primaryOrange)
                                      .withValues(alpha: 0.3),
                                ),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Icon(
                                    HugeIcons.strokeRoundedInformationCircle,
                                    color: HexColor(AppColors.primaryOrange),
                                    size: 24,
                                  ),
                                  Spaces.smallSideSpace,
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Airtime Charges Apply',
                                          style: TextStyle(
                                            color: HexColor(AppColors.primaryOrange),
                                            fontWeight: FontWeight.w600,
                                            fontSize: 14,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Builder(
                                          builder: (context) {
                                            // Calculate total recipients for local SMS
                                            int totalRecipients =
                                                bulkSmsProvider.groupPhoneNumbers.length +
                                                bulkSmsProvider.selectedContacts.length;
                                            return Text(
                                              'Your SIM card airtime will be used to send $totalRecipients SMS message${totalRecipients != 1 ? 's' : ''}. Standard network charges apply.',
                                              style: Grays.smallRoboto,
                                            );
                                          }
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),

                        Spaces.mediumTopSpace,

                        if (bulkSmsProvider.selectedSenderId == Strings.localSenderId)
                          Spaces.mediumTopSpace,

                        Spaces.largeTopSpace,
                        const SizedBox(height: 80), // Space for bottom buttons
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
      bottomNavigationBar: Consumer6<ProfileProvider, SenderIdsProvider,
          BulkSmsProvider, CreditsProvider, SmsProvider, PaymentsProvider>(
        builder: (_, profileProvider, senderIdsProvider, bulkSmsProvider,
            creditProvider, smsProvider, payments, __) {
          return Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha(15),
                  blurRadius: 10,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  // Edit Button
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: HexColor(AppColors.primaryOrange),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: BorderSide(
                            color: HexColor(AppColors.primaryOrange),
                            width: 2,
                          ),
                        ),
                        elevation: 0,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(HugeIcons.strokeRoundedEdit02, size: 18),
                          const SizedBox(width: 8),
                          const Text(
                            'Edit',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Spaces.smallSideSpace,
                  // Send Button
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: () => _handleSend(
                          context,
                          bulkSmsProvider,
                          smsProvider,
                          creditProvider),
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
                          Icon(HugeIcons.strokeRoundedSent, size: 18),
                          const SizedBox(width: 8),
                          const Text(
                            'Confirm & Send',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // Handle send SMS
  Future<void> _handleSend(
    BuildContext context,
    BulkSmsProvider bulkSmsProvider,
    SmsProvider smsProvider,
    CreditsProvider creditProvider,
  ) async {
    Fluttertoast.cancel();

    // Check if this is local SMS sending
    if (bulkSmsProvider.selectedSenderId == Strings.localSenderId) {
      // For local SMS, send using already selected SIM
      final localSms = Provider.of<LocalSmsProvider>(context, listen: false);

      if (localSms.selectedSimIndex == null) {
        Fluttertoast.showToast(msg: "No SIM card selected");
        return;
      }

      // Combine phone numbers from groups and individual contacts
      List<String> allPhoneNumbers = [];

      // Add group phone numbers
      if (bulkSmsProvider.groupPhoneNumbers.isNotEmpty) {
        allPhoneNumbers.addAll(bulkSmsProvider.groupPhoneNumbers);
      }

      // Add individual contact numbers
      if (bulkSmsProvider.selectedContacts.isNotEmpty) {
        allPhoneNumbers.addAll(
          bulkSmsProvider.selectedContacts.map((c) => c.phoneNumber!).toList()
        );
      }

      // Check if there are phone numbers to send to
      if (allPhoneNumbers.isEmpty) {
        Fluttertoast.showToast(msg: "No recipients selected");
        return;
      }

      // Send SMS via selected SIM to all numbers
      await localSms.sendSms(
        bulkSmsProvider.newSms?.message ?? '',
        allPhoneNumbers,
      );

      if (!context.mounted) return;

      // Show success and navigate back
      bulkSmsProvider.resetRecipients();
      // Clear group contacts from ContactsProvider
      Provider.of<ContactsProvider>(context, listen: false).clearGroupsContacts();

      showGeneralDialog(
        context: context,
        pageBuilder: (context, anim1, anim2) {
          return const SizedBox();
        },
        transitionDuration: const Duration(milliseconds: 400),
        transitionBuilder: (context, anim1, anim2, child) {
          return SlideTransition(
            position: Tween(
              begin: const Offset(1, 0),
              end: const Offset(0, 0),
            ).animate(anim1),
            child: TopUpAlert(
              title: 'SMS Sent',
              tapped: () {
                Navigator.pop(context);
                Navigator.pop(context);
                Navigator.pop(context);
              },
            ),
          );
        },
      );
      return;
    }

    // For API SMS, check balance and send
    // Check if sufficient balance
    if ((creditProvider.creditBalance?.smsBalance ?? 0) <
        bulkSmsProvider.recipientCount) {
      Fluttertoast.showToast(
        msg: "Insufficient SMS credits",
        toastLength: Toast.LENGTH_SHORT,
      );
      return;
    }

    // Show loading dialog
    showAdaptiveDialog(
      context: context,
      builder: (context) => AiAnalysisAlert(
        icon: HugeIcons.strokeRoundedUserGroup,
        action: "Sending Bulk Message",
      ),
    );

    // Combine phone numbers from groups and contacts
    List<String> allPhoneNumbers = [];

    // Fetch group contacts if groups are selected
    if (bulkSmsProvider.selectedGroups.isNotEmpty) {
      List<int> groupIds = bulkSmsProvider.selectedGroups.map((g) => g.id!).toList();
      await Provider.of<ContactsProvider>(context, listen: false).getGroupsContacts(groupIds);

      // Get the fetched group contacts
      final contactsProvider = Provider.of<ContactsProvider>(context, listen: false);
      allPhoneNumbers.addAll(contactsProvider.groupsContacts);
    }

    // Add individual contacts
    if (bulkSmsProvider.selectedContacts.isNotEmpty) {
      allPhoneNumbers.addAll(
        bulkSmsProvider.selectedContacts.map((c) => c.phoneNumber!).toList()
      );
    }

    // Send SMS to all phone numbers (groups + contacts)
    if (allPhoneNumbers.isNotEmpty) {
      final sms = SmsRequest(
        phoneNumbers: allPhoneNumbers,
        message: bulkSmsProvider.newSms!.message,
        senderId: bulkSmsProvider.selectedSenderId,
      );
      await smsProvider.sendSms(sms);
      if (!context.mounted) return;
      Navigator.pop(context);

      if (smsProvider.smsResponse?.error == null) {
        bulkSmsProvider.resetRecipients();
        // Clear group contacts from ContactsProvider
        if (!context.mounted) return;
        Provider.of<ContactsProvider>(context, listen: false).clearGroupsContacts();

        _showSuccessDialog(
          context,
          smsProvider.smsResponse?.message ?? 'Message queued',
        );
      }
    }
  }

  // Show success dialog
  void _showSuccessDialog(BuildContext context, String message) {
    showGeneralDialog(
      context: context,
      pageBuilder: (context, anim1, anim2) {
        return const SizedBox();
      },
      transitionDuration: const Duration(milliseconds: 400),
      transitionBuilder: (context, anim1, anim2, child) {
        return SlideTransition(
          position: Tween(
            begin: const Offset(1, 0),
            end: const Offset(0, 0),
          ).animate(anim1),
          child: TopUpAlert(
            title: message,
            tapped: () {
              Navigator.pop(context);
              Navigator.pop(context);
            },
          ),
        );
      },
    );
  }

  // Build info card section
  Widget _buildInfoCard({
    required IconData icon,
    required String title,
    required Widget child,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: HexColor(AppColors.primaryGreen).withValues(alpha: 0.05),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color:
                        HexColor(AppColors.primaryGreen).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    icon,
                    color: HexColor(AppColors.primaryGreen),
                    size: 20,
                  ),
                ),
                Spaces.smallSideSpace,
                Expanded(
                  child: Text(title, style: Blacks.regularBoldCodeNext),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: child,
          ),
        ],
      ),
    );
  }

  // Build detail row
  Widget _buildDetailRow(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(
          icon,
          size: 16,
          color: Colors.grey.shade600,
        ),
        Spaces.smallSideSpace,
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: Grays.smallRoboto),
              const SizedBox(height: 2),
              Text(value, style: Blacks.regularBoldCodeNext),
            ],
          ),
        ),
      ],
    );
  }

  // Build cost row
  Widget _buildCostRow(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(
          icon,
          size: 18,
          color: Colors.grey.shade600,
        ),
        Spaces.smallSideSpace,
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: Grays.smallRoboto),
              const SizedBox(height: 2),
              Text(value, style: Blacks.regularSemiRoboto),
            ],
          ),
        ),
      ],
    );
  }
}

