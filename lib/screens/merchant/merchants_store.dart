import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/merchant_provider.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/merchants/merchants.dart';

class MerchantsStore extends StatefulWidget {
  const MerchantsStore({super.key});

  @override
  State<MerchantsStore> createState() => _MerchantsStoreState();
}

class _MerchantsStoreState extends State<MerchantsStore> {
  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: HexColor('#F8F9FA'),
      body: Container(
        height: size.height,
        width: size.width,
        decoration: BoxDecoration(
          image: DecorationImage(
            image: AssetImage(Strings.imageAsset('gradient2.png')),
            fit: BoxFit.cover,
          ),
        ),
        child: SafeArea(
          child: Consumer<MerchantProvider>(
            builder: (context, merchantProvider, _) {
              return CustomScrollView(
                slivers: [
                  // App Bar area
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                      child: Row(
                        children: [
                          GestureDetector(
                            onTap: () => Navigator.pop(context),
                            child: Container(
                              height: 44,
                              width: 44,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.06),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Icon(
                                Icons.arrow_back_ios_new_rounded,
                                color: HexColor('#404040'),
                                size: 18,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Header
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                      child: MiniAppsHeader(
                        onSearchTap: () {
                          Fluttertoast.cancel();
                          Fluttertoast.showToast(msg: "Search coming soon!");
                        },
                      ),
                    ),
                  ),

                  // Installed merchants section title
                  if (merchantProvider.installedMerchants.isNotEmpty)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
                        child: MerchantSectionTitle(
                          title: 'Installed',
                        ),
                      ),
                    ),

                  // Installed merchants carousel
                  if (merchantProvider.installedMerchants.isNotEmpty)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.only(left: 20),
                        child: InstalledMerchantsCarousel(
                          merchants: merchantProvider.installedMerchants,
                          quickMenuIds: merchantProvider.quickMenuIds,
                          onMerchantTap: (merchant) {
                            Navigator.pushNamed(context, Routes.myChurch);
                          },
                          onQuickMenuToggle: (merchantId) {
                            merchantProvider.toggleQuickMenu(merchantId);
                            Fluttertoast.cancel();
                            Fluttertoast.showToast(
                              msg: merchantProvider.isInQuickMenu(merchantId)
                                  ? 'Added to Quick Menu'
                                  : 'Removed from Quick Menu',
                            );
                          },
                        ),
                      ),
                    ),

                  // Discover section title
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.fromLTRB(
                        20,
                        merchantProvider.installedMerchants.isEmpty ? 24 : 28,
                        20,
                        16,
                      ),
                      child: MerchantSectionTitle(
                        title: 'Discover',
                      ),
                    ),
                  ),

                  // Category filters
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: MerchantCategoryChips(
                        categories: merchantProvider.categories,
                        selectedCategory: merchantProvider.selectedCategory,
                        onCategorySelected: (category) {
                          merchantProvider.selectCategory(category);
                        },
                      ),
                    ),
                  ),

                  // Merchants list
                  if (merchantProvider.filteredMerchants.isEmpty)
                    SliverToBoxAdapter(
                      child: MerchantEmptyState(
                        message: 'No merchants in this category',
                        subtitle: 'Try selecting a different category',
                      ),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final merchant = merchantProvider.filteredMerchants[index];
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: MerchantListItem(
                                merchant: merchant,
                                isInstalled: merchantProvider.isInstalled(merchant.id),
                                showNewBadge: merchant.isNew,
                                onTap: () {
                                  if (merchantProvider.isInstalled(merchant.id)) {
                                    Navigator.pushNamed(context, Routes.myChurch);
                                  } else {
                                    Navigator.pushNamed(context, Routes.churchInfo);
                                  }
                                },
                                onInstallToggle: () {
                                  if (merchantProvider.isInstalled(merchant.id)) {
                                    merchantProvider.uninstallMerchant(merchant.id);
                                  } else {
                                    merchantProvider.installMerchant(merchant.id);
                                  }
                                },
                              ),
                            );
                          },
                          childCount: merchantProvider.filteredMerchants.length,
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}
