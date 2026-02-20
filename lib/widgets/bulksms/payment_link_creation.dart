import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import '../../providers/providers.dart';
import '../../constants/constants.dart';
import '../../widgets/widget.dart';

class PaymentLinkCreation extends StatefulWidget {
  const PaymentLinkCreation({super.key});

  @override
  State<PaymentLinkCreation> createState() => _PaymentLinkCreationState();
}

class _PaymentLinkCreationState extends State<PaymentLinkCreation> {

  TextEditingController amountController=TextEditingController();
  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Consumer2<WalletProvider,BulkSmsProvider>(
          builder: (_,wallets,bulksms,__) {
            return Container(
                padding: Paddings.smallestAllSides,
                width: size.width,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    WalletSelectorCard(
                      selectedWallet: bulksms.selectedWallet,
                      wallets: wallets.userWallets,
                      onSelected: (wallet) {
                        bulksms.setWallet(wallet);
                      },
                      label: 'Which wallet should receive the money?',
                      sheetTitle: 'Collection Wallet',
                      sheetSubtitle: 'Where payment will be collected',
                      isSource: false,
                    ),
                    Spaces.smallTopSpace,
                    LabeledField(
                        label: "Amount",
                        isNumber: true,
                        hint: "eg 500",
                        controller: amountController,
                        changed: (val){
                          if(val==null){
                            bulksms.setAmount(0);
                          }else if(val.isEmpty){
                            bulksms.setAmount(0);
                          }else{
                            bulksms.setAmount(double.parse(val));
                          }},
                            enabled: true),
                    Spaces.tinyTopSpace,
                    bulksms.amount>0&&bulksms.selectedWallet!=null?
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Icon(HugeIcons.strokeRoundedWalletDone01,color: HexColor(AppColors.darkerGray),size: 18),
                        Spaces.smallSideSpace,
                        Expanded(
                          child: Text('Recipients will be able to top up Ksh. ${formatThousands(amount: bulksms.amount,noDecimal: true)} to your ${bulksms.selectedWallet?.name??''} wallet',
                          style: Grays.tinyPoppinsHint),
                        ),
                      ],
                    ):const SizedBox()
                  ],
                ));
          }
        ),
        Spaces.smallTopSpace,
        Green(),
      ],
    );
  }
}
