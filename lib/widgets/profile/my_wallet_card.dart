import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import '../../constants/constants.dart';
import '../../models/models.dart';

class MyWalletCard extends StatelessWidget {
  final FullWallet wallet;
  final int index;
  const MyWalletCard({super.key,
    required this.wallet,
  required this.index});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return GestureDetector(
      onTap: (){
        Provider.of<WalletProvider>(context,listen: false).selectWallet(wallet);
        Navigator.pushNamed(context, Routes.myWalletDetails);
      },
      child: Container(
        padding: Paddings.tinyAllSides,
        margin: Paddings.tinyVertical,
        decoration: BoxDecoration(
            color: index%2==0? Colors.white:HexColor('#FCF9E5'),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              width: wallet.isPrimary==true?3:1,
                color: wallet.isPrimary==true?
                    HexColor(AppColors.primaryOrange)
                    : HexColor('#E4E4E4')
            )
        ),
        // height: 97,
        width: size.width,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              alignment: Alignment.center,
              height: 55,width: 55,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                color: HexColor(AppColors.lightestGray),
              ),
              child: Icon(HugeIcons.strokeRoundedWallet01),
            ),
            Spaces.smallSideSpace,
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text("Account Name",style: Blacks.tinyRoboto),
                      Text(wallet.name??'-',style: Blacks.smallestBoldPoppins),
                    ],
                  ),
                  Spaces.tinyTopSpace,
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Available balance',style: Grays.tinyPoppinsHint,),
                      Text('Ksh ${formatThousands(amount: wallet.balance??0)}',
                        style: Oranges.tinyPoppins,
                      ),
                    ],
                  ),
                  Spaces.tinyTopSpace,
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Purpose',style: Grays.tinyPoppinsHint),
                      Text(wallet.coopWallet?.purposeTag??'-',
                          style: Oranges.tinyPoppins)
                    ],
                  ),
                  Spaces.tinyTopSpace,
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Associated Bank',style: Grays.tinyPoppinsHint),
                      Text(wallet.bankAccount?.bankName??wallet.bank??'--',
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: HexColor(AppColors.primaryOrange),
                            fontSize: 8))
                    ],
                  ),
                  Spaces.tinyTopSpace,
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Alias',style: Grays.tinyPoppinsHint),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          GestureDetector(
                              onTap: ()async{
                                Fluttertoast.cancel();
                                await Clipboard.setData(ClipboardData(text: wallet.alias??'alias'));
                                Fluttertoast.showToast(msg: "Copied to clipboard");
                              },
                              child: Container(
                                padding: Paddings.smallestAllSides,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: HexColor(AppColors.lightestGray)),
                                  child: Icon(Icons.copy,size: 12))),
                          Spaces.smallSideSpace,
                          Text(wallet.alias??'--',
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                  color: HexColor(AppColors.primaryOrange),
                                  fontSize: 8)),
                        ],
                      )
                    ],
                  )
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
