import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
class MpesaNumber extends StatelessWidget {
  final TextEditingController phoneController;
  final void Function() tapped;
  const MpesaNumber({super.key,
  required this.phoneController,
  required this.tapped});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return SizedBox(
      child: Consumer<PaymentsProvider>(
          builder: (_,payments,__){
            return Padding(
              padding: Paddings.smallAllSides,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Enter your M-Pesa number",style: Blacks.smallestBolderPoppins),
                  Spaces.smallTopSpace,
                  LoanTextField(
                      controller: phoneController,
                      isNumber: true,
                      borderColor: AppColors.lightGray,
                      hint: '0701234567'),
                  Spaces.mediumTopSpace,
                  ListView.builder(
                      shrinkWrap: true,
                      itemCount: mpesaSteps.length,
                      itemBuilder: (context,index){
                        String step=mpesaSteps[index];
                        return Text('${index+1}. $step',style: Grays.smallestPoppinsHint);
                      }),
                  Spaces.mediumTopSpace,
                  Container(
                    padding: Paddings.smallestAllSides,
                decoration: BoxDecoration(
                border: Border.all(
                color: HexColor(AppColors.fadedOrange)),
                          color: HexColor(AppColors.fadedOrange2)),
                          child: RichText(
                text: TextSpan(text: 'Security Note: ',
                    style: Oranges.tinySemiRoboto,
                    children: [TextSpan(
                        text: "Your MPESA PIN is never requested on this app. You'll only enter it on your phone when prompted by the STK push notification. ")]))),
                  Spaces.mediumTopSpace,
                  SizedBox(
                    width: size.width,
                    child: SheetButton(
                        enabled: true,
                        tapped: tapped,
                        text: "Send Payment Request"),
                  )
                ],
              ),
            );
          }),
    );
  }
}

List<String> mpesaSteps=[
  "Click 'Send Payment Request' below",
  "You'll receive an MPESA STK push notification on your phone",
  "Enter your MPESA PIN on your phone (not here)",
  "Confirm the payment amount and recipient",
  "Payment will be processed automatically"
];
