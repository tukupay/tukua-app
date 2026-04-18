import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/widgets/widget.dart';

class WalletTypeSelect extends StatefulWidget {
  const WalletTypeSelect({super.key});

  @override
  State<WalletTypeSelect> createState() => _WalletTypeSelectState();
}


class _WalletTypeSelectState extends State<WalletTypeSelect> {

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await Provider.of<SasaPaymentsProvider>(context, listen: false)
          .getWalletTypes();
    });
  }

  IconData _iconFor(String id) {
    switch (id) {
      case 'mobile_wallet':
        return HugeIcons.strokeRoundedSmartPhone01;
      case 'bank_wallet':
        return HugeIcons.strokeRoundedBank;
      default:
        return HugeIcons.strokeRoundedWallet01;
    }
  }

  @override
  Widget build(BuildContext context) {
    final primaryGreen = HexColor(AppColors.primaryGreen);
    final fadedGreen = HexColor(AppColors.fadedGreen);
    final lightFadedGreen = HexColor(AppColors.lightFadedGreen);

    return Scaffold(
      appBar: AppBar(
        title: Text('Create Wallet', style: Blacks.tinyBolderPoppins),
        centerTitle: true,
        elevation: 0,
      ),
      body: Consumer<SasaPaymentsProvider>(
        builder: (_, provider, __) {
          // ── Loading State ──
          if (provider.loadingWalletTypes) {
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Shimmer header
                  Container(
                    height: 70,
                    width: 70,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: lightFadedGreen.withAlpha(60),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    height: 14,
                    width: 180,
                    decoration: BoxDecoration(
                      color: Colors.grey.withAlpha(40),
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    height: 10,
                    width: 260,
                    decoration: BoxDecoration(
                      color: Colors.grey.withAlpha(25),
                      borderRadius: BorderRadius.circular(6),
                    ),
                  ),
                  const SizedBox(height: 28),
                  // Shimmer cards
                  ...List.generate(2, (_) => Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: Container(
                      height: 110,
                      decoration: BoxDecoration(
                        color: Colors.grey.withAlpha(20),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.grey.withAlpha(30)),
                      ),
                    ),
                  )),
                ],
              ),
            );
          }

          // ── Empty State ──
          if (provider.walletTypes.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(HugeIcons.strokeRoundedWallet01,
                      size: 48, color: fadedGreen.withAlpha(120)),
                  const SizedBox(height: 12),
                  Text('No wallet types available',
                      style: Grays.smallestPoppinsHint),
                ],
              ),
            );
          }

          // ── Loaded State ──
          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 20, vertical: 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header icon
                      Center(
                        child: Container(
                          height: 70,
                          width: 70,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: LinearGradient(
                              colors: [
                                primaryGreen.withAlpha(25),
                                fadedGreen.withAlpha(40),
                              ],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                          ),
                          child: Icon(
                            HugeIcons.strokeRoundedWallet01,
                            size: 32,
                            color: fadedGreen,
                          ),
                        ),
                      ),
                      Spaces.tinyTopSpace,
                      Center(
                        child: Text('Choose Wallet Type',
                            style: Blacks.tinyBolderPoppins),
                      ),
                      const SizedBox(height: 4),
                      Center(
                        child: Padding(
                          padding: Paddings.mediumHorizontal,
                          child: Text(
                            'Select the type of wallet you\'d like to create for your SasaPay account.',
                            style: Grays.tinyPoppinsHint,
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                      Spaces.mediumTopSpace,

                      // Wallet type cards
                      ...provider.walletTypes.map((type) {
                        final isSelected = provider.selectedId == type.id;
                        return _WalletTypeCard(
                          type: type,
                          icon: _iconFor(type.id),
                          isSelected: isSelected,
                          onTap: () =>provider.selectWalletType(type.id),
                        );
                      }),

                      Spaces.smallTopSpace,

                      // Info banner
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          color: fadedGreen.withAlpha(15),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                              color: fadedGreen.withAlpha(40)),
                        ),
                        child: Row(
                          children: [
                            Icon(
                                HugeIcons.strokeRoundedInformationCircle,
                                size: 18,
                                color: fadedGreen),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'You can create multiple wallets later. Choose the one that best fits your primary use case.',
                                style: Grays.smallestPoppinsHint,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // ── Bottom CTA ──
              Padding(
                padding: Paddings.smallAllSides,
                child: AuthButton(
                    text: "Continue",
                    tapped: (){
                      if(provider.selectedId==null){
                        Fluttertoast.cancel();
                        Fluttertoast.showToast(msg: "Please select a wallet type to continue");
                        return;
                      }else{
                        Navigator.pop(context);
                      }
                    }),
              )
            ],
          );
        },
      ),
    );
  }
}

// ─────────────────────────────────────────────
// Wallet Type Selection Card
// ─────────────────────────────────────────────
class _WalletTypeCard extends StatelessWidget {
  final SasaWalletType type;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _WalletTypeCard({
    required this.type,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final primaryGreen = HexColor(AppColors.primaryGreen);
    final fadedGreen = HexColor(AppColors.fadedGreen);
    final lightFadedGreen = HexColor(AppColors.lightFadedGreen);

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: isSelected ? primaryGreen.withAlpha(25) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? primaryGreen : HexColor(AppColors.lightGray),
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: primaryGreen.withAlpha(30),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  )
                ]
              : AppShadows.light,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: isSelected
                      ? [primaryGreen, fadedGreen]
                      : [lightFadedGreen, lightFadedGreen.withAlpha(120)],
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                size: 22,
                color: isSelected ? Colors.white : fadedGreen,
              ),
            ),
            const SizedBox(width: 14),
            // Text content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(type.title, style: Blacks.smallestBolderPoppins),
                  const SizedBox(height: 4),
                  Text(
                    type.description,
                    style: Grays.smallestPoppinsHint,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            // Radio indicator
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected ? primaryGreen : Colors.transparent,
                border: Border.all(
                  color: isSelected ? primaryGreen : Colors.grey.withAlpha(80),
                  width: 2,
                ),
              ),
              child: isSelected
                  ? const Icon(Icons.check, size: 14, color: Colors.white)
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}
