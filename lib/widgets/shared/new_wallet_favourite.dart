import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/widgets/widget.dart';
class NewWalletFavourite extends StatelessWidget {
  final void Function() method;

  final TextEditingController? nameController;
  final TextEditingController? phoneController;
  final TextEditingController? aliasController;

  const NewWalletFavourite({super.key,
  required this.method,
  required this.nameController,
  required this.phoneController,
  required this.aliasController,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("Wallet Name",style: Blacks.tinyBoldGrotesk),
          CurvedTextField(
              hint: "John's Wallet",
          canGoNext: true,
            controller: nameController,
            suffixIcon: HugeIcons.strokeRoundedUser),
          Spaces.smallTopSpace,
          Text('Phone Number',style: Blacks.tinyBoldGrotesk),
          CurvedTextField(
              hint: "0701234567",
          canGoNext: true,
          isNumber: true,
          controller: phoneController,
          suffixIcon: HugeIcons.strokeRoundedCall),
          Spaces.smallTopSpace,
          Text('Wallet Number',style: Blacks.tinyBoldGrotesk),
          CurvedTextField(
              hint: "G5TXY0",
          controller: aliasController,
          suffixIcon: HugeIcons.strokeRoundedWalletDone01),
          Spaces.smallTopSpace,
          Spaces.mediumTopSpace,
          Center(
            child: AltGreenButton(
                tapped: method,
                text: "Add Favourite"),
          )
        ],
      ),
    );
  }
}
