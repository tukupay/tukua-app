import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
class NewInvite extends StatefulWidget {
  const NewInvite({super.key});

  @override
  State<NewInvite> createState() => _NewInviteState();
}

class _NewInviteState extends State<NewInvite> {
  final nameController=TextEditingController();
  final phoneController=TextEditingController();
  final emailController=TextEditingController();
  final messageController=TextEditingController();
  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return SizedBox(
      width: size.width,
      height: size.height,
      child: Consumer<ChurchInviteProvider>(
        builder: (_,churchInvite,__) {
          return SingleChildScrollView(
            padding: Paddings.tinyAllSides,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Spaces.tinyTopSpace,
                LabeledField(
                    label: "Name",
                    hint: "John Doe",
                    controller: nameController,
                    canGoNext: true,
                    enabled: true),
                Spaces.smallTopSpace,
                LabeledField(
                    label: "Phone",
                    hint: "0701234567",
                    controller: phoneController,
                    canGoNext: true,
                    isNumber: true,
                    enabled: true),
                Spaces.smallTopSpace,
                LabeledField(
                    label: "Email",
                    hint: "johndoe@mail.com",
                    controller: phoneController,
                    canGoNext: true,
                    isNumber: true,
                    enabled: true),
                Spaces.smallTopSpace,
                LabeledField(
                    label: 'Message',
                    hint: 'Some message to include while inviting your friend.',
                    controller: messageController,
                    multiLine: true,
                    initialText: "Hello! Check out this merchant I found in the Tuku App. I think you will find it useful. Let's connect",
                    enabled: true),
                Spaces.mediumTopSpace,
                Center(
                  child: AltGreenButton(
                      tapped: (){
                        Fluttertoast.cancel();
                        if(nameController.text.isEmpty){
                          Fluttertoast.showToast(msg: "Please provide a name");
                        }else if(phoneController.text.length!=10){
                          Fluttertoast.showToast(msg: "Please provide a valid 10-digit phone number");
                        }else if(churchInvite.selectedGender==null){
                          Fluttertoast.showToast(msg: "Please select a gender");
                        }else{
                          showAdaptiveDialog(
                              context: context,
                              builder: (context) => TopUpAlert(
                                title: 'Member Invited Successfully',
                                amount: '',
                                tapped: () {
                                  Navigator.pop(context);
                                  Navigator.pop(context);
                                },
                              ));
                        }
                      },
                      text: "REGISTER"),
                )
              ],
            ),
          );
        }
      ),
    );
  }
}
