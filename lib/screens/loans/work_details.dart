import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/widgets/widget.dart';

import '../../providers/providers.dart';
class WorkDetails extends StatelessWidget {
  const WorkDetails({super.key});

  @override
  Widget build(BuildContext context) {
    final companyController=TextEditingController();
    final statusController=TextEditingController();
    final salaryController=TextEditingController();
    return PopScope(
      onPopInvokedWithResult: (bool b,res){
        Provider.of<LoanProvider>(context,listen: false).goToStep(loanSteps[0]);
      },
      child: SizedBox(
        child:SingleChildScrollView(
          primary: true,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Spaces.smallTopSpace,
              Text('Company Name',style: Blacks.smallestBolderPoppins),
              Spaces.tinyTopSpace,
              LoanTextField(
                  controller: companyController,
                  hint: 'N/A'),
              Spaces.smallTopSpace,
              Text('Work Status',style: Blacks.smallestBolderPoppins),
              Spaces.tinyTopSpace,
              LoanTextField(
                  controller: statusController,
                  hint: 'N/A'),
              Spaces.smallTopSpace,
              Text('Salary Paid',style: Blacks.smallestBolderPoppins),
              Spaces.tinyTopSpace,
              LoanTextField(
                  controller: salaryController,
                  hint: 'N/A'),
              Spaces.smallTopSpace,
              Consumer<LoanProvider>(
                builder: (_,loans,__) {
                  return GridView.builder(
                    primary: false,
                    shrinkWrap: true,
                      itemCount: salaryBrackets.length,
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2,
                      childAspectRatio: 5/1,
                      mainAxisSpacing: 4,crossAxisSpacing: 4),
                      itemBuilder: (context,index){
                        String margin=salaryBrackets[index];
                        return GestureDetector(
                          onTap: (){
                            Provider.of<LoanProvider>(context,listen: false).setSalaryMargin(margin);
                          },
                          child: Container(
                            height: 35,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: loans.salaryMargin==margin?HexColor('#EDEBF2'):Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: HexColor('#A096BC').withAlpha(80),
                                  width: 1)
                            ),
                           child: Text(margin),
                          ),
                        );
                      });
                }
              ),
              Spaces.smallTopSpace,
              Text('Frequency of salary',style: Blacks.smallestBolderPoppins),
              Spaces.tinyTopSpace,
              LoanTextField(
                  controller: companyController,
                  hint: 'Monthly'),
            ],
          ),
        )
      ),
    );
  }
}
