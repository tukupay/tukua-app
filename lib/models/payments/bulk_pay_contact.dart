import 'package:tuku/models/contact/contact.dart';

class BulkPayContact {
  final Contact? contact;
  final DeviceContact? deviceContact;

  BulkPayContact({this.contact, this.deviceContact});

  String get name {
    if (contact != null) {
      return contact!.name;
    }
    return deviceContact!.fullName;
  }

  String? get phone {
    if (contact != null) {
      return contact!.phone;
    }
    return deviceContact!.phoneNumber;
  }

  int get amountToSend{
    if (contact != null) {
      return contact!.amountToSend??0;
    }
    return deviceContact!.amountToSend??0;
  }



  // Add an equality operator to help with list operations like `contains` and `remove`.
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is BulkPayContact &&
          runtimeType == other.runtimeType &&
          contact == other.contact &&
          deviceContact == other.deviceContact;

  @override
  int get hashCode => contact.hashCode ^ deviceContact.hashCode;
}
