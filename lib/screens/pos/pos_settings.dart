import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../widgets/widget.dart';
import '../../models/models.dart';

/// POS Settings screen - Update payment terminal configuration
class PosSettings extends StatefulWidget {
  const PosSettings({super.key});

  @override
  State<PosSettings> createState() => _PosSettingsState();
}

class _PosSettingsState extends State<PosSettings>
    with SingleTickerProviderStateMixin {
  final nameController = TextEditingController();
  final descController = TextEditingController();
  String? bizType;
  FullWallet? selectedWallet;

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
      _loadCurrentSettings();
      _animController.forward();
    });
  }

  void _loadCurrentSettings() {
    final user = Provider.of<ProfileProvider>(context, listen: false).user;
    final wallets = Provider.of<WalletProvider>(context, listen: false);

    // Load POS name - fallback to business name or user name
    final name = user?.posName ??
        user?.businessName ??
        '${user?.firstName ?? ''} ${user?.lastName ?? ''}'.trim();
    nameController.text = name.isNotEmpty ? name : '';

    // Load POS description
    descController.text = user?.posDescription ?? '';

    // Load POS type with proper capitalization
    if (user?.posType != null && user!.posType!.isNotEmpty) {
      // Ensure proper capitalization for display (e.g., "retail" -> "Retail")
      final type = user.posType!;
      bizType = '${type[0].toUpperCase()}${type.substring(1).toLowerCase()}';
    }

    // Find primary wallet (first wallet with isPrimary == true)
    FullWallet? primaryWallet;
    try {
      primaryWallet = wallets.userWallets.firstWhere((w) => w.isPrimary == true);
    } catch (_) {
      // No primary wallet found
    }

    // Load saved POS wallet
    if (wallets.userWallets.isNotEmpty) {
      if (user?.posWalletId != null) {
        // Try to find the saved POS wallet
        final savedWallet = wallets.userWallets.where((w) => w.id == user!.posWalletId);
        if (savedWallet.isNotEmpty) {
          selectedWallet = savedWallet.first;
        } else {
          // Fallback to primary wallet or first wallet
          selectedWallet = primaryWallet ?? wallets.userWallets.first;
        }
      } else {
        // No POS wallet set, use primary or first wallet
        selectedWallet = primaryWallet ?? wallets.userWallets.first;
      }
    }

    setState(() {});
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
                    child: Consumer3<PosProvider, ProfileProvider, WalletProvider>(
                      builder: (_, pos, profile, wallets, __) {
                        return SingleChildScrollView(
                          physics: const BouncingScrollPhysics(),
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 8),
                              // Current profile card
                              _buildCurrentProfileCard(profile),
                              const SizedBox(height: 24),
                              // Form fields
                              _buildFormSection(wallets),
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
                Text('POS Settings', style: Blacks.regularBoldCodeNext),
                Text('Update your payment terminal', style: Grays.tinyPoppinsHint),
              ],
            ),
          ),
          // Settings icon
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: HexColor(AppColors.primaryGreen).withAlpha(15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              HugeIcons.strokeRoundedSettings01,
              size: 18,
              color: HexColor(AppColors.primaryGreen),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentProfileCard(ProfileProvider profile) {
    final user = profile.user;
    return Container(
      padding: const EdgeInsets.all(10),
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
          // Store icon
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
                Text(
                  user?.posName ?? 'Your POS',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                    fontFamily: 'Poppins',
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withAlpha(30),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: user?.posStatus == 'active'
                              ? HexColor(AppColors.brightGreen)
                              : HexColor(AppColors.primaryOrange),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        user?.posStatus?.toUpperCase() ?? 'ACTIVE',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: Colors.white.withAlpha(220),
                          fontFamily: 'Inter',
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          // Type badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              user?.posType ?? 'Type',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: HexColor(AppColors.primaryGreen),
                fontFamily: 'Inter',
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormSection(WalletProvider wallets) {
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
// Section title
          Row(
            children: [
              Icon(
                HugeIcons.strokeRoundedEdit02,
                size: 16,
                color: HexColor(AppColors.fadedGreen),
              ),
              const SizedBox(width: 8),
              Text('Edit Details', style: Blacks.smallestBolderPoppins),
            ],
          ),
          const SizedBox(height: 18),
          // Business name
          LabeledField(
            enabled: true,
            label: 'Business / POS Name',
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
          // Wallet selector
          WalletSelectorCard(
            selectedWallet: selectedWallet,
            wallets: wallets.userWallets,
            onSelected: (wallet) {
              setState(() => selectedWallet = wallet);
            },
            label: 'POS Wallet',
            sheetTitle: 'Select POS Wallet',
            sheetSubtitle: 'Where payments will be collected',
            isSource: false,
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
              'These values are visible to customers during payment prompts.',
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
                  const Icon(HugeIcons.strokeRoundedTick01, size: 20),
                  const SizedBox(width: 10),
                  const Text(
                    'Save Changes',
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
    final name = nameController.text.trim();
    if (name.isEmpty) {
      Fluttertoast.showToast(msg: "Please include the name of your POS/business");
      return;
    }
    if (bizType == null) {
      Fluttertoast.showToast(msg: "Please select the type of business");
      return;
    }
    if (selectedWallet == null) {
      Fluttertoast.showToast(msg: "Please select a wallet for POS payments");
      return;
    }

    final request = PosRequest(
      name: name,
      type: bizType!.toLowerCase(),
      description: descController.text.trim(),
      walletId: selectedWallet!.id,
    );
    await Provider.of<PosProvider>(context, listen: false).updateProfile(request, context);
  }
}
