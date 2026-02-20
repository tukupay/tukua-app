import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../widgets/widget.dart';
import '../../models/models.dart';

/// POS Setup screen - Allows users to configure their payment terminal profile
class PosSetup extends StatefulWidget {
  const PosSetup({super.key});

  @override
  State<PosSetup> createState() => _PosSetupState();
}

class _PosSetupState extends State<PosSetup>
    with SingleTickerProviderStateMixin {
  final nameController = TextEditingController();
  final descController = TextEditingController();
  String? bizType;

  late AnimationController _animController;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _fadeAnim = CurvedAnimation(parent: _animController, curve: Curves.easeOut);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = Provider.of<ProfileProvider>(context, listen: false).user;
      final name = user?.businessName ?? '${user?.firstName} ${user?.middleName ?? ''}'.trim();
      nameController.text = name;
      _animController.forward();
    });
  }

  @override
  void dispose() {
    _animController.dispose();
    nameController.dispose();
    descController.dispose();
    super.dispose();
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
          child: SafeArea(
            child: Column(
              children: [
                // App bar
                _buildAppBar(context),
                // Content
                Expanded(
                  child: FadeTransition(
                    opacity: _fadeAnim,
                    child: Consumer<PosProvider>(
                      builder: (_, pos, __) {
                        return SingleChildScrollView(
                          physics: const BouncingScrollPhysics(),
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 8),
                              // Header card
                              _buildHeaderCard(),
                              const SizedBox(height: 24),
                              // Form fields
                              _buildFormSection(),
                              const SizedBox(height: 16),
                              // Helper text
                              _buildHelperText(),
                              const SizedBox(height: 24),
                              // Submit button
                              _buildSubmitButton(pos),
                              const SizedBox(height: 32),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAppBar(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(8, 8, 16, 8),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.pop(context),
            style: IconButton.styleFrom(
              backgroundColor: Colors.white.withAlpha(200),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            icon: Icon(
              HugeIcons.strokeRoundedArrowLeft01,
              color: HexColor(AppColors.primaryGreen),
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('POS Setup', style: Blacks.regularBoldCodeNext),
                Text('Configure your payment terminal', style: Grays.tinyPoppinsHint),
              ],
            ),
          ),
          // Step indicator
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: HexColor(AppColors.primaryGreen).withAlpha(15),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  HugeIcons.strokeRoundedSetup01,
                  size: 14,
                  color: HexColor(AppColors.primaryGreen),
                ),
                const SizedBox(width: 4),
                Text('Step 2/2', style: Greens.tinySemiRoboto),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeaderCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            HexColor(AppColors.primaryGreen),
            HexColor(AppColors.fadedGreen),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: HexColor(AppColors.primaryGreen).withAlpha(40),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(30),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              HugeIcons.strokeRoundedStore04,
              color: Colors.white,
              size: 24,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Almost Ready!',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                    fontFamily: 'Poppins',
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Add your business details so customers recognize your payment prompts.',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white.withAlpha(200),
                    fontFamily: 'Inter',
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(8),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Business name
          LabeledField(
            enabled: true,
            label: 'Business Name',
            hint: 'e.g Bright Mart',
            controller: nameController,
            prefixIcon: Icon(
              HugeIcons.strokeRoundedBuilding06,
              color: HexColor(AppColors.lightGray),
              size: 20,
            ),
          ),
          const SizedBox(height: 18),
          // Business type
          SimpleSelectorCard<String>(
            selectedItem: bizType,
            items: const ['Retail', 'Services', 'Hospitality', 'Other'],
            onSelected: (val) => setState(() => bizType = val),
            itemLabelBuilder: (s) => s,
            label: 'Business Type',
            sheetTitle: 'Select Business Type',
            sheetSubtitle: 'What type of business do you operate?',
            icon: HugeIcons.strokeRoundedStore04,
          ),
          const SizedBox(height: 18),
          // Description
          LabeledField(
            label: 'Description (optional)',
            hint: 'Short note customers may see',
            controller: descController,
            multiLine: true,
            enabled: true,
            prefixIcon: Icon(
              HugeIcons.strokeRoundedNote,
              color: HexColor(AppColors.lightGray),
              size: 20,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHelperText() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
      decoration: BoxDecoration(
        color: HexColor(AppColors.primaryGreen).withAlpha(8),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: HexColor(AppColors.primaryGreen).withAlpha(15),
        ),
      ),
      child: Row(
        children: [
          Icon(
            HugeIcons.strokeRoundedInformationCircle,
            size: 16,
            color: HexColor(AppColors.fadedGreen),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'You can update these details anytime in POS Settings.',
              style: Grays.tinyPoppinsHint,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubmitButton(PosProvider pos) {
    return SizedBox(
      width: double.infinity,
      height: 54,
      child: pos.submittingSetup
          ? Center(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withAlpha(6),
                      blurRadius: 12,
                    ),
                  ],
                ),
                child: const WaveDots(),
              ),
            )
          : ElevatedButton(
              onPressed: _onSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: HexColor(AppColors.primaryGreen),
                foregroundColor: Colors.white,
                elevation: 4,
                shadowColor: HexColor(AppColors.primaryGreen).withAlpha(60),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(HugeIcons.strokeRoundedCheckmarkCircle02, size: 20),
                  const SizedBox(width: 10),
                  const Text(
                    'Finish Setup',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'Inter',
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Future<void> _onSubmit() async {
    Fluttertoast.cancel();
    if (nameController.text.trim().isEmpty) {
      Fluttertoast.showToast(msg: "Please include the name of your business");
      return;
    }
    if (bizType == null) {
      Fluttertoast.showToast(msg: "Please select the type of business");
      return;
    }
    final request = PosRequest(
      name: nameController.text.trim(),
      type: bizType!.toLowerCase(),
      description: descController.text.trim().isEmpty ? null : descController.text.trim(),
    );
    await Provider.of<PosProvider>(context, listen: false).createProfile(request);
    Navigator.pushReplacementNamed(context, Routes.stkPos);
  }
}
