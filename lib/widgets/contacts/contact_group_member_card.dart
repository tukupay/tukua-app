import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import '../widget.dart';
import '../../constants/constants.dart';
class ContactGroupMemberCard extends StatefulWidget {
  final Contact contact;
  final int index;
  const ContactGroupMemberCard({super.key,
  required this.contact,
  required this.index});

  @override
  State<ContactGroupMemberCard> createState() => _ContactGroupMemberCardState();
}

class _ContactGroupMemberCardState extends State<ContactGroupMemberCard> {
  final nameController=TextEditingController();
  final phoneController=TextEditingController();
  final emailController=TextEditingController();
  final descriptionController=TextEditingController();

  @override
  void initState() {
    super.initState();
    nameController.text=widget.contact.name;
    phoneController.text=widget.contact.phone??'';
    emailController.text=widget.contact.email??'';
  }

  @override
  void dispose() {
    nameController.dispose();
    phoneController.dispose();
    emailController.dispose();
    descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ContactsProvider>(
      builder: (_,contactProvider,__) {
        return Container(
          margin: Paddings.smallestVertical,
          child: Row(
            children: [
              Text('${widget.index + 1}. ',style: Blacks.smallestBolderPoppins),
              Spaces.smallSideSpace,
              Container(
                height: 45,width: 45,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: HexColor(AppColors.primaryOrange)
                ),
                alignment: Alignment.center,
                child: Text(createInitials(widget.contact.name)),
              ),
              Spaces.smallSideSpace,
              Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(widget.contact.name,style: Blacks.smallestBolderPoppins),
                      Text(widget.contact.phone??'',style: Grays.smallestPoppinsHint),
                      Text(widget.contact.email??'',style: Blacks.tinyRoboto)
                    ],
                  )),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  IconButton(
                    visualDensity: VisualDensity.compact,
                      onPressed: (){
                        showAdaptiveDialog(
                            context: context,
                            builder: (context)=>ConfirmAlert(
                              text: 'Remove Member',
                              pressed: ()async{
                                showAdaptiveDialog(context: context, builder:(context)=> AiAnalysisAlert(
                                  icon: HugeIcons.strokeRoundedUserBlock01,
                                  action: 'Deleting Member',
                                ));
                                await Provider.of<ContactsProvider>(context,listen: false).deleteContact(widget.contact.id);
                                // Navigator.pop(context);
                                if(contactProvider.deleteContactError==null){
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
                                            child: TopUpAlert(
                                                title: 'Member Deleted Successfully.',
                                                tapped: (){
                                                  Navigator.pop(context);
                                                  Navigator.pop(context);
                                                  Navigator.pop(context);
                                                }));
                                      }
                                  );
                                }
                              },
                            ));
                      },
                      icon: Icon(Icons.delete_forever_rounded,
                        color: HexColor(AppColors.red))),
                  IconButton(
                      visualDensity: VisualDensity.compact,
                      onPressed: (){
                        showModalBottomSheet(
                            scrollControlDisabledMaxHeightRatio: 1/1,
                            context: context,
                            builder: (context){
                              return Padding(
                                padding: EdgeInsets.only(
                                  bottom: MediaQuery.of(context).viewInsets.bottom),
                                child: PlainSheet(
                                    height: 450,
                                      title: 'Edit ${contactProvider.selectedGroup?.name} Group Member',
                                    subTitle: 'Edit member',
                                    body: NewMemberForm(
                                      buttonText: 'Edit Member',
                                      nameController: nameController,
                                      phoneController: phoneController,
                                      emailController: emailController,
                                      method: ()async{
                                        if(nameController.text.isEmpty){
                                          Fluttertoast.showToast(msg: 'Please include a name');
                                        }else if(phoneController.text.isEmpty||phoneController.text.length<10||phoneController.text.length>13){
                                          Fluttertoast.showToast(msg: 'Please include a valid 10-digit phone number');
                                        }else if(emailController.text.isNotEmpty && !Strings.emailRegEx.hasMatch(emailController.text)){
                                         Fluttertoast.showToast(msg: 'Please enter a valid email');
                                        }else{
                                          final member=ContactRequest(
                                              name: nameController.text,
                                              phone: phoneController.text,
                                              email: emailController.text.isNotEmpty?emailController.text:null,
                                              groupId: contactProvider.selectedGroup!.id!);
                                          showAdaptiveDialog(context: context, builder:(context)=> AiAnalysisAlert(
                                            icon: HugeIcons.strokeRoundedUser,
                                            action: 'Updating Member',
                                          ));
                                          await Provider.of<ContactsProvider>(context,listen: false)
                                              .updateContact(widget.contact.id, member);
                                          Navigator.pop(context);
                                          if(contactProvider.updateContactResponse?.error==null){
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
                                                      child: TopUpAlert(
                                                          title: 'Member Updated Successfully.',
                                                          tapped: (){
                                                            Navigator.pop(context);
                                                            Navigator.pop(context);
                                                          }));
                                                }
                                            );
                                        }
                                        }})),
                              );
                            });
                      },
                      icon: Icon(Icons.edit,
                        color: HexColor(AppColors.primaryGreen))),
                ],
              )
            ],
          ),
        );
      }
    );
  }
}
