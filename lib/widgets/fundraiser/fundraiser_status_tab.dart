import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';

/// Configuration for a fundraiser status tab
class FundraiserStatusTab {
  final String status;
  final String label;
  final String color;
  final String emptyMessage;
  final String emptySubtext;
  final IconData icon;

  const FundraiserStatusTab({
    required this.status,
    required this.label,
    required this.color,
    required this.emptyMessage,
    required this.emptySubtext,
    required this.icon,
  });

  /// Get icon for a specific status (for empty state display)
  static IconData getIconForStatus(String status) {
    switch (status.toLowerCase()) {
      case 'active':
        return HugeIcons.strokeRoundedCheckmarkCircle02;
      case 'completed':
        return HugeIcons.strokeRoundedTick02;
      case 'inactive':
      case 'cancelled':
        return HugeIcons.strokeRoundedCancelCircle;
      default:
        return HugeIcons.strokeRoundedMoneySavingJar;
    }
  }

  /// Get color for a specific status
  static String getColorForStatus(String status) {
    switch (status.toLowerCase()) {
      case 'active':
        return '#15411D';
      case 'completed':
        return '#FF6B35';
      case 'inactive':
      case 'cancelled':
        return '#FF0000';
      default:
        return '#15411D';
    }
  }

  /// Get empty message for a specific status
  static String getEmptyMessage(String status) {
    switch (status.toLowerCase()) {
      case 'active':
        return 'No active fundraisers';
      case 'completed':
        return 'No completed fundraisers';
      case 'inactive':
        return 'No inactive fundraisers';
      case 'cancelled':
        return 'No cancelled fundraisers';
      default:
        return 'No fundraisers';
    }
  }

  /// Get empty subtext for a specific status
  static String getEmptySubtext(String status) {
    switch (status.toLowerCase()) {
      case 'active':
        return 'Create a fundraiser to get started';
      case 'completed':
        return 'Completed campaigns will appear here';
      case 'inactive':
        return 'Paused campaigns will appear here';
      case 'cancelled':
        return 'Cancelled campaigns will appear here';
      default:
        return 'Campaigns will appear here';
    }
  }

  /// Get label for a specific status
  static String getLabelForStatus(String status) {
    return status[0].toUpperCase() + status.substring(1);
  }

  /// Factory method to create tab configuration from status
  factory FundraiserStatusTab.fromStatus(String status) {
    return FundraiserStatusTab(
      status: status,
      label: getLabelForStatus(status),
      icon: getIconForStatus(status),
      color: getColorForStatus(status),
      emptyMessage: getEmptyMessage(status),
      emptySubtext: getEmptySubtext(status),
    );
  }
}
