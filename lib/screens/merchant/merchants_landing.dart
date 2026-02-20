import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/widgets/merchants/merchant_landing_app_bar.dart';
import 'package:tuku/widgets/merchants/merchant_landing_hero.dart';
import 'package:tuku/widgets/merchants/merchant_trust_badges.dart';
import 'package:tuku/widgets/merchants/merchant_what_are_card.dart';
import 'package:tuku/widgets/merchants/merchant_benefits_card.dart';
import 'package:tuku/widgets/merchants/merchant_explore_cta.dart';

/// Landing page for Merchants feature - educates users about merchant apps
class MerchantsLanding extends StatefulWidget {
  const MerchantsLanding({super.key});

  @override
  State<MerchantsLanding> createState() => _MerchantsLandingState();
}

class _MerchantsLandingState extends State<MerchantsLanding>
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
                const MerchantLandingAppBar(),
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
                            child: const Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                SizedBox(height: 16),
                                // Hero section
                                MerchantLandingHero(),
                                SizedBox(height: 24),
                                // Trust badges
                                MerchantTrustBadges(),
                                SizedBox(height: 24),
                                // What are Merchants section
                                MerchantWhatAreCard(),
                                SizedBox(height: 20),
                                // Benefits
                                MerchantBenefitsCard(),
                                SizedBox(height: 28),
                                // CTA button
                                MerchantExploreCTA(),
                                SizedBox(height: 32),
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

}

