import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/routes.dart';
import '../../constants/constants.dart';
import '../../models/models.dart';
import '../../widgets/widget.dart';
import '../../providers/providers.dart';

class MyWallets extends StatelessWidget {
  const MyWallets({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
      height: size.height,
      width: size.width,
      padding: Paddings.smallAllSides,
      child: Flex(
          direction: Axis.vertical,
      children: [
        Expanded(
            child: Consumer<WalletProvider>(
                builder: (_,walletsProvider,__){
                  return walletsProvider.userWallets.isEmpty?
                      emptyWallets(context):
                      walletsProvider.loadingWallets?
                          ListView.builder(
                            itemCount: 5,
                              shrinkWrap: true,
                              itemBuilder: (context,index){
                              return MyWalletCardShimmer(index: index, size: size);
                              }):
                      ListView.builder(
                        itemCount: walletsProvider.userWallets.length,
                          shrinkWrap: true,
                          itemBuilder: (context,index){
                          FullWallet wallet=walletsProvider.userWallets[index];
                            return MyWalletCard(index: index,wallet: wallet,);
                          });
                })),
        DottedButton(
            tapped: (){
              Navigator.pushNamed(context, Routes.newWallet);
            },
            text: "Add new Wallet")
      ],
      ),
    );
  }
}

Widget emptyWallets(BuildContext context){
  final size=MediaQuery.of(context).size;
  return SizedBox(
      width: size.width,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: HexColor(AppColors.primaryGreen).withAlpha(15),
              shape: BoxShape.circle,
            ),
            child: Icon(
              HugeIcons.strokeRoundedWalletNotFound01,
              size: 40,
              color: HexColor(AppColors.darkerGray2),
            ),
          ),
          Spaces.smallTopSpace,
          Text("No wallets created",
              style: Blacks.regularBoldCodeNext),
          const SizedBox(height: 6),
          Text('Tap "Add new Wallet" below to get started',
              style: Grays.smallestPoppinsHint,
              textAlign: TextAlign.center)
        ],
      ));
}
