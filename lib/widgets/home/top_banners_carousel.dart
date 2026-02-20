import 'dart:async';
import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'pin_banner.dart';
import 'individual_kyc_status.dart';
import 'business_kyc_status.dart';
import 'email_verification_banner.dart';
import 'pending_signatories_banner.dart';

/// TopBannersCarousel
/// Collects any applicable top-of-home banners (KYC status, PIN setup) and
/// presents them inside an auto-advancing PageView if there are multiple.
/// If zero or only one banner applies, it gracefully degrades to simple layout.
class TopBannersCarousel extends StatefulWidget {
  const TopBannersCarousel({super.key});

  @override
  State<TopBannersCarousel> createState() => _TopBannersCarouselState();
}

class _TopBannersCarouselState extends State<TopBannersCarousel> {
  final PageController _controller = PageController();
  Timer? _autoTimer;
  int _currentIndex = 0;
  List<Widget> _pages = const [];

  static const Duration _interval = Duration(seconds: 4);
  static const Duration _animDuration = Duration(milliseconds: 420);

  void _restartTimer() {
    _autoTimer?.cancel();
    if (_pages.length <= 1) return; // only run auto-scroll when multiple pages
    _autoTimer = Timer.periodic(_interval, (_) {
      if (!mounted || _pages.length <= 1) return;
      _currentIndex = (_currentIndex + 1) % _pages.length;
      if (_controller.hasClients) {
        _controller.animateToPage(
          _currentIndex,
          duration: _animDuration,
          curve: Curves.easeInOutCubic,
        );
      }
    });
  }

  @override
  void dispose() {
    _autoTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<ProfileProvider, SignatoryProvider>(
      builder: (_, profile, signatory, __) {
        final List<Widget> newPages = [];
        final user = profile.user;
        if (user != null) {
          final needsPin = user.requiresPinSetup == true;
          final notVerified = user.kycStatus != Strings.kycVerified;
          final hasEmail = user.email != null && user.email!.isNotEmpty;
          final emailNotVerified = hasEmail && user.emailVerified != true;
          final hasPendingSignatories = signatory.pendingRequestsCount > 0;

          if (notVerified) {
            if (user.type == Strings.individualAcc) {
              newPages.add(const IndividualKycStatus());
            } else if (user.type == Strings.businessAcc) {
              newPages.add(const BusinessKycStatus());
            }
          }
          if (needsPin) {
            newPages.add(const PinBanner());
          }
          if (emailNotVerified) {
            newPages.add(const EmailVerificationBanner());
          }
          // Add pending signatories banner if there are pending requests
          if (hasPendingSignatories) {
            newPages.add(const PendingSignatoriesBanner());
          }
        }

        final lengthChanged = _pages.length != newPages.length;
        _pages = newPages; // update pages reference

        if (lengthChanged) {
          // Reset index and restart timer AFTER the first frame when PageView is attached.
          _currentIndex = 0;
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (!mounted) return;
            if (_controller.hasClients && _pages.length > 1) {
              _controller.jumpToPage(0);
            }
            _restartTimer();
          });
        }

        if (_pages.isEmpty) {
          // ensure timer is cancelled if pages become empty
          _autoTimer?.cancel();
          return const SizedBox();
        }
        if (_pages.length == 1) {
          _autoTimer?.cancel();
          return _pages.first; // single banner, no carousel shell
        }

        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              height: 70,
              child: PageView.builder(
                controller: _controller,
                itemCount: _pages.length,
                onPageChanged: (i) => setState(() => _currentIndex = i),
                itemBuilder: (_, i) => _pages[i],
              ),
            ),
            const SizedBox(height: 6),
            _Indicators(count: _pages.length, index: _currentIndex),
          ],
        );
      },
    );
  }
}

/// Dot indicators for the carousel using green theme.
class _Indicators extends StatelessWidget {
  final int count;
  final int index;
  const _Indicators({required this.count, required this.index});

  @override
  Widget build(BuildContext context) {
    final primaryGreen = HexColor(AppColors.primaryGreen);
    final fadedGreen = HexColor(AppColors.fadedGreen);

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(count, (i) {
        final active = i == index;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 280),
          curve: Curves.easeOutCubic,
          margin: const EdgeInsets.symmetric(horizontal: 4),
          height: 6,
          width: active ? 22 : 6,
          decoration: BoxDecoration(
            gradient: active
                ? LinearGradient(
                    colors: [primaryGreen, fadedGreen],
                  )
                : null,
            color: active ? null : primaryGreen.withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(12),
            boxShadow: active
                ? [
                    BoxShadow(
                      color: primaryGreen.withValues(alpha: 0.3),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ]
                : null,
          ),
        );
      }),
    );
  }
}
