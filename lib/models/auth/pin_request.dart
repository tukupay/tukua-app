class PinRequest {
  final String pin;
  final String confirmPin;

  // Fixed PIN length - always 4 digits
  static const int pinLength = 4;

  PinRequest({required this.pin, required this.confirmPin});

  Map<String, dynamic> toJson() {
    return {
      'pin': pin,
      'confirm_pin': confirmPin,
    };
  }

  /// Returns null when valid, otherwise a short error message describing why the PIN is invalid.
  /// This is helpful for UI to show a concise reason to the user.
  String? validationError() {
    // presence
    if (pin.isEmpty || confirmPin.isEmpty) return 'PIN cannot be empty';
    if (pin != confirmPin) return 'PINs do not match';

    // length - exactly 4 digits
    if (pin.length != pinLength) return 'PIN must be $pinLength digits';

    // numeric only
    final numericRe = RegExp('^\\d{$pinLength}\$');
    if (!numericRe.hasMatch(pin)) return 'PIN must contain only digits';

    // PIN cannot be all the same digit
    if (pin.split('').every((c) => c == pin[0])) return 'PIN cannot be repetitive';

    // helper: sequential check (ascending or descending)
    bool isSequential(String s) {
      final digits = s.split('').map(int.parse).toList();
      bool asc = true;
      bool desc = true;
      for (int i = 1; i < digits.length; i++) {
        if (digits[i] != digits[i - 1] + 1) asc = false;
        if (digits[i] != digits[i - 1] - 1) desc = false;
      }
      return asc || desc;
    }

    if (isSequential(pin)) return 'PIN cannot be sequential';

    // helper: repeating substring (e.g., '1212', '123123')
    bool isRepeatingSubstring(String s) {
      for (int len = 1; len <= s.length ~/ 2; len++) {
        if (s.length % len != 0) continue;
        final sub = s.substring(0, len);
        if (List.filled(s.length ~/ len, sub).join() == s) return true;
      }
      return false;
    }

    if (isRepeatingSubstring(pin)) return 'PIN pattern too simple';

    // helper: paired blocks like '1122' (each pair has same digit)
    bool isPairedBlocks(String s) {
      if (s.length % 2 != 0) return false;
      for (int i = 0; i < s.length; i += 2) {
        if (s[i] != s[i + 1]) return false;
      }
      return true;
    }

    if (isPairedBlocks(pin)) return 'PIN pattern too simple';

    return null; // valid
  }

  /// Backwards-compatible boolean check
  bool isValid() {
    return validationError() == null;
  }

}
