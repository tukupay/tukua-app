import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/widget.dart';
import '../../models/models.dart';

class NewGroup extends StatefulWidget {
  const NewGroup({super.key});

  @override
  State<NewGroup> createState() => _NewGroupState();
}

class _NewGroupState extends State<NewGroup> {
  final nameController = TextEditingController();
  final descriptionController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Scaffold(
      backgroundColor: HexColor('#F8FAF9'),
      body: Consumer<ContactsProvider>(
        builder: (_, contactsProvider, __) {
          return Container(
            height: size.height,
            width: size.width,
            decoration: BoxDecoration(
              image: DecorationImage(
                image: AssetImage(Strings.imageAsset('bg.png')),
                fit: BoxFit.cover,
              ),
            ),
            child: Container(
              decoration: BoxDecoration(
                image: DecorationImage(
                  image: AssetImage(Strings.imageAsset('gradient2.png')),
                  fit: BoxFit.cover,
                ),
              ),
              child: Column(
                children: [
                  // Custom App Bar
                  SafeArea(
                    bottom: false,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: Row(
                        children: [
                          GestureDetector(
                            onTap: () => Navigator.pop(context),
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: HexColor('#F0F4F3'),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(HugeIcons.strokeRoundedArrowLeft01,
                                  color: HexColor(AppColors.darkerGray2), size: 20),
                            ),
                          ),
                          const Spacer(),
                          Column(
                            children: [
                              Text('New Group', style: Blacks.mediumSemiRubik),
                              Text('Create a contact group',
                                  style: Grays.smallestPoppinsHint.copyWith(fontSize: 10)),
                            ],
                          ),
                          const Spacer(),
                          const SizedBox(width: 36),
                        ],
                      ),
                    ),
                  ),

                  // Header Icon
                  Container(
                    margin: const EdgeInsets.symmetric(vertical: 20),
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        colors: [
                          HexColor(AppColors.primaryGreen),
                          HexColor(AppColors.fadedGreen),
                        ],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: HexColor(AppColors.primaryGreen).withAlpha(76),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: const Icon(
                      HugeIcons.strokeRoundedUserGroup,
                      size: 40,
                      color: Colors.white,
                    ),
                  ),

                  // Content
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Info Card
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: HexColor('#E8F5E9'),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: HexColor(AppColors.primaryGreen).withAlpha(51),
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(HugeIcons.strokeRoundedInformationCircle,
                                    color: HexColor(AppColors.primaryGreen), size: 20),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    'Groups help you organize contacts for bulk messaging and payments',
                                    style: TextStyle(
                                      color: HexColor(AppColors.primaryGreen),
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Form Card
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: Colors.white.withAlpha(100),
                              border: Border.all(color: HexColor(AppColors.lightGray)),
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withAlpha(10),
                                  blurRadius: 12,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: HexColor('#E8F5E9'),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Icon(HugeIcons.strokeRoundedEdit02,
                                          size: 18, color: HexColor(AppColors.primaryGreen)),
                                    ),
                                    const SizedBox(width: 12),
                                    Text('Group Information', style: Blacks.regularBoldCodeNext),
                                  ],
                                ),
                                const SizedBox(height: 20),

                                // Group Name Field
                                Text(
                                  'Group Name',
                                  style: Blacks.smallestBoldPoppins.copyWith(
                                    color: HexColor(AppColors.darkerGray2),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Container(
                                  decoration: BoxDecoration(
                                    color: HexColor('#F8FAF9'),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: HexColor('#E8ECE9')),
                                  ),
                                  child: TextField(
                                    controller: nameController,
                                    decoration: InputDecoration(
                                      hintText: 'e.g., Family Members',
                                      hintStyle: Grays.tinyPoppinsHint,
                                      border: InputBorder.none,
                                      contentPadding: const EdgeInsets.symmetric(
                                          horizontal: 16, vertical: 14),
                                      prefixIcon: Icon(
                                        HugeIcons.strokeRoundedUserMultiple,
                                        color: HexColor(AppColors.darkerGray2),
                                        size: 20,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 20),

                                // Group Description Field
                                Text(
                                  'Group Description (Optional)',
                                  style: Blacks.smallestBoldPoppins.copyWith(
                                    color: HexColor(AppColors.darkerGray2),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Container(
                                  decoration: BoxDecoration(
                                    color: HexColor('#F8FAF9'),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: HexColor('#E8ECE9')),
                                  ),
                                  child: TextField(
                                    controller: descriptionController,
                                    maxLines: 4,
                                    maxLength: 250,
                                    decoration: InputDecoration(
                                      hintText: 'Describe your group...',
                                      hintStyle: Grays.tinyPoppinsHint,
                                      border: InputBorder.none,
                                      contentPadding: const EdgeInsets.symmetric(
                                          horizontal: 16, vertical: 14),
                                      counterStyle: Grays.smallestPoppinsHint.copyWith(fontSize: 10),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 80),
                        ],
                      ),
                    ),
                  ),

                  // Bottom Action Button
                  Container(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withAlpha(15),
                          blurRadius: 10,
                          offset: const Offset(0, -2),
                        ),
                      ],
                    ),
                    child: SafeArea(
                      top: false,
                      child: SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () async {
                            if (nameController.text.isEmpty) {
                              Fluttertoast.showToast(msg: 'Your group must include a name');
                              return;
                            }

                            FocusScope.of(context).unfocus();

                            final group = ContactGroupRequest(
                              name: nameController.text,
                              description: descriptionController.text.isEmpty
                                  ? null
                                  : descriptionController.text,
                            );

                            // Show loading dialog
                            showAdaptiveDialog(
                              context: context,
                              barrierDismissible: false,
                              builder: (context) => AiAnalysisAlert(
                                icon: HugeIcons.strokeRoundedUserGroup,
                                action: 'Creating Group',
                              ),
                            );

                            await Provider.of<ContactsProvider>(context, listen: false)
                                .createContactGroup(group);

                            Navigator.pop(context); // Close loading dialog

                            if (contactsProvider.createGroupResponse?.error == null) {
                              // Show success dialog with option to add members
                              if (!mounted) return;
                              showGeneralDialog(
                                context: context,
                                barrierDismissible: false,
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
                                    child: Dialog(
                                      backgroundColor: Colors.transparent,
                                      insetPadding: const EdgeInsets.symmetric(horizontal: 20),
                                      child: Container(
                                        padding: const EdgeInsets.all(24),
                                        decoration: BoxDecoration(
                                          color: Colors.white,
                                          borderRadius: BorderRadius.circular(24),
                                          boxShadow: [
                                            BoxShadow(
                                              color: Colors.black.withAlpha(51),
                                              blurRadius: 30,
                                              offset: const Offset(0, 10),
                                            ),
                                          ],
                                        ),
                                        child: Column(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            // Success Icon
                                            Container(
                                              padding: const EdgeInsets.all(16),
                                              decoration: BoxDecoration(
                                                shape: BoxShape.circle,
                                                color: HexColor('#E8F5E9'),
                                              ),
                                              child: Icon(
                                                HugeIcons.strokeRoundedCheckmarkCircle01,
                                                color: HexColor(AppColors.primaryGreen),
                                                size: 48,
                                              ),
                                            ),
                                            const SizedBox(height: 20),

                                            // Title
                                            Text(
                                              'Group Created!',
                                              style: Blacks.mediumSemiPoppins.copyWith(fontSize: 18),
                                              textAlign: TextAlign.center,
                                            ),
                                            const SizedBox(height: 12),

                                            // Message
                                            Text(
                                              'Would you like to add members now?',
                                              style: Grays.regularPoppins.copyWith(fontSize: 14),
                                              textAlign: TextAlign.center,
                                            ),
                                            const SizedBox(height: 24),

                                            // Buttons
                                            Row(
                                              children: [
                                                Expanded(
                                                  child: OutlinedButton(
                                                    onPressed: () {
                                                      Navigator.pop(context); // Close dialog
                                                      Navigator.pop(context); // Go back to previous screen
                                                    },
                                                    style: OutlinedButton.styleFrom(
                                                      padding: const EdgeInsets.symmetric(vertical: 14),
                                                      side: BorderSide(
                                                        color: HexColor(AppColors.darkerGray2),
                                                        width: 1.5,
                                                      ),
                                                      shape: RoundedRectangleBorder(
                                                        borderRadius: BorderRadius.circular(12),
                                                      ),
                                                    ),
                                                    child: Text(
                                                      'Later',
                                                      style: TextStyle(
                                                        color: HexColor(AppColors.darkerGray2),
                                                        fontWeight: FontWeight.w600,
                                                        fontSize: 14,
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                                const SizedBox(width: 12),
                                                Expanded(
                                                  child: ElevatedButton(
                                                    onPressed: () {
                                                      Navigator.pop(context); // Close dialog
                                                      Navigator.pop(context); // Go back to previous screen
                                                      // Navigate to device contacts to add members
                                                      contactsProvider.selectGroup(contactsProvider.createGroupResponse!);
                                                      Navigator.pushNamed(context, Routes.deviceContacts);
                                                    },
                                                    style: ElevatedButton.styleFrom(
                                                      backgroundColor: HexColor(AppColors.primaryGreen),
                                                      foregroundColor: Colors.white,
                                                      padding: const EdgeInsets.symmetric(vertical: 14),
                                                      shape: RoundedRectangleBorder(
                                                        borderRadius: BorderRadius.circular(12),
                                                      ),
                                                      elevation: 0,
                                                    ),
                                                    child: const Text(
                                                      'Add Members',
                                                      style: TextStyle(
                                                        fontWeight: FontWeight.w700,
                                                        fontSize: 14,
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  );
                                },
                              );
                            } else {
                              Fluttertoast.showToast(
                                msg: contactsProvider.createGroupResponse!.error!,
                              );
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: HexColor(AppColors.primaryGreen),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            elevation: 0,
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(HugeIcons.strokeRoundedUserGroup, size: 18),
                              const SizedBox(width: 8),
                              const Text(
                                'CREATE GROUP',
                                style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 14,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
