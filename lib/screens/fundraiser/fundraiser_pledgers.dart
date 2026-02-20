import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import '../../widgets/widget.dart';

class FundraiserPledgers extends StatefulWidget {
  const FundraiserPledgers({super.key});

  @override
  State<FundraiserPledgers> createState() => _FundraiserPledgersState();
}

class _FundraiserPledgersState extends State<FundraiserPledgers> {

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_)async{
      await Provider.of<FundraiserProvider>(context,listen: false).getFundraiserPledges();
    });
  }

  final nameController=TextEditingController();
  final phoneController=TextEditingController();
  final emailController=TextEditingController();
  final amountController=TextEditingController();
  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text("Pledges",style: Blacks.mediumSemiRubik),
      ),
      body: Consumer<FundraiserProvider>(
        builder: (_,fundraiserProvider,__) {
          return Container(
            padding: Paddings.smallAllSides,
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    child: Row(
                        children: [
                          // Search
                          Expanded(
                              child: AuthTextField(
                                  hint: 'Search Pledges')),
                          Spaces.tinySideSpace,
                          // sort groups btn
                          GestureDetector(
                              onTap: () {},
                              child: Container(
                                height: 42,
                                width: 42,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                    border: Border.all(color: HexColor('#E0E8F2')),
                                    borderRadius: BorderRadius.circular(8)),
                                child: Icon(HugeIcons.strokeRoundedPreferenceHorizontal,
                                    color: Colors.black),
                              )),
                        ]
                    ),
                  ),
                  Spaces.smallTopSpace,
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      ActionChip(
                        labelStyle: Blacks.tinyBolderPoppins,
                          label: Text('Pledges: ${fundraiserProvider.campaignPledges.length}'),
                        color: WidgetStatePropertyAll(Colors.white),
                        backgroundColor: Colors.white,),
                      AddButton(
                        color: AppColors.primaryGreen,
                          tapped: (){
                            showModalBottomSheet(
                              isScrollControlled: true,
                              scrollControlDisabledMaxHeightRatio: 1/1,
                              context: context,
                              builder: (context){
                                return Padding(
                                    padding: EdgeInsets.only(
                                      bottom: MediaQuery.of(context).viewInsets.bottom
                                    ),
                                child: PlainSheet(
                                    title: "Add Pledge",
                                    subTitle: "Add new pledges and edit them later",
                                    body: NewPledgerForm(
                                      nameController: nameController,
                                      phoneController:phoneController,
                                      emailController: emailController,
                                      amountController: amountController,
                                      tapped: ()async{
                                        if(nameController.text.isEmpty){
                                          Fluttertoast.cancel();
                                          Fluttertoast.showToast(msg: "Enter the name of the pledger");
                                        }else if(!Strings.emailRegEx.hasMatch(emailController.text)){
                                          Fluttertoast.cancel();
                                          Fluttertoast.showToast(msg: "Enter a valid email address");
                                        }else if(phoneController.text.length!=10){
                                          Fluttertoast.cancel();
                                          Fluttertoast.showToast(msg: "Enter the 10-digit phone number of the pledger");
                                        }else if(amountController.text.isEmpty){
                                          Fluttertoast.cancel();
                                          Fluttertoast.showToast(msg: "Please enter an amount");
                                        }else{
                                          final pledger=PledgeRequest(
                                              pledgerName: nameController.text,
                                              pledgerEmail: emailController.text,
                                              pledgerPhone: phoneController.text,
                                              forAnonymous: true,
                                              amount: double.parse(amountController.text));
                                          showAdaptiveDialog(context: context, builder:(context)=> AiAnalysisAlert(
                                            icon: HugeIcons.strokeRoundedHealtcare,
                                            action: 'Adding Pledge',
                                          ));
                                          await Provider.of<FundraiserProvider>(context,listen: false).makePledge(pledger);
                                          Navigator.pop(context);
                                          Navigator.pop(context);
                                          if(fundraiserProvider.pledgeResponse?.error==null){
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
                                                        title: 'Operation Successful',
                                                        content: 'Pledge Added Successfully! Select a pledge to edit.',
                                                        tapped: (){
                                                          Navigator.pop(context);
                                                        },
                                                        anim1: anim1),);
                                                }
                                            );
                                          }
                                        }

                                      },
                                    ),
                                    height: 500),
                                );
                              }
                            );
                          },
                          text: "Add Pledge")
                    ],
                  ),
                  Spaces.smallTopSpace,
                  // pledgers
                  fundraiserProvider.loadingPledges?
                      ListView.builder(
                        itemCount: 5,
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemBuilder: (context,index){
                            return LoadingPledgers(index: index);
                          }):
                      fundraiserProvider.campaignPledges.isEmpty?
                          emptyPledges(size):
                  ListView.builder(
                    itemCount: fundraiserProvider.campaignPledges.length,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemBuilder: (context,index){
                      PledgeResponse pledge=fundraiserProvider.campaignPledges[index];
                      return Pledger(index: index,pledge: pledge);
                      })
                ],
              ),
            ),
          );
        }
      ),
    );
  }
}

Widget emptyPledges(Size size){
  return SizedBox(
    height: size.height/2,
    width: size.width,
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Icon(HugeIcons.strokeRoundedHealtcare,size: 48,
            color: HexColor(AppColors.lightGray)),
        Spaces.smallTopSpace,
        Text("No pledges yet",style: Grays.regularSemiInter)
      ],
    ),
  );
}
