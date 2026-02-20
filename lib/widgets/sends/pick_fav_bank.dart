import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

class PickFavBank extends StatefulWidget {
  final BuildContext favContext;
  const PickFavBank({super.key, required this.favContext});

  @override
  State<PickFavBank> createState() => _PickFavBankState();
}

class _PickFavBankState extends State<PickFavBank> {
  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Consumer<BankingProvider>(
        builder: (_, banking, __) {
      return Flexible(
        child: Stack(
          children: [
            Column(
              children: [
                Expanded(
                  child: banking.userBanks.isEmpty
                      ? EmptySheetBanks()
                      : ListView.builder(
                          itemCount: banking.userBanks.length,
                          shrinkWrap: true,
                          padding: EdgeInsets.zero,
                          itemBuilder: (context, index) {
                            FullBank bank = banking.userBanks[index];
                            bool isSelected = banking.selectedFav == bank;
                            return GestureDetector(
                              onTap: () {
                                Provider.of<BankingProvider>(context, listen: false).selectFavBank(bank);
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
                                        color: HexColor(
                                            isSelected ? '#EE7D13' : '#E4E4E4'),
                                        width: 2)),
                                child: Row(
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
                ),
                Spaces.largeTopSpace,
              ],
            ),
            Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Padding(
                    padding: Paddings.tinyAllSides,
                    child: banking.togglingFav?
                        Center(child: WaveDots()) : SheetButton(
                        enabled: banking.selectedFav != null,
                        text: "Set as favourite",
                        tapped: ()async{
                          Fluttertoast.cancel();
                          if(banking.selectedFav==null){
                            Fluttertoast.showToast(msg: "First select a bank");
                          }else{
                            await Provider.of<BankingProvider>(context,listen: false).toggleFavourite(banking.selectedFav!.id!);
                            Navigator.pop(widget.favContext);
                          }
                        })))
          ],
        ),
      );
    });
  }
}
