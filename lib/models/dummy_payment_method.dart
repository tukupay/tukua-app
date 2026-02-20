class DummyPaymentMethod{
  String method;
  String? phoneNumber;
  String? accountNumber;
  String? branch;
  String? walletNumber;
  String? cardName;
  String? cardNumber;

  DummyPaymentMethod({
    required this.method,
    this.phoneNumber,
    this.accountNumber,
    this.branch,
    this.walletNumber,
    this.cardName,
    this.cardNumber
  });
}

List<DummyPaymentMethod> dummyPaymentMethods=[
  DummyPaymentMethod(method: 'Tuku Pay Wallet',
      walletNumber: '384783282938'),
  DummyPaymentMethod(method: 'Mpesa',
      phoneNumber: '+254789398490'),
  DummyPaymentMethod(method: 'Bank',
      accountNumber: '384783282938',
      branch: 'Coop Bank, Eldoret Branch'),
  DummyPaymentMethod(
      method: 'Card',
      cardName: 'Teddy Karanja Mbugua',
      cardNumber: '8943 8484 6103 4893')
];