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

class FavouriteContacts extends StatefulWidget {
  final void Function(FullContact contact)? onContactSelected;

  const FavouriteContacts({super.key, this.onContactSelected});

  @override
  State<FavouriteContacts> createState() => _FavouriteContactsState();
}

class _FavouriteContactsState extends State<FavouriteContacts> {
  final nameController = TextEditingController();
  final phoneController = TextEditingController();
  final emailController = TextEditingController();

  // Extracted method to show the bottom sheet, preventing code duplication.
  void _showAddFavouriteSheet(BuildContext context) {
    final contactsProvider = Provider.of<ContactsProvider>(context, listen: false);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(sheetContext).viewInsets.bottom),
          child: PlainSheet(
            title: "Add Favourite",
            subTitle: "Add a contact to your favourites",
            body: NewMemberForm(
              nameController: nameController,
              phoneController: phoneController,
              emailController: emailController,
              method: () async {
                Fluttertoast.cancel();
                if (nameController.text.isEmpty) {
                  Fluttertoast.showToast(msg: 'Name is required');
                } else if (phoneController.text.isEmpty ||
                    phoneController.text.length != 10) {
                  Fluttertoast.showToast(
                      msg: 'Please include a valid 10-digit phone number');
                } else if (emailController.text.isNotEmpty &&
                    !Strings.emailRegEx.hasMatch(emailController.text)) {
                  Fluttertoast.showToast(msg: 'Please enter a valid email');
                } else {
                  // build contact obj
                  final contact = ContactRequest(
                    name: nameController.text,
                    phone: phoneController.text,
                    email: emailController.text.isEmpty
                        ? null
                        : emailController.text,
                  );

                  // show dialog while adding
                  showAdaptiveDialog(
                    context: sheetContext,
                    barrierDismissible: false,
                    builder: (dialogContext) => AiAnalysisAlert(
                      icon: HugeIcons.strokeRoundedFavourite,
                      action: "Adding favourite...",
                    ),
                  );

                  await contactsProvider.addFavourite(contact);

                  // pop loading dialog
                  Navigator.pop(sheetContext);

                  // if successful
                  if (contactsProvider.createContactResponse?.error == null) {
                    // Pop the bottom sheet itself
                    Navigator.pop(sheetContext);

                    // Clear controllers for the next use
                    nameController.clear();
                    phoneController.clear();
                    emailController.clear();

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
                                "Contact Added to your Send money favourites' list",
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
            height: 450,
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ContactsProvider>(
      builder: (_, contactsProvider, __) {
        return FavouritesSection<FullContact>(
          title: "Favourites",
          items: contactsProvider.favourites,
          onAdd: () => _showAddFavouriteSheet(context),
          emptyHint: 'Save frequently used contacts for quick access',
          onItemSelected: (contact) {
            Fluttertoast.cancel();
            widget.onContactSelected?.call(contact);
            Fluttertoast.showToast(msg: 'Selected ${contact.name}');
          },
          itemBuilder: (contact) {
            return FavouriteItem(name: contact.name ?? 'User');
          },
        );
      },
    );
  }
}
