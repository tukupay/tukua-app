import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/widget.dart';
import '../../constants/constants.dart';
import '../../providers/providers.dart';

class MyWalletDetails extends StatefulWidget {
  const MyWalletDetails({super.key});

  @override
  State<MyWalletDetails> createState() => _MyWalletDetailsState();
}

class _MyWalletDetailsState extends State<MyWalletDetails> {

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_)async{
      // await Provider.of<WalletProvider>(context,listen: false).getWalletTransactions();
    });
  }

  // Build info card section
  Widget _buildInfoCard({
    required String title,
    required IconData icon,
    Widget? trailing,
    required List<Widget> children,
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
                if (trailing != null) trailing,
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: children,
            ),
          ),
        ],
      ),
    );
  }

  // Build detail row
  Widget _buildDetailRow(
    String label,
    String value,
    IconData icon, {
    Color? valueColor,
    bool compact = false,
  }) {
    return Padding(
      padding: EdgeInsets.only(bottom: compact ? 8 : 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
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
                Text(
                  label,
                  style: Grays.smallRoboto,
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: (valueColor != null
                      ? Blacks.regularBoldCodeNext.copyWith(color: valueColor)
                      : Blacks.regularBoldCodeNext),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }


  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return PopScope(
      onPopInvokedWithResult: (bool b,res){
        Provider.of<WalletProvider>(context,listen: false).resetWallet();
      },
      child: Scaffold(
        backgroundColor: HexColor('#F8FAF9'),
        body: Consumer<WalletProvider>(
          builder: (_,walletProvider,__) {
            if(walletProvider.selectedWallet==null) {
              return const SizedBox();
            }

            return RefreshIndicator(
              onRefresh: ()async{
                await walletProvider.getWallet();
              },
              child: Container(
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
                      expandedHeight: 200,
                      floating: false,
                      pinned: true,
                      backgroundColor: HexColor(AppColors.primaryGreen),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      iconTheme: const IconThemeData(color: Colors.white),
                      flexibleSpace: FlexibleSpaceBar(
                        titlePadding: const EdgeInsets.only(left: 60, bottom: 16),
                        title: Text(
                          walletProvider.selectedWallet?.name??'Wallet',
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
                              Positioned(
                                left: -30,
                                bottom: -30,
                                child: Container(
                                  width: 150,
                                  height: 150,
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
                          onPressed: (){
                            Navigator.pushNamed(context, Routes.editWallet);
                          },
                          icon: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(
                              HugeIcons.strokeRoundedPencilEdit01,
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

                            // Wallet Information Card
                            _buildInfoCard(
                              title: "Wallet Information",
                              icon: HugeIcons.strokeRoundedWallet03,
                              children: [
                                _buildDetailRow(
                                  "Wallet Name",
                                  walletProvider.selectedWallet?.name??'(Not Named)',
                                  HugeIcons.strokeRoundedWallet01,
                                ),
                                _buildDetailRow(
                                  "Wallet Number",
                                  walletProvider.selectedWallet?.coopWallet?.accountNumber??'-',
                                  HugeIcons.strokeRoundedTextNumberSign,
                                ),
                                _buildDetailRow(
                                  "Purpose",
                                  walletProvider.selectedWallet?.coopWallet?.purposeTag??'(Not Tagged)',
                                  HugeIcons.strokeRoundedTag01,
                                ),
                                _buildDetailRow(
                                  "Status",
                                  walletProvider.selectedWallet?.isActive==true?'Active':'Inactive',
                                  HugeIcons.strokeRoundedCheckmarkCircle02,
                                  valueColor: walletProvider.selectedWallet?.isActive==true
                                      ? HexColor(AppColors.primaryGreen)
                                      : HexColor(AppColors.red),
                                ),

                                // Primary Wallet Section
                                Container(
                                  margin: const EdgeInsets.only(top: 12),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: walletProvider.selectedWallet?.isPrimary==true
                                        ? HexColor(AppColors.primaryGreen).withValues(alpha: 0.1)
                                        : HexColor('#F8FAF9'),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: walletProvider.selectedWallet?.isPrimary==true
                                          ? HexColor(AppColors.primaryGreen).withValues(alpha: 0.3)
                                          : Colors.grey.shade300,
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(
                                        HugeIcons.strokeRoundedStar,
                                        color: walletProvider.selectedWallet?.isPrimary==true
                                            ? HexColor(AppColors.primaryGreen)
                                            : Colors.grey,
                                        size: 20,
                                      ),
                                      Spaces.smallSideSpace,
                                      Expanded(
                                        child: Text(
                                          walletProvider.selectedWallet?.isPrimary==true
                                              ? "Primary Wallet"
                                              : "Set as Primary Wallet",
                                          style: walletProvider.selectedWallet?.isPrimary==true
                                              ? Greens.regularSemiRoboto
                                              : Grays.regularSemiInter,
                                        ),
                                      ),
                                      if(walletProvider.selectedWallet?.isPrimary!=true)
                                        GestureDetector(
                                          onTap: (){
                                            showAdaptiveDialog(
                                              context: context,
                                              builder: (context)=>ConfirmAlert(
                                                text: "Make this your primary wallet?",
                                                pressed: ()async{
                                                  showAdaptiveDialog(
                                                    context: context,
                                                    builder:(context)=> AiAnalysisAlert(
                                                      icon: HugeIcons.strokeRoundedWalletDone01,
                                                      action: 'Setting Primary Wallet',
                                                    )
                                                  );
                                                  await Provider.of<WalletProvider>(context,listen: false).setPrimaryWallet();
                                                  Navigator.pop(context);
                                                  Navigator.pop(context);
                                                }
                                              )
                                            );
                                          },
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                            decoration: BoxDecoration(
                                              color: HexColor(AppColors.primaryGreen),
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            child: Text("Set Primary", style: Whites.smallBoldRoboto),
                                          ),
                                        ),
                                    ],
                                  ),
                                ),

                                Spaces.tinyTopSpace,
                                Align(
                                  alignment: Alignment.centerRight,
                                  child: Text(
                                    "Created ${formatDate(walletProvider.selectedWallet?.createdAt??DateTime.now())} at ${formatTime(walletProvider.selectedWallet?.createdAt??DateTime.now())}",
                                    style: Grays.smallestPoppinsHint,
                                  ),
                                ),
                              ],
                            ),

                            Spaces.mediumTopSpace,

                            // Bank Account Card
                            _buildInfoCard(
                              title: "Settling Bank Account",
                              icon: HugeIcons.strokeRoundedBank,
                              trailing: AttachDetachBank(),
                              children: [
                                _buildDetailRow(
                                  "Bank Name",
                                  walletProvider.selectedWallet?.bankAccount?.bankName??
                                      walletProvider.selectedWallet?.bank ?? "No Bank Linked",
                                  HugeIcons.strokeRoundedBank,
                                ),
                                _buildDetailRow(
                                  "Account Name",
                                  walletProvider.selectedWallet?.bankAccount?.accountName??'-',
                                  HugeIcons.strokeRoundedUser,
                                ),
                                _buildDetailRow(
                                  "Account Number",
                                  walletProvider.selectedWallet?.bankAccount?.maskedAccountNumber??'-',
                                  HugeIcons.strokeRoundedCreditCardValidation,
                                ),
                              ],
                            ),

                            Spaces.mediumTopSpace,

                            // Settlement Details Card
                            _buildInfoCard(
                              title: "Settlement Configuration",
                              icon: HugeIcons.strokeRoundedSettings02,
                              children: [
                                _buildDetailRow(
                                  "Settlement Type",
                                  walletProvider.selectedWallet?.settlementType??"-",
                                  HugeIcons.strokeRoundedFileSync,
                                ),
                                _buildDetailRow(
                                  "Settlement Threshold",
                                  'KES ${formatThousands(amount: walletProvider.selectedWallet?.autoSettlementThreshold??0,noDecimal: true)}',
                                  HugeIcons.strokeRoundedDashboardSpeed02,
                                ),
                                _buildDetailRow(
                                  "Settlement Amount",
                                  'KES ${formatThousands(amount: walletProvider.selectedWallet?.autoSettlementAmount??0,noDecimal: true)}',
                                  HugeIcons.strokeRoundedMoneySend01,
                                ),
                              ],
                            ),

                            Spaces.mediumTopSpace,

                            // Signatories Section - uses modular SignatoriesSection widget
                            SignatoriesSection(
                              wallet: walletProvider.selectedWallet,
                              onRefresh: () async {
                                // Refresh wallet data after signatory changes
                                await walletProvider.getWallet();
                              },
                            ),

                            Spaces.largeTopSpace,

                            // Delete Button
                            Center(
                              child: AuthButton(
                                color: AppColors.red,
                                text: "DELETE WALLET",
                                tapped: ()async{
                                  showAdaptiveDialog(
                                    context: context,
                                    builder: (context)=>ConfirmAlert(
                                      text: "Delete Wallet?",
                                      pressed: ()async{
                                        showAdaptiveDialog(
                                          context: context,
                                          builder:(context)=> AiAnalysisAlert(
                                            icon: HugeIcons.strokeRoundedWalletRemove01,
                                            action: 'Deleting Wallet',
                                          )
                                        );
                                        await walletProvider.deleteWallet();
                                        Navigator.pop(context);
                                        if(walletProvider.deleteResp==null){
                                          showGeneralDialog(
                                            context: context,
                                            pageBuilder: (context,anim1,anim2){
                                              return const SizedBox();
                                            },
                                            transitionDuration: const Duration(milliseconds: 400),
                                            transitionBuilder: (context,anim1,anim2,child){
                                              return SlideTransition(
                                                position: Tween(
                                                  begin: const Offset(1, 0),
                                                  end: const Offset(0, 0)
                                                ).animate(anim1),
                                                child: SuccessAlert(
                                                  title: 'Wallet Deleted',
                                                  content: 'You have successfully deleted this wallet.',
                                                  tapped: (){
                                                    Navigator.pop(context);
                                                    Navigator.pop(context);
                                                    Navigator.pop(context);
                                                  },
                                                  anim1: anim1
                                                ),
                                              );
                                            }
                                          );
                                        }
                                      }
                                    )
                                  );
                                }
                              ),
                            ),

                            Spaces.largeTopSpace,
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }
        ),
      ),
    );
  }
}
