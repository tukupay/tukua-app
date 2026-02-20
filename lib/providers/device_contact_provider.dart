import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_contacts/flutter_contacts.dart';
import 'package:tuku/models/contact/device_contact.dart';

class DeviceContactProvider extends ChangeNotifier {
  List<Contact> _contacts = [];
  List<Contact> get contacts => _contacts;

  List<DeviceContact> _simpleContacts = [];
  List<DeviceContact> get simpleContacts => _simpleContacts;

  List<DeviceContact> _filteredContacts = [];
  List<DeviceContact> get filteredContacts => _filteredContacts;

  bool _permissionChecked = false;
  bool get permissionChecked => _permissionChecked;

  bool _permissionGranted = false;
  bool get permissionGranted => _permissionGranted;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  // Progress (0-100) for UI to show how much of the contacts have been processed
  int _fetchProgress = 0;
  int get fetchProgress => _fetchProgress;

  // Fast lookup indexes to avoid duplicates (store compact phone keys and normalized names).
  final Set<String> _phoneIndex = <String>{};
  // Store full normalized digits for exact phone matches.
  final Set<String> _fullPhoneIndex = <String>{};
  final Set<String> _nameIndex = <String>{};
  // Map normalized name -> set of full phone digits observed for that name
  final Map<String, Set<String>> _nameToPhones = <String, Set<String>>{};

  /// Normalize a phone number to digits only for comparison.
  String _normalizePhone(String? phone) => (phone ?? '').replaceAll(RegExp(r'\D+'), '');

  /// Produce a compact phone key (last up-to-9 digits) for fast deduplication.
  String _phoneKey(String? phone) {
    final digits = _normalizePhone(phone);
    if (digits.isEmpty) return '';
    return digits.length > 9 ? digits.substring(digits.length - 9) : digits;
  }

  /// Normalize a name for comparison: lowercased, trimmed, remove punctuation
  /// and collapse whitespace.
  String _normalizeName(String name) {
    // keep only alphanumerics and spaces, collapse multiple spaces
    final cleaned = name.toLowerCase().replaceAll(RegExp(r'[^a-z0-9\s]'), ' ');
    return cleaned.replaceAll(RegExp(r'\s+'), ' ').trim();
  }

  /// Returns true if a contact with the same phone (preferred) or exact name
  /// already exists in the cached simple contacts. This helps avoid adding
  /// duplicates when processing incoming device contacts.
  bool contactExists({DeviceContact? contact, String? phone, String? fullName}) {
    final inputPhone = phone ?? contact?.phoneNumber;
    final inputDigits = _normalizePhone(inputPhone);
    final inputKey = _phoneKey(inputPhone);
    final inputNameRaw = (fullName ?? contact?.fullName ?? '').trim();
    final inputName = inputNameRaw.isNotEmpty ? _normalizeName(inputNameRaw) : '';

    // Prepare name token set for fuzzy comparisons (split on space)
    final Set<String> inputTokens = inputName.isNotEmpty
        ? inputName.split(' ').where((t) => t.isNotEmpty).toSet()
        : <String>{};

    // Prefer exact full-digit phone matches first (fast O(1)).
    if (inputDigits.isNotEmpty) {
      if (_fullPhoneIndex.contains(inputDigits)) return true;

      // Then try key-level matches (last up-to-9 digits).
      if (inputKey.isNotEmpty && _phoneIndex.contains(inputKey)) return true;

      // Fallback: try suffix matching against full phone index
      for (final existing in _fullPhoneIndex) {
        if (existing.isEmpty) continue;
        final minLen = (existing.length < inputDigits.length) ? existing.length : inputDigits.length;
        // relax threshold slightly to 6 to catch more matches across formatting/country code differences
        if (minLen >= 6) {
          if (existing.endsWith(inputDigits) || inputDigits.endsWith(existing)) return true;
        }
      }
    }

    // Name-based checks
    if (inputName.isNotEmpty) {
      // Exact normalized name match
      if (_nameIndex.contains(inputName)) return true;

      // If we have a name-to-phone mapping for this normalized name, check phone overlap
      final mappedPhones = _nameToPhones[inputName];
      if (mappedPhones != null && mappedPhones.isNotEmpty && inputDigits.isNotEmpty) {
        // if any mapped phone equals or suffix-matches inputDigits -> duplicate
        for (final mp in mappedPhones) {
          if (mp == inputDigits) return true;
          final minLen = (mp.length < inputDigits.length) ? mp.length : inputDigits.length;
          if (minLen >= 6 && (mp.endsWith(inputDigits) || inputDigits.endsWith(mp))) return true;
          // key-level fast check
          if (_phoneKey(mp).isNotEmpty && _phoneKey(mp) == inputKey) return true;
        }
      }

      // Fuzzy token intersection: if two or more name tokens overlap (e.g., first + last), treat as duplicate
      if (inputTokens.isNotEmpty) {
        for (final existing in _nameIndex) {
          final existingTokens = existing.split(' ').where((t) => t.isNotEmpty).toSet();
          final intersection = inputTokens.intersection(existingTokens);
          if (intersection.length >= 2) return true;
        }
      }
    }

    // If incoming contact has no phone, be more lenient and treat a single-token name overlap as a duplicate
    // This reduces duplicates for contacts where one entry has no phone but shares a name token.
    if (inputDigits.isEmpty && inputTokens.isNotEmpty) {
      for (final existing in _nameIndex) {
        final existingTokens = existing.split(' ').where((t) => t.isNotEmpty).toSet();
        final intersection = inputTokens.intersection(existingTokens);
        if (intersection.isNotEmpty) return true;
      }
    }

    return false;
  }

  /// Clears currently cached contacts so a future request will refetch from device.
  void clearContacts() {
    _contacts.clear();
    _simpleContacts.clear();
    _filteredContacts.clear();
    _permissionChecked = false;
    _permissionGranted = false;
    _fetchProgress = 0;

    // Clear the phone and name indexes
    _phoneIndex.clear();
    _fullPhoneIndex.clear();
    _nameIndex.clear();
    _nameToPhones.clear();

    notifyListeners();
  }

  /// Refresh the contacts from device. If [force] is false and contacts already
  /// exist, the refresh will be skipped. If [force] is true, a new fetch will occur.
  Future<void> refreshContacts({bool force = false}) async {
    if (!force && _simpleContacts.isNotEmpty) {
      debugPrint('Contacts already loaded (${_simpleContacts.length} contacts); skipping refresh.');
      // Ensure filtered contacts are set if they were cleared
      if (_filteredContacts.isEmpty && _simpleContacts.isNotEmpty) {
        _filteredContacts = _simpleContacts;
        notifyListeners();
      }
      return;
    }
    clearContacts();
    await requestAndFetchContacts();
  }

  /// Helper run in an isolate via `compute` to process a chunk of raw contacts
  /// represented as maps with keys: 'first', 'last', 'phone'. Returns a list of
  /// maps with 'fullName' and 'phones' (list of digits-only phone strings).
  static List<Map<String, dynamic>> _computeProcessContactChunk(List<dynamic> rawChunk) {
    String _digitsOnly(String? s) => (s ?? '').replaceAll(RegExp(r'\D+'), '');

    return rawChunk.map<Map<String, dynamic>>((dynamic item) {
      final Map<String, dynamic> map = Map<String, dynamic>.from(item as Map);
      final String first = (map['first'] as String?) ?? '';
      final String last = (map['last'] as String?) ?? '';
      final List<dynamic>? phones = map['phones'] as List<dynamic>?;
      final fullName = [first, last].where((s) => s.isNotEmpty).join(' ').trim();
      final List<String> cleanedPhones = (phones ?? []).map((p) => _digitsOnly(p as String?)).where((p) => p.isNotEmpty).toList();
      return {'fullName': fullName, 'phones': cleanedPhones};
    }).toList();
  }

  /// Runs in a background isolate: deduplicates the processed contact maps against
  /// provided index snapshots and returns the accepted candidates and the
  /// index additions (phone keys, full phones, names). This keeps heavy work
  /// off the main isolate.
  static Map<String, dynamic> _computeDeduplicateChunk(Map<String, dynamic> args) {
    // args contains: processed (List<Map>), phoneIndex (List<String>), fullPhoneIndex (List<String>), nameIndex (List<String>)
    final List<dynamic> processed = args['processed'] as List<dynamic>;
    final List<dynamic> phoneIndexList = args['phoneIndex'] as List<dynamic>;
    final List<dynamic> fullPhoneList = args['fullPhoneIndex'] as List<dynamic>;
    final List<dynamic> nameIndexList = args['nameIndex'] as List<dynamic>;

    final Set<String> phoneIndex = phoneIndexList.map((e) => e as String).toSet();
    final Set<String> fullPhoneIndex = fullPhoneList.map((e) => e as String).toSet();
    final Set<String> nameIndex = nameIndexList.map((e) => e as String).toSet();

    String normalizeName(String name) {
      final cleaned = name.toLowerCase().replaceAll(RegExp(r'[^a-z0-9\s]'), ' ');
      return cleaned.replaceAll(RegExp(r'\s+'), ' ').trim();
    }

    String digitsOnly(String? s) => (s ?? '').replaceAll(RegExp(r'\D+'), '');
    String phoneKey(String? phone) {
      final digits = digitsOnly(phone);
      if (digits.isEmpty) return '';
      return digits.length > 9 ? digits.substring(digits.length - 9) : digits;
    }

    final List<Map<String, String?>> accepted = <Map<String, String?>>[];
    final Set<String> addFullPhones = <String>{};
    final Set<String> addPhoneKeys = <String>{};
    final Set<String> addNames = <String>{};

    for (final item in processed) {
      final Map m = item as Map;
      final String fullName = ((m['fullName'] ?? '') as String).trim();
      final List<dynamic> phonesRaw = (m['phones'] as List<dynamic>? ) ?? <dynamic>[];
      final List<String> phonesDigits = phonesRaw.map((p) => digitsOnly(p as String?)).where((p) => p.isNotEmpty).toList();
      final String normalized = fullName.isNotEmpty ? normalizeName(fullName) : '';

      bool skip = false;
      // phone based checks
      if (phonesDigits.isNotEmpty) {
        for (final pd in phonesDigits) {
          if (pd.isEmpty) continue;
          if (fullPhoneIndex.contains(pd) || addFullPhones.contains(pd)) { skip = true; break; }
          final pk = phoneKey(pd);
          if (pk.isNotEmpty && (phoneIndex.contains(pk) || addPhoneKeys.contains(pk))) { skip = true; break; }
        }
        if (skip) continue;
      }

      // name-based checks
      if (normalized.isNotEmpty) {
        if (nameIndex.contains(normalized) || addNames.contains(normalized)) continue;
      } else {
        // if no name and no phone, skip
        if (phonesDigits.isEmpty) continue;
      }

      // accept candidate: pick first phone if present
      final String? chosen = phonesDigits.isNotEmpty ? phonesDigits.first : null;
      accepted.add({'fullName': fullName, 'phone': chosen});

      // record additions for indexes
      if (chosen != null && chosen.isNotEmpty) {
        addFullPhones.add(chosen);
        final pk = phoneKey(chosen);
        if (pk.isNotEmpty) addPhoneKeys.add(pk);
      }
      if (normalized.isNotEmpty) addNames.add(normalized);
    }

    return {
      'devices': accepted,
      'phoneKeys': addPhoneKeys.toList(),
      'fullPhones': addFullPhones.toList(),
      'names': addNames.toList(),
    };
  }

  Future<void> requestAndFetchContacts() async {
    // If we've already fetched simple contacts, don't fetch again.
    if (_simpleContacts.isNotEmpty) {
      debugPrint('Contacts already fetched; skipping fetch.');
      return;
    }

    // Prevent duplicate concurrent fetches.
    if (_isLoading) {
      debugPrint('Contacts fetch already in progress; skipping duplicate call.');
      return;
    }

    _isLoading = true;
    _fetchProgress = 0;
    notifyListeners();

    _permissionGranted = await FlutterContacts.requestPermission();
    _permissionChecked = true;

    // If permission not granted, stop here and notify listeners.
    if (!_permissionGranted) {
      _isLoading = false;
      notifyListeners();
      return;
    }

    if (_permissionGranted) {
      final fetched = await FlutterContacts.getContacts(
          withProperties: true,
          withAccounts: false,
          deduplicateProperties: true);
      _contacts = fetched;

      // Process contacts in chunks to avoid blocking the UI for large contact lists.
      _simpleContacts = [];
      _filteredContacts = [];

      try {
        const int chunkSize = 25; // adjust as needed based on device performance
        for (int start = 0; start < fetched.length; start += chunkSize) {
          if (!_isLoading) break; // allow early exit if loading flag changed elsewhere
          final int end = (start + chunkSize) < fetched.length ? (start + chunkSize) : fetched.length;
          final slice = fetched.sublist(start, end);

          // Build a lightweight serializable representation of the slice to pass to `compute`.
          final rawSlice = slice.map((contact) {
            return {
              'first': contact.name.first,
              'last': contact.name.last,
              // pass all phone numbers for deduplication
              'phones': contact.phones.map((p) => p.number).toList(),
            };
          }).toList();

          // Process the slice in a background isolate.
          final processed = await compute(_computeProcessContactChunk, rawSlice);

          // Offload deduplication and candidate building to an isolate for this chunk.
          final dedupeArgs = {
            'processed': processed,
            'phoneIndex': _phoneIndex.toList(),
            'fullPhoneIndex': _fullPhoneIndex.toList(),
            'nameIndex': _nameIndex.toList(),
          };

          final Map<String, dynamic> dedupeResult = await compute(_computeDeduplicateChunk, dedupeArgs);

          final List<dynamic> devices = dedupeResult['devices'] as List<dynamic>;
          final List<dynamic> newPhoneKeys = dedupeResult['phoneKeys'] as List<dynamic>;
          final List<dynamic> newFullPhones = dedupeResult['fullPhones'] as List<dynamic>;
          final List<dynamic> newNames = dedupeResult['names'] as List<dynamic>;

          // Convert returned device maps to DeviceContact instances and append
          final List<DeviceContact> chunkDevices = devices.map<DeviceContact>((d) {
            final Map dd = d as Map;
            final String fn = (dd['fullName'] as String?)?.trim() ?? '';
            final String? ph = (dd['phone'] as String?)?.trim();
            return DeviceContact(fullName: fn, phoneNumber: ph);
          }).toList();

          _simpleContacts.addAll(chunkDevices);
          _filteredContacts = _simpleContacts;

          for (final k in newPhoneKeys) {
            if ((k as String).isNotEmpty) _phoneIndex.add(k);
          }
          for (final f in newFullPhones) {
            if ((f as String).isNotEmpty) _fullPhoneIndex.add(f);
          }
          for (final n in newNames) {
            final nameStr = (n as String);
            if (nameStr.isEmpty) continue;
            _nameIndex.add(nameStr);
            final set = _nameToPhones.putIfAbsent(nameStr, () => <String>{});
            for (final f in newFullPhones) {
              final fs = f as String;
              if (fs.isNotEmpty) set.add(fs);
            }
          }

          // Update progress and notify listeners after each chunk so the UI can render progress.
          _fetchProgress = (((start + chunkDevices.length) * 100) / fetched.length).round();
          if (_fetchProgress > 100) _fetchProgress = 100;
          notifyListeners();

          // Yield to the event loop / UI thread to avoid janking.
          await Future.delayed(const Duration(milliseconds: 16));
        }
      } catch (e, st) {
        debugPrint('Error processing contacts: $e\n$st');
      }

      _fetchProgress = 100;
      debugPrint("FOUND ${_simpleContacts.length} CONTACTS IN DEVICE");
    }
    _isLoading = false;
    notifyListeners();
  }

  // Timer for debouncing search
  Timer? _searchDebounce;

  void searchContacts(String query) {
    // Cancel previous timer if exists
    _searchDebounce?.cancel();

    // Debounce search by 300ms to avoid excessive filtering
    _searchDebounce = Timer(const Duration(milliseconds: 300), () {
      if (query.isEmpty) {
        _filteredContacts = _simpleContacts;
      } else {
        _filteredContacts = _simpleContacts.where((contact) {
          final nameLower = contact.fullName.toLowerCase();
          final phoneLower = contact.phoneNumber?.toLowerCase() ?? '';
          final queryLower = query.toLowerCase();
          return nameLower.contains(queryLower) || phoneLower.contains(queryLower);
        }).toList();
      }
      notifyListeners();
    });
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    super.dispose();
  }

  /// Reset any active search/filter and restore the filtered list to the
  /// full cached contacts list. Call this when leaving a screen that may
  /// have applied a search so the next time the contacts UI opens it shows
  /// the full list.
  void resetSearch() {
    _filteredContacts = _simpleContacts;
    notifyListeners();
  }

  /// Find index of an existing contact in `_simpleContacts` by matching any of
  /// the provided full-digit phone numbers using full-phone, key or suffix logic.
  int _indexByPhones(List<String> phonesDigits) {
    if (phonesDigits.isEmpty) return -1;
    for (int i = 0; i < _simpleContacts.length; i++) {
      final c = _simpleContacts[i];
      final cDigits = _normalizePhone(c.phoneNumber);
      if (cDigits.isEmpty) continue;
      for (final pd in phonesDigits) {
        if (pd.isEmpty) continue;
        if (cDigits == pd) return i;
        final minLen = (cDigits.length < pd.length) ? cDigits.length : pd.length;
        if (minLen >= 6) {
          if (cDigits.endsWith(pd) || pd.endsWith(cDigits)) return i;
        }
        final pk = _phoneKey(pd);
        final cpk = _phoneKey(c.phoneNumber);
        if (pk.isNotEmpty && cpk.isNotEmpty && pk == cpk) return i;
      }
    }
    return -1;
  }

  /// Find index of an existing contact by name-token overlap (>=2 tokens).
  int _indexByNameTokens(Set<String> tokens) {
    if (tokens.isEmpty) return -1;
    for (int i = 0; i < _simpleContacts.length; i++) {
      final n = _simpleContacts[i].fullName;
      if (n.isEmpty) continue;
      final existingTokens = _normalizeName(n).split(' ').where((t) => t.isNotEmpty).toSet();
      final intersection = tokens.intersection(existingTokens);
      if (intersection.length >= 2) return i;
    }
    return -1;
  }

  /// Merge phone numbers and name into an existing contact at [index]. Updates
  /// indexes accordingly.
  void _mergeIntoExisting(int index, String fullName, List<String> phonesDigits) {
    final existing = _simpleContacts[index];
    final existingAmount = existing.amountToSend;
    // Prefer keeping the existing fullName when available, otherwise use incoming
    final mergedFullName = existing.fullName.isNotEmpty ? existing.fullName : fullName;
    // Determine merged phone: prefer existing phone, otherwise first incoming
    String? mergedPhone = (existing.phoneNumber != null && existing.phoneNumber!.isNotEmpty) ? existing.phoneNumber : (phonesDigits.isNotEmpty ? phonesDigits.first : null);

    // Create a new DeviceContact (fields are final) and preserve amountToSend
    final merged = DeviceContact(fullName: mergedFullName, phoneNumber: mergedPhone, amountToSend: existingAmount);
    _simpleContacts[index] = merged;

    // Update indexes with any new phones
    for (final pd in phonesDigits) {
      if (pd.isEmpty) continue;
      final pk = _phoneKey(pd);
      _fullPhoneIndex.add(pd);
      if (pk.isNotEmpty) _phoneIndex.add(pk);
      // also map into name->phones
      final nameKey = _normalizeName(merged.fullName);
      if (nameKey.isNotEmpty) {
        final set = _nameToPhones.putIfAbsent(nameKey, () => <String>{});
        set.add(pd);
      }
    }
  }
}
