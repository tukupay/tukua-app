import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import '../../widgets/widget.dart';
import '../../constants/constants.dart';
import '../../models/models.dart';
import '../../widgets/widget.dart';

class ContactGroupMembers extends StatefulWidget {
  const ContactGroupMembers({super.key});

  @override
  State<ContactGroupMembers> createState() => _ContactGroupMembersState();
}

class _ContactGroupMembersState extends State<ContactGroupMembers> {
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_)async{
      await Provider.of<ContactsProvider>(context,listen: false).listGroupContacts();
    });
  }
  

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return PopScope(
      onPopInvokedWithResult: (bool b,res){
        Provider.of<ContactsProvider>(context,listen: false).resetGroup();
      },
      child: Scaffold(
        appBar: AppBar(
          centerTitle: true,
          title: Text('Group Members',
          style: Blacks.regularBoldCodeNext),
          actions: [
            NotificationsBell(),
            Spaces.smallSideSpace,
          ],
        ),
        body: Consumer<ContactsProvider>(
          builder: (_,contactsProvider,__) {
            return Container(
              height: size.height,
              width: size.width,
              padding: Paddings.smallAllSides,
              decoration: BoxDecoration(
                image: DecorationImage(
                    image: AssetImage(Strings.imageAsset('bg.png')),
                fit:BoxFit.cover)
              ),
              child: Flex(
                direction: Axis.vertical,
                children: [
                  Expanded(
                    child: SingleChildScrollView(
                      primary: true,
                        child: contactsProvider.loadingGroupContacts?
                            ListView.builder(
                              itemCount: 4,
                                shrinkWrap: true,
                                itemBuilder: (context,index){
                                return ContactGroupMemberShimmer();
                                }):
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('${contactsProvider.selectedGroup?.name}',style: Blacks.smallestBolderPoppins),
                                AddButton(
                                    tapped: (){
                                      showModalBottomSheet(
                                          context: context,
                                          isScrollControlled: true,
                                          scrollControlDisabledMaxHeightRatio: 1/1,
                                          builder: (context){
                                            return Padding(
                                                padding: EdgeInsets.only(
                                                  bottom: MediaQuery.of(context).viewInsets.bottom
                                                ),
                                            child: PlainSheet(
                                                title: "Add contacts to this group",
                                                subTitle: "Enter manually or select from contacts",
                                                body: ContactTypeForm(),
                                                height: 300),
                                            );
                                          });
                                    },
                                    text: 'Add Member')
                              ],
                            ),
                            Spaces.smallTopSpace,
                            // SEARCH & SORT GROUPS
                            Container(
                              padding: Paddings.smallestAllSides,
                              child: Row(
                                  mainAxisAlignment: MainAxisAlignment.start,
                                  children: [
                                    // Search
                                    Expanded(
                                        child: AuthTextField(
                                            hint: 'Search Group Members')),
                                    Spaces.tinySideSpace,
                                    GestureDetector(
                                      onTap: () {},
                                      child: Container(
                                        height: 42,
                                        width: 42,
                                        alignment: Alignment.center,
                                        decoration: BoxDecoration(
                                            borderRadius: BorderRadius.circular(8),
                                            color: Colors.white,
                                            border: Border.all(color: HexColor('#E0E8F2'))),
                                        child: Icon(Icons.search, color: Colors.black),
                                      ),
                                    ),
                                    Spaces.tinySideSpace,
                                    // add group btn
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
                            Text('Total ${contactsProvider.selectedGroup?.contactCount??0}',
                            style: Blacks.regularBoldCodeNext),
                            Spaces.smallTopSpace,
                            contactsProvider.fullGroup==null||
                            contactsProvider.fullGroup!.contacts!.isEmpty?
                                noMembersFound(size)
                                :
                            ListView.builder(
                                itemCount: contactsProvider.fullGroup?.contacts?.length??0,
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemBuilder: (context,index){
                                  Contact contact=contactsProvider.fullGroup!.contacts![index];
                                  return ContactGroupMemberCard(contact: contact,index: index,);
                                })
                          ],
                        )),
                  ),
                  AuthButton(
                      color: AppColors.red,
                      text: "Delete",
                      tapped: ()async{
                        showAdaptiveDialog(
                            context: context,
                            builder: (context)=>ConfirmAlert(
                                text: "Delete Group?",
                                pressed: ()async{
                                  showAdaptiveDialog(context: context, builder:(context)=> AiAnalysisAlert(
                                    icon: HugeIcons.strokeRoundedUserGroup,
                                    action: 'Deleting Group',
                                  ));
                                  await Provider.of<ContactsProvider>(context,listen: false).deleteContactGroup(contactsProvider.selectedGroup!.id!);
                                  if(contactsProvider.deleteGroupError==null){
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
                                                  title: 'Group Deleted Successfully.',
                                                  tapped: (){
                                                    Navigator.pop(context);
                                                    Navigator.pop(context);
                                                    Navigator.pop(context);
                                                    Navigator.pop(context);
                                                  }));
                                        }
                                    );
                                  }
                                }));
                      })
                ],
              )
            );
          }
        ),
      ),
    );
  }
}

Widget noMembersFound(Size size){
  return SizedBox(
    width: size.width,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Spaces.mediumTopSpace,
        Icon(HugeIcons.strokeRoundedUserBlock01,size: 45,color: HexColor(AppColors.lightGray)),
        Spaces.smallTopSpace,
        Text('No members found in this group',style: Grays.regularBoldPoppins)
      ],
    ),
  );
}
