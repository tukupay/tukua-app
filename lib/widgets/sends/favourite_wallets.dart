import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
class FavouriteWallets extends StatefulWidget {
  final void Function(FavWalletResponse wallet)? onWalletSelected;

  const FavouriteWallets({super.key, this.onWalletSelected});

  @override
  State<FavouriteWallets> createState() => _FavouriteWalletsState();
}

class _FavouriteWalletsState extends State<FavouriteWallets> {

  final nameController=TextEditingController();
  final phoneController=TextEditingController();
  final aliasController=TextEditingController();

  // show bottom sheet
  void _showAddFavouriteSheet(BuildContext context){
    final favWallsProvider=Provider.of<FavWalletsProvider>(context,listen: false);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext){
        return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(sheetContext).viewInsets.bottom),
          child: PlainSheet(
              title: "Add favourite",
              subTitle: "Add a new favourite wallet",
              body: NewWalletFavourite(
                nameController: nameController,
                phoneController: phoneController,
                aliasController: aliasController,
                method: ()async{
                  Fluttertoast.cancel();
                  if(nameController.text.isEmpty){
                    Fluttertoast.showToast(msg: "Name is required");
                  }else if(phoneController.text.isNotEmpty && phoneController.text.length!=10){
                    Fluttertoast.showToast(msg: "Phone include a valid 10-digit phone number");
                  }else if(aliasController.text.isNotEmpty && aliasController.text.length!=6){
                    Fluttertoast.showToast(msg: "Alias must be 6 characters");
                  }else{
                    final favWallet=FavWalletRequest(
                      name: nameController.text,
                      phoneNumber: phoneController.text.isNotEmpty?phoneController.text:null,
                      walletAlias: aliasController.text.isNotEmpty?
                      aliasController.text.trim().toUpperCase():null);

                    // show dialog while adding
                    showAdaptiveDialog(
                      context: sheetContext,
                      barrierDismissible: false,
                      builder: (dialogContext) => AiAnalysisAlert(
                        icon: HugeIcons.strokeRoundedFavourite,
                        action: "Adding favourite...",
                      ),
                    );

                    await favWallsProvider.addFavWallet(favWallet);

                    // pop loading dialog
                    Navigator.pop(sheetContext);

                    // if successful
                    if (favWallsProvider.favResponse?.error == null) {
                      // Pop the bottom sheet itself
                      Navigator.pop(sheetContext);

                      // Clear controllers for the next use
                      nameController.clear();
                      phoneController.clear();
                      aliasController.clear();

                      // Show success animation
                      showGeneralDialog(
                        context: context,
                        pageBuilder: (context, anim1, anim2) {
                          return const SizedBox();
                        },
                        transitionDuration: const Duration(milliseconds: 400),
                        transitionBuilder: (context, anim1, anim2, child) {
                          return SlideTransition(
                            position: Tween(
                              begin: const Offset(1, 0),
                              end: const Offset(0, 0),
                            ).animate(anim1),
                            child: SuccessAlert(
                              title: "Operation Successful",
                              content:
                              "Wallet Added to your Send money favourites' list",
                              anim1: anim1,
                              tapped: () {
                                Navigator.pop(context); // Pop SuccessAlert
                              },
                            ),
                          );
                        },
                      );
                    }
                  }
                },
              ),
              height: 450),
        );
      }
    );
  }
  @override
  Widget build(BuildContext context) {
    return Consumer<FavWalletsProvider>(
        builder: (_,favWallsProvider,__){
          return FavouritesSection<FavWalletResponse>(
              title: "Favourites",
              items: favWallsProvider.favWallets,
              onAdd: ()=> _showAddFavouriteSheet(context),
              emptyHint: 'Save favourite wallets for quick access',
              onItemSelected: (wallet){
                widget.onWalletSelected?.call(wallet);
              },
              itemBuilder: (wallet){
                return FavouriteItem(name: wallet.name??"Wallet");
              });
        });
  }
}
