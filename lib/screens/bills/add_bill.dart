import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

import '../../constants/constants.dart';
class AddBill extends StatelessWidget {
  const AddBill({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    final amountController=TextEditingController();
    final noteController=TextEditingController();
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
            onPressed: (){
              Navigator.pop(context);
            },
            icon: Icon(Icons.arrow_back,
                color: HexColor('#404040'))),
        title: Text('New Bill',
            style: Blacks.mediumSemiRoboto),
        centerTitle: true,
      ),
      body: Container(
        height: size.height,
        width: size.width,
        decoration: BoxDecoration(
          image: DecorationImage(
              image: AssetImage(Strings.imageAsset('bg.png')),
          fit: BoxFit.cover)
        ),
        child: Container(
          height: size.height,
          width: size.width,
          decoration: BoxDecoration(
            color: Colors.white.withAlpha(100),
            image: DecorationImage(
                image: AssetImage(Strings.imageAsset('gradient2.png')),
            fit: BoxFit.cover)
          ),
          child: Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: Paddings.smallAllSides,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header hint
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          color: HexColor(AppColors.primaryGreen).withAlpha(12),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: HexColor(AppColors.primaryGreen).withAlpha(30)),
                        ),
                        child: Row(
                          children: [
                            Icon(HugeIcons.strokeRoundedInformationCircle,
                                size: 18, color: HexColor(AppColors.primaryGreen)),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'Set up a bill reminder and we\'ll notify you before it\'s due.',
                                style: Blacks.smallestBoldPoppins.copyWith(
                                  fontWeight: FontWeight.w400,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Spaces.smallTopSpace,
                      LabeledField(
                        enabled: true,
                          label: 'Title',
                          hint: 'e.g. Rent, Electricity, Wi-Fi'),
                      Spaces.smallTopSpace,
                      LabeledField(
                        enabled: true,
                        label: 'Category',
                        hint: 'Select a category',
                      initialText: 'TODO Select a category',),
                      Spaces.smallTopSpace,
                      LabeledField(
                        enabled: true,
                        label: 'Payment Method',
                        hint: 'Select payment method',
                        initialText: 'TODO Paybill,Lipa na Mpesa,Send Money',),
                      Spaces.smallTopSpace,
                      Text('Amount',style: Blacks.smallestBolderPoppins),
                      CurrencyAmountField(controller: amountController),
                      Spaces.smallTopSpace,
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Flexible(
                              child: LabeledField(
                                  label: "Due Date",
                                  hint: "Select due date",
                                  enabled: true)),
                          Spaces.tinySideSpace,
                          Flexible(
                              child: LabeledField(
                                  label: "Frequency",
                                  hint: "How often?",
                                  enabled: true)),
                        ],
                      ),
                      Spaces.smallTopSpace,
                      Text('Reminder Type',style: Blacks.smallestBolderPoppins),
                      Spaces.tinyTopSpace,
                      Consumer<BillsProvider>(
                          builder: (_,billsProvider,__) {
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
                                          Provider.of<BillsProvider>(context,listen: false).selectReminderType(reminder);
                                        },
                                        child: ChoiceChip(
                                            selectedColor: HexColor(AppColors.primaryGreen).withAlpha(30),
                                            backgroundColor: HexColor('#F5F6F5'),
                                            shape: RoundedRectangleBorder(
                                              borderRadius: BorderRadius.circular(20),
                                              side: BorderSide(
                                                color: billsProvider.reminderType==reminder
                                                    ? HexColor(AppColors.primaryGreen)
                                                    : HexColor('#E0E0E0'),
                                              ),
                                            ),
                                            label: Text(reminder, style: TextStyle(
                                              fontSize: 12,
                                              color: billsProvider.reminderType==reminder
                                                  ? HexColor(AppColors.primaryGreen)
                                                  : HexColor('#666666'),
                                              fontWeight: billsProvider.reminderType==reminder
                                                  ? FontWeight.w600 : FontWeight.w400,
                                            )),
                                            selected: billsProvider.reminderType==reminder),
                                      ),
                                    );
                                  }),
                            );
                          }
                      ),
                      Spaces.smallTopSpace,
                      LabeledField(
                        label: 'Additional Notes (Optional)',
                          enabled: true,
                          controller: noteController,
                          multiLine: true,
                          hint: 'Add any notes or references')
                    ],
                  ),
                ),
              ),
              Padding(
                padding: Paddings.smallAllSides,
                child: AltGreenButton(
                    tapped: (){
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
                                  title: 'Bill Created!',
                                  content: 'Your bill reminder has been set up. You\'ll be notified before it\'s due.',
                                  tapped: (){
                                    Navigator.pop(context);
                                    Navigator.pop(context);
                                  },
                                  anim1: anim1),);
                          }
                      );
                    },
                    text: 'Create Bill'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
