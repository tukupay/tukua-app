import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';

/// Universal bottom sheet for bank selection across the app
/// Works with both AvailableBank (for new bank selection) and FullBank (user's saved banks)
class UniversalBankSelector<T> extends StatefulWidget {
  final List<T> banks;
  final T? selectedBank;
  final ValueChanged<T> onSelected;
  final String title;
  final String? subtitle;
  final IconData? icon;
  final String Function(T) labelBuilder;

  const UniversalBankSelector({
    super.key,
    required this.banks,
    required this.selectedBank,
    required this.onSelected,
    required this.labelBuilder,
    this.title = 'Select Bank',
    this.subtitle,
    this.icon,
  });

  /// Show the bank selector as a modal bottom sheet for AvailableBank
  static Future<AvailableBank?> showAvailableBanks(
    BuildContext context, {
    required List<AvailableBank> banks,
    AvailableBank? selectedBank,
    String title = 'Select Bank',
    String? subtitle,
    IconData? icon,
  }) {
    return showModalBottomSheet<AvailableBank>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => UniversalBankSelector<AvailableBank>(
        banks: banks,
        selectedBank: selectedBank,
        onSelected: (bank) => Navigator.pop(context, bank),
        labelBuilder: (bank) => bank.name,
        title: title,
        subtitle: subtitle,
        icon: icon,
      ),
    );
  }

  /// Show the bank selector as a modal bottom sheet for FullBank (user's saved banks)
  static Future<FullBank?> showUserBanks(
    BuildContext context, {
    required List<FullBank> banks,
    FullBank? selectedBank,
    String title = 'Select Bank',
    String? subtitle,
    IconData? icon,
  }) {
    return showModalBottomSheet<FullBank>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => UniversalBankSelector<FullBank>(
        banks: banks,
        selectedBank: selectedBank,
        onSelected: (bank) => Navigator.pop(context, bank),
        labelBuilder: (bank) => '${bank.bankName ?? 'Bank'} - ${bank.maskedAccountNumber ?? bank.accountNumber ?? ''}',
        title: title,
        subtitle: subtitle,
        icon: icon,
      ),
    );
  }

  /// Show bank selector with String items (for bank names only)
  static Future<String?> showBankNames(
    BuildContext context, {
    required List<String> bankNames,
    String? selectedBank,
    String title = 'Select Bank',
    String? subtitle,
    IconData? icon,
  }) {
    return showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => UniversalBankSelector<String>(
        banks: bankNames,
        selectedBank: selectedBank,
        onSelected: (bank) => Navigator.pop(context, bank),
        labelBuilder: (bank) => bank,
        title: title,
        subtitle: subtitle,
        icon: icon,
      ),
    );
  }

  @override
  State<UniversalBankSelector<T>> createState() => _UniversalBankSelectorState<T>();
}

class _UniversalBankSelectorState<T> extends State<UniversalBankSelector<T>> {
  final TextEditingController _searchController = TextEditingController();
  List<T> _filteredBanks = [];

  @override
  void initState() {
    super.initState();
    _filteredBanks = widget.banks;
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      if (query.isEmpty) {
        _filteredBanks = widget.banks;
      } else {
        _filteredBanks = widget.banks.where((bank) {
          return widget.labelBuilder(bank).toLowerCase().contains(query);
        }).toList();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.75,
      ),
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle bar
          Center(
            child: Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: HexColor('#E0E0E0'),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: HexColor('#E8F5E9'),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  widget.icon ?? HugeIcons.strokeRoundedBank,
                  color: HexColor(AppColors.primaryGreen),
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(widget.title, style: Blacks.regularBoldCodeNext),
                    if (widget.subtitle != null) ...[
                      const SizedBox(height: 2),
                      Text(widget.subtitle!, style: Grays.tinyPoppinsHint),
                    ],
                  ],
                ),
              ),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: Icon(
                  HugeIcons.strokeRoundedCancel01,
                  color: Colors.grey.shade500,
                  size: 22,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Search bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: HexColor('#F5F7F6'),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: HexColor('#E0E5E2')),
            ),
            child: Row(
              children: [
                Icon(
                  HugeIcons.strokeRoundedSearch01,
                  color: Colors.grey.shade500,
                  size: 18,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      hintText: 'Search banks...',
                      hintStyle: Grays.smallestPoppinsHint,
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    style: Blacks.smallestBoldPoppins,
                  ),
                ),
                if (_searchController.text.isNotEmpty)
                  GestureDetector(
                    onTap: () {
                      _searchController.clear();
                    },
                    child: Icon(
                      HugeIcons.strokeRoundedCancel01,
                      color: Colors.grey.shade400,
                      size: 16,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          // Bank count
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: HexColor('#F5F7F6'),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(
                  HugeIcons.strokeRoundedInformationCircle,
                  color: HexColor(AppColors.primaryGreen),
                  size: 16,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '${_filteredBanks.length} bank${_filteredBanks.length != 1 ? 's' : ''} available',
                    style: Grays.smallestPoppinsHint,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Banks list
          Flexible(
            child: _filteredBanks.isEmpty
                ? _EmptyBanks()
                : ListView.separated(
                    shrinkWrap: true,
                    physics: const BouncingScrollPhysics(),
                    itemCount: _filteredBanks.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final bank = _filteredBanks[index];
                      final isSelected = _isSelected(bank);
                      return _BankCard<T>(
                        bank: bank,
                        isSelected: isSelected,
                        labelBuilder: widget.labelBuilder,
                        onTap: () => widget.onSelected(bank),
                      );
                    },
                  ),
          ),
          SizedBox(height: MediaQuery.of(context).viewInsets.bottom + 10),
        ],
      ),
    );
  }

  bool _isSelected(T bank) {
    if (widget.selectedBank == null) return false;
    // For AvailableBank
    if (bank is AvailableBank && widget.selectedBank is AvailableBank) {
      return (bank).id == (widget.selectedBank as AvailableBank).id;
    }
    // For FullBank
    if (bank is FullBank && widget.selectedBank is FullBank) {
      return (bank).id == (widget.selectedBank as FullBank).id;
    }
    // For String
    if (bank is String && widget.selectedBank is String) {
      return bank == widget.selectedBank;
    }
    return bank == widget.selectedBank;
  }
}

class _BankCard<T> extends StatelessWidget {
  final T bank;
  final bool isSelected;
  final String Function(T) labelBuilder;
  final VoidCallback onTap;

  const _BankCard({
    required this.bank,
    required this.isSelected,
    required this.labelBuilder,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected
              ? HexColor(AppColors.primaryGreen).withAlpha(25)
              : HexColor('#F8FAF9'),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected
                ? HexColor(AppColors.primaryGreen)
                : HexColor('#E0E5E2'),
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            // Bank icon
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: isSelected
                      ? [
                          HexColor(AppColors.primaryGreen),
                          HexColor(AppColors.fadedGreen),
                        ]
                      : [
                          HexColor('#E8F5E9'),
                          HexColor('#F1F8F2'),
                        ],
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                HugeIcons.strokeRoundedBank,
                color: isSelected ? Colors.white : HexColor(AppColors.primaryGreen),
                size: 18,
              ),
            ),
            const SizedBox(width: 12),
            // Bank info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    labelBuilder(bank),
                    style: isSelected
                        ? Blacks.smallestBolderPoppins
                        : Blacks.smallestBoldPoppins,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (bank is FullBank && (bank as FullBank).branch != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      (bank as FullBank).branch!,
                      style: Grays.tinyPoppinsHint,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
            // Selection indicator
            if (isSelected)
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: HexColor(AppColors.primaryGreen),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check,
                  color: Colors.white,
                  size: 12,
                ),
              )
            else
              Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: HexColor('#E0E5E2'),
                    width: 1.5,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _EmptyBanks extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: HexColor('#F5F7F6'),
                shape: BoxShape.circle,
              ),
              child: Icon(
                HugeIcons.strokeRoundedBank,
                color: Colors.grey.shade400,
                size: 32,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'No banks found',
              style: Blacks.smallestBoldPoppins,
            ),
            const SizedBox(height: 4),
            Text(
              'Try adjusting your search',
              style: Grays.tinyPoppinsHint,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

