import 'package:flutter/material.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';

/// Simple enum to represent the PIN flow mode.
enum PinFlowMode { setup, verify }

/// PinProvider manages PIN entry, hints/validation and the submit flow.
///
/// - Keeps PIN only in memory and clears it after use.
/// - Uses PinRequest for validation rules (single source of truth).
class PinProvider extends ChangeNotifier {
  final ProfileProvider profile;
  final AuthProvider auth;

  PinProvider({required this.profile, required this.auth}) {
    _mode = profile.user?.requiresPinSetup == true ? PinFlowMode.setup : PinFlowMode.verify;
  }

  // current typed pin
  String _pin = '';
  String get pin => _pin;

  // during setup: hold first entry awaiting confirmation
  String? _firstPin;
  String? get firstPin => _firstPin;

  // network/submission state
  bool _submitting = false;
  bool get submitting => _submitting;

  String? _error;
  String? get error => _error;

  PinFlowMode? _mode;
  PinFlowMode get mode => _mode ?? PinFlowMode.verify;

  /// Update the mode based on user's requiresPinSetup status.
  void setMode(PinFlowMode newMode) {
    if (_mode != newMode) {
      _mode = newMode;
      notifyListeners();
    }
  }

  /// Update mode from user profile - call this when user data changes.
  void updateModeFromProfile(bool requiresPinSetup) {
    setMode(requiresPinSetup ? PinFlowMode.setup : PinFlowMode.verify);
  }

  // Fixed at 4 digits
  static const int pinLength = PinRequest.pinLength;

  bool _isResetting = false;
  bool get isResetting => _isResetting;

  // For reset flow: hold first entry awaiting confirmation
  String? _resetFirstPin;
  String? get resetFirstPin => _resetFirstPin;

  /// Whether we are in the confirm step of reset flow.
  bool get inResetConfirmStep => _isResetting && _resetFirstPin != null;

  // --- state mutators -----------------------------------------------------

  // set resetting state to handle otp page accordingly
  void setIsResetting(bool val) {
    _isResetting = val;
    notifyListeners();
  }

  /// Append a digit to the current pin (max limited).
  void appendDigit(String d) {
    if (_pin.length >= pinLength || _submitting) return;
    _pin += d;
    _error = null;
    notifyListeners();
  }

  /// Remove last digit.
  void backspace() {
    if (_pin.isEmpty || _submitting) return;
    _pin = _pin.substring(0, _pin.length - 1);
    _error = null;
    notifyListeners();
  }

  /// Reset the current entry (used when user cancels confirmation step).
  void resetEntry() {
    _pin = '';
    _error = null;
    notifyListeners();
  }

  /// Start the confirm step if the current pin is valid. Returns true when moved to confirm step.
  bool startConfirmIfValid() {
    final req = PinRequest(pin: _pin, confirmPin: _pin);
    final err = req.validationError();
    if (err != null) {
      _error = err;
      notifyListeners();
      return false;
    }
    _firstPin = _pin;
    _pin = '';
    _error = null;
    notifyListeners();
    return true;
  }

  /// Whether we are in the confirm step of setup flow (first PIN has been entered)
  bool get inConfirmStep => _firstPin != null;

  bool get isCurrentValid {
    final req = PinRequest(pin: _pin, confirmPin: _pin);
    return req.isValid();
  }

  // --- hint getters (derived) --------------------------------------------

  bool get lengthOk => _pin.length == pinLength;
  bool get notAllSame => _pin.isNotEmpty && _pin.split('').toSet().length > 1;

  bool? get notSequential {
    if (_pin.isEmpty) return null;
    if (_pin.length < 2) return true;
    bool asc = true;
    bool desc = true;
    for (var i = 1; i < _pin.length; i++) {
      final prev = int.tryParse(_pin[i - 1]);
      final cur = int.tryParse(_pin[i]);
      if (prev == null || cur == null) return null;
      if (cur != prev + 1) asc = false;
      if (cur != prev - 1) desc = false;
      if (!asc && !desc) return true;
    }
    return !(asc || desc);
  }

  bool? get notSimpleRepeat {
    final s = _pin;
    if (s.isEmpty) return null;
    if (s.length < 2) return true;
    for (int k = 1; k <= s.length ~/ 2; k++) {
      if (s.length % k != 0) continue;
      final sub = s.substring(0, k);
      if (List.filled(s.length ~/ k, sub).join() == s) return false;
    }
    return true;
  }

  bool? get notTwoBlockPattern {
    if (_pin.isEmpty) return null;
    if (_pin.length % 2 != 0) return null;
    final half = _pin.length ~/ 2;
    final first = _pin.substring(0, half);
    final second = _pin.substring(half);
    if (first.split('').toSet().length == 1 && second.split('').toSet().length == 1 && first != second) {
      return false;
    }
    return true;
  }

  // --- submission flow ---------------------------------------------------

  /// Confirm the second entry and submit to server when in setup mode.
  /// Returns true on success.
  Future<bool> confirmAndSubmit(BuildContext context) async {
    // Only check for _firstPin - we're in confirm step if it exists
    if (_firstPin == null) return false;
    final confirmReq = PinRequest(pin: _firstPin!, confirmPin: _pin);
    final err = confirmReq.validationError();
    if (err != null) {
      _error = err == 'PINs do not match' ? 'PINs do not match' : err;
      if (err == 'PINs do not match') _pin = '';
      notifyListeners();
      return false;
    }

    _submitting = true;
    _error = null;
    notifyListeners();

    try {
      final ok = await auth.setupPin(_firstPin!, _pin, context);
      _submitting = false;
      if (ok) {
        // clear sensitive state on success
        _pin = '';
        _firstPin = null;
        _error = null;
        notifyListeners();
        return true;
      }
      // when auth.setupPin failed it already produced toast; reflect a generic error
      _error = 'Could not set PIN';
      notifyListeners();
      return false;
    } catch (e) {
      _submitting = false;
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  /// For verify mode: simple local validation, returns true when valid.
  bool verifyLocal() {
    // Just validate the PIN format - caller controls when this is called
    final req = PinRequest(pin: _pin, confirmPin: _pin);
    final err = req.validationError();
    if (err != null) {
      _error = err;
      notifyListeners();
      return false;
    }
    _error = null;
    notifyListeners();
    return true;
  }

  /// Clear reset state when user cancels or completes reset.
  void clearResetState() {
    _pin = '';
    _resetFirstPin = null;
    _error = null;
    _isResetting = false;
    notifyListeners();
  }

  // --- PIN Reset Flow Methods --------------------------------------------

  /// Start the confirm step for reset if the current pin is valid.
  bool startResetConfirmIfValid() {
    final req = PinRequest(pin: _pin, confirmPin: _pin);
    final err = req.validationError();
    if (err != null) {
      _error = err;
      notifyListeners();
      return false;
    }
    _resetFirstPin = _pin;
    _pin = '';
    _error = null;
    notifyListeners();
    return true;
  }

  /// Confirm and submit the new PIN for reset.
  /// Returns true on success.
  Future<bool> confirmAndResetPin() async {
    if (!_isResetting || _resetFirstPin == null) return false;
    final confirmReq = PinRequest(pin: _resetFirstPin!, confirmPin: _pin);
    final err = confirmReq.validationError();
    if (err != null) {
      _error = err == 'PINs do not match' ? 'PINs do not match' : err;
      if (err == 'PINs do not match') _pin = '';
      notifyListeners();
      return false;
    }

    _submitting = true;
    _error = null;
    notifyListeners();

    try {
      final ok = await auth.resetPin(_resetFirstPin!, _pin);
      _submitting = false;
      if (ok) {
        clearResetState();
        return true;
      }
      _error = 'Could not reset PIN';
      notifyListeners();
      return false;
    } catch (e) {
      _submitting = false;
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }
}

