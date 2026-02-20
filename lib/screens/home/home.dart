import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/widget.dart';
import 'package:tuku/widgets/merchants/merchants.dart';

class Home extends StatelessWidget {
  const Home({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return  Scaffold(
      backgroundColor: HexColor('#F8FAF9'),
        body: RefreshIndicator(
          onRefresh: ()async{
            await Provider.of<WalletProvider>(context,listen: false).listWallets();
            await Provider.of<TransactionsProvider>(context,listen: false).getSummary();
          },
          child: Container(
            height: size.height,
            width: size.width,
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(80),
              image: DecorationImage(
                  image: AssetImage(Strings.imageAsset('bg.png')),
              fit: BoxFit.cover)
            ),
            child: Container(
              height: size.height,
              width: size.width,
              decoration: BoxDecoration(
                image: DecorationImage(
                    image: AssetImage(Strings.imageAsset('gradient1.png')),
                fit: BoxFit.cover)
              ),
              child: Column(
                children: [
                  // Persistent App Bar
                  SafeArea(
                    bottom: false,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: Row(
                        children: [
                          Consumer<ProfileProvider>(
                            builder: (_,profile,__) {
                              return Container(
                                height: 44,
                                width: 44,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: HexColor(AppColors.primaryGreen).withAlpha(40),
                                    width: 2,
                                  ),
                                  image: DecorationImage(
                                      image:
                                      profile.user?.profileImg!=null?
                                          NetworkImage(profile.user!.profileImg!):
                                      AssetImage(Strings.imageAsset('user.jpeg')),
                                  fit: BoxFit.cover)
                                ),
                              );
                            }
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Consumer<ProfileProvider>(
                              builder: (_,profile,__) {
                                String? firstName=profile.user?.firstName;
                                String? middleName=profile.user?.middleName;
                                bool scanned=firstName!=null && middleName!=null;
                                String fullName='$firstName $middleName';
                                String? businessName=profile.user?.businessName;
                                bool uploaded=profile.user?.businessName!=null &&
                                    profile.user?.kraPin!=null;
                                bool isIndividual=profile.user?.type==Strings.individualAcc;
                                bool isBusiness=profile.user?.type==Strings.businessAcc;
                                return Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    GestureDetector(
                                      onDoubleTap: (){
                                        Navigator.pushNamed(context, Routes.capture);
                                      },
                                      child: Text(scanned && isIndividual?fullName:
                                          uploaded && isBusiness ?businessName!:'Your Name',
                                          style: Blacks.regularSemiRoboto),
                                    ),
                                    Text(profile.user?.phoneNumber??'',
                                        style: Grays.smallestPoppinsHint),
                                  ],
                                );
                              }
                            ),
                          ),
                          NotificationsBell(),
                          Spaces.tinySideSpace,
                          GestureDetector(
                            onTap: ()async{
                              await Provider.of<AuthProvider>(context,listen: false).logout();
                              Navigator.pushNamedAndRemoveUntil(context,
                                  Routes.login, (route)=>false);
                            },
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.white.withAlpha(180),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(Icons.logout, color: HexColor(AppColors.darkerGray2),
                              size: 20),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Scrollable body
                  Expanded(
                    child: SingleChildScrollView(
                      primary: true,
                      padding: EdgeInsets.zero,
                      child: Padding(
                        padding: Paddings.smallHorizontal,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const TopBannersCarousel(),
                            Spaces.smallTopSpace,
                            Wallets(),
                            Spaces.mediumTopSpace,
                            InstantPay(),
                            Spaces.mediumTopSpace,
                            FundraiserMenu(),
                            const QuickMenuMerchants(),
                            Spaces.mediumTopSpace,
                            RecentTransactions(),
                            Spaces.mediumTopSpace,
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ));
  }
}
