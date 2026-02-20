import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
import '../../constants/constants.dart';

class BulkPayHistory extends StatefulWidget {
  const BulkPayHistory({super.key});

  @override
  State<BulkPayHistory> createState() => _BulkPayHistoryState();
}

class _BulkPayHistoryState extends State<BulkPayHistory> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    final provider = Provider.of<BulkPayProvider>(context, listen: false);
    if (provider.bulkTransactions.isEmpty) {
      provider.getBulkTransactions(isRefresh: true);
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
      Provider.of<BulkPayProvider>(context, listen: false).getBulkTransactions();
    }
  }

  Future<void> _onRefresh() async {
    await Provider.of<BulkPayProvider>(context, listen: false)
        .getBulkTransactions(isRefresh: true);
    Fluttertoast.showToast(msg: 'Transactions refreshed');
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text('Bulk Pay History', style: Blacks.mediumSemiRubik),
        actions: [
          NotificationsBell(),
          Spaces.smallSideSpace
        ],
      ),
      body: Consumer<BulkPayProvider>(
        builder: (_, bulkPay, __) {
          return Container(
            height: size.height,
            width: size.width,
            padding: Paddings.tinyHorizontal,
            child: bulkPay.loadingTransactions && bulkPay.bulkTransactions.isEmpty
                ? const BulkTransactionShimmer()
                : bulkPay.bulkTransactions.isEmpty
                    ? RefreshIndicator(
                        onRefresh: _onRefresh,
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            ListView(),
                            Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(HugeIcons.strokeRoundedUserMultiple02,
                                    color: HexColor(AppColors.darkerGray),
                                    size: 56),
                                Spaces.smallTopSpace,
                                Text('Your bulk payments will appear here',
                                    style: Grays.tinyPoppinsHint),
                              ],
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _onRefresh,
                        child: ListView.builder(
                          controller: _scrollController,
                          shrinkWrap: true,
                          padding: EdgeInsets.zero,
                          itemCount: bulkPay.bulkTransactions.length +
                              (bulkPay.loadingMore ? 1 : 0),
                          itemBuilder: (context, index) {
                            if (index == bulkPay.bulkTransactions.length) {
                              return const Center(
                                child: Padding(
                                  padding: EdgeInsets.all(16.0),
                                  child: CircularProgressIndicator(),
                                ),
                              );
                            }
                            BulkTransaction transaction =
                                bulkPay.bulkTransactions[index];
                            return BulkTransactionCard(transaction: transaction);
                          },
                        ),
                      ),
          );
        },
      ),
    );
  }
}
