import 'package:flutter/material.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:stylish_bottom_bar/stylish_bottom_bar.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/screens/screens.dart';
import 'package:tuku/widgets/widget.dart';
class MainBody extends StatefulWidget {
  const MainBody({super.key});

  @override
  State<MainBody> createState() => _MainBodyState();
}

class _MainBodyState extends State<MainBody> with WidgetsBindingObserver{

  @override
  void initState() {
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_)async{
        // FETCH TO USE THE LATEST USER OBJ
        await Provider.of<ProfileProvider>(context,listen: false).getUser();
        // GET LATEST USER OBJ
        await Provider.of<AuthProvider>(context,listen: false).updateUser(context);
        FlutterNativeSplash.remove();
        // offer biometrics
        await Provider.of<BiometricsProvider>(context, listen: false).biometricSetup(context);
        // FETCH USER WALLETS
        await Provider.of<WalletProvider>(context,listen: false).listWallets();
        // FETCH PAYMENT METHODS & TRANSACTION TYPES
        await Provider.of<PaymentsProvider>(context,listen: false).getTransactionTypes();
        await Provider.of<PaymentsProvider>(context,listen: false).getPaymentMethods();
        // FETCH TRANSACTIONS
        await Provider.of<TransactionsProvider>(context,listen: false).getSummary();
        await Provider.of<TransactionsProvider>(context,listen: false).getMyTransactions();
        // NOTIFICATIONS
        await Provider.of<NotificationProvider>(context,listen: false).getStats();
        // FETCH CREDIT BALANCE & SENDER IDS
        await Provider.of<CreditsProvider>(context,listen: false).getCreditBalance();
        await Provider.of<SenderIdsProvider>(context,listen: false).getSenderIds();
        // FETCH USER BANKS ACCOUNTS
        await Provider.of<BankingProvider>(context,listen: false).getUserBanks();
        // FETCH GROUPS
        Provider.of<ContactsProvider>(context,listen: false).listContactGroups();
        // FETCH FAV CONTACTS
        await Provider.of<ContactsProvider>(context,listen: false).getFavourites();
        // FETCH FAV WALLETS
        await Provider.of<FavWalletsProvider>(context,listen: false).getFavWallets();
        // CHECKOUT LINK TYPES
        await Provider.of<CheckoutProvider>(context,listen: false).getLinkTypes();
        // FETCH FUNDRAISER STATUSES
        await Provider.of<FundraiserProvider>(context,listen: false).getStatuses();
    });
    super.initState();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state)async{
    debugPrint("APP IS $state");
    final prefs=await SharedPreferences.getInstance();
    if(state==AppLifecycleState.inactive || state==AppLifecycleState.paused){
      // app is backgrounded or closed
      await prefs.setInt('last_exit', DateTime.now().millisecondsSinceEpoch);
      debugPrint("APP HAS BEEN BACKGROUNDED @ ${prefs.getInt('last_exit')}");
    }else if(state==AppLifecycleState.resumed){
      final lastExit = prefs.getInt('last_exit');
      if (lastExit != null){
        final diff=DateTime.now().difference(DateTime.fromMillisecondsSinceEpoch(lastExit));
        debugPrint("RESUMED APP WAS MINIMIZED ${diff.inMinutes} MINUTES AGO");
        if (diff.inMinutes >= 3){
          // clear DB if needed
          await Provider.of<AuthProvider>(context,listen: false).logout();
          Navigator.pushNamedAndRemoveUntil(context, Routes.login,(route)=>false);
        }
      }
    }
    // else {
    //   await Provider.of<AuthProvider>(context,listen: false).logout();
    // }
    super.didChangeAppLifecycleState(state);
  }

  @override
  Widget build(BuildContext context) {
    List<Widget> children=[
      Home(),
      Fundraiser(),
      AltLoansLanding(),
      ProfileLanding(),
    ];

    return Consumer2<AppState,AuthProvider>(
      builder: (_,appState,auth,__) {
        return auth.loading?
        LoadingSplash()
            : Scaffold(
          resizeToAvoidBottomInset: true,
          body: IndexedStack(
            index: appState.selectedTab,
            children: children,
          ),
          bottomNavigationBar: StylishBottomBar(
              items: [
                BottomBarItem(
                    icon: Icon(HugeIcons.strokeRoundedHome02),
                    title: Text('Home')),
                BottomBarItem(
                    icon: Icon(HugeIcons.strokeRoundedHoney01),
                    title: Text('Fundraiser')),
                BottomBarItem(
                    icon: Icon(HugeIcons.strokeRoundedMoneyBag02),
                    title: Text('Loans')),
                BottomBarItem(
                  icon: Consumer<ProfileProvider>(
                    builder: (_,profile,__) {
                      return Stack(
                        clipBehavior: Clip.none,
                        children: [
                          Icon(HugeIcons.strokeRoundedUserAccount),
                          Positioned(
                            top: -2,
                            right: -6,
                            child: (profile.user?.type==Strings.individualAcc &&
                            profile.user?.firstName==null) ||
                                (profile.user?.type==Strings.businessAcc &&
                          profile.user?.businessName==null) ? Container(
                              padding: EdgeInsets.all(2),
                              decoration: BoxDecoration(
                                color: Colors.red,
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                HugeIcons.strokeRoundedAlert02,
                                size: 12,
                                color: Colors.white,
                              ),
                            ):
                                (profile.user?.type==Strings.individualAcc &&
                            profile.user?.kycStatus==Strings.kycPending &&
                                profile.user?.firstName!=null) ||
                                    (profile.user?.type==Strings.businessAcc &&
                                    profile.user?.kycStatus==Strings.kycPending&&
                                    profile.user?.businessName!=null) ?
                            Container(
                              padding: EdgeInsets.all(2),
                              decoration: BoxDecoration(
                                color: HexColor('EE7D13'),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                HugeIcons.strokeRoundedClock01,
                                size: 12,
                                color: Colors.white,
                              ),
                            ):
                            const SizedBox()
                          ),
                        ],
                      );
                    }
                  ),
                  title: Text('Profile'),
                ),
              ],
              onTap: (index){
                if(index==1){
                  Navigator.pushNamed(context, Routes.fundraiserPromotions);
                }else{
                  Provider.of<AppState>(context,listen: false).selectTab(index);
                }
              },
              fabLocation: StylishBarFabLocation.center,
              currentIndex: appState.selectedTab,
              option: AnimatedBarOptions(),
          ),
          floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
          floatingActionButton: Consumer2<WalletProvider,AppState>(
            builder: (_,walletProvider,appState,__) {
              return AnimatedFAB(
                onPressed: (){
                  Provider.of<WebviewProvider>(context,listen: false).setLink(Strings.bankGpt);
                  Provider.of<WebviewProvider>(context,listen: false).setTitle(Strings.bankGptTitle);
                  Navigator.pushNamed(context, Routes.bankGPT);
                },
              );
            }
          )
        );
      }
    );
  }
}
