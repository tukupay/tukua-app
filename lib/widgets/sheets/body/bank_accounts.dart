import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/models/bank/bank.dart';
import 'package:tuku/providers/providers.dart';
import '../../../constants/constants.dart';
import '../../../widgets/widget.dart';

class BankAccounts extends StatelessWidget {
  final void Function() tapped;
  const BankAccounts({super.key,
    required this.tapped});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Consumer2<BankingProvider,PaymentsProvider>(
        builder: (_,banking,payments,__){
          return Stack(

            alignment: Alignment.bottomCenter,
            children: [
              banking.userBanks.isEmpty
                  ? EmptySheetBanks()
                  : ListView.builder(
                      itemCount: banking.userBanks.length,
                      shrinkWrap: true,
                      padding: EdgeInsets.only(bottom: 80),
                      itemBuilder: (context, index) {
                          FullBank bank = banking.userBanks[index];
                          bool isSelected = payments.selectedSourceBank == bank;
                          return GestureDetector(
                            onTap: () {
                              Provider.of<PaymentsProvider>(context, listen: false)
                                  .selectSourceBank(bank);
                            },
                            child: Container(
                              margin: Paddings.smallestAllSides,
                              height: 75,
                              width: size.width,
                              padding: Paddings.smallestAllSides,
                              decoration: BoxDecoration(
                                  color: isSelected
                                      ? HexColor('EE7D13').withAlpha(40)
                                      : Colors.white,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                      color: HexColor(isSelected ? '#EE7D13' : '#E4E4E4'),
                                      width: 2)),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    height: 56,
                                    width: 56,
                                    alignment: Alignment.center,
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(6),
                                      color: Colors.white,
                                      border: Border.all(
                                          color: isSelected
                                              ? HexColor('#EE7D13')
                                              : Colors.transparent,
                                          width: 1),
                                    ),
                                    child: Container(
                                      height: 46,
                                      width: 46,
                                      decoration: BoxDecoration(
                                          image: DecorationImage(
                                              image: AssetImage(
                                                  Strings.iconImage('bank.webp')),
                                              fit: BoxFit.contain)),
                                    ),
                                  ),
                                  Spaces.tinySideSpace,
                                  Expanded(
                                      child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(bank.bankName ?? 'Bank',
                                          style: Blacks.smallestBolderPoppins),
                                      Text(bank.accountName ?? "Jame",
                                          style: Grays.smallestPoppinsHint),
                                      Text(
                                          hideMiddleCharacters(
                                              bank.accountNumber ?? '0000000000'),
                                          style: Grays.smallestPoppinsHint),
                                    ],
                                  ))
                                ],
                              ),
                            ),
                          );
                        }),
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: Container(
                  color: Colors.white,
                  padding: Paddings.tinyAllSides,
                  child: SheetButton(
                      enabled: true,
                      text: "Next",
                      tapped: tapped),
                ),
              ),
            ],
          );
        });
  }
}
