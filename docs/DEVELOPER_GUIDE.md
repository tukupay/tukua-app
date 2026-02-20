# TukuPay Developer Guide

This guide provides detailed technical documentation for developers working on the TukuPay Flutter application.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [State Management](#state-management)
3. [API Integration](#api-integration)
4. [Local Storage](#local-storage)
5. [Authentication Flow](#authentication-flow)
6. [Navigation](#navigation)
7. [Widget Components](#widget-components)
8. [Best Practices](#best-practices)

---

## Architecture Overview

TukuPay follows a layered architecture pattern that promotes separation of concerns, testability, and maintainability.

### Layer Responsibilities

| Layer | Directory | Responsibility |
|-------|-----------|----------------|
| **Presentation** | `screens/`, `widgets/` | UI rendering and user interaction |
| **State** | `providers/` | Business logic and state management |
| **Domain** | `models/`, `repository/` | Business entities and data contracts |
| **Data** | `services/`, `endpoints/` | API communication and data transformation |
| **Local** | `services/local/` | Local database and secure storage |

### Data Flow

```
User Interaction
       │
       ▼
┌─────────────┐
│   Screen    │  ──────────────────────────┐
└─────────────┘                            │
       │                                   │
       │ Provider.of<T>(context)           │
       ▼                                   │
┌─────────────┐                            │
│  Provider   │  ──► notifyListeners() ────┘
└─────────────┘
       │
       │ async call
       ▼
┌─────────────┐
│   Service   │
└─────────────┘
       │
       │ HTTP request
       ▼
┌─────────────┐
│     API     │
└─────────────┘
```

---

## State Management

TukuPay uses the **Provider** package for state management.

### Provider Pattern

```dart
// 1. Define Provider (extends ChangeNotifier)
class WalletProvider extends ChangeNotifier {
  List<Wallet> _wallets = [];
  bool _isLoading = false;
  
  // Getters (read-only access to state)
  List<Wallet> get wallets => _wallets;
  bool get isLoading => _isLoading;
  
  // Actions (methods that modify state)
  Future<void> fetchWallets() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      _wallets = await _walletService.getWallets();
    } catch (e) {
      // Handle error
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
```

### Using Providers in Widgets

```dart
// Reading state (rebuilds on change)
Consumer<WalletProvider>(
  builder: (context, provider, child) {
    return ListView.builder(
      itemCount: provider.wallets.length,
      itemBuilder: (context, index) => WalletCard(provider.wallets[index]),
    );
  },
)

// Reading state without rebuild
final provider = Provider.of<WalletProvider>(context, listen: false);

// Calling actions
Provider.of<WalletProvider>(context, listen: false).fetchWallets();
```

### Provider Registration

Providers are registered in `main.dart`:

```dart
MultiProvider(
  providers: [
    ChangeNotifierProvider(create: (_) => AuthProvider()),
    ChangeNotifierProvider(create: (_) => WalletProvider()),
    ChangeNotifierProvider(create: (_) => TransactionsProvider()),
    // ... other providers
  ],
  child: MyApp(),
)
```

---

## API Integration

### Service Layer Structure

Each feature has a dedicated service class:

```dart
class WalletService {
  final AuthHttp _authHttp = AuthHttp();
  
  Future<List<Wallet>> getWallets() async {
    final response = await _authHttp.get(WalletEndpoints.wallets);
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return (data['wallets'] as List)
          .map((w) => Wallet.fromJson(w))
          .toList();
    }
    throw Exception('Failed to fetch wallets');
  }
  
  Future<Wallet> createWallet(Map<String, dynamic> payload) async {
    final response = await _authHttp.post(
      WalletEndpoints.wallets,
      body: jsonEncode(payload),
    );
    
    if (response.statusCode == 201) {
      return Wallet.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to create wallet');
  }
}
```

### AuthHttp (Authenticated Requests)

The `AuthHttp` class handles authentication automatically:

```dart
class AuthHttp {
  Future<http.Response> get(String url) async {
    final token = await _getAccessToken();
    return http.get(
      Uri.parse(url),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
  }
  
  // Handles token refresh automatically
  Future<String?> _getAccessToken() async {
    // Check if token is expired, refresh if needed
    // Return valid access token
  }
}
```

### Endpoint Configuration

Endpoints are defined in `lib/endpoints/`:

```dart
class WalletEndpoints {
  static final String wallets = '${Configs.root}/wallets';
  static String walletById(int id) => '${Configs.root}/wallets/$id';
  static String walletTransactions(int id) => '${Configs.root}/wallets/$id/transactions';
}
```

---

## Local Storage

### Isar Database

Used for complex local data (contacts, transactions cache):

```dart
// Define schema
@collection
class LocalUser {
  Id id = Isar.autoIncrement;
  
  String? phone;
  String? email;
  String? accessToken;
  String? refreshToken;
}

// Usage
final isar = await Isar.open([LocalUserSchema]);

// Write
await isar.writeTxn(() async {
  await isar.localUsers.put(user);
});

// Read
final user = await isar.localUsers.where().findFirst();
```

### Secure Storage

Used for sensitive data (tokens, PIN):

```dart
final storage = FlutterSecureStorage();

// Write
await storage.write(key: 'access_token', value: token);

// Read
final token = await storage.read(key: 'access_token');

// Delete
await storage.delete(key: 'access_token');
```

### SharedPreferences

Used for simple key-value storage (settings, flags):

```dart
final prefs = await SharedPreferences.getInstance();

// Write
await prefs.setBool('biometrics_enabled', true);
await prefs.setInt('last_exit', DateTime.now().millisecondsSinceEpoch);

// Read
final enabled = prefs.getBool('biometrics_enabled') ?? false;
```

---

## Authentication Flow

### Registration Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Register   │ ──► │ Verify OTP  │ ──► │  KYC Setup  │ ──► │  PIN Setup  │
│   Screen    │     │   Screen    │     │   Screen    │     │   Screen    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
                                                            ┌─────────────┐
                                                            │    Home     │
                                                            │   Screen    │
                                                            └─────────────┘
```

### Login Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Login    │ ──► │  PIN Entry  │ ──► │    Home     │
│   Screen    │     │   Screen    │     │   Screen    │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼ (if enabled)
                    ┌─────────────┐
                    │  Biometric  │
                    │   Prompt    │
                    └─────────────┘
```

### Session Management

```dart
// Auto-logout on inactivity (configured in main.dart)
InAppIdleDetector.initialize(
  timeout: const Duration(minutes: 3),
  onIdle: () async {
    // Show warning dialog
    // Countdown 30 seconds
    // Logout if no action
  },
);
```

---

## Navigation

### Route Definitions

Routes are defined in `lib/routes.dart`:

```dart
class Routes {
  static const login = '/login';
  static const home = '/home';
  static const walletDetails = '/walletDetails';
  // ...
}
```

### Navigation Methods

```dart
// Push new screen
Navigator.pushNamed(context, Routes.walletDetails);

// Push with arguments
Navigator.pushNamed(
  context, 
  Routes.walletDetails,
  arguments: {'walletId': 123},
);

// Replace current screen
Navigator.pushReplacementNamed(context, Routes.home);

// Clear stack and push
Navigator.pushNamedAndRemoveUntil(
  context, 
  Routes.login, 
  (route) => false,
);

// Pop current screen
Navigator.pop(context);

// Pop with result
Navigator.pop(context, result);
```

### Route Tracking

The app tracks the current route for analytics and idle detection:

```dart
// In RouteTracker
class RouteTracker extends NavigatorObserver {
  static String? currentRoute;
  
  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    currentRoute = route.settings.name;
    debugPrint('➡️ Pushed $currentRoute');
  }
}
```

---

## Widget Components

### Reusable Widgets Location

```
widgets/
├── buttons/           # Custom buttons
│   ├── primary_button.dart
│   ├── sheet_button.dart
│   └── action_button.dart
├── cards/             # Card components
│   ├── wallet_card.dart
│   └── transaction_card.dart
├── sheets/            # Bottom sheets
│   ├── wallet_selector_sheet.dart
│   └── confirmation_sheet.dart
├── dialogs/           # Alert dialogs
│   ├── confirmation_dialog.dart
│   └── insufficient_balance_dialog.dart
├── inputs/            # Form inputs
│   ├── custom_text_field.dart
│   └── amount_input.dart
└── shared/            # Shared components
    ├── loading_indicator.dart
    └── empty_state.dart
```

### Creating Reusable Widgets

```dart
class PrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  
  const PrimaryButton({
    Key? key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: isLoading
          ? CircularProgressIndicator(color: Colors.white)
          : Text(label),
      ),
    );
  }
}
```

---

## Best Practices

### Code Organization

1. **One Widget per File**: Keep each widget in its own file
2. **Descriptive Names**: Use clear, descriptive names for files and classes
3. **Feature Folders**: Group related files by feature, not type

### State Management

1. **Minimal State**: Keep state as minimal as possible
2. **Single Source of Truth**: Avoid duplicating state
3. **Immutable State**: Prefer immutable state objects
4. **Reset State**: Always reset state when navigating away

### API Calls

1. **Error Handling**: Always handle API errors gracefully
2. **Loading States**: Show loading indicators during API calls
3. **Retry Logic**: Implement retry logic for failed requests
4. **Token Refresh**: Let AuthHttp handle token refresh automatically

### Performance

1. **const Constructors**: Use `const` wherever possible
2. **Lazy Loading**: Load data only when needed
3. **Pagination**: Implement pagination for large lists
4. **Image Caching**: Use cached network images

### Security

1. **No Hardcoded Secrets**: Use environment variables
2. **Secure Storage**: Use flutter_secure_storage for sensitive data
3. **Input Validation**: Validate all user inputs
4. **Log Responsibly**: Never log sensitive data in production

---

## Common Patterns

### Loading Pattern

```dart
class MyScreen extends StatefulWidget {
  @override
  _MyScreenState createState() => _MyScreenState();
}

class _MyScreenState extends State<MyScreen> {
  bool _isLoading = true;
  
  @override
  void initState() {
    super.initState();
    _loadData();
  }
  
  Future<void> _loadData() async {
    try {
      await Provider.of<MyProvider>(context, listen: false).fetchData();
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return LoadingIndicator();
    }
    return MyContent();
  }
}
```

### Form Validation Pattern

```dart
final _formKey = GlobalKey<FormState>();

Form(
  key: _formKey,
  child: Column(
    children: [
      TextFormField(
        validator: (value) {
          if (value == null || value.isEmpty) {
            return 'This field is required';
          }
          return null;
        },
      ),
      ElevatedButton(
        onPressed: () {
          if (_formKey.currentState!.validate()) {
            // Proceed with form submission
          }
        },
        child: Text('Submit'),
      ),
    ],
  ),
)
```

### Dispose Pattern

```dart
class _MyScreenState extends State<MyScreen> {
  late TextEditingController _controller;
  
  @override
  void initState() {
    super.initState();
    _controller = TextEditingController();
  }
  
  @override
  void dispose() {
    _controller.dispose();
    // Reset provider state if needed (use WidgetsBinding)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<MyProvider>(context, listen: false).reset();
    });
    super.dispose();
  }
}
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Provider not found | Ensure provider is registered in MultiProvider |
| setState after dispose | Check `mounted` before calling setState |
| Token expired | AuthHttp handles refresh automatically |
| Build runner errors | Run `dart run build_runner build --delete-conflicting-outputs` |

### Debug Logging

```dart
// Enable logging
debugPrint('Debug message');

// Conditional logging
if (kDebugMode) {
  print('Only in debug mode');
}
```

---

## Next Steps

- Review the [API Documentation](./API_DOCUMENTATION.md) for endpoint details
- Check [Widget Catalog](./WIDGET_CATALOG.md) for available components
- See [Testing Guide](./TESTING_GUIDE.md) for testing practices

