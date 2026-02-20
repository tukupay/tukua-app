import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
class ContactScreen extends StatefulWidget {
  const ContactScreen({super.key});

  @override
  State<ContactScreen> createState() => _ContactScreenState();
}

class _ContactScreenState extends State<ContactScreen> {

  bool isFirst=true;

  @override
  void initState() {
    super.initState();
    if(isFirst==true){
      usernameController.text=Provider.of<ProfileProvider>(context,listen: false).user?.username??'';
      emailController.text=Provider.of<ProfileProvider>(context,listen: false).user?.email??'';
      setState(() {
        isFirst=false;
      });
      debugPrint("IS FIRST? $isFirst");
    }
  }

  bool showPass=false;
  final usernameController=TextEditingController();
  final emailController=TextEditingController();

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
            onPressed: (){
              Navigator.pop(context);
            },
            icon:  Icon(Icons.arrow_back,
            color: HexColor('#404040'),)),
        title: Text('Edit Profile',
        style: Blacks.mediumSemiRoboto),
        centerTitle: true,
      ),
      body: SizedBox(
        height: size.height,
        width: size.width,
        child: Consumer<ProfileProvider>(
          builder: (_,profile,__) {
            // Only update the controller values when necessary
            if (profile.user != null && isFirst==true) {
              // Prevent overwriting user input with old data
              if (usernameController.text != profile.user!.username) {
                usernameController.text = profile.user!.username ?? '';
              }
              if (emailController.text != profile.user!.email) {
                emailController.text = profile.user!.email ?? '';
              }
            }

            return SingleChildScrollView(
              padding: Paddings.smallAllSides,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // PROFILE PIC
                  GestureDetector(
                    onTap: (){
                      const snackBar=SnackBar(content: Text('Prompt PIC CHANGE'));
                      ScaffoldMessenger.maybeOf(context)?.removeCurrentSnackBar();
                      ScaffoldMessenger.of(context).showSnackBar(snackBar);
                    },
                    child: Center(
                      child: Container(
                        height: 150,width: 150,
                        decoration: BoxDecoration(
                            border: Border.all(
                                color: HexColor('242760'),
                                width: 1
                            ),
                            shape: BoxShape.circle
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(2.0),
                          child: Container(
                            height: 145,width: 145,
                            decoration: BoxDecoration(
                                image: DecorationImage(
                                    image:
                                    profile.user?.profileImg==null?
                                    AssetImage(Strings.imageAsset('user.jpeg')):
                                    NetworkImage(profile.user!.profileImg!),
                                    fit: BoxFit.cover),
                                shape: BoxShape.circle
                            ),
                            child: Stack(
                              children: [
                                Positioned(
                                    bottom: 5,
                                    right: 5,
                                    child: Icon(Icons.camera_alt,
                                        color: HexColor('#EE7D13')))
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  Spaces.smallTopSpace,
                  Text('Name',style: Blacks.tinyBolderPoppins),
                  AuthTextField(
                      disabled: true,
                      initialText:
                      profile.user?.type==Strings.individualAcc?
                      "${profile.user?.firstName ?? "User's"} ${ profile.user?.lastName ?? "Name"}" :
                      profile.user?.businessName,
                  hint: 'Your Name'),
                  Spaces.smallTopSpace,
                  Text('Username',style: Blacks.tinyBolderPoppins),
                  AuthTextField(
                    controller: usernameController,
                      hint: profile.user?.username??"Username"),
                  Spaces.smallTopSpace,
                  Text('Email',style: Blacks.tinyBolderPoppins),
                  AuthTextField(
                      controller: emailController,
                      hint: profile.user?.email?? 'Your Email'),
                  Spaces.smallTopSpace,
                  Text( profile.user?.type==Strings.individualAcc? 'Date Of Birth':"Date of registration",
                      style: Blacks.tinyBolderPoppins),
                  AuthTextField(
                      disabled: true,
                      hint: profile.user?.type==Strings.individualAcc && profile.user?.dob!=null ? formatDate(DateTime.parse(profile.user!.dob!)):
                          profile.user?.type==Strings.businessAcc && profile.user?.registrationDate!=null ? formatDate(DateTime.parse(profile.user!.registrationDate!)):
                      'Your DOB'),
                  Spaces.smallTopSpace,
                  Text('Title',
                      style: Blacks.tinyBolderPoppins),
                  AuthTextField(
                      disabled: true,
                      hint: profile.user?.title??'Unknown'),
                  Spaces.mediumTopSpace,
                  Center(
                    child: profile.updatingProfile?WaveDots():
                    SizedBox(
                      width: size.width/1.5,
                      child: AuthButton(
                          text: 'Save Changes',
                          tapped: ()async{
                            Fluttertoast.cancel();
                            if(usernameController.text.isEmpty || usernameController.text.length<3){
                              Fluttertoast.showToast(msg: "Please provide at least a 3-letter username.");
                            }else if(!Strings.emailRegEx.hasMatch(emailController.text)){
                              Fluttertoast.showToast(msg: 'Please provide a valid email.');
                            }else if(usernameController.text!=profile.user?.username||
                              emailController.text!=profile.user?.email){
                              if(usernameController.text!=profile.user?.username){
                                profile.updates.addAll({'username':usernameController.text});
                              }
                              if(emailController.text!=profile.user?.email){
                                profile.updates.addAll({'email':emailController.text});
                              }
                              if(profile.user?.type==Strings.individualAcc){
                                await profile.updateIndividualProfile();
                              }else if(profile.user?.type==Strings.businessAcc){
                                await profile.updateBusinessProfile();
                              }
                              if(profile.updatedProfile?.error==null){
                                setState(() {
                                  emailController.text=profile.updatedProfile?.email??'';
                                  usernameController.text=profile.updatedProfile?.username??'';
                                });
                                Fluttertoast.showToast(msg: "Your profile has been updated!");
                                Navigator.pop(context);
                              }
                            }else{
                              Fluttertoast.showToast(msg: "No changes to save.");
                              Navigator.pop(context);
                            }
                          }),
                    ),
                  )

                ],
              ),
            );
          }
        ),
      ),
    );
  }
}
