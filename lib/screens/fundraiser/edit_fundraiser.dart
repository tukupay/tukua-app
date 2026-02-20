import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';

import '../../constants/constants.dart';
import '../../models/models.dart';
import '../../providers/providers.dart';
import '../../routes.dart';
import '../../widgets/widget.dart';

class EditFundraiser extends StatefulWidget {
  const EditFundraiser({super.key});

  @override
  State<EditFundraiser> createState() => _EditFundraiserState();
}

class _EditFundraiserState extends State<EditFundraiser> {
  final titleController = TextEditingController();
  final donationController = TextEditingController();
  final descriptionController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_)async{
      final fundraiserProvider = Provider.of<FundraiserProvider>(context, listen: false);
      final fundraiser = fundraiserProvider.selectedFundraiser;

      if (fundraiser != null) {
        titleController.text = fundraiser.title ?? '';
        donationController.text = fundraiser.goalAmount?.toString() ?? '';
        descriptionController.text = fundraiser.description ?? '';
        fundraiserProvider.setPublicity(fundraiser.isPublic ?? false);
        fundraiserProvider.setAllowPledging(fundraiser.allowPledges ?? false);
        fundraiserProvider.setAnalyticsPublic(fundraiser.analyticsPublic ?? false);
        fundraiserProvider.setStartDate(fundraiser.startDate!);
        fundraiserProvider.setEndDate(fundraiser.endDate!);
        fundraiserProvider.selectCategory(fundraiser.category ?? '');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: Consumer2<FundraiserProvider, WalletProvider>(
        builder: (_, fundraiserProvider, walletProvider, __) {
          final fundraiser = fundraiserProvider.selectedFundraiser;
          if (fundraiser == null) {
            return const Center(child: Text("No fundraiser selected"));
          }

          return Container(
            height: size.height,
            width: size.width,
            decoration: BoxDecoration(
                image: DecorationImage(
                    image: AssetImage(Strings.imageAsset('bg.png')),
                    fit: BoxFit.cover)),
            child: Container(
              height: size.height,
              width: size.width,
              decoration: BoxDecoration(
                  image: DecorationImage(
                      image: AssetImage(Strings.imageAsset('gradient3.png')),
                      fit: BoxFit.cover)),
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
                                  color: HexColor(AppColors.darkerGray2),
                                  size: 20),
                            ),
                          ),
                          const Spacer(),
                          Column(
                            children: [
                              Text('Edit Fundraiser',
                                  style: Blacks.mediumSemiRubik),
                              Text('Update your campaign',
                                  style: Grays.smallestPoppinsHint
                                      .copyWith(fontSize: 10)),
                            ],
                          ),
                          const Spacer(),
                          NotificationsBell(),
                        ],
                      ),
                    ),
                  ),
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Fundraising Details', style: Blacks.tinyBolderPoppins),
                          Spaces.smallTopSpace,

                          // Title
                          Spaces.tinyTopSpace,
                          LabeledField(
                            label: 'Title',
                            controller: titleController,
                            enabled: true,
                            hint: 'Fundraiser title'),

                          // Category
                          Spaces.smallTopSpace,
                          SimpleSelectorCard<String>(
                            selectedItem: fundraiserProvider.selectedCategory,
                            items: fundraiserProvider.categories,
                            onSelected: (val) {
                              fundraiserProvider.selectCategory(val);
                            },
                            itemLabelBuilder: (val) => val,
                            label: 'Category',
                            sheetTitle: 'Select Category',
                            sheetSubtitle: 'What type of fundraiser is this?',
                            icon: HugeIcons.strokeRoundedFolderDetails,
                          ),

                          // Target amount
                          Spaces.smallTopSpace,
                          Spaces.tinyTopSpace,
                          LabeledField(
                            label: 'Donation Goal',
                            controller: donationController,
                            hint: 'e.g. 10000',
                            suffixIcon: Icon(Icons.monetization_on_outlined),
                            isNumber: true,
                            enabled: true,
                          ),

                          // Dates
                          Spaces.smallTopSpace,
                          FundraiserDates(),

                          // Description
                          Spaces.smallTopSpace,
                          Spaces.tinyTopSpace,
                          LabeledField(
                            label: 'Description',
                            controller: descriptionController,
                            hint: 'Description...',
                            multiLine: true,
                            enabled: true),

                          // Toggles
                          Spaces.smallTopSpace,
                          Text('Publicity', style: Blacks.tinyBolderPoppins),
                          Row(
                            children: [
                              Expanded(child: Text('Visible to the public?', style: Grays.smallRoboto)),
                              Switch(
                                value: fundraiserProvider.publiclyVisible,
                                onChanged: (val) => fundraiserProvider.setPublicity(val),
                              ),
                            ],
                          ),

                          Text('Pledging', style: Blacks.tinyBolderPoppins),
                          Row(
                            children: [
                              Expanded(child: Text('Allow pledging?', style: Grays.smallRoboto)),
                              Switch(
                                value: fundraiserProvider.allowPledging,
                                onChanged: (val) => fundraiserProvider.setAllowPledging(val),
                              ),
                            ],
                          ),

                          Text('Publicize Analytics', style: Blacks.tinyBolderPoppins),
                          Row(
                            children: [
                              Expanded(child: Text('Show progress publicly?', style: Grays.smallRoboto)),
                              Switch(
                                value: fundraiserProvider.publicAnalytics,
                                onChanged: (val) => fundraiserProvider.setAnalyticsPublic(val),
                              ),
                            ],
                          ),

                          Spaces.mediumTopSpace,
                        ],
                      ),
                    ),
                  ),

                  Padding(
                    padding: Paddings.tinyVertical,
                    child: AltGreenButton(
                      text: 'SAVE CHANGES',
                      tapped: () async {
                        Fluttertoast.cancel();
                        // Validations first
                        if (titleController.text.trim().isEmpty) {
                          Fluttertoast.showToast(msg: "Please enter a title");
                        } else if (fundraiserProvider.selectedCategory == null) {
                          Fluttertoast.showToast(msg: "Please choose a category");
                        } else if (donationController.text.trim().isEmpty ||
                            double.tryParse(donationController.text.trim()) == null) {
                          Fluttertoast.showToast(msg: "Enter a valid donation goal");
                        } else if (fundraiserProvider.startDate == null ||
                            fundraiserProvider.endDate == null) {
                          Fluttertoast.showToast(msg: "Please set valid dates");
                        } else if (descriptionController.text.trim().isEmpty) {
                          Fluttertoast.showToast(msg: "Add a description");
                        } else {
                          final fundraiser = fundraiserProvider.selectedFundraiser!;
                          final newTitle = titleController.text.trim();
                          final newCategory = fundraiserProvider.selectedCategory!;
                          final newGoal = double.parse(donationController.text.trim());
                          final newDescription = descriptionController.text.trim();
                          final newStart = fundraiserProvider.startDate!;
                          final newEnd = fundraiserProvider.endDate!;
                          final newIsPublic = fundraiserProvider.publiclyVisible;
                          final newAllowPledges = fundraiserProvider.allowPledging;
                          final newAnalytics = fundraiserProvider.publicAnalytics;

                          // Check for changes
                          bool hasChanged =
                              fundraiser.title != newTitle ||
                                  fundraiser.category != newCategory ||
                                  fundraiser.goalAmount != newGoal ||
                                  fundraiser.description != newDescription ||
                                  fundraiser.startDate != newStart ||
                                  fundraiser.endDate != newEnd ||
                                  fundraiser.isPublic != newIsPublic ||
                                  fundraiser.allowPledges != newAllowPledges ||
                                  fundraiser.analyticsPublic != newAnalytics;

                          if (!hasChanged) {
                            Fluttertoast.showToast(msg: "No changes detected.");
                            return;
                          }

                          // Prepare update data
                          final updateData = {
                            "title": newTitle,
                            "category": newCategory,
                            "goal_amount": newGoal.toString(),
                            "description": newDescription,
                            "start_date": newStart.toIso8601String(),
                            "end_date": newEnd.toIso8601String(),
                            "is_public": newIsPublic.toString(),
                            "allow_pledges": newAllowPledges.toString(),
                            "analytics_public": newAnalytics.toString(),
                          };

                          // Proceed with update
                          showAdaptiveDialog(
                            context: context,
                            builder: (_) => AiAnalysisAlert(
                              icon: HugeIcons.strokeRoundedMoneySavingJar,
                              action: "Updating Fundraiser...",
                            ),
                          );

                          await fundraiserProvider.updateFundraiser(updateData);

                          Navigator.pop(context); // close loading dialog

                          if (fundraiserProvider.updateResponse?.error == null) {
                            Fluttertoast.showToast(msg: "Fundraiser updated successfully!");
                            Navigator.pop(context); // Go back
                          } else {
                            Fluttertoast.showToast(msg: "Update failed. Try again.");
                          }
                        }

                      },
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
