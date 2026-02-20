# Contributing to TukuPay

Thank you for your interest in contributing to TukuPay! This document provides guidelines and instructions for contributing.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Code Standards](#code-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Testing](#testing)
8. [Documentation](#documentation)

---

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the project
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discriminatory language
- Personal attacks
- Publishing private information
- Any unprofessional conduct

---

## Getting Started

### Prerequisites

1. Flutter SDK `^3.6.1`
2. Git
3. IDE (VS Code or Android Studio recommended)

### Setup

```bash
# Clone the repository
git clone https://github.com/albatomuch/tuku.git
cd tuku

# Install dependencies
flutter pub get

# Generate code (Isar schemas)
dart run build_runner build

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Run the app
flutter run
```

### IDE Setup

#### VS Code Extensions
- Flutter
- Dart
- GitLens
- Error Lens

#### Android Studio Plugins
- Flutter
- Dart

---

## Development Workflow

### Branch Strategy

```
main (production)
  │
  └── develop (staging)
        │
        ├── feature/feature-name
        ├── bugfix/bug-description
        └── hotfix/urgent-fix
```

### Creating a Feature Branch

```bash
# Checkout develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Work on your feature...

# Push branch
git push -u origin feature/your-feature-name
```

### Branch Naming Convention

| Type | Format | Example |
|------|--------|---------|
| Feature | `feature/description` | `feature/wallet-sharing` |
| Bug Fix | `bugfix/description` | `bugfix/login-error` |
| Hot Fix | `hotfix/description` | `hotfix/payment-crash` |
| Refactor | `refactor/description` | `refactor/auth-module` |

---

## Code Standards

### File Organization

```
lib/
├── screens/           # Full-page widgets
│   └── feature/       # Feature-specific screens
├── widgets/           # Reusable components
│   └── feature/       # Feature-specific widgets
├── providers/         # State management
├── services/          # API services
├── models/            # Data models
└── constants/         # App constants
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | snake_case | `wallet_provider.dart` |
| Classes | PascalCase | `WalletProvider` |
| Variables | camelCase | `selectedWallet` |
| Constants | camelCase | `primaryColor` |
| Private | _prefix | `_isLoading` |

### Code Style

```dart
// ✅ Good
class WalletCard extends StatelessWidget {
  final Wallet wallet;
  final VoidCallback? onTap;
  
  const WalletCard({
    Key? key,
    required this.wallet,
    this.onTap,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        child: Text(wallet.name),
      ),
    );
  }
}

// ❌ Avoid
class wallet_card extends StatelessWidget {
  var wallet;  // Missing type
  // Missing const constructor
  // Missing Key
}
```

### Import Order

```dart
// 1. Dart SDK
import 'dart:async';
import 'dart:convert';

// 2. Flutter SDK
import 'package:flutter/material.dart';

// 3. External packages
import 'package:provider/provider.dart';

// 4. Project imports
import 'package:tuku/providers/providers.dart';
import 'package:tuku/models/models.dart';
```

### Widget Structure

```dart
class MyScreen extends StatefulWidget {
  // 1. Static constants
  static const routeName = '/my-screen';
  
  // 2. Final fields
  final String title;
  
  // 3. Constructor
  const MyScreen({Key? key, required this.title}) : super(key: key);
  
  @override
  State<MyScreen> createState() => _MyScreenState();
}

class _MyScreenState extends State<MyScreen> {
  // 1. State variables
  bool _isLoading = false;
  
  // 2. Controllers
  late TextEditingController _controller;
  
  // 3. Lifecycle methods
  @override
  void initState() {
    super.initState();
    _controller = TextEditingController();
  }
  
  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
  
  // 4. Build method
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _buildBody(),
    );
  }
  
  // 5. Build helpers (private)
  Widget _buildBody() {
    return Container();
  }
  
  // 6. Action methods (private)
  void _handleSubmit() {
    // ...
  }
}
```

---

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting (no code change) |
| `refactor` | Code restructuring |
| `test` | Adding tests |
| `chore` | Maintenance tasks |

### Examples

```bash
# Feature
git commit -m "feat(wallet): add signatory management"

# Bug fix
git commit -m "fix(auth): resolve token refresh loop"

# Documentation
git commit -m "docs: update API documentation"

# Refactor
git commit -m "refactor(payments): extract validation logic"
```

### Commit Best Practices

- Keep commits atomic (one change per commit)
- Write clear, descriptive messages
- Reference issue numbers when applicable
- Don't commit commented-out code
- Don't commit debug statements

---

## Pull Request Process

### Before Submitting

1. **Update from develop**
   ```bash
   git checkout develop
   git pull
   git checkout your-branch
   git rebase develop
   ```

2. **Run checks**
   ```bash
   flutter analyze
   flutter test
   ```

3. **Self-review**
   - Check for typos
   - Remove debug statements
   - Ensure no commented code
   - Verify formatting

### PR Template

```markdown
## Description
[What does this PR do?]

## Type of Change
- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Documentation

## Testing
[How was this tested?]

## Screenshots
[If applicable]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed
- [ ] Added/updated documentation
- [ ] Added tests (if applicable)
- [ ] All tests pass
```

### Review Process

1. Submit PR to `develop` branch
2. Request review from team members
3. Address feedback
4. Squash and merge when approved

---

## Testing

### Running Tests

```bash
# All tests
flutter test

# Specific test file
flutter test test/widget_test.dart

# With coverage
flutter test --coverage
```

### Writing Tests

```dart
// test/providers/wallet_provider_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:tuku/providers/wallet_provider.dart';

void main() {
  group('WalletProvider', () {
    late WalletProvider provider;
    
    setUp(() {
      provider = WalletProvider();
    });
    
    test('initial state has empty wallets', () {
      expect(provider.wallets, isEmpty);
    });
    
    test('selectWallet updates selected wallet', () {
      final wallet = Wallet(id: 1, name: 'Test');
      provider.selectWallet(wallet);
      expect(provider.selectedWallet, equals(wallet));
    });
  });
}
```

### Test Naming

- Use descriptive names
- Follow `should_expectedBehavior_when_condition` pattern

```dart
test('should return error when PIN is invalid', () {
  // ...
});
```

---

## Documentation

### Code Comments

```dart
/// A widget that displays wallet information.
/// 
/// This widget shows the wallet name, balance, and
/// an optional action button.
/// 
/// Example:
/// ```dart
/// WalletCard(
///   wallet: myWallet,
///   onTap: () => print('Tapped'),
/// )
/// ```
class WalletCard extends StatelessWidget {
  /// The wallet to display.
  final Wallet wallet;
  
  /// Called when the card is tapped.
  final VoidCallback? onTap;
  
  // ...
}
```

### README Updates

- Update README when adding major features
- Keep installation instructions current
- Document breaking changes

### Doc Files

Place documentation in `/docs`:
- Technical guides
- API documentation
- Feature specifications

---

## Questions?

- Check existing documentation
- Search closed issues
- Ask in team chat
- Open a discussion issue

---

Thank you for contributing to TukuPay! 🎉

