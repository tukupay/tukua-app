import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

class ActiveFundraisers extends StatefulWidget {
  const ActiveFundraisers({super.key});

  @override
  State<ActiveFundraisers> createState() => _ActiveFundraisersState();
}

class _ActiveFundraisersState extends State<ActiveFundraisers>
    with SingleTickerProviderStateMixin {
  TabController? _tabController;
  List<FundraiserStatusTab> _tabConfigs = [];

  @override
  void initState() {
    super.initState();
    // Schedule initialization after the build phase completes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _initializeTabsAndLoadData();
    });
  }

  /// Initialize tabs from API statuses
  Future<void> _initializeTabsAndLoadData() async {
    if (!mounted) return;

    final fundraiserProvider = Provider.of<FundraiserProvider>(context, listen: false);

    // Load statuses from API if not already loaded
    if (fundraiserProvider.statuses.isEmpty) {
      await fundraiserProvider.getStatuses();
    }

    // Check mounted again after async operation
    if (!mounted) return;

    // Create tab configurations from API statuses
    setState(() {
      _tabConfigs = fundraiserProvider.statuses
          .map((status) => FundraiserStatusTab.fromStatus(status))
          .toList();
      _tabController = TabController(length: _tabConfigs.length, vsync: this);
    });

    // Note: Fundraisers are already loaded by parent (fundraiser_landing.dart)
    // No need to reload them here to avoid duplicate API calls
  }

  @override
  void dispose() {
    _tabController?.dispose();
    super.dispose();
  }

  /// Get fundraisers for a specific status
  List<FundraiserResponse> _getFundraisersForStatus(
    FundraiserProvider provider,
    String status,
  ) {
    switch (status.toLowerCase()) {
      case 'active':
        return provider.activeFundraisers;
      case 'completed':
        return provider.completedFundraisers;
      case 'inactive':
        return provider.inactiveFundraisers;
      case 'cancelled':
        return provider.cancelledFundraisers;
      default:
        return [];
    }
  }

  /// Get loading state for a specific status
  bool _isLoadingForStatus(FundraiserProvider provider, String status) {
    switch (status.toLowerCase()) {
      case 'active':
        return provider.loadingActiveFundraisers;
      case 'completed':
        return provider.loadingCompletedFundraisers;
      case 'inactive':
        return provider.loadingInactiveFundraisers;
      case 'cancelled':
        return provider.loadingCancelledFundraisers;
      default:
        return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<FundraiserProvider>(
      builder: (_, fundraiserProvider, __) {
        // Show loading indicator while tabs are being initialized
        if (_tabConfigs.isEmpty || _tabController == null) {
          return const Center(
            child: CircularProgressIndicator(),
          );
        }

        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Tab Bar
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: HexColor('#F0F4F3'),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: TabBar(
                  controller: _tabController!,
                  isScrollable: true,
                  tabAlignment: TabAlignment.start,
                  indicator: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withAlpha(10),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  indicatorSize: TabBarIndicatorSize.tab,
                  labelColor: HexColor(AppColors.primaryGreen),
                  unselectedLabelColor: HexColor(AppColors.darkerGray2),
                  labelStyle: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                  unselectedLabelStyle: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                  dividerColor: Colors.transparent,
                  labelPadding: const EdgeInsets.symmetric(horizontal: 4),
                  tabs: _tabConfigs.map((config) {
                    final fundraisers = _getFundraisersForStatus(
                      fundraiserProvider,
                      config.status,
                    );
                    return FundraiserTabItem(
                      label: config.label,
                      count: fundraisers.length,
                    );
                  }).toList(),
                ),
              ),

              const SizedBox(height: 16),

              // Tab Bar View
              Expanded(
                child: TabBarView(
                  controller: _tabController!,
                  children: _tabConfigs.map((config) {
                    final fundraisers = _getFundraisersForStatus(
                      fundraiserProvider,
                      config.status,
                    );
                    final isLoading = _isLoadingForStatus(
                      fundraiserProvider,
                      config.status,
                    );

                    return FundraiserListView(
                      isLoading: isLoading,
                      fundraisers: fundraisers,
                      emptyIcon: config.icon,
                      emptyMessage: config.emptyMessage,
                      emptySubtext: config.emptySubtext,
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
