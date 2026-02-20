import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/widget.dart';
import '../../models/models.dart';

/// Main STK POS screen - Request M-Pesa payments from customers
class StkPos extends StatefulWidget {
  const StkPos({super.key});

  @override
  State<StkPos> createState() => _StkPosState();
}

class _StkPosState extends State<StkPos> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _fadeAnimation;

  // Cache color instances
  late final Color _bgColor;
  late final Color _primaryGreen;
  late final Color _fadedGreen;
  late final Color _borderColor;

  @override
  void initState() {
    super.initState();

    // Initialize cached colors
    _bgColor = HexColor('#F8FAF9');
    _primaryGreen = HexColor(AppColors.primaryGreen);
    _fadedGreen = HexColor(AppColors.fadedGreen);
    _borderColor = HexColor('#E8EBE9');

    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOut,
    );

    // Start animation immediately
    _animController.forward();

    // Load transactions asynchronously without blocking UI
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<PosProvider>(context, listen: false).getRecentPosTransactions();
    });
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Consumer2<PosProvider, ProfileProvider>(
      builder: (_, pos, profile, __) {
        return Scaffold(
          backgroundColor: _bgColor,
          body: Container(
            height: size.height,
            width: size.width,
            decoration: BoxDecoration(
                image: DecorationImage(
                    image: AssetImage(Strings.imageAsset('bg.png')),
                    fit: BoxFit.cover)
            ),
            child: Container(
              height: size.height,
              width: size.width,
              decoration: BoxDecoration(
                image: DecorationImage(
                  image: AssetImage(Strings.imageAsset('gradient2.png')),
                  fit: BoxFit.cover,
                ),
              ),
              child: SafeArea(
                child: FadeTransition(
                  opacity: _fadeAnimation,
                  child: CustomScrollView(
                    physics: const BouncingScrollPhysics(),
                    slivers: [
                      // App bar
                      SliverToBoxAdapter(
                        child: _buildAppBar(context, profile),
                      ),
                      // Business card
                      SliverToBoxAdapter(
                        child: _buildBusinessCard(profile, pos),
                      ),
                      // Payment input card
                      SliverToBoxAdapter(
                        child: _buildPaymentCard(),
                      ),
                      // Transactions header
                      SliverToBoxAdapter(
                        child: _buildTransactionsHeader(context, pos),
                      ),
                      // Transactions list
                      _buildTransactionsList(pos),
                      // Bottom padding
                      const SliverToBoxAdapter(
                        child: SizedBox(height: 24),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildAppBar(BuildContext context, ProfileProvider profile) {
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
              color: _primaryGreen,
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
                  profile.user?.posName ?? 'Request M-Pesa payments',
                  style: Grays.tinyPoppinsHint,
                ),
              ],
            ),
          ),
          // Settings button
          GestureDetector(
            onTap: () {
              if (profile.user?.posName == null) {
                Navigator.pushNamed(context, Routes.stkPosLanding);
              } else {
                Navigator.pushNamed(context, Routes.stkPosSettings);
              }
            },
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withAlpha(8),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Icon(
                HugeIcons.strokeRoundedSettings01,
                size: 20,
                color: _primaryGreen,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBusinessCard(ProfileProvider profile, PosProvider pos) {
    final todayCount = pos.recentTransactions.where((t) => _isToday(t.createdAt)).length;

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            _primaryGreen,
            _fadedGreen,
          ],
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: _primaryGreen.withAlpha(50),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        children: [
          // Stats row
          Container(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(20),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Expanded(
                  child: _buildStatItem(
                    icon: HugeIcons.strokeRoundedCalendar01,
                    label: 'Today',
                    value: '$todayCount',
                  ),
                ),
                Container(
                  width: 1,
                  height: 36,
                  color: Colors.white.withAlpha(40),
                ),
                Expanded(
                  child: _buildStatItem(
                    icon: HugeIcons.strokeRoundedInvoice03,
                    label: 'Total',
                    value: '${pos.recentTransactions.length}',
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem({required IconData icon, required String label, required String value}) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.white.withAlpha(180), size: 14),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: Colors.white.withAlpha(180),
                fontFamily: 'Inter',
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: Colors.white,
            fontFamily: 'Poppins',
          ),
        ),
      ],
    );
  }

  Widget _buildPaymentCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(20),
      decoration: GlassMorphism.standard(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: _primaryGreen.withAlpha(15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  HugeIcons.strokeRoundedPaymentSuccess01,
                  color: _primaryGreen,
                  size: 18,
                ),
              ),
              const SizedBox(width: 10),
              Text('Request Payment', style: Blacks.regularBoldGrotesk),
            ],
          ),
          const SizedBox(height: 16),
          const PosInputs(),
        ],
      ),
    );
  }

  Widget _buildTransactionsHeader(BuildContext context, PosProvider pos) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: _primaryGreen.withAlpha(15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  HugeIcons.strokeRoundedClock01,
                  size: 16,
                  color: _primaryGreen,
                ),
              ),
              const SizedBox(width: 10),
              Text('Recent Transactions', style: Blacks.regularBoldGrotesk),
            ],
          ),
          GestureDetector(
            onTap: () => Navigator.pushNamed(context, Routes.allPosTransactions),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: _primaryGreen.withAlpha(10),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: _primaryGreen.withAlpha(30),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('View all', style: Greens.smallBoldInter),
                  const SizedBox(width: 4),
                  Icon(
                    HugeIcons.strokeRoundedArrowRight01,
                    size: 14,
                    color: _primaryGreen,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionsList(PosProvider pos) {
    if (pos.loadingRecents) {
      return const SliverToBoxAdapter(
        child: Padding(
          padding: EdgeInsets.only(top: 32),
          child: Center(child: WaveDots()),
        ),
      );
    }

    if (pos.recentTransactions.isEmpty) {
      return SliverToBoxAdapter(
        child: _buildEmptyState(),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final transaction = pos.recentTransactions[index];
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _buildTransactionCard(transaction),
            );
          },
          childCount: pos.recentTransactions.length,
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _borderColor),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: _primaryGreen.withAlpha(12),
              shape: BoxShape.circle,
            ),
            child: Icon(
              HugeIcons.strokeRoundedInvoice03,
              size: 36,
              color: _primaryGreen,
            ),
          ),
          const SizedBox(height: 18),
          Text('No transactions yet', style: Blacks.regularBoldGrotesk),
          const SizedBox(height: 8),
          Text(
            'Payments requested via STK Push\nwill appear here',
            style: Grays.smallRoboto,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionCard(Transaction transaction) {
    final isSuccessful = transaction.status?.toLowerCase() == 'completed' ||
        transaction.status?.toLowerCase() == 'success';
    final isPending = transaction.status?.toLowerCase() == 'pending';

    final statusColor = isSuccessful
        ? _primaryGreen
        : isPending
            ? HexColor('#FFA726')
            : HexColor('#EF5350');

    return GestureDetector(
      onTap: () {
        Provider.of<PosProvider>(context, listen: false).selectTransaction(transaction);
        Navigator.pushNamed(context, Routes.posTransactionDetails);
      },
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: GlassMorphism.standard(),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: statusColor.withAlpha(15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                isSuccessful
                    ? HugeIcons.strokeRoundedCheckmarkCircle02
                    : isPending
                        ? HugeIcons.strokeRoundedClock01
                        : HugeIcons.strokeRoundedCancel01,
                size: 20,
                color: statusColor,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    transaction.payerPhone ?? transaction.payerName ?? 'Unknown',
                    style: Blacks.smallestBoldPoppins,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    transaction.createdAt != null
                        ? formatDate(transaction.createdAt!)
                        : '--',
                    style: Grays.tinyPoppinsHint,
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  'KES ${formatThousands(amount: transaction.amount ?? 0)}',
                  style: Blacks.smallestBoldPoppins.copyWith(
                    color: isSuccessful ? statusColor : HexColor('#404040'),
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: statusColor.withAlpha(12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    transaction.status ?? 'Unknown',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: statusColor,
                      fontFamily: 'Inter',
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  bool _isToday(DateTime? date) {
    if (date == null) return false;
    final now = DateTime.now();
    return date.year == now.year && date.month == now.month && date.day == now.day;
  }
}
