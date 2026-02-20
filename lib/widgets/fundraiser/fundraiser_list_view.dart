import 'package:flutter/material.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/widgets/fundraiser/fundraiser_card.dart';
import 'package:tuku/widgets/fundraiser/fundraiser_empty_state.dart';
import 'package:tuku/widgets/fundraiser/loading_fundraiser_card.dart';

/// Widget to display a list of fundraisers with loading and empty states
class FundraiserListView extends StatelessWidget {
  final bool isLoading;
  final List<FundraiserResponse> fundraisers;
  final IconData emptyIcon;
  final String emptyMessage;
  final String emptySubtext;

  const FundraiserListView({
    super.key,
    required this.isLoading,
    required this.fundraisers,
    required this.emptyIcon,
    required this.emptyMessage,
    required this.emptySubtext,
  });

  @override
  Widget build(BuildContext context) {
    // Show loading state
    if (isLoading) {
      return ListView.separated(
        padding: EdgeInsets.zero,
        itemCount: 3,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          return const LoadingFundraiserCard();
        },
      );
    }

    // Show empty state
    if (fundraisers.isEmpty) {
      return FundraiserEmptyState(
        icon: emptyIcon,
        message: emptyMessage,
        subtext: emptySubtext,
      );
    }

    // Show fundraiser list
    return ListView.separated(
      itemCount: fundraisers.length,
      padding: EdgeInsets.zero,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        FundraiserResponse fundraiser = fundraisers[index];
        return FundraiserCard(fundraiser: fundraiser);
      },
    );
  }
}
