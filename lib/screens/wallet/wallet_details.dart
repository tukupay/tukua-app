import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/routes.dart';
import '../../widgets/widget.dart';
import '../../constants/constants.dart';
import '../../providers/providers.dart';

class WalletDetails extends StatelessWidget {
  final TextEditingController? nameController;
  final TextEditingController? settlementAmount;
  const WalletDetails({super.key,
  this.nameController,
  this.settlementAmount});

  @override
  Widget build(BuildContext context) {
    return Consumer2<WalletProvider,BankingProvider>(
      builder: (_,wallet,banking,__) {
        return SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Wallet Details',style: Blacks.smallestBolderPoppins),
              // Spaces.smallTopSpace,
              LabeledField(
                changed: (str){
                  Provider.of<WalletProvider>(context,listen: false).updateWalletName(str??'');
                },
                label: 'Wallet Name',
                hint: 'eg Coop Savings Account',
                initialText: nameController?.text,
                enabled: true,
                controller: nameController,
              ),
              Spaces.smallTopSpace,
              SimpleSelectorCard<WalletType>(
                selectedItem: wallet.selectedType,
                items: wallet.walletTypes,
                onSelected: (type) {
                  Provider.of<WalletProvider>(context, listen: false).selectedWalletType(type);
                },
                itemLabelBuilder: (WalletType type) => type.name,
                label: 'Wallet Purpose',
                sheetTitle: 'Select Wallet Purpose',
                sheetSubtitle: 'What will this wallet be used for?',
                icon: HugeIcons.strokeRoundedWallet03,
              ),
              Spaces.smallTopSpace,
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                      child:Text('Would you like to auto settle your balance to your bank account ?',
                          style: Grays.smallestPoppinsHint)
                  ),
                  Spaces.smallSideSpace,
                  Switch(
                      activeTrackColor: HexColor(AppColors.primaryGreen),
                      value: wallet.autoSettle,
                      onChanged: (val){
                        Provider.of<WalletProvider>(context,listen: false).toggleAutoSettle(val);
                      })
                ],
              ),
              Spaces.smallTopSpace,
              wallet.autoSettle
                  ? Text('Settling Bank Account', style: Blacks.smallestBolderPoppins)
                  : const SizedBox(),
              Spaces.smallTopSpace,
              wallet.autoSettle
                  ? banking.userBanks.isEmpty
                      ? noBanks(context)
                      : UserBankSelectorCard(
                          selectedBank: wallet.selectedBank,
                          userBanks: banking.userBanks,
                          onSelected: (bank) {
                            Provider.of<WalletProvider>(context, listen: false).selectBank(bank);
                          },
                          label: 'Settlement Bank',
                          sheetTitle: 'Select Settlement Bank',
                          sheetSubtitle: 'Funds will be transferred to this account',
                        )
                  : const SizedBox(),
              Spaces.smallTopSpace,
              wallet.autoSettle?
              LabeledField(
                  controller: settlementAmount,
                  label: 'Auto Settlement Amount',
                  hint: 'e.g 5000',
                  changed: (val){
                    Provider.of<WalletProvider>(context,listen: false).updateSettleAmount(val??'0');
                  },
                  isNumber: true,
                  enabled: true):const SizedBox(),
              Spaces.smallTopSpace,
            ],
          ),
        );
      }
    );
  }
}

Widget noBanks(BuildContext context){
  final size=MediaQuery.of(context).size;
  return Column(
    children: [
      Row(
        children: [
          Icon(HugeIcons.strokeRoundedHelpCircle,color: HexColor(AppColors.lightGray)),
          Spaces.smallSideSpace,
          Expanded(child: Text('To settle your wallet funds directly to your bank account, you need to add a bank account',
          style: Grays.smallestPoppinsHint))
        ],
      ),
      Spaces.smallTopSpace,
      SizedBox(
        width: size.width/2,
        child: AuthButton(
          color: AppColors.primaryGreen,
            tapped: (){
            Navigator.pushNamed(context, Routes.newBank);
        }, text: 'ADD BANK ACCOUNT'),
      )
    ],
  );
}

Widget hint(String text){
  return Row(
    children: [
      Icon(Icons.info_outline,size: 16,color: HexColor(AppColors.darkerGray)),
      Spaces.tinySideSpace,
      Expanded(child: Text(text,style: Grays.smallestSemiKarla))
    ],
  );
}
