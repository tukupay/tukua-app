import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/widget.dart';
import '../../constants/constants.dart';



class MyChurch extends StatelessWidget {
  const MyChurch({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Scaffold(
      body: Builder(
        builder: (context) {
          return SizedBox(
            height: size.height,
            width: size.width,
            child: Stack(
              children: [
                DashBar(
                  needsPop: true,
                    title: Text("Church Dashboard",
                    style: Whites.mediumSemiRoboto)),
                Positioned(
                    top: size.height/7,
                    bottom: 0,
                    child: Container(
                      height: size.height,
                      width: size.width,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        image: DecorationImage(
                            image: AssetImage(Strings.imageAsset('bg.png')),
                        fit: BoxFit.cover),
                        color: Colors.white
                      ),
                      child: Container(
                        height: size.height,
                        width: size.width,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          image: DecorationImage(
                              image: AssetImage(Strings.imageAsset('gradient2.png')),
                              fit: BoxFit.cover)),
                        child: SingleChildScrollView(
                          padding: Paddings.smallAllSides,
                          primary: true,
                          child: Column(
                            children: [
                              ChurchInfoCard(),
                              Spaces.tinyTopSpace,
                              Consumer<ChurchProvider>(
                                builder: (_,church,__) {
                                  return church.creatingWallet==true?
                                        ChurchWalletCard(
                                            header: "Wallet",
                                            subTitle: "Create Church Wallet",
                                            color: AppColors.primaryGreen,
                                            icon: Icons.add,
                                            text: 'ADD',
                                            tapped: (){
                                              Navigator.pushNamed(context, Routes.newWallet);
                                            }):
                                    ChurchWalletCard(
                                    header: 'KSH ${formatThousands(amount: 11009.50)}',
                                    subTitle: 'Wallet Balance',
                                    color: AppColors.primaryOrange,
                                    icon: HugeIcons.strokeRoundedMoneyAdd02,
                                    text: 'Top Up',
                                      hasArrow: true,
                                    tapped: (){
                                      Provider.of<ChurchProvider>(context,listen: false).setCreatingWallet(true);
                                    },
                                  );
                                }
                              ),
                              Spaces.smallTopSpace,
                              MenuCard(
                                  title: "Quick Access",
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                    children: [
                                      MenuItem(
                                          menu: 'Offering',
                                          icon: HugeIcons.strokeRoundedHealtcare,
                                          iconColor: AppColors.primaryGreen,
                                          tapped: (){
                                            Navigator.pushNamed(context, Routes.offeringTypes);
                                          }),
                                      MenuItem(
                                          menu: "Projects",
                                          icon: HugeIcons.strokeRoundedTaskDaily01,
                                          iconColor: AppColors.primaryGreen,
                                          tapped: (){
                                            Navigator.pushNamed(context, Routes.churchProjects);
                                          }),
                                      MenuItem(
                                          menu: "Teachings",
                                          icon: HugeIcons.strokeRoundedComputerVideo,
                                          iconColor: AppColors.red,
                                          tapped: (){
                                            Navigator.pushNamed(context, Routes.teachings);
                                          }),
                                      MenuItem(
                                          menu: "Invite",
                                          icon: HugeIcons.strokeRoundedUserAdd01,
                                          iconColor: AppColors.primaryGreen,
                                          tapped: (){
                                            Navigator.pushNamed(context, Routes.invite);
                                          }),
                                    ],
                                  )),
                              Spaces.smallTopSpace,
                              MenuCard(
                                  title: "My Givings",
                                  isList: true,
                                  hasAction: true,
                                  child: ListView.builder(
                                    padding: EdgeInsets.zero,
                                    primary: false,
                                      itemCount: 5,
                                      shrinkWrap: true,
                                      itemBuilder: (context,index){
                                        return Container(
                                          margin: Paddings.tinyAllSides,
                                          padding: Paddings.tinyHorizontal,
                                          width: size.width,
                                          decoration: BoxDecoration(
                                            border: Border.all(
                                                color: Colors.white
                                            ),
                                            borderRadius: BorderRadius.circular(8),
                                            color:Colors.transparent,
                                          ),
                                          child: Row(
                                            children: [
                                              Spaces.tinySideSpace,
                                              Expanded(
                                                  child: Column(
                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                    children: [
                                                      Text("Lipa Na Mpesa",
                                                          style: Blacks.tinyBoldGrotesk),
                                                      Text('17 Jun 2024',
                                                        style: Grays.tinySemiGrotesk,
                                                        maxLines: 1)
                                                    ],
                                                  )),
                                              Spaces.tinySideSpace,
                                              Text('KSH ${formatThousands(amount: 1250)}'
                                                  ,style: Blacks.regularBoldGrotesk),
                                            ],
                                          ),
                                        );
                                      })),
                              Spaces.mediumTopSpace,
                              // Uninstall button
                              Center(
                                child: AltGreenButton(
                                  text: 'Uninstall Merchant',
                                  icon: HugeIcons.strokeRoundedDelete02,
                                  color: AppColors.red,
                                  tapped: () {
                                    Provider.of<ChurchProvider>(context, listen: false)
                                        .uninstallMerchant();
                                    Fluttertoast.showToast(
                                      msg: 'Merchant uninstalled successfully',
                                      backgroundColor: HexColor(AppColors.primaryGreen),
                                    );
                                    Navigator.pop(context);
                                  },
                                ),
                              ),
                              Spaces.smallTopSpace,
                            ],
                          ),
                        ),
                      ),
                    ))
              ],
            ),
          );
        }
      )
    );
  }
}
