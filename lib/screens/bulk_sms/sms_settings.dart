import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/widgets/widget.dart';

class SmsSettings extends StatelessWidget {
  const SmsSettings({super.key});

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
                          Text('SMS Settings', style: Blacks.mediumSemiRubik),
                          Text('Manage your SMS configuration',
                              style: Grays.smallestPoppinsHint.copyWith(fontSize: 10)),
                        ],
                      ),
                      const Spacer(),
                      const SizedBox(width: 36), // Balance for back button
                    ],
                  ),
                ),
              ),

              // Header Card
              Container(
                margin: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      HexColor(AppColors.primaryGreen),
                      HexColor(AppColors.fadedGreen),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: HexColor(AppColors.primaryGreen).withAlpha(76),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white.withAlpha(51),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(
                        HugeIcons.strokeRoundedSettings01,
                        color: Colors.white,
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'SMS Configuration',
                            style: Whites.mediumSemiRoboto.copyWith(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Customize your messaging experience',
                            style: Whites.smallBoldRoboto.copyWith(
                              color: Colors.white.withAlpha(204),
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Settings Content
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Sender IDs Section
                      _buildSectionCard(
                        icon: HugeIcons.strokeRoundedUser,
                        title: 'Sender IDs',
                        description: 'Manage your sender identities',
                        child: const SenderIds(),
                      ),
                      const SizedBox(height: 16),

                      // SMS Groups Section
                      _buildSectionCard(
                        icon: HugeIcons.strokeRoundedUserGroup,
                        title: 'Contact Groups',
                        description: 'Organize your recipients',
                        child: const SmsGroups(),
                      ),
                      const SizedBox(height: 80),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionCard({
    required IconData icon,
    required String title,
    required String description,
    required Widget child,
  }) {
    return Container(
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
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: HexColor('#E8F5E9'),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, size: 20, color: HexColor(AppColors.primaryGreen)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: Blacks.regularBoldCodeNext),
                    const SizedBox(height: 2),
                    Text(description, style: Grays.smallestPoppinsHint),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }
}
