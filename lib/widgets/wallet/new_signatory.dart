import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
import '../../models/models.dart';

class NewSignatory extends StatelessWidget {
  final Signatory signatory;
  final int index;
  const NewSignatory({super.key,
  required this.signatory,
  required this.index});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
      margin: EdgeInsets.symmetric(vertical: 2),
      padding: Paddings.tinyAllSides,
      decoration: BoxDecoration(
        border: Border.all(
          color: HexColor(AppColors.darkerGray),
        ),
        borderRadius: BorderRadius.circular(14)
      ),
      width: size.width,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(signatory.fullName!,style: Blacks.regularBoldGrotesk),
              Spaces.tinyTopSpace,
              Text(signatory.role!,style: Grays.smallestPoppinsHint)
            ],
          ),
          IconButton(
              icon:Icon(HugeIcons.strokeRoundedDelete02),
              color: HexColor(AppColors.red),
          onPressed: (){
                showAdaptiveDialog(
                    context: context,
                    builder: (context)=>ConfirmAlert(
                      text: 'Remove Member',
                      pressed: (){
                        Provider.of<WalletProvider>(context,listen: false).removeSignatory(index);
                        Navigator.pop(context);
                      },
                    ));
          },
          )
        ],
      ),
    );
  }
}
