import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
class CreateWallet extends StatelessWidget {
  const CreateWallet({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return  Consumer<ProfileProvider>(
      builder: (_,profile,__) {
        return Container(
          padding: Paddings.smallHorizontal,
          margin: EdgeInsets.symmetric(horizontal: 4),
          decoration: BoxDecoration(
              border: Border.all(
                  color: HexColor('#15411D'),
                  width: 1
              ),
              borderRadius: BorderRadius.circular(14)
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Text('Add a bank account or create wallet',
              //     style: Grays.smallGrotesk),
              Spaces.tinyTopSpace,
              Flex(
                direction: Axis.horizontal,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // add bank account
                  Flexible(
                    flex: 1,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Text('Your money will be sent to your bank account',
                        style: Grays.smallerGrotesk,
                        textAlign: TextAlign.center),
                        Spaces.tinyTopSpace,
                        GestureDetector(
                          onTap: (){
                            if(profile.user?.profileImg==null){
                              Fluttertoast.cancel();
                              Fluttertoast.showToast(msg: 'Complete your KYC to create a wallet');
                            } else{
                              Navigator.pushNamed(context, Routes.newBank);
                            }
                          },
                          child: Container(
                            width: 105,
                            alignment: Alignment.center,
                            padding: Paddings.tinyAllSides,
                            decoration: BoxDecoration(
                                border: Border.all(
                                    color: Colors.grey
                                ),
                                color: HexColor('#15411D').withAlpha(15),
                                borderRadius: BorderRadius.circular(5)
                            ),
                            child: Text('Add Bank',style: Greens.smallBoldInter),
                          ),
                        ),
                        Spaces.tinyTopSpace,
                        Text('eg Coop Bank Account, KCB Account etc',
                            style: Grays.smallestSemiKarla,
                        textAlign: TextAlign.center)
                      ],
                    ),
                  ),
                  Spaces.tinySideSpace,
                  // create wallet
                  Flexible(
                    flex: 1,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Text('Create a new wallet to manage your funds',
                            style: Grays.smallerGrotesk,
                          textAlign: TextAlign.center),
                        Spaces.tinyTopSpace,
                        GestureDetector(
                          onTap: (){
                            if(profile.user?.profileImg==null){
                              Fluttertoast.cancel();
                              Fluttertoast.showToast(msg: 'Complete your KYC to create a wallet');
                            }else{
                              Navigator.pushNamed(context, Routes.newWallet);
                            }
                          },
                          child: Container(
                            width: 105,
                            alignment: Alignment.center,
                            padding: Paddings.tinyAllSides,
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: Colors.grey
                              ),
                              color: HexColor('#15411D').withAlpha(15),
                              borderRadius: BorderRadius.circular(5)
                            ),
                            child: Text('Add Wallets',style: Greens.smallBoldInter),
                          ),
                        ),
                        Spaces.tinyTopSpace,
                        Text('eg Savings, Church Expenses etc',
                            style: Grays.smallestSemiKarla,
                        textAlign: TextAlign.center)
                      ],
                    ),
                  ),
                ],
              ),
              Spaces.smallTopSpace,
            ],
          ),
        );
      }
    );
  }
}
