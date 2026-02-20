import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';

/// Universal bottom sheet selector for simple items (strings, enums, etc.)
/// Modern fintech replacement for DynamicDropdownMenu
class SimpleSheetSelector<T> extends StatefulWidget {
  final List<T> items;
  final T? selectedItem;
  final ValueChanged<T> onSelected;
  final String Function(T) itemLabelBuilder;
  final String title;
  final String? subtitle;
  final IconData? icon;
  final bool showSearch;

  const SimpleSheetSelector({
    super.key,
    required this.items,
    required this.selectedItem,
    required this.onSelected,
    required this.itemLabelBuilder,
    this.title = 'Select Option',
    this.subtitle,
    this.icon,
    this.showSearch = false,
  });

  /// Show the selector as a modal bottom sheet
  static Future<T?> show<T>(
    BuildContext context, {
    required List<T> items,
    T? selectedItem,
    required String Function(T) itemLabelBuilder,
    String title = 'Select Option',
    String? subtitle,
    IconData? icon,
    bool showSearch = false,
  }) {
    return showModalBottomSheet<T>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => SimpleSheetSelector<T>(
        items: items,
        selectedItem: selectedItem,
        onSelected: (item) => Navigator.pop(context, item),
        itemLabelBuilder: itemLabelBuilder,
        title: title,
        subtitle: subtitle,
        icon: icon,
        showSearch: showSearch,
      ),
    );
  }

  @override
  State<SimpleSheetSelector<T>> createState() => _SimpleSheetSelectorState<T>();
}

class _SimpleSheetSelectorState<T> extends State<SimpleSheetSelector<T>> {
  final TextEditingController _searchController = TextEditingController();
  List<T> _filteredItems = [];

  @override
  void initState() {
    super.initState();
    _filteredItems = widget.items;
    if (widget.showSearch) {
      _searchController.addListener(_onSearchChanged);
    }
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
        _filteredItems = widget.items;
      } else {
        _filteredItems = widget.items.where((item) {
          return widget.itemLabelBuilder(item).toLowerCase().contains(query);
        }).toList();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.6,
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
                  color: HexColor(AppColors.primaryGreen).withAlpha(25),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  widget.icon ?? HugeIcons.strokeRoundedCheckList,
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

          // Search (optional)
          if (widget.showSearch) ...[
            Container(
              decoration: BoxDecoration(
                color: HexColor('#F5F7F6'),
                borderRadius: BorderRadius.circular(12),
              ),
              child: TextField(
                controller: _searchController,
                style: Blacks.smallestBoldPoppins,
                decoration: InputDecoration(
                  hintText: 'Search...',
                  hintStyle: Grays.smallRoboto,
                  prefixIcon: Icon(
                    HugeIcons.strokeRoundedSearch01,
                    color: Colors.grey.shade400,
                    size: 20,
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Items list
          Flexible(
            child: _filteredItems.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            HugeIcons.strokeRoundedSearchMinus,
                            size: 48,
                            color: Colors.grey.shade300,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'No items found',
                            style: Grays.smallRoboto,
                          ),
                        ],
                      ),
                    ),
                  )
                : ListView.separated(
                    shrinkWrap: true,
                    itemCount: _filteredItems.length,
                    separatorBuilder: (_, __) => Divider(
                      height: 1,
                      color: HexColor('#F0F2F1'),
                    ),
                    itemBuilder: (context, index) {
                      final item = _filteredItems[index];
                      final isSelected = widget.selectedItem == item;
                      return _ItemTile<T>(
                        item: item,
                        label: widget.itemLabelBuilder(item),
                        isSelected: isSelected,
                        onTap: () => widget.onSelected(item),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class _ItemTile<T> extends StatelessWidget {
  final T item;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _ItemTile({
    required this.item,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isSelected
              ? HexColor(AppColors.primaryGreen).withAlpha(15)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: isSelected
                    ? Blacks.smallestBoldPoppins.copyWith(
                        color: HexColor(AppColors.primaryGreen),
                      )
                    : Blacks.smallestBoldPoppins,
              ),
            ),
            if (isSelected)
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: HexColor(AppColors.primaryGreen),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check,
                  size: 14,
                  color: Colors.white,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Compact card that displays selected item and opens selector sheet on tap
class SimpleSelectorCard<T> extends StatelessWidget {
  final T? selectedItem;
  final List<T> items;
  final ValueChanged<T> onSelected;
  final String Function(T) itemLabelBuilder;
  final String label;
  final String? sheetTitle;
  final String? sheetSubtitle;
  final IconData? icon;
  final bool showSearch;
  final bool enabled;

  const SimpleSelectorCard({
    super.key,
    required this.selectedItem,
    required this.items,
    required this.onSelected,
    required this.itemLabelBuilder,
    this.label = 'Select Option',
    this.sheetTitle,
    this.sheetSubtitle,
    this.icon,
    this.showSearch = false,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    final hasSelection = selectedItem != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label
        Row(
          children: [
            Icon(
              icon ?? HugeIcons.strokeRoundedCheckList,
              size: 14,
              color: HexColor(AppColors.primaryGreen),
            ),
            const SizedBox(width: 6),
            Text(label, style: Grays.smallestBolderPoppinsHint),
          ],
        ),
        const SizedBox(height: 8),
        // Card
        GestureDetector(
          onTap: enabled
              ? () async {
                  final result = await SimpleSheetSelector.show<T>(
                    context,
                    items: items,
                    selectedItem: selectedItem,
                    itemLabelBuilder: itemLabelBuilder,
                    title: sheetTitle ?? label,
                    subtitle: sheetSubtitle,
                    icon: icon,
                    showSearch: showSearch,
                  );
                  if (result != null) {
                    onSelected(result);
                  }
                }
              : null,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: enabled
                  ? (hasSelection ? Colors.white : HexColor('#F8FAF9'))
                  : HexColor('#F0F2F1'),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: hasSelection
                    ? HexColor(AppColors.primaryGreen).withAlpha(100)
                    : HexColor('#E0E5E2'),
                width: hasSelection ? 1.5 : 1,
              ),
              boxShadow: hasSelection && enabled
                  ? [
                      BoxShadow(
                        color: Colors.black.withAlpha(8),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      )
                    ]
                  : null,
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    hasSelection
                        ? itemLabelBuilder(selectedItem as T)
                        : 'Select $label',
                    style: hasSelection
                        ? Blacks.smallestBoldPoppins
                        : Grays.smallRoboto,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (enabled)
                  Icon(
                    HugeIcons.strokeRoundedArrowDown01,
                    size: 18,
                    color: HexColor(AppColors.primaryGreen),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

