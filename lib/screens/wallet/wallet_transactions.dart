import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/utils/pdf_generator.dart';
import 'package:tuku/widgets/widget.dart';

class WalletTransactions extends StatefulWidget {
  const WalletTransactions({super.key});

  @override
  State<WalletTransactions> createState() => _WalletTransactionsState();
}

class _WalletTransactionsState extends State<WalletTransactions> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_)async{
      final provider=Provider.of<WalletProvider>(context,listen: false);
      if(provider.walletTransactions.isEmpty){
        await provider.getWalletTransactions(isRefresh: true);
      }
      _scrollController.addListener(_onScroll);
    });
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll(){
    if(_scrollController.position.pixels == _scrollController.position.maxScrollExtent){
      Provider.of<WalletProvider>(context,listen: false).getWalletTransactions();
    }
  }

  Future<void> _onRefresh()async{
    await Provider.of<WalletProvider>(context,listen: false)
        .getWalletTransactions(isRefresh: true);
    Fluttertoast.showToast(msg: 'Transactions refreshed');
  }

  Future<void> _downloadTransactions() async {
    final provider = Provider.of<WalletProvider>(context, listen: false);
    final profile = Provider.of<ProfileProvider>(context, listen: false);

    if (provider.walletTransactions.isEmpty) {
      Fluttertoast.showToast(msg: 'No transactions to download');
      return;
    }

    Fluttertoast.showToast(msg: 'Generating PDF...');

    try {
      await PdfGenerator.generateWalletTransactionsPdf(
        transactions: provider.walletTransactions,
        wallet: provider.selectedWallet!,
        user: profile.user!,
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
    final size=MediaQuery.of(context).size;
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text("Wallet Transactions",style: Blacks.mediumSemiRubik),
        actions: [
          // Download button
          Consumer2<WalletProvider, ProfileProvider>(
            builder: (_, walletProvider, profile, __) {
              return IconButton(
                icon: Icon(
                  HugeIcons.strokeRoundedDownload01,
                  color: walletProvider.walletTransactions.isEmpty
                      ? HexColor(AppColors.darkerGray)
                      : HexColor(AppColors.primaryGreen),
                ),
                onPressed: walletProvider.walletTransactions.isEmpty
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
      body: Consumer<WalletProvider>(
        builder: (_,walletProvider,__) {
          return PopScope(
            onPopInvokedWithResult: (bool b, res){
              walletProvider.clearWalletTransactions();
            },
            child: Container(
                height: size.height,
                width: size.width,
                padding: Paddings.tinyHorizontal,
                child: walletProvider.loadingWalletTransactions && walletProvider.walletTransactions.isEmpty?
                const EnhancedTransactionShimmer():
                walletProvider.walletTransactions.isEmpty?
                RefreshIndicator(
                    onRefresh: _onRefresh,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    ListView(
                      children: [
                        Spaces.smallTopSpace,
                        _buildWalletDetailsCard(walletProvider),
                        Spaces.largeTopSpace,
                      ],
                    ),
                    Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                        Icon(HugeIcons.strokeRoundedWalletRemove01,
                        color: HexColor(AppColors.darkerGray),
                        size: 56),
                  Spaces.smallTopSpace,
                  Text(' ${walletProvider.selectedWallet?.name??'Wallet'} transactions will appear here',
                      style: Grays.tinyPoppinsHint),
                  ],
                )])):
                RefreshIndicator(
              onRefresh: _onRefresh,
              child: ListView.builder(
                controller: _scrollController,
                  shrinkWrap: true,
                  itemCount: walletProvider.walletTransactions.length +
                      (walletProvider.loadingMore ? 1 : 0) + 1, // +1 for wallet card
                  itemBuilder: (context,index){
                  // Wallet details card at index 0
                  if(index == 0){
                    return Column(
                      children: [
                        Spaces.smallTopSpace,
                        _buildWalletDetailsCard(walletProvider),
                        Spaces.mediumTopSpace,
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          child: Row(
                            children: [
                              Text(
                                'Recent Transactions',
                                style: Blacks.tinyBolderPoppins,
                              ),
                              const Spacer(),
                              Text(
                                '${walletProvider.walletTransactions.length} total',
                                style: Grays.smallRoboto,
                              ),
                            ],
                          ),
                        ),
                        Spaces.tinyTopSpace,
                      ],
                    );
                  }

                  // Adjust index for transactions
                  final transactionIndex = index - 1;

                  if(transactionIndex == walletProvider.walletTransactions.length){
                    return const Center(
                      child: Padding(
                          padding: EdgeInsets.all(16),
                      child: CircularProgressIndicator()),
                    );
                  }
                    Transaction transaction=walletProvider.walletTransactions[transactionIndex];
                    return EnhancedTransactionCard(transaction: transaction);
                  }))));
        }
      ),
    );
  }

  // Build wallet details card
  Widget _buildWalletDetailsCard(WalletProvider walletProvider) {
    final wallet = walletProvider.selectedWallet;
    if (wallet == null) return const SizedBox();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            HexColor(AppColors.primaryGreen),
            HexColor(AppColors.primaryGreen).withValues(alpha: 0.8),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Wallet icon and name
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha(51),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  HugeIcons.strokeRoundedWallet03,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      wallet.name ?? 'Wallet',
                      style: Whites.mediumBoldRoboto.copyWith(fontSize: 18),
                    ),
                    const SizedBox(height: 4),
                    if (wallet.purposeTag != null && wallet.purposeTag!.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withAlpha(51),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          wallet.purposeTag!,
                          style: Whites.tinyPoppins.copyWith(fontSize: 11),
                        ),
                      ),
                  ],
                ),
              ),
              if (wallet.isPrimary == true)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        HugeIcons.strokeRoundedStar,
                        color: HexColor(AppColors.primaryGreen),
                        size: 14,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Primary',
                        style: TextStyle(
                          color: HexColor(AppColors.primaryGreen),
                          fontWeight: FontWeight.w600,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 20),
          // Balance
          Text(
            'Available Balance',
            style: Whites.tinyPoppins.copyWith(
              color: Colors.white.withAlpha(204),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '${wallet.currency ?? 'KES'} ${formatThousands(amount: wallet.balance ?? 0)}',
            style: Whites.largeSemiPoppins.copyWith(
              fontSize: 32,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 16),
          // Wallet status only
          _buildInfoChip(
            wallet.isActive == true
                ? HugeIcons.strokeRoundedCheckmarkCircle02
                : HugeIcons.strokeRoundedCancelCircle,
            wallet.isActive == true ? 'Active' : 'Inactive',
          ),
        ],
      ),
    );
  }

  // Build info chip
  Widget _buildInfoChip(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(51),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 14),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              style: Whites.tinyPoppins.copyWith(fontSize: 11),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }


}
