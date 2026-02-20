import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/widgets/widget.dart';
import '../../providers/providers.dart';

class LoanDetails extends StatefulWidget {
  const LoanDetails({super.key});

  @override
  State<LoanDetails> createState() => _LoanDetailsState();
}

class _LoanDetailsState extends State<LoanDetails> {
  final amountController=TextEditingController();
  final noteController=TextEditingController();
  final scheduleController=TextEditingController();
  final durationController=TextEditingController();
  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
      return SizedBox(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Amount',style: Blacks.smallestBolderPoppins),
                    Spaces.tinyTopSpace,
                    CurrencyAmountField(controller: amountController),
                    Spaces.smallTopSpace,
                    Text('Loan Type',style: Blacks.smallestBolderPoppins),
                    Spaces.tinyTopSpace,
                    Container(
                      height: 55,width: size.width,
                      alignment: Alignment.center,
                      child: Consumer<LoanProvider>(
                          builder: (_,loans,__) {
                            return DropdownMenu<String>(
                              textAlign: TextAlign.start,
                              textStyle: Blacks.regularCairo,
                              initialSelection: loans.loanType??loanTypes[0],
                              onSelected: (val){
                                if(val!=null){
                                  Provider.of<LoanProvider>(context,listen: false).setLoanType(val);
                                }
                              },
                              trailingIcon: const Icon(Icons.keyboard_arrow_down,
                                  color: Colors.black),
                              expandedInsets: EdgeInsets.zero,
                              dropdownMenuEntries:loanTypes
                                  .map((element)=>
                                  DropdownMenuEntry(
                                      value: element,
                                      trailingIcon: Checkbox(
                                          value: loans.loanType==element,
                                          onChanged: (val){
                                            if(val==true){
                                              Provider.of<LoanProvider>(context,listen: false).setLoanType(element);
                                            }
                                          }),
                                      label: element)).toList(),
                            );
                          }
                      ),
                    ),
                    Spaces.smallTopSpace,
                    Text('Loan Duration',style: Blacks.smallestBolderPoppins),
                    Spaces.tinyTopSpace,
                    LoanTextField(
                        controller: amountController,
                        hint: 'Enter duration here',
                    enabled: false,),
                    Text('Your Duration Limit is 6 Months',style: Oranges.tinyPoppins),
                    Spaces.smallTopSpace,
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Schedule Payment',style: Blacks.smallestBolderPoppins),
                            SizedBox(
                                width: 150,
                                child: LoanTextField(controller: scheduleController, hint: 'KSH 4,500'))
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('How Often?',style: Blacks.smallestBolderPoppins),
                            SizedBox(
                                width: 150,
                                child: LoanTextField(controller: durationController, hint: 'Choose duration'))
                          ],
                        )
                      ],
                    ),
                    Spaces.smallTopSpace,
                    Text('Reminder Type',style: Blacks.smallestBolderPoppins),
                    Spaces.tinyTopSpace,
                    Consumer<LoanProvider>(
                      builder: (_,loans,__) {
                        return SizedBox(
                          height: 40,
                          child: ListView.builder(
                            itemCount: reminderTypes.length,
                              shrinkWrap: true,
                              scrollDirection: Axis.horizontal,
                              itemBuilder: (context,index){
                              String reminder=reminderTypes[index];
                              return Padding(
                                padding: Paddings.tinyHorizontal,
                                child: GestureDetector(
                                  onTap: (){
                                    Provider.of<LoanProvider>(context,listen: false).setReminderType(reminder);
                                  },
                                  child: ChoiceChip(
                                      selectedColor: HexColor('#EDEBF2'),
                                      label: Text(reminder),
                                      selected: loans.reminderType==reminder),
                                ),
                              );
                              }),
                        );
                      }
                    ),
                    Spaces.smallTopSpace,
                    Text('Additional Notes (Optional)',style: Blacks.smallestBolderPoppins),
                    LoanTextField(
                        controller: noteController,
                        multiline: true,
                        hint: 'Additional notes here')
                  ],
                ),
              ),
            ),
            // AltGreenButton(
            //     tapped: (){},
            //     text: 'Save & Next')
          ],
        ),
      );
  }
}
