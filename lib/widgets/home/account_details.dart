import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';

class AccountDetails extends StatefulWidget {
  final FullWallet wallet;
  final int index;
  const AccountDetails({super.key,
  required this.wallet,
  required this.index});

  @override
  State<AccountDetails> createState() => _AccountDetailsState();
}

class _AccountDetailsState extends State<AccountDetails> {

  String _getFormattedPhoneNumber(String? phoneNumber) {
    final phoneNumberRaw = phoneNumber?.replaceAll("+", "") ?? '0';
    if (phoneNumberRaw.length > 3) {
      final countryCode = phoneNumberRaw.substring(0, 3);
      final restOfNumber = phoneNumberRaw.substring(3);
      return '$countryCode$restOfNumber';
    }
    return phoneNumberRaw;
  }

  String _getWalletIndexSuffix(int index) {
    return '0${index + 1}';
  }

  String _getAccountNumberForClipboard(String? phoneNumber, int index) {
    final phoneNumberRaw = phoneNumber?.replaceAll("+", "") ?? '0';
    if (phoneNumberRaw.length > 3) {
      final countryCode = phoneNumberRaw.substring(0, 3);
      final restOfNumber = phoneNumberRaw.substring(3);
      return '$countryCode$restOfNumber 0${index + 1}';
    }
    return '$phoneNumberRaw 0${index + 1}';
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<ProfileProvider>(context).user;
    final phoneNumberPart = _getFormattedPhoneNumber(user?.phoneNumber);
    final walletIndexPart = _getWalletIndexSuffix(widget.index);
    final size = MediaQuery.of(context).size;

    // Build gradient colors from wallet.colors or fallback
    final List<Color> gradientColors = () {
      try {
        final cols = widget.wallet.colors;
        if (cols != null && cols.length >= 2) {
          return cols.take(2).map((c) => HexColor(c.trim())).toList();
        }
        final col = widget.wallet.color;
        if (col != null && col.contains(',')) {
          final parts = col.split(',');
          if (parts.length >= 2) {
            return [HexColor(parts[0].trim()), HexColor(parts[1].trim())];
          }
        }
      } catch (_) {}
      return [HexColor('#0D1B2A'), HexColor('#1B3A4B')];
    }();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4),
      height: 190,
      width: size.width,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: gradientColors,
        ),
        boxShadow: [
          BoxShadow(
            color: gradientColors.first.withOpacity(0.4),
            blurRadius: 20,
            offset: const Offset(0, 8),
            spreadRadius: -4,
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Stack(
          children: [
            // Decorative glassmorphic shapes
            Positioned(
              top: -30,
              right: -30,
              child: Container(
                height: 120,
                width: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      Colors.white.withOpacity(0.15),
                      Colors.white.withOpacity(0.05),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
            Positioned(
              bottom: -50,
              left: -20,
              child: Container(
                height: 140,
                width: 140,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      Colors.white.withOpacity(0.08),
                      Colors.white.withOpacity(0.02),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
            // Subtle noise/texture overlay
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.white.withOpacity(0.1),
                      Colors.transparent,
                      Colors.black.withOpacity(0.1),
                    ],
                    stops: const [0.0, 0.5, 1.0],
                  ),
                ),
              ),
            ),
            // Main content
            Consumer<AppState>(
              builder: (_, appState, __) {
                return Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Top row: Logo, wallet info, settings
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Glassmorphic logo container
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: BackdropFilter(
                              filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                              child: Container(
                                height: 48,
                                width: 48,
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: Colors.white.withOpacity(0.3),
                                    width: 1,
                                  ),
                                ),
                                padding: const EdgeInsets.all(6),
                                child: Image.asset(
                                  Strings.iconImage('tuku.png'),
                                  fit: BoxFit.contain,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          // Wallet name & account
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  widget.wallet.name ?? 'My Wallet',
                                  style: GoogleFonts.indieFlower(
                                    fontSize: 17,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.white,
                                    letterSpacing: 0.3,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Text(
                                      'Acc: $phoneNumberPart',
                                      style: GoogleFonts.inter(
                                        fontSize: 11,
                                        color: Colors.white.withOpacity(0.7),
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    Text(
                                      walletIndexPart,
                                      style: GoogleFonts.inter(
                                        fontSize: 11,
                                        color: HexColor('#F59E0B'),
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    _GlassIconButton(
                                      icon: HugeIcons.strokeRoundedCopy01,
                                      size: 22,
                                      iconSize: 12,
                                      onTap: () async {
                                        final accNum = _getAccountNumberForClipboard(user?.phoneNumber, widget.index);
                                        await Clipboard.setData(ClipboardData(text: accNum));
                                        Fluttertoast.showToast(msg: "Copied to clipboard");
                                      },
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          // Settings button
                          _GlassIconButton(
                            icon: HugeIcons.strokeRoundedSettings01,
                            size: 36,
                            iconSize: 18,
                            onTap: () {
                              Provider.of<WalletProvider>(context, listen: false).selectWallet(widget.wallet);
                              Navigator.pushNamed(context, Routes.myWalletDetails);
                            },
                          ),
                        ],
                      ),
                      const Spacer(),
                      // Wallet alias row
                      Row(
                        children: [
                          Icon(
                            HugeIcons.strokeRoundedWallet01,
                            color: Colors.white.withOpacity(0.6),
                            size: 14,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            widget.wallet.alias ?? '---',
                            style: GoogleFonts.robotoMono(
                              fontSize: 11,
                              color: Colors.white.withOpacity(0.7),
                              letterSpacing: 1.2,
                            ),
                          ),
                          const SizedBox(width: 6),
                          _GlassIconButton(
                            icon: HugeIcons.strokeRoundedClipboard,
                            size: 22,
                            iconSize: 12,
                            onTap: () async {
                              Fluttertoast.cancel();
                              await Clipboard.setData(ClipboardData(text: widget.wallet.alias ?? '--'));
                              Fluttertoast.showToast(msg: "Copied wallet number");
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      // Permalink/Share link row
                      Row(
                        children: [
                          Icon(
                            HugeIcons.strokeRoundedLink01,
                            color: Colors.white.withOpacity(0.5),
                            size: 12,
                          ),
                          const SizedBox(width: 6),
                          Flexible(
                            child: Text(
                              'tuku.money/pay/${widget.wallet.alias ?? 'wallet'}',
                              style: GoogleFonts.robotoMono(
                                fontSize: 9,
                                color: Colors.white.withOpacity(0.5),
                                letterSpacing: 0.8,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 6),
                          _GlassIconButton(
                            icon: HugeIcons.strokeRoundedCopy01,
                            size: 20,
                            iconSize: 10,
                            onTap: () async {
                              Fluttertoast.cancel();
                              final link = 'https://tuku.money/pay/${widget.wallet.alias ?? 'wallet'}';
                              await Clipboard.setData(ClipboardData(text: link));
                              Fluttertoast.showToast(msg: "Payment link copied");
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      // Balance section
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Total Balance',
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    color: Colors.white.withOpacity(0.6),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Row(
                                  children: [
                                    appState.hideBalance
                                        ? Text(
                                            '••••••',
                                            style: GoogleFonts.plusJakartaSans(
                                              fontSize: 26,
                                              fontWeight: FontWeight.w800,
                                              color: Colors.white,
                                            ),
                                          )
                                        : Text(
                                            'KES ${formatThousands(amount: widget.wallet.balance ?? 0)}',
                                            style: GoogleFonts.plusJakartaSans(
                                              fontSize: 26,
                                              fontWeight: FontWeight.w800,
                                              color: Colors.white,
                                              letterSpacing: -0.5,
                                            ),
                                          ),
                                    const SizedBox(width: 8),
                                    _GlassIconButton(
                                      icon: appState.hideBalance
                                          ? HugeIcons.strokeRoundedViewOff
                                          : HugeIcons.strokeRoundedEye,
                                      size: 28,
                                      iconSize: 16,
                                      onTap: () => appState.toggleBalance(),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          // View Transactions button
                          GestureDetector(
                            onTap: () {
                              Provider.of<WalletProvider>(context, listen: false).selectWallet(widget.wallet);
                              Navigator.pushNamed(context, Routes.walletTransactions);
                            },
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(20),
                              child: BackdropFilter(
                                filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                      color: Colors.white.withOpacity(0.25),
                                      width: 1,
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        'History',
                                        style: GoogleFonts.inter(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.white,
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      Icon(
                                        HugeIcons.strokeRoundedArrowRight01,
                                        color: Colors.white,
                                        size: 14,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

/// Reusable glassmorphic icon button
class _GlassIconButton extends StatelessWidget {
  final IconData icon;
  final double size;
  final double iconSize;
  final VoidCallback onTap;

  const _GlassIconButton({
    required this.icon,
    required this.size,
    required this.iconSize,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(size / 2),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
          child: Container(
            height: size,
            width: size,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.15),
              shape: BoxShape.circle,
              border: Border.all(
                color: Colors.white.withOpacity(0.2),
                width: 1,
              ),
            ),
            child: Icon(
              icon,
              color: Colors.white.withOpacity(0.9),
              size: iconSize,
            ),
          ),
        ),
      ),
    );
  }
}
