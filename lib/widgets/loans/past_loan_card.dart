import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:intl/intl.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
class PastLoanCard extends StatelessWidget {
  final Loan loan;
  final int index;
  const PastLoanCard({super.key,
  required this.loan,
  required this.index});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
      margin: Paddings.tinyVertical,width: size.width,
      decoration: BoxDecoration(
        color:index%2==0?Colors.white:HexColor('#E7CD38').withAlpha(30),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(
          color: index%2==0? HexColor('#E0E8F2'):
              HexColor('#E7CD38').withAlpha(30)
        )
      ),
      padding: Paddings.tinyAllSides,
      child: Row(
        children: [
          Container(
            height: 45,width: 45,
            decoration: BoxDecoration(
              image: DecorationImage(
                  image: AssetImage(loan.icon),
              fit: BoxFit.cover)
            ),
          ),
          Spaces.smallSideSpace,
          Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(loan.name,style: Blacks.regularBoldGrotesk),
                  Spaces.tinyTopSpace,
                  Text(loan.paymentUsed,style: Blacks.smallestBoldPoppins),
                  Text('Transaction ID',style: Grays.tinyPoppinsHint),
                  Text(loan.transactionId,style: Blacks.smallestBoldPoppins)
                ],
              )),
          Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('KSH ${formatThousands(amount: loan.amount.toDouble())}',
              style: Blacks.regularBoldGrotesk),
              Container(
                height: 14,width: 64,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(4),
                  color: loan.completed==true?
                      HexColor('#00FF94').withAlpha(30):
                      HexColor('#FFB800').withAlpha(20)
                ),
                alignment: Alignment.center,
                child: Text(loan.completed==true?'completed':'pending',
                style: TextStyle(
                  color: loan.completed==true?HexColor('#5DC486'):
                  HexColor('#F49A47'),
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  fontFamily: GoogleFonts.spaceGrotesk().fontFamily
                ),),
              ),
             Text(DateFormat.yMMMd()
                 .format(DateTime
                 .fromMillisecondsSinceEpoch(loan.time)),
             style: Grays.smallRoboto),
              Text(DateFormat.jm()
                  .format(DateTime
                  .fromMillisecondsSinceEpoch(loan.time)),
              style: Grays.smallRoboto)
            ],
          )
        ],
      ),
    );
  }
}
