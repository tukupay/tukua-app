import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import '../../widgets/widget.dart';

/// All POS transactions page with pagination and search
class AllPosTransactions extends StatefulWidget {
  const AllPosTransactions({super.key});

  @override
  State<AllPosTransactions> createState() => _AllPosTransactionsState();
}

class _AllPosTransactionsState extends State<AllPosTransactions>
    with SingleTickerProviderStateMixin {
  final ScrollController _scrollController = ScrollController();
  final searchController = TextEditingController();

  late AnimationController _animController;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _fadeAnim = CurvedAnimation(parent: _animController, curve: Curves.easeOut);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = Provider.of<PosProvider>(context, listen: false);
      if (provider.transactions.isEmpty) {
        provider.getPosTransactions(isRefresh: true);
      }
      _animController.forward();
    });
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _animController.dispose();
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    searchController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 100) {
      Provider.of<PosProvider>(context, listen: false).getPosTransactions();
    }
  }

  Future<void> _onRefresh() async {
    await Provider.of<PosProvider>(context, listen: false)
        .getPosTransactions(isRefresh: true);
    Fluttertoast.showToast(msg: 'Transactions refreshed');
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
                // Search bar
                _buildSearchBar(),
                // Transactions list
                Expanded(
                  child: FadeTransition(
                    opacity: _fadeAnim,
                    child: Consumer<PosProvider>(
                      builder: (_, pos, __) {
                        return _buildTransactionsList(pos);
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
                Text('All Transactions', style: Blacks.regularBoldCodeNext),
                Text('POS payment history', style: Grays.tinyPoppinsHint),
              ],
            ),
          ),
          // Filter button
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha(8),
                  blurRadius: 8,
                ),
              ],
            ),
            child: Icon(
              HugeIcons.strokeRoundedFilter,
              size: 18,
              color: HexColor(AppColors.primaryGreen),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(6),
            blurRadius: 12,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Icon(
            HugeIcons.strokeRoundedSearch01,
            color: HexColor(AppColors.lightGray),
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: TextField(
              controller: searchController,
              decoration: InputDecoration(
                hintText: 'Search transactions...',
                hintStyle: Grays.smallestPoppinsHint,
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
              ),
              style: Blacks.smallestBoldPoppins,
            ),
          ),
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: HexColor(AppColors.primaryGreen).withAlpha(10),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              HugeIcons.strokeRoundedSortByUp01,
              color: HexColor(AppColors.primaryGreen),
              size: 16,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionsList(PosProvider pos) {
    if (pos.loadingTransactions && pos.transactions.isEmpty) {
      return const EnhancedTransactionShimmer();
    }

    if (pos.transactions.isEmpty) {
      return RefreshIndicator(
        onRefresh: _onRefresh,
        child: Stack(
          alignment: Alignment.center,
          children: [
            ListView(),
            _buildEmptyState(),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _onRefresh,
      color: HexColor(AppColors.primaryGreen),
      child: ListView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: pos.transactions.length + (pos.loadingMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == pos.transactions.length) {
            return Padding(
              padding: const EdgeInsets.all(16),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const WaveDots(),
                ),
              ),
            );
          }
          final transaction = pos.transactions[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _buildTransactionCard(transaction),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      margin: const EdgeInsets.all(20),
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: HexColor('#E8EBE9')),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: HexColor(AppColors.primaryGreen).withAlpha(12),
              shape: BoxShape.circle,
            ),
            child: Icon(
              HugeIcons.strokeRoundedInvoice03,
              size: 36,
              color: HexColor(AppColors.primaryGreen),
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
        ? HexColor(AppColors.primaryGreen)
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
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: HexColor('#E8EBE9')),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(4),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
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
            const SizedBox(width: 8),
            Icon(
              HugeIcons.strokeRoundedArrowRight01,
              size: 16,
              color: HexColor(AppColors.lightGray),
            ),
          ],
        ),
      ),
    );
  }
}
