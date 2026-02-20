import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/widgets/widget.dart';
import '../../constants/constants.dart';
import '../../providers/providers.dart';

class EditWallet extends StatefulWidget {
  const EditWallet({super.key});

  @override
  State<EditWallet> createState() => _EditWalletState();
}

class _EditWalletState extends State<EditWallet> {
  bool isFirst = true;

  final nameController = TextEditingController();
  final purposeController = TextEditingController();
  final settlementAmount = TextEditingController();

  String settlementType = Strings.manualSettlement;
  double? threshold;
  double? amount;
  bool? isActive;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_)async{
      await Provider.of<WalletProvider>(context,listen: false).getWalletTypes();
      await Provider.of<BankingProvider>(context,listen: false).getUserBanks();

      final wallet = Provider.of<WalletProvider>(context, listen: false).selectedWallet;

      if (wallet != null) {
        nameController.text = wallet.name ?? '';
        purposeController.text = wallet.purposeTag ?? '';
        settlementAmount.text = wallet.autoSettlementAmount?.toInt().toString() ?? '0';

        settlementType = wallet.settlementType ?? Strings.manualSettlement;
        threshold = wallet.autoSettlementThreshold;
        amount = wallet.autoSettlementAmount;
        isActive = wallet.isActive;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: HexColor('#F8FAF9'),
      body: Consumer2<WalletProvider,BankingProvider>(
        builder: (_,wallet,banking,__) {
          if(wallet.loadingTypes || banking.loadingAccounts) {
            return const Center(child: CircularProgressIndicator());
          }

          final selectedWallet = wallet.selectedWallet;
          if (selectedWallet == null) {
            return const Center(child: Text("No wallet selected"));
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
                      'Edit Wallet',
                      style: Whites.mediumBoldRoboto,
                    ),
                    background: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            HexColor(AppColors.primaryGreen),
                            HexColor(AppColors.primaryGreen).withValues(alpha: 0.8),
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
                    NotificationsBell(isLight: true),
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

                        // Wallet Information Card
                        _buildSectionCard(
                          title: "Wallet Information",
                          icon: HugeIcons.strokeRoundedWallet03,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              LabeledField(
                                enabled: true,
                                controller: nameController,
                                label: "Wallet Name",
                                hint: "e.g. Coop Wallet",
                                changed: (val) {
                                  setState(() {
                                    nameController.text=val??'';
                                  });
                                },
                              ),
                              Spaces.smallTopSpace,
                              SimpleSelectorCard<WalletType>(
                                selectedItem: wallet.selectedWallet?.coopWallet?.purposeTag != null
                                    ? wallet.walletTypes.firstWhere(
                                        (el) => el.purpose == wallet.selectedWallet?.coopWallet?.purposeTag,
                                        orElse: () => wallet.walletTypes.first)
                                    : null,
                                items: wallet.walletTypes,
                                onSelected: (type) {
                                  setState(() {
                                    purposeController.text = type.purpose;
                                  });
                                },
                                itemLabelBuilder: (WalletType type) => "${type.name} - ${type.purpose}",
                                label: "Wallet Purpose",
                                sheetTitle: "Select Wallet Purpose",
                                sheetSubtitle: "What will this wallet be used for?",
                                icon: HugeIcons.strokeRoundedWallet03,
                              ),
                              Spaces.smallTopSpace,
                              _buildSwitchRow(
                                label: 'Wallet is active',
                                value: isActive??false,
                                onChanged: (val) {
                                  setState(() {
                                    isActive=val;
                                  });
                                },
                              ),
                              Spaces.smallTopSpace,
                              _buildInfoRow(
                                icon: HugeIcons.strokeRoundedWallet01,
                                label: "Wallet Number",
                                value: selectedWallet.coopWallet?.accountNumber ?? "-",
                              ),
                            ],
                          ),
                        ),

                        Spaces.mediumTopSpace,

                        // Auto Settlement Card
                        _buildSectionCard(
                          title: "Auto Settlement",
                          icon: HugeIcons.strokeRoundedSettings02,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Minimum balance to trigger auto-settlement',
                                style: Grays.smallRoboto,
                              ),
                              Spaces.smallTopSpace,
                              LabeledField(
                                enabled: true,
                                controller: settlementAmount,
                                label: "Settlement Amount",
                                hint: "e.g. 5000",
                                isNumber: true,
                                changed: (val) {
                                  wallet.updateSettleAmount(val ?? '0');
                                },
                              ),
                              Spaces.tinyTopSpace,
                              Text(
                                'Amount to settle when threshold is reached',
                                style: Grays.smallRoboto,
                              ),
                              Spaces.smallTopSpace,
                              _buildSwitchRow(
                                label: 'Enable auto-settlement when threshold is reached?',
                                value: settlementType == Strings.autoSettlement,
                                onChanged: (val) {
                                  setState(() {
                                    val=!val;
                                  });
                                  if(val==false){
                                    setState(() {
                                      settlementType = Strings.autoSettlement;
                                    });
                                  }else{
                                    setState(() {
                                      settlementType = Strings.manualSettlement;
                                    });
                                  }
                                },
                              ),
                            ],
                          ),
                        ),

                        Spaces.mediumTopSpace,

                        // Bank Account Card
                        _buildSectionCard(
                          title: "Settling Bank Account",
                          icon: HugeIcons.strokeRoundedBank,
                          child: selectedWallet.bankAccount != null
                              ? Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: HexColor('#F8FAF9'),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: Colors.grey.shade300),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(
                                        HugeIcons.strokeRoundedBank,
                                        color: HexColor(AppColors.primaryGreen),
                                        size: 20,
                                      ),
                                      Spaces.smallSideSpace,
                                      Expanded(
                                        child: Text(
                                          selectedWallet.bankAccount!.bankName!,
                                          style: Blacks.regularBoldCodeNext,
                                        ),
                                      ),
                                      Icon(
                                        HugeIcons.strokeRoundedCheckmarkCircle02,
                                        color: HexColor(AppColors.primaryGreen),
                                        size: 20,
                                      ),
                                    ],
                                  ),
                                )
                              : UserBankSelectorCard(
                                  selectedBank: null,
                                  userBanks: banking.userBanks,
                                  onSelected: (FullBank bank) {
                                    // wallet.updateBankAccount(bank);
                                  },
                                  label: 'Select Bank Account',
                                  sheetTitle: 'Settling Bank',
                                  sheetSubtitle: 'Choose bank account for settlements',
                                ),
                        ),

                        Spaces.mediumTopSpace,

                        // Signatories Card
                        _buildSectionCard(
                          title: "Wallet Signatories (${selectedWallet.signatoriesCount ?? 0})",
                          icon: HugeIcons.strokeRoundedUserMultiple,
                          child: (selectedWallet.signatoriesCount ?? 0) == 0
                              ? Container(
                                  padding: const EdgeInsets.all(16),
                                  alignment: Alignment.center,
                                  child: Column(
                                    children: [
                                      Icon(
                                        HugeIcons.strokeRoundedUserRemove01,
                                        color: Colors.grey.shade400,
                                        size: 40,
                                      ),
                                      Spaces.tinyTopSpace,
                                      Text(
                                        "No signatories found",
                                        style: Grays.regularSemiInter,
                                      ),
                                    ],
                                  ),
                                )
                              : Column(
                                  children: List.generate(
                                    selectedWallet.signatories?.length ?? 0,
                                    (index) {
                                      final signatory = selectedWallet.signatories![index];
                                      return Container(
                                        margin: EdgeInsets.only(
                                          bottom: index < (selectedWallet.signatoriesCount??1) - 1 ? 12 : 0,
                                        ),
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(
                                          color: HexColor('#F8FAF9'),
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(color: Colors.grey.shade300),
                                        ),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              children: [
                                                Container(
                                                  padding: const EdgeInsets.all(8),
                                                  decoration: BoxDecoration(
                                                    color: HexColor(AppColors.primaryGreen).withValues(alpha: 0.1),
                                                    borderRadius: BorderRadius.circular(8),
                                                  ),
                                                  child: Icon(
                                                    HugeIcons.strokeRoundedUserCircle,
                                                    color: HexColor(AppColors.primaryGreen),
                                                    size: 20,
                                                  ),
                                                ),
                                                Spaces.smallSideSpace,
                                                Expanded(
                                                  child: Column(
                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                    children: [
                                                      Text(signatory.fullName, style: Blacks.regularBoldCodeNext),
                                                      Text(signatory.role, style: Grays.smallestPoppinsHint),
                                                    ],
                                                  ),
                                                ),
                                              ],
                                            ),
                                            Spaces.tinyTopSpace,
                                            _buildInfoRow(
                                              icon: HugeIcons.strokeRoundedCall,
                                              label: "Phone",
                                              value: signatory.phoneNumber,
                                              compact: true,
                                            ),
                                            _buildInfoRow(
                                              icon: HugeIcons.strokeRoundedMail01,
                                              label: "Email",
                                              value: signatory.email ?? "-",
                                              compact: true,
                                            ),
                                          ],
                                        ),
                                      );
                                    },
                                  ),
                                ),
                        ),

                        Spaces.largeTopSpace,

                        // Save button
                        wallet.loading
                            ? Center(child: WaveDots())
                            : Center(
                              child: AuthButton(
                                  color: AppColors.primaryGreen,
                                  text: "UPDATE WALLET",
                                  tapped: () async {
                                    Fluttertoast.cancel();
                                    // Validation
                                    if(wallet.selectedWallet?.name==nameController.text&&
                                        wallet.selectedWallet?.autoSettlementAmount==double.parse(settlementAmount.text)&&
                                        wallet.selectedWallet?.settlementType==settlementType&&
                                        wallet.selectedWallet?.isActive==isActive){
                                      Fluttertoast.showToast(msg: "Nothing to update");
                                      Navigator.pop(context);
                                    } else if (nameController.text.isEmpty || nameController.text.length < 4) {
                                      Fluttertoast.showToast(msg: "Please enter a wallet name (at least 4 characters)");
                                      return;
                                    }else{
                                      wallet.updates.addAll({
                                        "name": nameController.text,
                                        "purpose_tag": purposeController.text,
                                        "settlement_type": settlementType,
                                        "auto_settlement_amount": settlementAmount.text,
                                        "is_active": isActive,
                                      });

                                      await wallet.updateWallet();
                                      if (wallet.updateResp?.error == null) {
                                        Fluttertoast.showToast(msg: "Wallet updated successfully!");
                                        Navigator.pop(context);
                                      }
                                    }
                                  },
                                ),
                            ),

                        Spaces.largeTopSpace,
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        }
      ),
    );
  }

  // Build section card
  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    required Widget child,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(
          color: HexColor(AppColors.lightestGray)
        ),
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
                    color: HexColor(AppColors.primaryGreen).withValues(alpha: 0.1),
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

  // Build switch row
  Widget _buildSwitchRow({
    required String label,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: HexColor('#F8FAF9'),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: Blacks.regularSemiRoboto,
            ),
          ),
          Switch(
            activeTrackColor: HexColor(AppColors.primaryGreen),
            value: value,
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }

  // Build info row
  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
    bool compact = false,
  }) {
    return Padding(
      padding: EdgeInsets.only(bottom: compact ? 6 : 0),
      child: Row(
        children: [
          Icon(
            icon,
            size: 16,
            color: Colors.grey.shade600,
          ),
          Spaces.tinySideSpace,
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: Grays.smallRoboto,
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: Blacks.regularBoldCodeNext,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
