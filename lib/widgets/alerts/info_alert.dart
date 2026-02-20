import 'package:flutter/material.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/widgets/widget.dart';
import '../../models/models.dart';

class InfoAlert extends StatelessWidget {
  final bool isHome;
  final Animation<double> anim1;
  final bool isIndividual;
  final bool isBusiness;
  final bool isValidating;
  final bool isSuccess;
  final void Function()? tapped;
  final ValidationResponse? transaction;
  final PaymentResponse? payment;
  const InfoAlert({super.key,
  required this.anim1,
  this.isHome=false,
  this.isIndividual=false,
  this.isBusiness=false,
  this.isValidating=false,
  this.isSuccess=false,
    this.tapped,
  this.transaction,
  this.payment});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return SlideTransition(
        position: Tween(
          // -1 implies to "come" from up
          begin: const Offset(0, -1),
          end: const Offset(0, 0)
        ).animate(anim1),
    child: Stack(
      children: [
        // background overlay
        Container(
          color: Colors.black.withAlpha(180),
          width: double.infinity,
          height: double.infinity,
        ),
        // main content
        AlertDialog(
          insetPadding: Paddings.smallHorizontal,
          contentPadding: EdgeInsets.zero,
          elevation: 0,
          clipBehavior: Clip.antiAlias,
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          content: Container(
            height: isSuccess==true ? null : null,
            constraints: BoxConstraints(maxHeight: size.height * 0.85),
            padding: isValidating==true||isSuccess==true?
            EdgeInsets.zero:
            Paddings.tinyAllSides,
            width: size.width,
              child: isValidating==true?TransactionValidation(
                transaction: transaction!,
                text: 'Proceed',
                tapped: tapped!,
              ):
              isSuccess==true?CompletedTransaction(
                payment: payment!,
              ):
              isIndividual==true? IdInfo(isHome: isHome):
              isBusiness==true?BusinessInfo():Text('data')
          ),
        ),
      ],
    ),
    );
  }
}
