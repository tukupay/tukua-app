import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

class NewBank extends StatefulWidget {
  const NewBank({super.key});

  @override
  State<NewBank> createState() => _NewBankState();
}

class _NewBankState extends State<NewBank> {

  @override
  void initState() {
    WidgetsBinding.instance.addPostFrameCallback((_)async{
      await Provider.of<BankingProvider>(context,listen: false).getAvailableBanks();
    });
    super.initState();
  }

  final accountName=TextEditingController();
  final accountNumber=TextEditingController();
  final branch=TextEditingController();

  bool isFav=false;
  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Scaffold(
      backgroundColor: HexColor('#F8FAF9'),
      body: Consumer<BankingProvider>(
        builder: (_,banking,__) {
          return Container(
            height: size.height,
            width: size.width,
            decoration: BoxDecoration(
              image: DecorationImage(
                  image: AssetImage(Strings.imageAsset('bg.png')),
                  fit: BoxFit.cover)
            ),
            child: Container(
              decoration: BoxDecoration(
                  image: DecorationImage(
                      image: AssetImage(Strings.imageAsset('gradient2.png')),
                      fit: BoxFit.cover)
              ),
              child: Column(
                children: [
                  const PageAppBar(
                    title: 'New Bank Account',
                    subtitle: 'Link your bank for settlements',
                  ),
                  Expanded(
                    child: banking.loadingAvailableBanks?
                    Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            CircularProgressIndicator(),
                            Spaces.smallTopSpace,
                            Text('Setting up..',style: Grays.smallestPoppinsHint)
                          ],
                        )):
                    SingleChildScrollView(
                      physics: const BouncingScrollPhysics(),

                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                              padding: Paddings.smallAllSides,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Bank Information',style: Blacks.smallestBolderPoppins),
                              Spaces.smallTopSpace,
                              Text('Bank name',style: Grays.smallestBolderPoppinsHint),
                              Spaces.smallTopSpace,
                              _BankPickerCard(
                                selectedBank: banking.selectedAvailableBank,
                                availableBanks: banking.availableBanks,
                                onTap: () async {
                                  final result = await UniversalBankSelector.showAvailableBanks(
                                    context,
                                    banks: banking.availableBanks,
                                    selectedBank: banking.selectedAvailableBank,
                                    title: 'Select Your Bank',
                                    subtitle: 'Choose from available banks',
                                  );
                                  if (result != null) {
                                    Provider.of<BankingProvider>(context, listen: false).selectMainBank(result);
                                  }
                                },
                              ),
                              Spaces.smallTopSpace,
                              LabeledField(
                                  label: "Branch Location",
                                  hint: "Thika Road",
                                  controller: branch,
                                  canGoNext: true,
                                  enabled: true),
                              Spaces.smallTopSpace,
                              Text('Account Information',style: Blacks.smallestBolderPoppins),
                              Spaces.smallTopSpace,
                              LabeledField(
                                controller: accountNumber,
                                  label: 'Account Number',
                                  hint: 'e.g 123456789',
                                  canGoNext: true,
                                  isNumber: true,
                                  enabled: true),
                              Spaces.smallTopSpace,
                              LabeledField(
                                controller: accountName,
                                  label: 'Account Name',
                                  hint: 'e.g John Doe',
                                  enabled: true),
                              Spaces.smallTopSpace,
                              Text('Mark as favourite',style: Blacks.smallestBolderPoppins),
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Expanded(
                                      child:Text('Include this among your favourite banks when transacting?',
                                          style: Grays.smallestPoppinsHint)
                                  ),
                                  Spaces.smallSideSpace,
                                  Switch(
                                      activeTrackColor: HexColor(AppColors.primaryGreen),
                                      value:isFav,
                                      onChanged: (val){
                                        setState(() {
                                          isFav=val;
                                        });
                                      })
                                ],
                              ),
                            ],
                          ))
                        ],
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                    child: AltGreenButton(
                      tapped: ()async{
                        if(banking.selectedAvailableBank==null){
                          Fluttertoast.showToast(msg: "Which is your bank?");
                        }else if(accountNumber.text.trim().isEmpty){
                          Fluttertoast.showToast(msg: 'Please enter your account number');
                        } else if(accountName.text.trim().isEmpty){
                          Fluttertoast.showToast(msg: 'Please enter your account name');
                        } else{
                          final bank=BankRequest(
                              accountName: accountName.text,
                              accountNumber: accountNumber.text,
                              isFavorite: isFav,
                              branch: branch.text.isEmpty?null:branch.text,
                              bankName: banking.selectedAvailableBank!.name);
                          showAdaptiveDialog(context: context, builder:(context)=> AiAnalysisAlert(
                            icon: HugeIcons.strokeRoundedBank,
                            action: 'Creating Bank Account',
                          ));
                         await Provider.of<BankingProvider>(context,listen: false).createBank(bank);
                          Navigator.pop(context);
                          if(banking.newBank?.error==null){
                            showGeneralDialog(
                                context: context,
                                pageBuilder: (context,anim1,anim2){
                                  return const SizedBox();
                                },
                                transitionDuration: const Duration(milliseconds: 600),
                                transitionBuilder: (context,anim1,anim2,child){
                                  return SuccessWalletCreate(anim1: anim1,
                                  title: 'Bank has been successfully linked',
                                  gridItems: [
                                    SuccessGridItem(title: "Name", content: banking.newBank?.bankName??'Bank Name'),
                                    SuccessGridItem(title: "Acc Number", content: banking.newBank?.accountNumber??'Acc Number'),
                                    SuccessGridItem(title: "Created On", content: banking.newBank!=null? formatDate(banking.newBank!.createdAt!):"Settle Type"),
                                    SuccessGridItem(title: "Acc Name", content: banking.newBank?.accountName??'Acc Name'),
                                  ],);
                                }
                            );
                          }
                        }
                      },
                      text: "Submit"),
                  ),
                  Spaces.smallTopSpace,
                ],
              ),
            ),
          );
        }
      ),
    );
  }
}

/// A simple card for picking banks that opens the bank selector sheet
class _BankPickerCard extends StatelessWidget {
  final AvailableBank? selectedBank;
  final List<AvailableBank> availableBanks;
  final VoidCallback onTap;

  const _BankPickerCard({
    required this.selectedBank,
    required this.availableBanks,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final hasSelection = selectedBank != null;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: hasSelection
                ? HexColor(AppColors.primaryGreen).withAlpha(100)
                : HexColor('#E0E5E2'),
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: hasSelection
                    ? HexColor(AppColors.primaryGreen).withAlpha(25)
                    : HexColor('#F5F7F6'),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                HugeIcons.strokeRoundedBank,
                size: 18,
                color: hasSelection
                    ? HexColor(AppColors.primaryGreen)
                    : Colors.grey.shade500,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                hasSelection ? selectedBank!.name : 'Select your bank',
                style: hasSelection ? Blacks.smallestBoldPoppins : Grays.smallestPoppinsHint,
              ),
            ),
            Icon(
              HugeIcons.strokeRoundedArrowDown01,
              size: 18,
              color: Colors.grey.shade500,
            ),
          ],
        ),
      ),
    );
  }
}
