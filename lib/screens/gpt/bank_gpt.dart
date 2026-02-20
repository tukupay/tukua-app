import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:url_launcher/url_launcher.dart';

/// BankGPT WebView Screen with automatic token-based authentication
/// Flow: 1. Login via REST API -> 2. Load WebView -> 3. Send token via postMessage
class BankGpt extends StatefulWidget {
  const BankGpt({super.key});

  @override
  State<BankGpt> createState() => _BankGptState();
}

class _BankGptState extends State<BankGpt> {
  final Completer<InAppWebViewController> _controller =
      Completer<InAppWebViewController>();
  InAppWebViewController? _webController;

  // Cache provider to avoid context issues in async callbacks
  WebviewProvider? _webviewProvider;
  bool _tokenSent = false;
  bool _isInitialized = false;

  /// Whether this is a BankGPT page (vs terms/privacy/other webpages)
  bool get _isBankGptPage =>
      _webviewProvider?.title == Strings.bankGptTitle;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      _webviewProvider = Provider.of<WebviewProvider>(context, listen: false);
      // Only login to BankGPT for actual BankGPT pages, not terms/privacy
      if (_isBankGptPage) {
        _initializeBankGpt();
      }
    });
  }

  /// Step 1: Login to BankGPT via REST API, then load WebView
  Future<void> _initializeBankGpt() async {
    if (_isInitialized) return;
    _isInitialized = true;

    // Login to BankGPT using stored credentials
    final success = await _webviewProvider?.loginToBankGpt() ?? false;

    if (!success && mounted) {
      debugPrint('❌ BankGPT login failed, showing error');
      // Still show webview but without token - user may need to login there
    }
  }

  @override
  void dispose() {
    _webController = null;
    // Reset state safely
    final provider = _webviewProvider;
    if (provider != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        provider.resetBankGptState();
      });
    }
    super.dispose();
  }

  /// Step 3: Send BankGPT access token to WebView via postMessage
  Future<void> _sendAuthToken() async {
    if (_webController == null) {
      debugPrint('❌ WebController is null, cannot send token');
      return;
    }

    // Get token from provider (obtained via iframe-login)
    final token = _webviewProvider?.bankGptAccessToken;

    if (token == null || token.isEmpty) {
      debugPrint('❌ No BankGPT access token available');
      return;
    }

    // Prevent duplicate sends
    if (_tokenSent) {
      debugPrint('⚠️ Token already sent, skipping...');
      return;
    }

    try {
      debugPrint('🔑 Sending token to BankGPT, length: ${token.length}');

      // Use base64 encoding to safely pass token (avoids escaping issues)
      final tokenBase64 = base64Encode(utf8.encode(token));

      // Send token via postMessage (per BankGPT documentation)
      final js = '''
        (function(){
          try {
            // Decode the base64 token
            var tokenBase64 = "$tokenBase64";
            var token = atob(tokenBase64);
            
            console.log('Flutter: Token decoded, length:', token.length);
            
            // AUTH_TOKEN format (per BankGPT documentation)
            var authMessage = {
              type: 'AUTH_TOKEN',
              payload: { token: token }
            };
            
            // Store token in localStorage for BankGPT to pick up
            try {
              localStorage.setItem('tukupay_token', token);
              localStorage.setItem('tukupay_auth', JSON.stringify(authMessage));
              console.log('Flutter: Token stored in localStorage');
            } catch(e) {
              console.log('Flutter: localStorage not available', e);
            }
            
            // Post to window
            window.postMessage(authMessage, '*');
            
            // Dispatch custom events
            window.dispatchEvent(new CustomEvent('tukupay-auth', { detail: authMessage }));
            
            // Set on window object for direct access
            window.tukupayToken = token;
            window.tukupayAuth = authMessage;
            
            console.log('Flutter: Sent AUTH_TOKEN to BankGPT');
            
            // Confirm send to Flutter
            if (window.flutter_inappwebview) {
              window.flutter_inappwebview.callHandler('TokenSent', 'success');
            }
          } catch(e) {
            console.error('Flutter: Error sending token', e.message);
            if (window.flutter_inappwebview) {
              window.flutter_inappwebview.callHandler('TokenSent', 'error: ' + e.message);
            }
          }
        })();
      ''';

      await _webController?.evaluateJavascript(source: js);
      _tokenSent = true;
      debugPrint('✅ Sent AUTH_TOKEN to BankGPT');
    } catch (e) {
      debugPrint('❌ Error sending auth token: $e');
    }
  }

  /// Handle incoming messages from BankGPT
  void _handleMessage(String messageJson) {
    if (!mounted) return;

    try {
      final message = jsonDecode(messageJson);
      final type = message['type'];
      final payload = message['payload'];

      debugPrint('📨 Received from BankGPT: $type');

      switch (type) {
        case 'REQUEST_TOKEN':
          debugPrint('🔄 BankGPT requesting token...');
          _tokenSent = false; // Allow re-send
          _sendAuthToken();
          break;

        case 'TOKEN_RECEIVED':
          debugPrint('✅ BankGPT confirmed token receipt');
          _webviewProvider?.setAuthenticated(true);
          break;

        case 'AUTH_RESPONSE':
          final success = payload?['success'] ?? false;
          final error = payload?['error'];
          _webviewProvider?.setAuthenticated(success);
          if (success) {
            debugPrint('✅ BankGPT authentication successful');
          } else {
            debugPrint('❌ BankGPT authentication failed: $error');
            _webviewProvider?.setAuthError(error?.toString());
          }
          break;

        case 'SESSION_SYNC':
          final success = payload?['success'] ?? false;
          debugPrint('🔄 Session sync: ${success ? "Active" : "Inactive"}');
          _webviewProvider?.setAuthenticated(success);
          break;

        case 'BACK_BUTTON_PRESSED':
          final canGoBack = payload?['canGoBack'] ?? false;
          if (!canGoBack && mounted) {
            debugPrint('⬅️ BankGPT requests native back navigation');
            Navigator.of(context).pop();
          }
          break;

        case 'LOGOUT':
          debugPrint('🚪 BankGPT initiated logout');
          if (mounted) Navigator.of(context).pop();
          break;

        default:
          debugPrint('❓ Unknown message type: $type');
      }
    } catch (e) {
      debugPrint('❌ Error parsing BankGPT message: $e');
    }
  }

  /// Send logout message to BankGPT
  Future<void> _sendLogout() async {
    if (_webController == null) return;

    final message = jsonEncode({'type': 'LOGOUT'});
    await _webController?.evaluateJavascript(
      source: "(function(){ window.postMessage($message, '*'); })();"
    );
    debugPrint('Sent LOGOUT to BankGPT');
  }

  /// Inject message listener into the page
  Future<void> _injectMessageListener() async {
    if (_webController == null) return;

    final js = '''
      (function() {
        if (window._flutterListenerAdded) {
          console.log('Flutter: Listener already installed, skipping');
          return;
        }
        window._flutterListenerAdded = true;
        
        var knownTypes = ['REQUEST_TOKEN', 'TOKEN_RECEIVED', 'AUTH_RESPONSE', 
                          'SESSION_SYNC', 'BACK_BUTTON_PRESSED', 'LOGOUT'];
        
        // Listen for postMessage events
        window.addEventListener('message', function(event) {
          try {
            var data = event.data;
            if (typeof data === 'string') {
              try { data = JSON.parse(data); } catch(e) {}
            }
            
            if (data && data.type) {
              console.log('Flutter: Received message type:', data.type);
              
              if (window.flutter_inappwebview) {
                window.flutter_inappwebview.callHandler('FlutterChannel', JSON.stringify(data));
              }
            }
          } catch(e) {
            console.log('Flutter listener error:', e);
          }
        });
        
        // Notify that Flutter is ready
        window.dispatchEvent(new CustomEvent('flutter-ready'));
        window.dispatchEvent(new CustomEvent('tukupay-ready'));
        
        console.log('Flutter: Message listener installed');
        
        if (window.flutter_inappwebview) {
          window.flutter_inappwebview.callHandler('ListenerReady', 'installed');
        }
      })();
    ''';

    await _webController?.evaluateJavascript(source: js);
    debugPrint('✅ Injected message listener into BankGPT');
  }

  /// Handle back button press
  Future<bool> _onWillPop() async {
    if (_webController != null) {
      final canGoBack = await _webController!.canGoBack();
      if (canGoBack) {
        await _webController!.goBack();
        return false;
      }
    }
    return true;
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<WebviewProvider>(
      builder: (_, webview, __) {
        // Determine if this is a BankGPT page directly from consumer
        final isBankGpt = webview.title == Strings.bankGptTitle;

        return PopScope(
          canPop: false,
          onPopInvokedWithResult: (didPop, result) async {
            if (didPop) return;
            final shouldPop = await _onWillPop();
            if (shouldPop && context.mounted) Navigator.of(context).pop();
          },
          child: Scaffold(
            appBar: _buildAppBar(webview),
            body: SafeArea(
              child: Stack(
                alignment: Alignment.topCenter,
                children: [
                  // For non-BankGPT pages (terms/privacy), load webview directly
                  // For BankGPT pages, wait until login completes
                  if (webview.link != null && (!isBankGpt || !webview.isLoggingIn))
                    _buildWebView(webview),

                  // Show splash ONLY for BankGPT pages while logging in or loading
                  if (isBankGpt && (webview.isLoggingIn || webview.isLoading || webview.progress < 0.5))
                    _buildLoadingSplash(webview),

                  // Progress bar (for all pages)
                  if (webview.progress < 1.0 && webview.progress > 0)
                    _buildProgressBar(webview),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  /// Build app bar (hidden when BankGPT title)
  PreferredSizeWidget? _buildAppBar(WebviewProvider webview) {
    if (webview.title == Strings.bankGptTitle) return null;

    return AppBar(
      backgroundColor: HexColor("F9F9FA"),
      leading: IconButton(
        onPressed: () {
          if (context.mounted) Navigator.pop(context);
        },
        icon: const Icon(Icons.arrow_back),
      ),
      title: Text(
        webview.title ?? '',
        style: Blacks.regularSemiRoboto,
      ),
    );
  }

  /// Build loading splash with BankGPT logo
  Widget _buildLoadingSplash(WebviewProvider webview) {
    return Container(
      color: Colors.white,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // BankGPT logo as splash
            Image.asset(
              Strings.iconImage('bankgpt.png'),
              width: 120,
              height: 120,
            ),
            const SizedBox(height: 24),
            Text(
              webview.isLoggingIn ? 'Connecting...' : 'Loading BankGPT...',
              style: TextStyle(
                fontSize: 16,
                color: HexColor(AppColors.primaryGreen),
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: 32,
              height: 32,
              child: CircularProgressIndicator(
                strokeWidth: 3,
                color: HexColor(AppColors.primaryGreen),
              ),
            ),
            // Show error if login failed
            if (webview.authError != null) ...[
              const SizedBox(height: 16),
              Text(
                webview.authError!,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.red.shade400,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ],
        ),
      ),
    );
  }

  /// Build progress indicator
  Widget _buildProgressBar(WebviewProvider webview) {
    return LinearProgressIndicator(
      minHeight: 2.0,
      value: webview.progress,
      color: HexColor(AppColors.primaryOrange),
    );
  }

  /// Build the WebView
  Widget _buildWebView(WebviewProvider webview) {
    final settings = InAppWebViewSettings(
      isInspectable: false,
      mediaPlaybackRequiresUserGesture: false,
      allowsInlineMediaPlayback: true,
      useOnDownloadStart: true,
      iframeAllowFullscreen: true,
      javaScriptEnabled: true,
      domStorageEnabled: true,
    );

    return InAppWebView(
      initialSettings: settings,
      initialUrlRequest: URLRequest(url: WebUri(webview.link!)),
      shouldOverrideUrlLoading: _handleUrlLoading,
      onWebViewCreated: _onWebViewCreated,
      onLoadStart: (_, __) => _onLoadStart(),
      onLoadStop: (_, __) => _onLoadStop(),
      onProgressChanged: (_, progress) => _onProgressChanged(progress),
      onConsoleMessage: (_, msg) => debugPrint('BankGPT: ${msg.message}'),
    );
  }

  /// Handle URL loading (external links)
  Future<NavigationActionPolicy?> _handleUrlLoading(
    InAppWebViewController controller,
    NavigationAction action,
  ) async {
    final uri = action.request.url!;
    final allowed = ["http", "https", "file", "chrome", "data", "javascript", "about"];

    if (!allowed.contains(uri.scheme)) {
      if (_webviewProvider?.link != null && await canLaunchUrl(Uri.parse(_webviewProvider!.link!))) {
        await launchUrl(Uri.parse(_webviewProvider!.link!));
        return NavigationActionPolicy.CANCEL;
      }
    }
    return NavigationActionPolicy.ALLOW;
  }

  /// WebView created callback
  void _onWebViewCreated(InAppWebViewController webController) {
    // Ensure provider is cached
    _webviewProvider ??= Provider.of<WebviewProvider>(context, listen: false);
    _webviewProvider?.setLoading(true);

    if (!_controller.isCompleted) _controller.complete(webController);
    _webController = webController;

    // Register JavaScript handler for messages from BankGPT
    webController.addJavaScriptHandler(
      handlerName: 'FlutterChannel',
      callback: (args) {
        if (args.isNotEmpty) {
          final msg = args[0];
          _handleMessage(msg is String ? msg : jsonEncode(msg));
        }
        return null;
      },
    );

    // Handler to confirm token was sent
    webController.addJavaScriptHandler(
      handlerName: 'TokenSent',
      callback: (args) {
        debugPrint('🔑 TokenSent callback: ${args.isNotEmpty ? args[0] : "no args"}');
        return null;
      },
    );

    // Handler to confirm listener is ready
    webController.addJavaScriptHandler(
      handlerName: 'ListenerReady',
      callback: (args) {
        debugPrint('👂 ListenerReady callback: ${args.isNotEmpty ? args[0] : "no args"}');
        return null;
      },
    );
  }

  /// Page load started
  void _onLoadStart() {
    _tokenSent = false; // Reset token sent flag on page reload
    _webviewProvider?.setLoading(true);
    _webviewProvider?.setPageLoaded(false);
  }

  /// Page load completed - inject listener and send token
  Future<void> _onLoadStop() async {
    _webviewProvider?.setLoading(false);

    if (_webviewProvider?.isPageLoaded != true) {
      _webviewProvider?.setPageLoaded(true);

      // Only inject listener and send token for BankGPT pages
      if (_isBankGptPage) {
        await _injectMessageListener();

        // Wait for BankGPT's listener to initialize, then send token
        Future.delayed(const Duration(milliseconds: 800), () {
          if (mounted) _sendAuthToken();
        });
      }
    }
  }

  /// Progress changed
  void _onProgressChanged(int progress) {
    if (progress == 100) _webviewProvider?.setLoading(false);
    _webviewProvider?.setProgress(progress / 100);
  }
}
