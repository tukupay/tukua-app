import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/utils/pdf_generator.dart';
import 'package:tuku/widgets/widget.dart';
import '../../models/models.dart';

class AllTransactions extends StatefulWidget {
  const AllTransactions({super.key});

  @override
  State<AllTransactions> createState() => _AllTransactionsState();
}

class _AllTransactionsState extends State<AllTransactions> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    final provider = Provider.of<TransactionsProvider>(context, listen: false);
    if (provider.transactions.isEmpty) {
      provider.getMyTransactions(isRefresh: true);
    }
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels ==
        _scrollController.position.maxScrollExtent) {
      Provider.of<TransactionsProvider>(context, listen: false)
          .getMyTransactions();
    }
  }

  Future<void> _onRefresh() async {
    await Provider.of<TransactionsProvider>(context, listen: false)
        .getMyTransactions(isRefresh: true);
    Fluttertoast.showToast(msg: 'Transactions refreshed');
  }

  Future<void> _downloadTransactions() async {
    final provider = Provider.of<TransactionsProvider>(context, listen: false);
    final profile = Provider.of<ProfileProvider>(context, listen: false);

    if (provider.transactions.isEmpty) {
      Fluttertoast.showToast(msg: 'No transactions to download');
      return;
    }

    Fluttertoast.showToast(msg: 'Generating PDF...');

    try {
      await PdfGenerator.generateAllTransactionsPdf(
        transactions: provider.transactions,
        user: profile.user!,
        summary: provider.summary,
      );
      Fluttertoast.showToast(
        msg: 'PDF downloaded successfully',
        toastLength: Toast.LENGTH_SHORT,
      );
    } catch (e) {
      Fluttertoast.showToast(
        msg: 'Failed to generate PDF: $e',
        toastLength: Toast.LENGTH_SHORT,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Scaffold(
      backgroundColor: HexColor('#F8FAF9'),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        title: Text("All Transactions", style: Blacks.mediumSemiRubik),
        actions: [
          // Download button
          Consumer2<TransactionsProvider, ProfileProvider>(
            builder: (_, transactionsProvider, profile, __) {
              return IconButton(
                icon: Icon(
                  HugeIcons.strokeRoundedDownload01,
                  color: transactionsProvider.transactions.isEmpty
                      ? HexColor(AppColors.darkerGray)
                      : HexColor(AppColors.primaryGreen),
                ),
                onPressed: transactionsProvider.transactions.isEmpty
                    ? null
                    : _downloadTransactions,
                tooltip: 'Download PDF',
              );
            },
          ),
          NotificationsBell(),
          Spaces.smallSideSpace
        ],
      ),
      body: Consumer<TransactionsProvider>(
        builder: (_, transactionProvider, __) {
          return Container(
            height: size.height,
            width: size.width,
            decoration: BoxDecoration(
              image: DecorationImage(
                image: AssetImage(Strings.imageAsset('bg.png')),
                fit: BoxFit.cover,
              ),
            ),
            child: transactionProvider.loadingTransactions &&
                    transactionProvider.transactions.isEmpty
                ? const EnhancedTransactionShimmer()
                : transactionProvider.transactions.isEmpty
                    ? RefreshIndicator(
                        onRefresh: _onRefresh,
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            ListView(),
                            _emptyState(),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _onRefresh,
                        child: CustomScrollView(
                          controller: _scrollController,
                          slivers: [
                            // Summary Header
                            SliverToBoxAdapter(
                              child: _buildSummaryHeader(transactionProvider.summary),
                            ),
                            // Transactions List
                            SliverPadding(
                              padding: Paddings.tinyHorizontal,
                              sliver: SliverList(
                                delegate: SliverChildBuilderDelegate(
                                  (context, index) {
                                    if (index ==
                                        transactionProvider
                                            .transactions.length) {
                                      return const Center(
                                        child: Padding(
                                          padding: EdgeInsets.all(16.0),
                                          child: CircularProgressIndicator(),
                                        ),
                                      );
                                    }
                                    Transaction transaction =
                                        transactionProvider.transactions[index];
                                    return EnhancedTransactionCard(
                                        transaction: transaction);
                                  },
                                  childCount:
                                      transactionProvider.transactions.length +
                                          (transactionProvider.loadingMore
                                              ? 1
                                              : 0),
                                ),
                              ),
                            ),
                            // Bottom padding
                            const SliverToBoxAdapter(
                              child: SizedBox(height: 20),
                            ),
                          ],
                        ),
                      ),
          );
        },
      ),
    );
  }

  Widget _buildSummaryHeader(TransactionSummary? summary) {
    // Calculate totals
    double totalAmount = summary?.totalAmount??0;
    int completedCount = summary?.successfulTransactions??0;
    int pendingCount = summary?.pendingTransactions??0;


    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [HexColor('#1B5E20'), HexColor('#2E7D32')],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: HexColor('#1B5E20').withAlpha(76),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha(51),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  HugeIcons.strokeRoundedAnalytics01,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Transaction Summary',
                    style: Whites.tinyPoppins.copyWith(
                      color: Colors.white.withAlpha(204),
                    ),
                  ),
                  Text(
                    '${summary?.totalTransactions??0} transactions',
                    style: Whites.largeSemiPoppins.copyWith(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(25),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _summaryItem(
                  icon: HugeIcons.strokeRoundedCheckmarkCircle01,
                  label: 'Completed',
                  value: '$completedCount',
                  color: HexColor('#A5D6A7'),
                ),
                Container(
                  width: 1,
                  height: 40,
                  color: Colors.white.withAlpha(51),
                ),
                _summaryItem(
                  icon: HugeIcons.strokeRoundedTimeQuarterPass,
                  label: 'Pending',
                  value: '$pendingCount',
                  color: HexColor('#FFE082'),
                ),
                Container(
                  width: 1,
                  height: 40,
                  color: Colors.white.withAlpha(51),
                ),
                _summaryItem(
                  icon: HugeIcons.strokeRoundedMoney03,
                  label: 'Total',
                  value: 'KES ${formatThousands(amount: totalAmount)}',
                  color: Colors.white,
                  isLarge: true,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _summaryItem({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
    bool isLarge = false,
  }) {
    return Column(
      children: [
        Icon(icon, color: color, size: 18),
        const SizedBox(height: 6),
        Text(
          value,
          style: TextStyle(
            color: Colors.white,
            fontSize: isLarge ? 12 : 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withAlpha(178),
            fontSize: 10,
            fontWeight: FontWeight.w400,
          ),
        ),
      ],
    );
  }

  Widget _emptyState() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: HexColor('#F0F4F3'),
            shape: BoxShape.circle,
          ),
          child: Icon(
            HugeIcons.strokeRoundedPayment01,
            color: HexColor(AppColors.darkerGray2),
            size: 48,
          ),
        ),
        Spaces.smallTopSpace,
        Text(
          'No transactions yet',
          style: Blacks.tinyBolderPoppins,
        ),
        const SizedBox(height: 4),
        Text(
          'Your transactions will appear here',
          style: Grays.tinyPoppinsHint,
        ),
      ],
    );
  }
}
