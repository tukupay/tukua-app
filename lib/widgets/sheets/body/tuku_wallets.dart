import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
import '../../../constants/constants.dart';
import '../../../models/models.dart';

class TukuWallets extends StatelessWidget {
  final void Function() tapped;
  const TukuWallets({super.key,
  required this.tapped});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Consumer2<WalletProvider,PaymentsProvider>(
      builder: (_,wallets,payments,__) {
        return Flexible(
          child: Stack(
            children: [
              Column(
                children: [
                  Expanded(
                      child:
                      wallets.userWallets.isEmpty? EmptySheetWallets() :
                      ListView.builder(
                          itemCount: wallets.userWallets.length,
                          shrinkWrap: true,
                          padding: EdgeInsets.zero,
                          itemBuilder: (context,index){
                            FullWallet wallet=wallets.userWallets[index];
                            bool isSelected=payments.selectedSourceWallet?.id==wallet.id;
                            return GestureDetector(
                              onTap: (){
                                Provider.of<PaymentsProvider>(context,listen: false).selectSourceWallet(wallet);
                              },
                              child: Container(
                                  margin: Paddings.smallestAllSides,
                                  height: 75,
                                  width: size.width,
                                  padding: Paddings.smallestAllSides,
                                  decoration: BoxDecoration(
                                      color: isSelected?HexColor('#EE7D13').withAlpha(40):Colors.white,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(
                                          color: HexColor(isSelected?'#EE7D13':'#E4E4E4'),
                                          width: 2
                                      )
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Container(
                                        height: 56,width: 56,
                                        alignment: Alignment.center,
                                        decoration: BoxDecoration(
                                          borderRadius: BorderRadius.circular(6),
                                          color: Colors.white,
                                          border: Border.all(
                                              color:isSelected? HexColor('#EE7D13'):Colors.transparent,
                                              width: 1
                                          ),
                                        ),
                                        child: Container(
                                          height: 46,width: 46,
                                          decoration: BoxDecoration(
                                              image: DecorationImage(
                                                  image: AssetImage(Strings.iconImage('tuku.jpeg')),
                                                  fit: BoxFit.contain)
                                          ),
                                        ),
                                      ),
                                      Spaces.tinySideSpace,
                                      Expanded(
                                        child: Column(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(wallet.name??wallet.coopWallet?.alias??'coop wallet',
                                                style: Blacks.smallestBolderPoppins),
                                            Text('Purpose: ${wallet.coopWallet?.purposeTag}',
                                                style: Grays.smallestPoppinsHint),
                                            Text('Balance Ksh. ${formatThousands(amount:wallet.balance??0,
                                                noDecimal: true)}',style: Blacks.smallestBoldPoppins)
                                          ],
                                        ),
                                      ),
                                    ],
                                  )),
                            );
                          }))
                ],
              ),
              Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: Padding(
                      padding: Paddings.tinyAllSides,
                  child: SheetButton(
                      enabled: payments.selectedSourceWallet!=null,
                      text: "Next",
                  tapped: tapped)))
            ],
          ),
        );
      }
    );
  }
}
