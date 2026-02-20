import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import '../../widgets/widget.dart';
import '../../constants/constants.dart';
class SignatoryDetails extends StatefulWidget {
  const SignatoryDetails({super.key});

  @override
  State<SignatoryDetails> createState() => _SignatoryDetailsState();
}

class _SignatoryDetailsState extends State<SignatoryDetails> {
  String selectedRole=signatoryRoles[0];
  final nameController=TextEditingController();
  final phoneController=TextEditingController();
  final emailController=TextEditingController();
  
  @override
  Widget build(BuildContext context) {
    return Consumer<WalletProvider>(
      builder: (_,walletProvider,__) {
        return SingleChildScrollView(
          primary: true,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Signatory Information',style: Blacks.smallestBolderPoppins),
              Spaces.smallTopSpace,
              LabeledField(
                label: 'Full Name',
                hint: 'Enter Name',
                enabled: true,
                controller: nameController,
                canGoNext: true,
              ),
              Spaces.smallTopSpace,
              LabeledField(
                label: 'Phone Number',
                hint: '0701295873',
                enabled: true,
                isNumber: true,
                controller: phoneController,
                canGoNext: true,
              ),
              Spaces.smallTopSpace,
              LabeledField(
                label: 'Email',
                hint: 'name@mail.com',
                enabled: true,
                controller: emailController,
              ),
              Spaces.smallTopSpace,
              SimpleSelectorCard<String>(
                selectedItem: selectedRole,
                items: signatoryRoles,
                onSelected: (val) {
                  setState(() {
                    selectedRole = val;
                  });
                },
                itemLabelBuilder: (val) => val,
                label: 'Role',
                sheetTitle: 'Select Role',
                sheetSubtitle: 'What access level should this signatory have?',
                icon: HugeIcons.strokeRoundedUserSettings01,
              ),
              Spaces.smallTopSpace,
              GestureDetector(
                onTap: (){
                  if(nameController.text.isEmpty){
                    Fluttertoast.showToast(msg: 'Please enter a name');
                  }else if(phoneController.text.length<10){
                    Fluttertoast.showToast(msg: 'Please enter a valid phone number');
                  } else if(emailController.text.isNotEmpty&&
                      (!emailController.text.contains('@')||!emailController.text.contains('.'))){
                    Fluttertoast.showToast(msg: 'Please enter a valid email');
                  }else{
                    final newSignatory=Signatory(
                        phone: phoneController.text.trim(),
                        fullName: nameController.text.trim(),
                        email: emailController.text.trim().isEmpty?null:emailController.text.trim(),
                        role: selectedRole.toLowerCase());
                    Provider.of<WalletProvider>(context,listen: false).addSignatory(newSignatory);
                    // reset vars
                    phoneController.clear();
                    nameController.clear();
                    emailController.clear();
                    selectedRole=signatoryRoles[0];
                  }

                },
                child: Container(
                  padding: Paddings.smallestAllSides,
                  decoration: BoxDecoration(
                    color: HexColor(AppColors.fadedGreen),
                    borderRadius: BorderRadius.circular(8)
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Icon(Icons.save_as_rounded,size: 14,color: Colors.white),
                      Spaces.tinySideSpace,
                      Text('Add',style: Whites.regularSemiRoboto)
                    ],
                  ),
                ),
              ),
              Spaces.smallTopSpace,
              Text('Selected Signatories: ${walletProvider.newSignatories.length}',style: Blacks.smallestBolderPoppins),
              Spaces.smallTopSpace,
              ListView.builder(
                primary: false,
                  itemCount: walletProvider.newSignatories.length,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemBuilder: (context,index){
                  Signatory signatory=walletProvider.newSignatories[index];
                  return NewSignatory(signatory: signatory,index: index);
                  })
            ],
          ),
        );
      }
    );
  }
}
