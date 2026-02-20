import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';

import '../../widgets/widget.dart';
class ProfileLanding extends StatelessWidget {
  const ProfileLanding({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Scaffold(
      appBar: AppBar(
        title: Text('My Profile',style: Blacks.mediumSemiRoboto),
        centerTitle: true,
        actions: [
          NotificationsBell(),
          Spaces.smallSideSpace,
        ],
      ),
        body: Consumer<ProfileProvider>(
          builder: (_,profile,__) {
            return SingleChildScrollView(
              primary: true,
              child: Container(
                height: size.height+200,
                width: size.width,
                padding: const EdgeInsets.only(
                    bottom: 8.0),
                child: Stack(
                  children: [
                    SizedBox(
                      height: size.height/2,
                      width: size.width,
                      child: profile.user?.profileImg!=null?
                          Image.network(profile.user!.profileImg!,
                          fit: BoxFit.cover):
                      Image.asset(Strings.imageAsset('user.jpeg'),
                      fit: BoxFit.cover)),
                    Positioned(
                      top: 8,
                        right: 8,
                        child: GestureDetector(
                          onTap: ()async{
                            await Provider.of<AuthProvider>(context,listen: false).logout();
                            Navigator.pushNamedAndRemoveUntil(context,
                                Routes.login, (route)=>false);
                          },
                          child: Column(
                            children: [
                              HugeIcon(
                                  icon: HugeIcons.strokeRoundedLogoutSquare02,
                                  color: Colors.white),
                              Text('Log Out',style: Whites.regularRoboto)
                            ],
                          ),
                        )),
                    Positioned(
                      top: size.height/5,
                        bottom: 0,
                        child: Container(
                          height: size.height+150,
                          width: size.width,
                          decoration: BoxDecoration(
                              image: DecorationImage(
                                  image: AssetImage(Strings.imageAsset('profileeclipse.png')),
                                  fit: BoxFit.cover)
                          ),
                          padding: Paddings.smallAllSides,
                          child: Column(
                            children: [
                              UserDetails(),
                              Spaces.smallTopSpace,
                              UserStats(),
                              // Consumer<ProfileProvider>(
                              //   builder: (_,profile,__) {
                              //     return SettingOption(
                              //         tapped: (){
                              //           Navigator.pushNamed(context, Routes.myIdentity);
                              //         },
                              //         kycVerified: profile.kycVerified,
                              //         kycPending: profile.kycPending,
                              //         icon: HugeIcons.strokeRoundedIdentityCard,
                              //         option: 'My Identity');
                              //   }
                              // ),
                              SettingOption(
                                tapped: (){
                                  Navigator.pushNamed(context, Routes.contact);
                                },
                                option: 'Contact',
                                icon: HugeIcons.strokeRoundedCall,
                              ),
                              SettingOption(
                                tapped: (){
                                  Navigator.pushNamed(context, Routes.accountsCards);
                                },
                                option: 'Wallets & Banks',
                                icon: HugeIcons.strokeRoundedWallet01,
                              ),
                              SettingOption(
                                  tapped: (){
                                    Navigator.pushNamed(context, Routes.groupsMgt);
                                  },
                                  icon: HugeIcons.strokeRoundedUserGroup,
                                  option: "Groups"),
                              SettingOption(
                                  tapped: (){
                                    Navigator.pushNamed(context, Routes.signatories);
                                  },
                                  icon: HugeIcons.strokeRoundedSignature,
                                  option: 'Signatories'),
                              SettingOption(
                                  tapped: (){
                                    Provider.of<WebviewProvider>(context,listen: false).setTitle(Strings.bankGptTitle);
                                    Provider.of<WebviewProvider>(context,listen: false).setLink(Strings.bankGpt);
                                    Navigator.pushNamed(context, Routes.bankGPT);
                                  },
                                  icon: HugeIcons.strokeRoundedHelpCircle,
                                  option: 'Help & Support'),
                              SettingOption(
                                  tapped: (){
                                    Provider.of<WebviewProvider>(context,listen: false).setTitle("Terms and Conditions");
                                    Provider.of<WebviewProvider>(context,listen: false).setLink(Strings.termsLink);
                                    Navigator.pushNamed(context, Routes.bankGPT);
                                  },
                                  icon: HugeIcons.strokeRoundedJusticeScale01,
                                  option: 'Terms & Conditions'),
                              Spaces.smallTopSpace,
                              AltGreenButton(
                                  text: 'Edit Profile',
                              tapped: (){
                                    Navigator.pushNamed(context, Routes.contact);
                              },
                              icon: Icons.edit),
                            ],
                          ),
                        ))
                  ],
                ),
              ),
            );
          }
        ));
  }
}
