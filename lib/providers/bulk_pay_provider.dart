import 'package:flutter/foundation.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/repository/repository.dart';
import 'package:tuku/services/services.dart';

class BulkPayProvider extends ChangeNotifier {
  ContactGroupResponse? _selectedGroup;
  ContactGroupResponse? get selectedGroup => _selectedGroup;

  bool _loadingContacts = false;
  bool get loadingContacts => _loadingContacts;

  // Date range helper for transaction fetching
  DateTime _dateOnly([int daysAgo = 0]) {
    final now = DateTime.now().subtract(Duration(days: daysAgo));
    return DateTime(now.year, now.month, now.day);
  }
  DateTime get start => _dateOnly(90);
  DateTime get end => _dateOnly();

  FullGroup? _groupContacts;
  FullGroup? get groupContacts => _groupContacts;

  List<BulkPayContact> _selectedContacts = [];
  List<BulkPayContact> get selectedContacts => _selectedContacts;

  bool _selectAll = false;
  bool get selectAll => _selectAll;

  bool _sameAmount = false;
  bool get sameAmount => _sameAmount;

  int _totalAmount = 0;
  int get totalAmount => _totalAmount;

  FullWallet? _selectedWallet;
  FullWallet? get selectedWallet => _selectedWallet;

  String? _message;
  String? get message => _message;

  bool _isSending = false;
  bool get isSending => _isSending;

  BulkPayResponse? _bulkPayResponse;
  BulkPayResponse? get bulkPayResponse => _bulkPayResponse;

  bool _loadingTransactions = false;
  bool get loadingTransactions => _loadingTransactions;

  // --- Pagination State ---
  int _currentPage=1;
  bool _hasMorePages=true;
  bool _loadingMore=false;
  bool get loadingMore=>_loadingMore;

  List<BulkTransaction> _bulkTransactions = [];
  List<BulkTransaction> get bulkTransactions => _bulkTransactions;

  BulkTransaction? _selectedTransaction;
  BulkTransaction? get selectedTransaction => _selectedTransaction;

  // --- Repositories ---
  ContactsRepository contactsApi = ContactsService();
  PaymentsRepository paymentsApi = PaymentsService();
  TransactionsRepository transactionsApi = TransactionsService();


  Future<void> selectGroup(ContactGroupResponse group) async {
    if (_selectedGroup != group) {
      _selectedGroup = group;
      _groupContacts?.contacts?.clear();
      _groupContacts = null;
      if (_selectedContacts.isNotEmpty) {
        _selectedContacts.clear();
      }
      _loadingContacts = true;
      notifyListeners();
      final list = await contactsApi.listGroupContacts(_selectedGroup!.id!);
      _groupContacts = list;
      _loadingContacts = false;
      notifyListeners();
    }
  }

  void resetSelected() {
    _groupContacts?.contacts?.clear();
    _groupContacts = null;
    _selectedGroup = null;
    _selectedContacts.clear();
    _totalAmount = 0;
    _selectAll = false;
    _selectedWallet = null;
    notifyListeners();
  }

  void selectContact(BulkPayContact contact) {
    if (_selectedContacts.contains(contact)) {
      _selectedContacts.remove(contact);
      if (_selectAll) {
        _selectAll = false;
      }
    } else {
      _selectedContacts.add(contact);
    }
    notifyListeners();
  }

  void selectAllContacts() {
    if (_selectAll == false) {
      _selectAll = true;
      _selectedContacts.clear();
      _selectedContacts.addAll(
          _groupContacts?.contacts?.map((c) => BulkPayContact(contact: c)) ??
              []);
    } else {
      _selectAll = false;
      _selectedContacts.clear();
    }
    notifyListeners();
  }

  void setSameAmount(bool val) {
    _sameAmount = !_sameAmount;
    _totalAmount = 0;
    resetContactAmounts();
    notifyListeners();
  }

  void resetContactAmounts() {
    for (var contact in _selectedContacts) {
      if (contact.contact != null) {
        contact.contact!.amountToSend = 0;
      } else if (contact.deviceContact != null) {
        contact.deviceContact!.amountToSend = 0;
      }
    }
    _totalAmount=0;
    notifyListeners();
  }

  // Future<void> getContacts() async {
  //   _loadingContacts = true;
  //   notifyListeners();
  //   if (_contacts.isEmpty) {
  //     _contacts = await contactsApi.getContacts();
  //   }
  //   _loadingContacts = false;
  //   notifyListeners();
  // }

  void setMessage(String title) {
    _message = title;
    notifyListeners();
  }

  void selectWallet(FullWallet wallet) {
    _selectedWallet = wallet;
    notifyListeners();
  }

  void setAmount(BulkPayContact? contact, int amount) {
    if (contact != null) {
      // Update single contact: adjust total by the difference between new and previous amount
      final int previous = contact.amountToSend;
      if (contact.contact != null) {
        contact.contact!.amountToSend = amount;
      } else if (contact.deviceContact != null) {
        contact.deviceContact!.amountToSend = amount;
      }
      _totalAmount += (amount - previous);
    } else {
      // Set amount for all selected contacts (when contact is null)
      final int count = _selectedContacts.length;
      if (count == 0) {
        _totalAmount = 0;
      } else {
        for (var c in _selectedContacts) {
          if (c.contact != null) {
            c.contact!.amountToSend = amount;
          } else if (c.deviceContact != null) {
            c.deviceContact!.amountToSend = amount;
          }
        }
        _totalAmount = amount * count;
      }
    }
    notifyListeners();
  }

  /// Returns true if the provided [deviceContact] is currently selected
  /// in the bulk pay selection list. Comparison uses phone number and full name
  /// to avoid relying on object identity.
  bool isDeviceContactSelected(DeviceContact deviceContact) {
    return _selectedContacts.any((c) {
      final dc = c.deviceContact;
      if (dc == null) return false;
      final phoneA = (dc.phoneNumber ?? '').replaceAll(' ', '').trim();
      final phoneB =
          (deviceContact.phoneNumber ?? '').replaceAll(' ', '').trim();
      final nameA = dc.fullName.trim();
      final nameB = deviceContact.fullName.trim();
      return phoneA.isNotEmpty && phoneA == phoneB && nameA == nameB;
    });
  }

  /// Toggle selection for a device contact. If already selected it will be removed,
  /// otherwise it will be added. This avoids constructing temporary BulkPayContact
  /// instances for comparisons in the UI.
  void toggleDeviceContact(DeviceContact deviceContact) {
    final idx = _selectedContacts.indexWhere((c) {
      final dc = c.deviceContact;
      if (dc == null) return false;
      final phoneA = (dc.phoneNumber ?? '').replaceAll(' ', '').trim();
      final phoneB =
          (deviceContact.phoneNumber ?? '').replaceAll(' ', '').trim();
      final nameA = dc.fullName.trim();
      final nameB = deviceContact.fullName.trim();
      return phoneA.isNotEmpty && phoneA == phoneB && nameA == nameB;
    });

    if (idx >= 0) {
      _selectedContacts.removeAt(idx);
      if (_selectAll) _selectAll = false;
    } else {
      _selectedContacts.add(BulkPayContact(deviceContact: deviceContact));
    }
    notifyListeners();
  }

  /// Add manually inputted phone numbers as device contacts
  void addManualPhoneNumbers(List<String> phoneNumbers) {
    for (String phone in phoneNumbers) {
      // Check if phone number already exists
      final exists = _selectedContacts.any((c) {
        final dc = c.deviceContact;
        if (dc == null) return false;
        final phoneA = (dc.phoneNumber ?? '').replaceAll(' ', '').trim();
        final phoneB = phone.replaceAll(' ', '').trim();
        return phoneA == phoneB;
      });

      if (!exists) {
        // Create a DeviceContact for the manually entered phone number
        final deviceContact = DeviceContact(
          fullName: phone, // Use phone as name for manual entries
          phoneNumber: phone,
          amountToSend: 0,
        );
        _selectedContacts.add(BulkPayContact(deviceContact: deviceContact));
      }
    }
    notifyListeners();
  }

  /// Remove a specific contact by index
  void removeContactAtIndex(int index) {
    if (index >= 0 && index < _selectedContacts.length) {
      final contact = _selectedContacts[index];
      // Deduct the amount from total
      _totalAmount -= contact.amountToSend;
      _selectedContacts.removeAt(index);
      if (_selectAll && _selectedContacts.isEmpty) {
        _selectAll = false;
      }
      notifyListeners();
    }
  }

  /// Update phone number for manually entered contact
  void updateManualPhoneNumber(int index, String newPhoneNumber) {
    if (index >= 0 && index < _selectedContacts.length) {
      final contact = _selectedContacts[index];
      if (contact.deviceContact != null) {
        // Create a new DeviceContact with updated phone
        final updatedContact = DeviceContact(
          fullName: newPhoneNumber,
          phoneNumber: newPhoneNumber,
          amountToSend: contact.deviceContact!.amountToSend,
        );
        _selectedContacts[index] = BulkPayContact(deviceContact: updatedContact);
        notifyListeners();
      }
    }
  }

  Future<void> bulkSend({
    required int sourceWalletId,
    required String destinationType,
  }) async {
    _isSending = true;
    notifyListeners();

    List<BulkRecipient> recipients = [];
    for (var bulkContact in _selectedContacts) {
      int? amountToSend;
      String? phoneNumber;

      if (bulkContact.contact != null) {
        amountToSend = bulkContact.amountToSend;
        phoneNumber = bulkContact.contact!.phone;
      } else if (bulkContact.deviceContact != null) {
        amountToSend = bulkContact.amountToSend;
        phoneNumber = bulkContact.deviceContact!.phoneNumber;
      }

      if (amountToSend != null && amountToSend > 0 && phoneNumber != null) {
        recipients.add(BulkRecipient(
            amount: amountToSend.toDouble(),
            phoneNumber: convertToLocalKenyanFormat(phoneNumber)!,
            message: _message));
      }
    }

    if (recipients.isEmpty) {
      Fluttertoast.showToast(msg: "No recipients with a valid amount to send.");
      _isSending = false;
      notifyListeners();
      return;
    }

    final request = BulkPayRequest(
      amount: _totalAmount.toDouble(),
      destinationType: destinationType,
      recipients: recipients,
      sourceWalletId: sourceWalletId,
      transactionType: Strings.bulkTransfer,
    );
    _bulkPayResponse = await paymentsApi.bulkTransfer(request);
    _isSending = false;
    notifyListeners();
  }

  Future<void> getBulkTransactions({bool isRefresh=false})async{
    if(isRefresh){
      _currentPage=1;
      _bulkTransactions=[];
      _hasMorePages=true;
      _loadingTransactions=true;
    }else{
      if(_loadingMore || !_hasMorePages) return;
      _loadingMore = true;
    }
    notifyListeners();

    final offset = (_currentPage - 1) * 15;
    final resp=await transactionsApi.getBulkTransactions(offset, start, end);

    if(resp.error!=null){
      Fluttertoast.showToast(msg: resp.error!);
    }else{
      _bulkTransactions.addAll(resp.transactions??[]);
      _hasMorePages=resp.hasMore??false;
      if(resp.transactions?.isNotEmpty??false){
        _currentPage++;
      }
    }
    if(isRefresh){
      _loadingTransactions=false;
    }else{
      _loadingMore=false;
    }
    notifyListeners();
  }

  void selectTransaction(BulkTransaction transaction){
    _selectedTransaction=transaction;
    notifyListeners();
  }
}
