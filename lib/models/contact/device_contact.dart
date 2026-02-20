class DeviceContact {
  final String fullName;
  final String? phoneNumber;
  int? amountToSend; // flag for bulk pay

  DeviceContact({
    required this.fullName,
    this.phoneNumber,
    this.amountToSend,
  });
}
