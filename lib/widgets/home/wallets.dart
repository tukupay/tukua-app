import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
class Wallets extends StatefulWidget {
  const Wallets({super.key});

  @override
  State<Wallets> createState() => _WalletsState();
}

class _WalletsState extends State<Wallets> {
  PageController? _pageController;
  bool _didInitialSetup = false;

  @override
  void dispose() {
    _pageController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Consumer2<WalletProvider,AppState>(
      builder: (_,walletProvider,appState,__) {
        bool walletsAreEmpty= walletProvider.userWallets.isEmpty;
        if(walletProvider.loadingWallets || !walletProvider.fetched){
          return WalletsShimmer(size: size);
        }
        if(walletsAreEmpty && walletProvider.fetched){
         return SizedBox(
              height: 160,
              child: CreateWallet());
        }
        final wallets = walletProvider.userWallets;
        // keep a single controller instance so the PageView state survives rebuilds
        _pageController ??= PageController(initialPage: 0);

        // defer provider updates that trigger notifyListeners to after build
        if (!_didInitialSetup) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            // ensure payments provider has a selected wallet (first wallet)
            final payments = Provider.of<PaymentsProvider>(context, listen: false);
            payments.selectSourceWallet(wallets[0]);
            payments.selectDestinationWallet(wallets[0]);

            // sync app state to first wallet
            appState.selectWallet(0);

            _didInitialSetup = true;
          });
        }

        return SizedBox(
          child: Column(
            children: [
              SizedBox(
                height: 200,
                child: PageView.builder(
                  controller: _pageController,
                  physics: const BouncingScrollPhysics(),
                  pageSnapping: true,
                  onPageChanged: (index) {
                    appState.selectWallet(index);
                    if (index < wallets.length) {
                      final payments = Provider.of<PaymentsProvider>(context, listen: false);
                      payments.selectSourceWallet(wallets[index]);
                      payments.selectDestinationWallet(wallets[index]);
                    }
                  },
                  itemCount: wallets.length + 1,
                  itemBuilder: (context, index) {
                    if (index == wallets.length) {
                      return CreateWallet();
                    }
                    if (index < wallets.length) {
                      final FullWallet wallet = wallets[index];
                      return AccountDetails(wallet: wallet, index: index);
                    }
                    return const SizedBox();
                  },
                ),
              ),
              Spaces.smallTopSpace,
              walletsAreEmpty
                  ? SizedBox()
                  : AnimatedSmoothIndicator(
                      activeIndex: appState.currentWallet,
                      count: wallets.length + 1,
                      effect: ExpandingDotsEffect(
                        dotHeight: 8,
                        dotWidth: 14,
                        activeDotColor: appState.currentWallet == wallets.length
                            ? HexColor(AppColors.primaryGreen)
                            : HexColor(wallets[appState.currentWallet].color?.split(',').first ?? AppColors.primaryGreen),
                      ),
                    )
            ],
          ),
        );
      }
    );
  }
}