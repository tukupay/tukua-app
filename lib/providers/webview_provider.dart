import 'package:flutter/foundation.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/services/services.dart';

/// State management for WebView screens including BankGPT
class WebviewProvider extends ChangeNotifier {
  // Basic webview properties
  String? _link;
  String? get link => _link;

  String? _title;
  String? get title => _title;

  // BankGPT specific state
  bool _isPageLoaded = false;
  bool get isPageLoaded => _isPageLoaded;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  double _progress = 0.0;
  double get progress => _progress;

  bool _isAuthenticated = false;
  bool get isAuthenticated => _isAuthenticated;

  String? _authError;
  String? get authError => _authError;

  // BankGPT session
  BankGptSession? _bankGptSession;
  BankGptSession? get bankGptSession => _bankGptSession;

  bool _isLoggingIn = false;
  bool get isLoggingIn => _isLoggingIn;

  final BankGptService _bankGptService = BankGptService();

  void setTitle(String? value) {
    _title = value;
    notifyListeners();
  }

  void setLink(String? value) {
    _link = value;
    notifyListeners();
  }

  void setPageLoaded(bool value) {
    _isPageLoaded = value;
    notifyListeners();
  }

  void setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void setProgress(double value) {
    _progress = value;
    notifyListeners();
  }

  void setAuthenticated(bool value) {
    _isAuthenticated = value;
    notifyListeners();
  }

  void setAuthError(String? error) {
    _authError = error;
    notifyListeners();
  }

  /// Get BankGPT URL
  String getBankGptUrl() => Strings.bankGpt;

  /// Login to BankGPT using stored credentials
  Future<bool> loginToBankGpt() async {
    _isLoggingIn = true;
    _authError = null;
    notifyListeners();

    try {
      final session = await _bankGptService.loginWithStoredCredentials();

      if (session != null && session.isValid) {
        _bankGptSession = session;
        _isAuthenticated = true;
        debugPrint('✅ BankGPT login successful, token length: ${session.accessToken?.length}');
      } else {
        _authError = 'Failed to login to BankGPT';
        _isAuthenticated = false;
        debugPrint('❌ BankGPT login failed');
      }
    } catch (e) {
      _authError = 'Login error: $e';
      _isAuthenticated = false;
      debugPrint('❌ BankGPT login error: $e');
    }

    _isLoggingIn = false;
    notifyListeners();
    return _isAuthenticated;
  }

  /// Get the BankGPT access token (after successful login)
  String? get bankGptAccessToken => _bankGptSession?.accessToken;

  /// Reset BankGPT state (call when leaving the screen)
  void resetBankGptState() {
    _isPageLoaded = false;
    _isLoading = false;
    _progress = 0.0;
    _isAuthenticated = false;
    _authError = null;
    _bankGptSession = null;
    _isLoggingIn = false;
    notifyListeners();
  }
}