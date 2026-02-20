import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/widget.dart';
import '../../providers/providers.dart';
import '../../models/models.dart';

class ContactTypeForm extends StatefulWidget {
  const ContactTypeForm({super.key});

  @override
  State<ContactTypeForm> createState() => _ContactTypeFormState();
}

class _ContactTypeFormState extends State<ContactTypeForm> {

  final nameController=TextEditingController();
  final phoneController=TextEditingController();
  final emailController=TextEditingController();
  final descriptionController=TextEditingController();

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Consumer<ContactsProvider>(
      builder: (_,contactsProvider,__) {
        return SizedBox(
          width: size.width,
          child: Column(
            children: [
              Spaces.smallTopSpace,
              ContactTypeOption(
                  tapped: (){
                    Navigator.pop(context);
                    Navigator.pushNamed(context, Routes.deviceContacts);
                  },
                  icon: HugeIcons.strokeRoundedContact02,
                  title: "Select from contacts",
                  subtitle: "Pick contacts directly from your device's contact list."),
              Spaces.smallTopSpace,
              ContactTypeOption(
                  tapped: (){
                    Navigator.pop(context);
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
                                height: 450,
                                title: 'Add ${contactsProvider.selectedGroup?.name} Group Member',
                                subTitle: 'Add member',
                                body: NewMemberForm(
                                  nameController: nameController,
                                  phoneController: phoneController,
                                  emailController: emailController,
                                  method: ()async{
                                    if(nameController.text.isEmpty){
                                      Fluttertoast.showToast(msg: 'Please include a name');
                                    }else if(phoneController.text.isEmpty||phoneController.text.length!=10){
                                      Fluttertoast.showToast(msg: 'Please include a valid 10-digit phone number');
                                    }else if(emailController.text.isNotEmpty && !Strings.emailRegEx.hasMatch(emailController.text)){
                                      Fluttertoast.showToast(msg: 'Please enter a valid email');
                                    }else{
                                      // build contact obj
                                      final contact=ContactRequest(
                                          name: nameController.text,
                                          phone: phoneController.text,
                                          email: emailController.text.isNotEmpty?emailController.text:null,
                                          groupId: contactsProvider.selectedGroup!.id!);
                                      // upload contact info
                                      await Provider.of<ContactsProvider>(context,listen: false).createContact(contact,context);
                                    }
                                  },
                                )),
                          );
                        });
                  },
                  icon: HugeIcons.strokeRoundedPencilEdit02,
                  title: "Enter a contact",
                  subtitle: "Manually type in contact information."),
            ],
          ),
        );
      }
    );
  }
}
