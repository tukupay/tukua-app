import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';

class EditBankAccount extends StatefulWidget {
  const EditBankAccount({super.key});

  @override
  State<EditBankAccount> createState() => _EditBankAccountState();
}

class _EditBankAccountState extends State<EditBankAccount> {
  final bankNameController = TextEditingController();
  final accountNameController = TextEditingController();
  final accountNumberController = TextEditingController();
  final branchCodeController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final banking = Provider.of<BankingProvider>(context, listen: false);
      if (banking.selectedBank != null) {
        bankNameController.text = banking.selectedBank?.bankName ?? '';
        accountNameController.text = banking.selectedBank?.accountName ?? '';
        accountNumberController.text = banking.selectedBank?.accountNumber ?? '';
        branchCodeController.text = banking.selectedBank?.branch ?? '';
      }
    });
  }

  @override
  void dispose() {
    bankNameController.dispose();
    accountNameController.dispose();
    accountNumberController.dispose();
    branchCodeController.dispose();
    super.dispose();
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    TextInputType? keyboardType,
    int maxLines = 1,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
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
            controller: controller,
            keyboardType: keyboardType,
            maxLines: maxLines,
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: Grays.tinyPoppinsHint,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              prefixIcon: Icon(
                icon,
                color: HexColor(AppColors.darkerGray2),
                size: 20,
              ),
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Scaffold(
      backgroundColor: HexColor('#F8FAF9'),
      body: Container(
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
                          Text('Edit Bank Account', style: Blacks.mediumSemiRubik),
                          Text('Update account details',
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
                  HugeIcons.strokeRoundedBank,
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
                          color: HexColor('#FFF9E6'),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: HexColor('#FFE082')),
                        ),
                        child: Row(
                          children: [
                            Icon(HugeIcons.strokeRoundedInformationCircle,
                                color: HexColor('#F57C00'), size: 20),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'Update your bank account information for settlements',
                                style: TextStyle(
                                  color: HexColor('#5D4037'),
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
                                Text('Account Details', style: Blacks.regularBoldCodeNext),
                              ],
                            ),
                            const SizedBox(height: 20),

                            // Bank Name Field
                            _buildTextField(
                              controller: bankNameController,
                              label: 'Bank Name',
                              hint: 'e.g., Kenya Commercial Bank',
                              icon: HugeIcons.strokeRoundedBank,
                            ),
                            const SizedBox(height: 20),

                            // Account Name Field
                            _buildTextField(
                              controller: accountNameController,
                              label: 'Account Name',
                              hint: 'e.g., John Doe',
                              icon: HugeIcons.strokeRoundedUser,
                            ),
                            const SizedBox(height: 20),

                            // Account Number Field
                            _buildTextField(
                              controller: accountNumberController,
                              label: 'Account Number',
                              hint: 'e.g., 1234567890',
                              icon: HugeIcons.strokeRoundedCreditCardValidation,
                              keyboardType: TextInputType.number,
                            ),
                            const SizedBox(height: 20),

                            // Branch Code Field
                            _buildTextField(
                              controller: branchCodeController,
                              label: 'Branch Code (Optional)',
                              hint: 'e.g., 001',
                              icon: HugeIcons.strokeRoundedLocation01,
                              keyboardType: TextInputType.number,
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
                      onPressed: () {
                        // TODO: Implement update functionality when API is ready
                        Fluttertoast.showToast(
                          msg: 'Todo Update details?',
                          toastLength: Toast.LENGTH_LONG,
                        );
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
                          const Icon(HugeIcons.strokeRoundedCheckmarkCircle01, size: 18),
                          const SizedBox(width: 8),
                          const Text(
                            'UPDATE ACCOUNT',
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
      ),
    );
  }
}

