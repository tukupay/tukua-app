import 'package:dotted_border/dotted_border.dart';
import 'package:flutter/material.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/widgets/widget.dart';
class LoanReceipt extends StatelessWidget {
  const LoanReceipt({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Column(
      children: [
        ClipPath(
          clipper: ZigZagClipper(),
          child: Container(
            padding: Paddings.tinyAllSides,
            height: 450,
            width: size.width,
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              border: Border.all(
                color: Colors.black26,
                width: 1
              )
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Text('Loan Summary',style: Blacks.tinyBolderPoppins),
                Spaces.tinyTopSpace,
                DottedBorder(
                    child: SizedBox(
                      height: 0.1,width: size.width,
                    )),
                Spaces.smallTopSpace,
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Loan Amount',style: Blacks.smallestBoldPoppins),
                    Text('30,000 /=',style: Oranges.tinyPoppins)
                  ],
                ),
                Spaces.smallTopSpace,
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Loan Type',style: Blacks.smallestBoldPoppins),
                    Text('Short Term',style: Blacks.tinyBolderPoppins)
                  ],
                ),
                Spaces.smallTopSpace,
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Purpose Of Loan',style: Blacks.smallestBoldPoppins),
                    Text('School Fees',style: Blacks.tinyBolderPoppins)
                  ],
                ),
                Spaces.smallTopSpace,
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Next RepaymentDate',style: Blacks.smallestBoldPoppins),
                    Text('02/04/2024',style: Blacks.tinyBolderPoppins)
                  ],
                ),
                Spaces.smallTopSpace,
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Interest Rate',style: Blacks.smallestBoldPoppins),
                    Text('10%',style: Blacks.tinyBolderPoppins)
                  ],
                ),
                Spaces.smallTopSpace,
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Monthly Payment',style: Blacks.smallestBoldPoppins),
                    Text('KES 5,000',style: Blacks.tinyBolderPoppins)
                  ],
                ),
                Spaces.smallTopSpace,
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('No of Payments',style: Blacks.smallestBoldPoppins),
                    Text('24',style: Blacks.tinyBolderPoppins)
                  ],
                ),
                Spaces.smallTopSpace,
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Total Payback Amount',style: Blacks.smallestBoldPoppins),
                    Text('KES 40,000',style: Oranges.tinyPoppins)
                  ],
                ),
                Spaces.smallTopSpace,
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Guarantors',style: Blacks.smallestBoldPoppins),
                    Text('Alice Kimani',style: Blacks.tinyBolderPoppins)
                  ],
                ),
                Spaces.smallTopSpace,
              ],
            ),
          ),
        ),
        Spaces.smallTopSpace,
        Spaces.smallTopSpace,
        Center(
          child: AltGreenButton(
              tapped: (){
                showModalBottomSheet(
                    scrollControlDisabledMaxHeightRatio: 1/1,
                    context: context,
                    builder: (context){
                      return DecoratedSheet(
                        height: 350,
                        title: 'Select Method',
                        body: Text('pay now options'),
                      );
                    });
              },
              text: 'Pay Now'),
        ),
        Spaces.smallTopSpace,
      ],
    );
  }
}

class ZigZagClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    Path path = Path();
    path.lineTo(0, size.height);
    double x = 0;
    double y = size.height;
    double increment = size.width / 20;

    while (x < size.width) {
      x += increment;
      y = (y == size.height) ? size.height * .95 : size.height;
      path.lineTo(x, y);
    }
    path.lineTo(size.width, 0.0);

    path.close();
    return path;
  }

  @override
  bool shouldReclip(CustomClipper old) {
    return old != this;
  }
}
