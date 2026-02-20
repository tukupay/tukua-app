import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
class NewWallet extends StatefulWidget {
  const NewWallet({super.key});

  @override
  State<NewWallet> createState() => _NewWalletState();
}

class _NewWalletState extends State<NewWallet> {

  @override
  void initState() {
    WidgetsBinding.instance.addPostFrameCallback((_)async{
      await Provider.of<WalletProvider>(context,listen: false).getWalletTypes();
    });
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Scaffold(
      backgroundColor: HexColor('#F8FAF9'),
      body: Consumer2<WalletProvider,ProfileProvider>(
        builder: (_,walletProvider,profileProvider,__) {
          return PopScope(
            canPop: walletProvider.currentStep==1?false:true,
            onPopInvokedWithResult: (bool b,res){
              if(walletProvider.currentStep==1){
                Provider.of<WalletProvider>(context,listen: false).stepBack();
              }
              return;
            },
            child: Container(
              width: size.width,
              height: size.height,
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
                    PageAppBar(
                      title: 'Create Wallet',
                      subtitle: 'Set up a new wallet for your funds',
                      onBack: walletProvider.currentStep == 0
                          ? null
                          : () => Provider.of<WalletProvider>(context, listen: false).stepBack(),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Column(
                        children: [
                          Steppers(),
                          const SizedBox(height: 8),
                          Text('Complete the steps to create your wallet',
                            style: Blacks.regularBoldGrotesk,
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    Expanded(
                      child: walletProvider.loadingTypes?
                      Center(
                          child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          CircularProgressIndicator(),
                          Spaces.smallTopSpace,
                          Text('Setting up..',style: Grays.smallestPoppinsHint)
                        ],
                      )):
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: walletSteps[walletProvider.currentStep],
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 6, 16, 6),
                      child: AltGreenButton(
                        tapped: ()async{
                          if(walletProvider.walletName==null){
                            Fluttertoast.showToast(msg: "Enter this wallet's name");
                          }
                         else if(walletProvider.currentStep==0){
                             if(walletProvider.selectedBank==null && (walletProvider.autoSettleAmount!=null||walletProvider.autoThreshold!=null)){
                              Fluttertoast.cancel();
                              Fluttertoast.showToast(msg: "Please select a bank account to settle to");
                            } else{
                              Provider.of<WalletProvider>(context,listen: false).nextStep();
                            }
                          }else{
                            if(profileProvider.user?.type==Strings.businessAcc && walletProvider.newSignatories.isEmpty){
                              Fluttertoast.cancel();
                              Fluttertoast.showToast(msg: 'Business wallet NEEDS at least one signatory');
                            }else{
                              final userId=Provider.of<ProfileProvider>(context,listen: false).user!.userId!;
                              final wallet=WalletRequest(name: walletProvider.walletName,userId: userId);
                              showAdaptiveDialog(context: context, builder:(context)=> AiAnalysisAlert(
                                icon: HugeIcons.strokeRoundedWallet01,
                                action: 'Creating Wallet',
                              ));
                              await Provider.of<WalletProvider>(context,listen: false).createWallet(wallet);
                              Navigator.pop(context);
                              if(walletProvider.newWallet?.error==null){
                                showGeneralDialog(
                                    context: context,
                                    pageBuilder: (context,anim1,anim2){
                                      return const SizedBox();
                                    },
                                    transitionDuration: const Duration(milliseconds: 600),
                                    transitionBuilder: (context,anim1,anim2,child){
                                      return SuccessWalletCreate(anim1: anim1,
                                      title: 'Wallet has been successfully created',
                                      gridItems: [
                                        SuccessGridItem(title: 'Account Number', content: walletProvider.newWallet?.coopWallet?.accountNumber??'tuku acc no'),
                                        SuccessGridItem(title: 'Customer Number', content: walletProvider.newWallet?.coopWallet?.customerNumber??'tuku cust no'),
                                        SuccessGridItem(title: 'Bank', content:  walletProvider.newWallet?.bankAccount?.bankName??walletProvider.newWallet?.bank??'NONE LINKED'),
                                        SuccessGridItem(title: 'Purpose', content: walletProvider.newWallet?.coopWallet?.purposeTag??'purpose'),
                                      ],);
                                    }
                                );
                              }
                            }
                          }
                        }, text: walletProvider.currentStep==0? "NEXT":"CREATE WALLET"),
                    ),
                    Spaces.smallTopSpace,
                  ],
                ),
              ),
            ),
          );
        }
      ),
    );
  }
}
