import 'package:flutter/material.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/routes.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';

/// Landing page for STK POS feature - introduces users to payment terminal capabilities
class PosLanding extends StatefulWidget {
  const PosLanding({super.key});

  @override
  State<PosLanding> createState() => _PosLandingState();
}

class _PosLandingState extends State<PosLanding>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fade;
  late Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 600));
    _fade = CurvedAnimation(parent: _controller, curve: Curves.easeOut);
    _slide = Tween<Offset>(begin: const Offset(0, 0.04), end: Offset.zero)
        .animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));
    WidgetsBinding.instance.addPostFrameCallback((_) => _controller.forward());
  }

  @override
  void dispose() {
    _controller.dispose();
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
                // Scrollable content
                Expanded(
                  child: AnimatedBuilder(
                    animation: _controller,
                    builder: (_, __) {
                      return FadeTransition(
                        opacity: _fade,
                        child: SlideTransition(
                          position: _slide,
                          child: SingleChildScrollView(
                            physics: const BouncingScrollPhysics(),
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const SizedBox(height: 16),
                                // Hero section
                                _buildHeroSection(),
                                const SizedBox(height: 24),
                                // Trust badges
                                _buildTrustBadges(),
                                const SizedBox(height: 24),
                                // How it works
                                _buildHowItWorks(),
                                const SizedBox(height: 20),
                                // Benefits
                                _buildBenefitsCard(),
                                const SizedBox(height: 28),
                                // CTA button
                                _buildCTAButton(context),
                                const SizedBox(height: 32),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
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
                Text('STK POS', style: Blacks.regularBoldCodeNext),
                Text(
                  'Turn your phone into a payment terminal',
                  style: Grays.tinyPoppinsHint,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroSection() {
    return Container(
      padding: const EdgeInsets.all(24),
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
            color: HexColor(AppColors.primaryGreen).withAlpha(60),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          // Icon
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(30),
              shape: BoxShape.circle,
            ),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: Icon(
                HugeIcons.strokeRoundedCoins01,
                size: 32,
                color: HexColor(AppColors.primaryGreen),
              ),
            ),
          ),
          const SizedBox(height: 20),
          // Title
          const Text(
            'Accept M-Pesa Payments',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: Colors.white,
              fontFamily: 'Poppins',
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Send instant payment prompts to customers.\nNo extra hardware needed.',
            style: TextStyle(
              fontSize: 14,
              color: Colors.white.withAlpha(200),
              fontFamily: 'Inter',
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildTrustBadges() {
    return Row(
      children: [
        Expanded(child: _buildBadge(HugeIcons.strokeRoundedFlash, 'Instant', 'Setup')),
        const SizedBox(width: 12),
        Expanded(child: _buildBadge(HugeIcons.strokeRoundedDollarCircle, 'Low Fees', 'Affordable')),
        const SizedBox(width: 12),
        Expanded(child: _buildBadge(HugeIcons.strokeRoundedSecurityCheck, 'Secure', 'M-Pesa')),
      ],
    );
  }

  Widget _buildBadge(IconData icon, String title, String subtitle) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(8),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: HexColor(AppColors.primaryGreen).withAlpha(15),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: HexColor(AppColors.primaryGreen), size: 20),
          ),
          const SizedBox(height: 10),
          Text(title, style: Blacks.smallestBolderPoppins),
          Text(subtitle, style: Grays.tinySemiKarla),
        ],
      ),
    );
  }

  Widget _buildHowItWorks() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(6),
            blurRadius: 16,
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
                  color: HexColor(AppColors.primaryGreen).withAlpha(15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  HugeIcons.strokeRoundedInformationCircle,
                  color: HexColor(AppColors.primaryGreen),
                  size: 18,
                ),
              ),
              const SizedBox(width: 10),
              Text('How It Works', style: Blacks.regularBoldGrotesk),
            ],
          ),
          const SizedBox(height: 16),
          _buildStep('1', 'Enter customer phone number', HugeIcons.strokeRoundedCall),
          _buildStep('2', 'Enter payment amount', HugeIcons.strokeRoundedCalculator),
          _buildStep('3', 'Customer receives M-Pesa prompt', HugeIcons.strokeRoundedSmartPhone01),
          _buildStep('4', 'Payment confirmed instantly', HugeIcons.strokeRoundedCheckmarkCircle02, isLast: true),
        ],
      ),
    );
  }

  Widget _buildStep(String number, String text, IconData icon, {bool isLast = false}) {
    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 0 : 12),
      child: Row(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: HexColor(AppColors.primaryGreen),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                number,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: Grays.smallestBolderPoppinsHint,
            ),
          ),
          Icon(icon, color: HexColor(AppColors.lightGray), size: 18),
        ],
      ),
    );
  }

  Widget _buildBenefitsCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            HexColor(AppColors.primaryGreen).withAlpha(12),
            HexColor(AppColors.fadedGreen).withAlpha(8),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: HexColor(AppColors.primaryGreen).withAlpha(30),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                HugeIcons.strokeRoundedStore04,
                color: HexColor(AppColors.primaryGreen),
                size: 18,
              ),
              const SizedBox(width: 8),
              Text('Perfect For', style: Blacks.regularBoldGrotesk),
            ],
          ),
          const SizedBox(height: 14),
          _buildBenefitItem('Small businesses & retail shops'),
          _buildBenefitItem('Event vendors & markets'),
          _buildBenefitItem('Service providers & freelancers'),
          _buildBenefitItem('Any business accepting M-Pesa'),
        ],
      ),
    );
  }

  Widget _buildBenefitItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(
            HugeIcons.strokeRoundedCheckmarkCircle02,
            color: HexColor(AppColors.primaryGreen),
            size: 16,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(text, style: Grays.smallestBolderPoppinsHint),
          ),
        ],
      ),
    );
  }

  Widget _buildCTAButton(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 54,
      child: ElevatedButton(
        onPressed: () {
          Navigator.pushReplacementNamed(context, Routes.stkPosSetup);
        },
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
            const Text(
              'Get Started',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                fontFamily: 'Inter',
              ),
            ),
            const SizedBox(width: 8),
            const Icon(HugeIcons.strokeRoundedArrowRight01, size: 20),
          ],
        ),
      ),
    );
  }
}
