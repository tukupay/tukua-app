import '../models/models.dart';
import 'package:flutter/foundation.dart';

class MerchantProvider extends ChangeNotifier {
  // All available merchants
  List<MerchantApp> _merchants = [];
  List<MerchantApp> get merchants => _merchants;

  // Installed merchants (user has added these)
  final List<String> _installedMerchantIds = [];
  List<String> get installedMerchantIds => _installedMerchantIds;

  // Merchants added to quick menu
  final List<String> _quickMenuIds = [];
  List<String> get quickMenuIds => _quickMenuIds;

  // Selected category filter
  String _selectedCategory = 'All';
  String get selectedCategory => _selectedCategory;

  // Available categories
  final List<String> _categories = ['All', 'Faith', 'Finance', 'Shopping', 'Education', 'Health', 'Lifestyle'];
  List<String> get categories => _categories;

  // Loading state
  bool _isLoading = false;
  bool get isLoading => _isLoading;

  MerchantProvider() {
    _loadMerchants();
    _autoInstallFirstMerchant();
  }

  /// Auto-install the first merchant by default
  void _autoInstallFirstMerchant() {
    if (_merchants.isNotEmpty && _installedMerchantIds.isEmpty) {
      _installedMerchantIds.add(_merchants.first.id);
    }
  }

  /// Load available merchants (mock data for now)
  void _loadMerchants() {
    _merchants = [
      const MerchantApp(
        id: 'jcc_thika',
        name: 'JCC Thika Road',
        description: 'Our church is located along Thika Road',
        category: 'Faith',
        iconAsset: 'tukuka.png',
        isNew: false,
      ),
      const MerchantApp(
        id: 'faith_chapel',
        name: 'Faith Chapel',
        description: 'Sunday services and community outreach',
        category: 'Faith',
        iconAsset: 'tukuka.png',
        isNew: true,
      ),
      const MerchantApp(
        id: 'global_pay',
        name: 'Global Pay',
        description: 'Access M-Pesa\'s global payment network',
        category: 'Finance',
        iconAsset: 'tukuka.png',
        isNew: false,
      ),
      const MerchantApp(
        id: 'shop_express',
        name: 'Shop Express',
        description: 'Online shopping made easy',
        category: 'Shopping',
        iconAsset: 'tukuka.png',
        isNew: true,
      ),
      const MerchantApp(
        id: 'edu_hub',
        name: 'EduHub',
        description: 'Pay school fees instantly',
        category: 'Education',
        iconAsset: 'tukuka.png',
        isNew: false,
      ),
      const MerchantApp(
        id: 'health_plus',
        name: 'Health Plus',
        description: 'Medical bill payments',
        category: 'Health',
        iconAsset: 'tukuka.png',
        isNew: false,
      ),
    ];
    notifyListeners();
  }

  /// Select category filter
  void selectCategory(String category) {
    _selectedCategory = category;
    notifyListeners();
  }

  /// Get filtered merchants by category
  List<MerchantApp> get filteredMerchants {
    if (_selectedCategory == 'All') {
      return _merchants;
    }
    return _merchants.where((m) => m.category == _selectedCategory).toList();
  }

  /// Check if merchant is in quick menu
  bool isInQuickMenu(String merchantId) {
    return _quickMenuIds.contains(merchantId);
  }

  /// Add merchant to quick menu
  void addToQuickMenu(String merchantId) {
    if (!_quickMenuIds.contains(merchantId)) {
      _quickMenuIds.add(merchantId);
      notifyListeners();
    }
  }

  /// Remove merchant from quick menu
  void removeFromQuickMenu(String merchantId) {
    _quickMenuIds.remove(merchantId);
    notifyListeners();
  }

  /// Toggle quick menu status
  void toggleQuickMenu(String merchantId) {
    if (isInQuickMenu(merchantId)) {
      removeFromQuickMenu(merchantId);
    } else {
      addToQuickMenu(merchantId);
    }
  }

  /// Get merchants in quick menu
  List<MerchantApp> get quickMenuMerchants {
    return _merchants.where((m) => _quickMenuIds.contains(m.id)).toList();
  }

  /// Check if merchant is installed
  bool isInstalled(String merchantId) {
    return _installedMerchantIds.contains(merchantId);
  }

  /// Install a merchant
  void installMerchant(String merchantId) {
    if (!_installedMerchantIds.contains(merchantId)) {
      _installedMerchantIds.add(merchantId);
      notifyListeners();
    }
  }

  /// Uninstall a merchant
  void uninstallMerchant(String merchantId) {
    _installedMerchantIds.remove(merchantId);
    // Also remove from quick menu if installed
    _quickMenuIds.remove(merchantId);
    notifyListeners();
  }

  /// Get installed merchants
  List<MerchantApp> get installedMerchants {
    return _merchants.where((m) => _installedMerchantIds.contains(m.id)).toList();
  }

  /// Get merchant by ID
  MerchantApp? getMerchant(String id) {
    try {
      return _merchants.firstWhere((m) => m.id == id);
    } catch (_) {
      return null;
    }
  }
}

