import 'package:easy_stepper/easy_stepper.dart';
import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/screens/screens.dart';
import 'package:tuku/widgets/widget.dart';
class ApplyLoan extends StatelessWidget {
  const ApplyLoan({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Consumer<LoanProvider>(
      builder: (_,loanProvider,__) {
        return PopScope(
          onPopInvokedWithResult: (bool b,res){
            if(loanProvider.activeStep!=loanSteps[0]){
              Provider.of<LoanProvider>(context,listen: false).resetOption();
            }
          },
          canPop: loanProvider.activeStep!=loanSteps[0]?false:true,
          child: Scaffold(
              appBar: AppBar(
                leading: IconButton(
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    icon: Icon(Icons.arrow_back, color: HexColor('#404040'))),
                title: Text('Loans', style: Blacks.mediumSemiRoboto),
                centerTitle: true,
                actions: [
                  IconButton(
                      onPressed: (){
                        Navigator.pushNamed(context, Routes.notifications);
                      },
                      icon: const Icon(Icons.notifications,color: Colors.black)),
                  Spaces.smallSideSpace,
                ],
              ),
            body: Container(
              height: size.height,
              width: size.width,
              decoration: BoxDecoration(
                  image: DecorationImage(
                      image:AssetImage(Strings.imageAsset('bg.png')),
                      fit: BoxFit.cover)
              ),
              padding: Paddings.smallAllSides,
              child: Consumer<LoanProvider>(
                builder: (_,loanProvider,__) {
                  return Column(
                    children: [
                      Text('Complete the steps below to receive your loan',
                      style: Blacks.smallestBoldPoppins),
                      SizedBox(
                        height: 60,
                        child: EasyStepper(
                          activeStep: loanSteps.indexOf(loanProvider.activeStep),
                            lineStyle: LineStyle(
                              lineType: LineType.normal,
                              lineLength: size.width/4,
                              lineThickness: 2,
                              defaultLineColor: HexColor('#15411D'),
                              finishedLineColor: HexColor('#EE7D13')
                            ),
                          finishedStepBackgroundColor: Colors.transparent,
                          activeStepTextColor: Colors.black87,
                          finishedStepTextColor: Colors.black87,
                          internalPadding: 0,
                          showLoadingAnimation: false,
                          stepRadius: 16,
                          showStepBorder: false,
                          steps: [
                            EasyStep(
                              customStep: Icon(
                                HugeIcons.strokeRoundedTimeHalfPass,
                                color: loanSteps.contains(loanProvider.activeStep) ? HexColor('#EE7D13'):Colors.black,
                              ),
                              title: loanSteps[0],
                            ),
                            EasyStep(
                              customStep: Icon(
                                HugeIcons.strokeRoundedTimeHalfPass,
                                color: loanSteps.indexOf(loanProvider.activeStep) >= 1 ? HexColor('#EE7D13'):Colors.black,
                              ),
                              title: loanSteps[1],
                            ),
                            EasyStep(
                              customStep: Icon(
                                HugeIcons.strokeRoundedTimeHalfPass,
                                color: loanSteps.indexOf(loanProvider.activeStep) >= 2 ? HexColor('#EE7D13'):Colors.black,
                              ),
                              title: loanSteps[2],
                            ),
                          ]),
                      ),
                      Spaces.smallTopSpace,
                      Expanded(
                          child: loanProvider.activeStep==loanSteps[0]?
                          LoanDetails():
                          loanProvider.activeStep==loanSteps[1]?
                          WorkDetails():
                          loanProvider.activeStep==loanSteps[2]?
                          GuarantorDetails():
                          const SizedBox()),
                      Spaces.smallTopSpace,
                      AltGreenButton(
                          tapped: (){
                            if(loanProvider.activeStep==loanSteps[0]){
                              Provider.of<LoanProvider>(context,listen: false).goToStep(loanSteps[1]);
                            }else if(loanProvider.activeStep==loanSteps[1]){
                              Provider.of<LoanProvider>(context,listen: false).goToStep(loanSteps[2]);
                            }else{
                              showGeneralDialog(
                                  context: context,
                                  pageBuilder: (context,anim1,anim2){
                                    return const SizedBox();
                                  },
                              transitionDuration: const Duration(milliseconds: 400),
                                transitionBuilder: (context,anim1,anim2,child){
                                    return SlideTransition(
                                        position: Tween(
                                          begin: const Offset(1, 0),
                                          end: const Offset(0, 0)
                                        ).animate(anim1),
                                    child: SuccessAlert(
                                        title: 'Loan Request Submitted!',
                                        content: 'You will receive a confirmation/denial message in your notification module and phone number.',
                                        tapped: (){
                                          Navigator.pop(context);
                                          Provider.of<LoanProvider>(context,listen: false).resetSteps();
                                          Provider.of<LoanProvider>(context,listen: false).resetOption();
                                          Navigator.pop(context);
                                        },
                                        anim1: anim1),);
                                }
                              );
                            }
                          },
                          text: loanProvider.activeStep==loanSteps[2]?'Submit': 'Save & Next')
                    ],
                  );
                }
              ),
            )
          ),
        );
      }
    );
  }
}
