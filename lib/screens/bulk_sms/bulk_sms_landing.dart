import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/widget.dart';

class BulkSmsLanding extends StatefulWidget {
  const BulkSmsLanding({super.key});

  @override
  State<BulkSmsLanding> createState() => _BulkSmsLandingState();
}

class _BulkSmsLandingState extends State<BulkSmsLanding>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final contactProvider = Provider.of<DeviceContactProvider>(context, listen: false);
      final bulkSms = Provider.of<BulkSmsProvider>(context, listen: false);

      // Only fetch contacts if not already loaded (fire and forget to avoid blocking UI)
      if (contactProvider.simpleContacts.isEmpty && !contactProvider.isLoading) {
        contactProvider.refreshContacts();
      } else if (contactProvider.filteredContacts.isEmpty && contactProvider.simpleContacts.isNotEmpty) {
        // Contacts exist but filtered is empty - reset to show all
        contactProvider.resetSearch();
      }

      // Set "Local" as default sender ID
      if (bulkSms.selectedSenderId == null) {
        bulkSms.selectSenderId(Strings.localSenderId);
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  final body = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return PopScope(
      onPopInvokedWithResult: (bool b, res) {
        Provider.of<BulkSmsProvider>(context, listen: false).resetWallet();
        Provider.of<DeviceContactProvider>(context, listen: false).resetSearch();
      },
      child: Scaffold(
        backgroundColor: HexColor('#F8FAF9'),
        body: Consumer5<BulkSmsProvider, CreditsProvider, PaymentsProvider,
            CheckoutProvider, LocalSmsProvider>(
          builder:
              (_, bulkSmsProvider, credits, payments, checkouts, localSms, __) {
            return Container(
              height: size.height,
              width: size.width,
              decoration: BoxDecoration(
                image: DecorationImage(
                  image: AssetImage(Strings.imageAsset('bg.png')),
                  fit: BoxFit.cover,
                ),
              ),
              child: Container(
                decoration: BoxDecoration(
                  image: DecorationImage(
                    image: AssetImage(Strings.imageAsset('gradient2.png')),
                    fit: BoxFit.cover,
                  ),
                ),
                child: Column(
                  children: [
                    // Fixed App Bar
                    SafeArea(
                      bottom: false,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: Row(
                          children: [
                            GestureDetector(
                              onTap: () => Navigator.pop(context),
                              child: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: HexColor('#F0F4F3'),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(HugeIcons.strokeRoundedArrowLeft01,
                                    color: HexColor(AppColors.darkerGray2), size: 20),
                              ),
                            ),
                            const Spacer(),
                            Text('Bulk SMS', style: Blacks.mediumSemiRubik),
                            const Spacer(),
                            IconButton(
                                onPressed: (){
                                  Navigator.pushNamed(context, Routes.smsHistory);
                                }, icon: Icon(Icons.history)),
                            GestureDetector(
                              onTap: () => Navigator.pushNamed(context, Routes.smsSettings),
                              child: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: HexColor('#F0F4F3'),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(HugeIcons.strokeRoundedSettings01,
                                    color: HexColor(AppColors.darkerGray2), size: 20),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Fixed Balance Card
                    _buildBalanceCard(credits, payments),

                    // Scrollable Content
                    Expanded(
                      child: NestedScrollView(
                        headerSliverBuilder: (context, innerBoxIsScrolled) {
                          return [
                            // Message Compose Section
                            SliverToBoxAdapter(
                              child: _buildComposeSection(),
                            ),

                            // Recipients Section Header
                            SliverToBoxAdapter(
                              child: _buildRecipientsHeader(),
                            ),

                            // Pinned Tab Bar
                            SliverPersistentHeader(
                              pinned: true,
                              delegate: _StickyTabBarDelegate(
                                child: Container(
                                  color: HexColor('#F8FAF9'),
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                  child: _buildTabBar(),
                                ),
                              ),
                            ),
                          ];
                        },
                        body: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: TabBarView(
                            controller: _tabController,
                            children: const [
                              BulkSmsIndividual(),
                              BulkSmsGroups(),
                            ],
                          ),
                        ),
                      ),
                    ),

                    // Bottom Action Button
                    Consumer2<BulkSmsProvider, CheckoutProvider>(
                      builder: (_, bulkSms, checkouts, __) {
                        return _buildBottomAction(bulkSms, credits, checkouts, localSms);
                      },
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildBalanceCard(CreditsProvider credits, PaymentsProvider payments) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [HexColor(AppColors.primaryGreen), HexColor(AppColors.fadedGreen)],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: HexColor(AppColors.primaryGreen).withAlpha(76),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          // SMS Icon
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(51),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(HugeIcons.strokeRoundedMail01,
                color: Colors.white, size: 24),
          ),
          const SizedBox(width: 16),
          // Balance Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'SMS Balance',
                  style: Whites.tinyPoppins.copyWith(
                    color: Colors.white.withAlpha(204),
                  ),
                ),
                const SizedBox(height: 4),
                credits.loadingBalance
                    ? const WaveDots()
                    : Text(
                        '${credits.creditBalance?.smsBalance ?? 0} credits',
                        style: Whites.largeSemiPoppins.copyWith(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
              ],
            ),
          ),
          // Top Up Button
          GestureDetector(
            onTap: () {
              Provider.of<PaymentsProvider>(context, listen: false).selectType(
                  payments.transactionTypes
                      .firstWhere((el) => el.type == Strings.smsCreditsPurchase));
              Navigator.pushNamed(context, Routes.buyCredits);
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(HugeIcons.strokeRoundedAdd01,
                      color: HexColor(AppColors.primaryGreen), size: 18),
                  const SizedBox(width: 6),
                  Text(
                    'Top Up',
                    style: TextStyle(
                      color: HexColor(AppColors.primaryGreen),
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
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

  Widget _buildComposeSection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(100),
        border: Border.all(
          color: HexColor(AppColors.lightGray)
        ),
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
          // Section Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: HexColor('#E8F5E9'),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(HugeIcons.strokeRoundedEdit02,
                    size: 18, color: HexColor(AppColors.primaryGreen)),
              ),
              const SizedBox(width: 12),
              Text('Compose Message', style: Blacks.tinyBolderPoppins),
              const Spacer(),
              // ===> Character count indicator
              // Consumer<BulkSmsProvider>(
              //   builder: (_, smsProvider, __) {
              //     return Container(
              //       padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              //       decoration: BoxDecoration(
              //         color: HexColor('#F0F4F3'),
              //         borderRadius: BorderRadius.circular(8),
              //       ),
              //       child: Text(
              //         '${body.text.length}/160',
              //         style: Grays.tinySemiGrotesk.copyWith(fontSize: 10),
              //       ),
              //     );
              //   },
              // ),
            ],
          ),
          const SizedBox(height: 16),
          SmsInputs(body: body),
        ],
      ),
    );
  }

  Widget _buildRecipientsHeader() {
    return Consumer<DeviceContactProvider>(
      builder: (_, deviceContacts, __) {
        return Container(
          margin: const EdgeInsets.fromLTRB(16, 6, 16, 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white.withAlpha(100),
            border: Border.all(
                color: HexColor(AppColors.lightGray)
            ),
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
              // Header Row
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: HexColor('#E8F5E9'),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(HugeIcons.strokeRoundedUserMultiple02,
                        size: 18, color: HexColor(AppColors.primaryGreen)),
                  ),
                  const SizedBox(width: 12),
                  Text('Select Recipients', style: Blacks.tinyBolderPoppins),
                  const Spacer(),
                  // Show loading progress or contact count
                  if (deviceContacts.isLoading)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: HexColor('#E8F5E9'),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox(
                            width: 12,
                            height: 12,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                HexColor(AppColors.primaryGreen),
                              ),
                              value: deviceContacts.fetchProgress > 0
                                  ? deviceContacts.fetchProgress / 100
                                  : null,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            '${deviceContacts.fetchProgress}%',
                            style: TextStyle(
                              color: HexColor(AppColors.primaryGreen),
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: HexColor('#F0F4F3'),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(HugeIcons.strokeRoundedUser,
                              size: 12, color: HexColor(AppColors.darkerGray2)),
                          const SizedBox(width: 4),
                          Text(
                            '${deviceContacts.filteredContacts.length}',
                            style: Grays.tinySemiGrotesk.copyWith(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 14),
              // Search Field
              Container(
                decoration: BoxDecoration(
                  color: HexColor('#F8FAF9'),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: HexColor('#E8ECE9')),
                ),
                child: TextField(
                  onChanged: (value) {
                    Provider.of<DeviceContactProvider>(context, listen: false)
                        .searchContacts(value);
                  },
                  decoration: InputDecoration(
                    hintText: 'Search contacts...',
                    hintStyle: Grays.tinyPoppinsHint,
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                    prefixIcon: Icon(HugeIcons.strokeRoundedSearch01,
                        color: HexColor(AppColors.darkerGray2), size: 20),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTabBar() {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: HexColor('#E8ECE9')),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(8),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: TabBar(
        controller: _tabController,
        dividerColor: Colors.transparent,
        indicator: BoxDecoration(
          color: HexColor(AppColors.primaryGreen),
          borderRadius: BorderRadius.circular(10),
        ),
        indicatorSize: TabBarIndicatorSize.tab,
        indicatorPadding: const EdgeInsets.all(4),
        labelColor: Colors.white,
        unselectedLabelColor: HexColor(AppColors.darkerGray2),
        labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        unselectedLabelStyle:
            const TextStyle(fontWeight: FontWeight.w500, fontSize: 13),
        tabs: [
          Tab(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(HugeIcons.strokeRoundedUser, size: 16),
                const SizedBox(width: 6),
                const Text('Individual'),
              ],
            ),
          ),
          Tab(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(HugeIcons.strokeRoundedUserGroup, size: 16),
                const SizedBox(width: 6),
                const Text('Groups'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomAction(
    BulkSmsProvider bulkSmsProvider,
    CreditsProvider credits,
    CheckoutProvider checkouts,
    LocalSmsProvider localSms,
  ) {
    final int recipientCount = bulkSmsProvider.selectedContacts.length +
        bulkSmsProvider.selectedGroups.fold(0, (sum, g) => sum + (g.contactCount ?? 0));
    final bool hasRecipients = bulkSmsProvider.selectedContacts.isNotEmpty ||
        bulkSmsProvider.selectedGroups.isNotEmpty;

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
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Recipients summary chip
            if (hasRecipients)
              Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: HexColor('#E8F5E9'),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(HugeIcons.strokeRoundedCheckmarkCircle01,
                        color: HexColor(AppColors.primaryGreen), size: 16),
                    const SizedBox(width: 8),
                    Text(
                      '$recipientCount recipient${recipientCount != 1 ? 's' : ''} selected',
                      style: TextStyle(
                        color: HexColor(AppColors.primaryGreen),
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),

            // Preview button
            checkouts.generatingLink
                ? const Center(child: WaveDots())
                : SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => _handlePreview(
                          bulkSmsProvider, credits, checkouts, localSms),
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
                          Icon(HugeIcons.strokeRoundedMail02, size: 18),
                          const SizedBox(width: 8),
                          const Text(
                            'PREVIEW & SEND',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                              letterSpacing: 0.5,
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
  }

  Future<void> _handlePreview(
    BulkSmsProvider bulkSmsProvider,
    CreditsProvider credits,
    CheckoutProvider checkouts,
    LocalSmsProvider localSms,
  ) async {
    Fluttertoast.cancel();
    if (body.text.length < 3) {
      Fluttertoast.showToast(msg: "Please enter some message");
    // } else if (body.text.length > 160) {
    //   Fluttertoast.showToast(
    //       msg: "Your message should contain a maximum of 160 characters");
    } else if (bulkSmsProvider.selectedContacts.isEmpty &&
        bulkSmsProvider.selectedGroups.isEmpty) {
      Fluttertoast.showToast(msg: "Please select at least one contact or group");
    } else if (bulkSmsProvider.selectedContacts.length > 100) {
      Fluttertoast.showToast(
          msg: "You can only bulk send to 100 contacts at a go");
    } else if (bulkSmsProvider.includePaymentLink == true &&
        bulkSmsProvider.selectedWallet == null) {
      Fluttertoast.showToast(msg: "Please select a wallet");
    } else if (bulkSmsProvider.includePaymentLink == true &&
        bulkSmsProvider.amount == 0) {
      Fluttertoast.showToast(msg: "Please enter an amount");
    } else if ((credits.creditBalance?.smsBalance ?? 0) <
        bulkSmsProvider.recipientCount) {
      Fluttertoast.showToast(
          msg: "You don't have enough balance to send this message");
    } else if (bulkSmsProvider.selectedSenderId == Strings.localSenderId) {
      // For local SMS, select SIM first, then show preview
      // Fetch group contacts if groups are selected
      List<String> allPhoneNumbers = [];

      if(bulkSmsProvider.selectedGroups.isNotEmpty){
        List<int> groupIds = bulkSmsProvider.selectedGroups.map((g) => g.id!).toList();
        Fluttertoast.showToast(msg: "Fetching group contacts...");
        await Provider.of<ContactsProvider>(context,listen: false).getGroupsContacts(groupIds);
        Fluttertoast.cancel();

        // Get the fetched group contacts
        final contactsProvider = Provider.of<ContactsProvider>(context,listen: false);
        allPhoneNumbers.addAll(contactsProvider.groupsContacts);

        // Store in BulkSmsProvider for preview
        bulkSmsProvider.setGroupPhoneNumbers(contactsProvider.groupsContacts);
      }

      // Add individual contacts
      allPhoneNumbers.addAll(
        bulkSmsProvider.selectedContacts.map((c) => c.phoneNumber!).toList()
      );

      late String message;
      if (bulkSmsProvider.includePaymentLink == true) {
        final request = CheckoutRequest(
          linkType: Strings.walletTopUp,
          walletId: bulkSmsProvider.selectedWallet!.id!,
          amount: bulkSmsProvider.amount,
        );
        await checkouts.createCheckoutLink(request);
        if (checkouts.checkoutResp?.error == null &&
            checkouts.checkoutResp?.checkoutLinkUrl != null) {
          message = '${body.text} \n\n${checkouts.checkoutResp?.checkoutLinkUrl}';
        } else {
          message = body.text;
        }
      } else {
        message = body.text;
      }

      // Create SMS request with all phone numbers (contacts + groups)
      final sms = SmsRequest(
        phoneNumbers: allPhoneNumbers,
        message: message,
      );
      Provider.of<BulkSmsProvider>(context, listen: false).setNewSms(sms);

      // Fetch SIM cards and show selection first
      Fluttertoast.showToast(msg: "Fetching SIM Cards");
      await Provider.of<LocalSmsProvider>(context, listen: false).fetchSimCards();
      Fluttertoast.cancel();
      if (!mounted) return;

      // Show SIM selection, then navigate to preview
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        scrollControlDisabledMaxHeightRatio: 1 / 1,
        builder: (context) {
          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
            child: DecoratedSheet(
              items: localSms.simCards.length,
              title: "Select SIM to Preview",
              body: Consumer<LocalSmsProvider>(
                builder: (_, localSmsProvider, __) {
                  return Column(
                    children: [
                      ListView.builder(
                        shrinkWrap: true,
                        itemCount: localSmsProvider.simCards.length,
                        itemBuilder: (context, index) {
                          final sim = localSmsProvider.simCards[index];
                          return ListTile(
                            leading: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: HexColor(AppColors.primaryGreen).withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Icon(
                                Icons.sim_card_outlined,
                                color: HexColor(AppColors.primaryGreen),
                                size: 20,
                              ),
                            ),
                            title: Text(
                              sim['displayName'] ?? 'SIM ${index + 1}',
                              style: Blacks.regularBoldCodeNext,
                            ),
                            subtitle: Text(
                              sim['carrierName'] ?? 'Unknown Carrier',
                              style: Grays.smallRoboto,
                            ),
                            trailing: Icon(
                              HugeIcons.strokeRoundedArrowRight01,
                              color: HexColor(AppColors.darkerGray2),
                            ),
                            onTap: () {
                              localSmsProvider.selectSim(index);
                              Navigator.pop(context);
                              Navigator.pushNamed(context, Routes.smsPreview);
                            },
                          );
                        },
                      ),
                    ],
                  );
                },
              ),
              height: 200,
            ),
          );
        },
      );
    } else {
      late String message;
      if (bulkSmsProvider.includePaymentLink == true) {
        final request = CheckoutRequest(
          linkType: Strings.walletTopUp,
          walletId: bulkSmsProvider.selectedWallet!.id!,
          amount: bulkSmsProvider.amount,
        );
        await checkouts.createCheckoutLink(request);
        if (checkouts.checkoutResp?.error == null &&
            checkouts.checkoutResp?.checkoutLinkUrl != null) {
          message =
              '${body.text} \n\n ${checkouts.checkoutResp?.checkoutLinkUrl}';
        }
      } else {
        message = body.text;
      }
      final sms = SmsRequest(
        phoneNumbers:
            bulkSmsProvider.selectedContacts.map((c) => c.phoneNumber!).toList(),
        message: message,
      );
      Provider.of<BulkSmsProvider>(context, listen: false).setNewSms(sms);
      Navigator.pushNamed(context, Routes.smsPreview);
    }
  }
}

/// Sticky tab bar delegate for pinned header
class _StickyTabBarDelegate extends SliverPersistentHeaderDelegate {
  final Widget child;

  _StickyTabBarDelegate({required this.child});

  @override
  double get minExtent => 56;

  @override
  double get maxExtent => 56;

  @override
  Widget build(
      BuildContext context, double shrinkOffset, bool overlapsContent) {
    return child;
  }

  @override
  bool shouldRebuild(covariant _StickyTabBarDelegate oldDelegate) {
    return child != oldDelegate.child;
  }
}
