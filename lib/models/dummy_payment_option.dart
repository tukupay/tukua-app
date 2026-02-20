import 'package:tuku/constants/constants.dart';
class DummyPaymentOption{
  String key;
  String icon;
  String name;
  String hint;
  int? cost;
  String? accountNumber;
  int? paybill;
  
  DummyPaymentOption({
    required this.key,
    required this.icon,
    required this.name,
    required this.hint,
    this.cost,
    this.accountNumber
});
}

List<DummyPaymentOption> dummyTopUpMethods=[
  DummyPaymentOption(
    key:'mpesa',
      icon: Strings.iconImage('mpesa.png'), 
      name: Strings.mpesa,
      cost: 10,
      hint: 'Mpesa charges apply'),
  DummyPaymentOption(
    key: 'tukupay_wallet',
      icon: Strings.iconImage('tuku.png'),
      name: Strings.tuku,
      cost: 0,
      hint: 'Free Top Up'),
  // PaymentOption(
  //     icon: Strings.iconImage('jirani.png'),
  //     name: Strings.agent,
  //     cost: 0,
  //     hint: 'Free Top Up'),
  DummyPaymentOption(
    key: 'card',
      icon: Strings.iconImage('card.jpg'),
      name: Strings.card,
      cost: 14,
      hint: 'Visa card charges apply'),
  DummyPaymentOption(
    key: 'bank',
      icon: Strings.iconImage('bank.webp'),
      name: Strings.bank,
      cost: 16,
      hint: 'Bank Charges Apply'),
];

List<DummyPaymentOption> dummyCoops=[
  DummyPaymentOption(
      key: 'bank',
      icon: Strings.iconImage('coop.png'),
      name: 'MAIN ACC',
      hint: 'Free Top Up',
      accountNumber: '2526 7838 9230'),
  DummyPaymentOption(
      key: 'bank',
      icon: Strings.iconImage('coop.png'),
      name: 'SAVINGS ACC',
      hint: 'Free Top Up',
      accountNumber: '5226 3878 0239'),
  DummyPaymentOption(
      key: 'bank',
      icon: Strings.iconImage('coop.png'),
      name: 'BUSINESS ACC',
      hint: 'Free Top Up',
      accountNumber: '2256 8378 2093'),
  DummyPaymentOption(
      key: 'bank',
      icon: Strings.iconImage('coop.png'),
      name: 'CRUCIAL SAVINGS',
      hint: 'Free Top Up',
      accountNumber: '5622 8837 2039')
];

List<DummyPaymentOption> dummyCards=[
  DummyPaymentOption(
      key: 'card',
      icon: Strings.iconImage('visa.png'),
      name: 'CARD 1',
      hint: 'Visa card charges apply',
      cost: 10,
      accountNumber: '9230 7838 6252'),
  DummyPaymentOption(
      key: 'card',
      icon: Strings.iconImage('cards.png'),
      name: 'CARD 2',
      cost: 13,
      hint: 'Card charges apply',
      accountNumber: '8387 0329 2562'),
  DummyPaymentOption(
      key: 'card',
      icon: Strings.iconImage('mastercard.png'),
      name: 'CARD 3',
      cost: 11,
      hint: 'Mastercard charges apply',
      accountNumber: '0923 8387 2625'),
  DummyPaymentOption(
      key: 'card',
      icon: Strings.iconImage('cardalt.png'),
      name: 'CARD 4',
      hint: 'Card charges apply',
      cost: 10,
      accountNumber: '5262 0392 3788')
];

List<DummyPaymentOption> dummyBanks=[
  DummyPaymentOption(
      key: 'bank',
      icon: Strings.iconImage('stanbic.png'),
      name: 'Stanbic Bank',
      hint: 'Bank charges apply',
      cost: 13,
      accountNumber: '8960267530'),
  DummyPaymentOption(
      key: 'bank',
      icon: Strings.iconImage('kcb.png'),
      name: 'KCB',
      hint: 'Bank charges apply',
      cost: 11,
      accountNumber: '1266351848'),
  DummyPaymentOption(
      key: 'bank',
      icon: Strings.iconImage('equity.png'),
      name: 'Equity Bank',
      cost: 7,
      hint: 'Bank charges apply',
      accountNumber: '7765034001'),
  DummyPaymentOption(
      key: 'bank',
      icon: Strings.iconImage('absa.png'),
      name: 'ABSA',
      cost: 12,
      hint: 'Bank charges apply',
      accountNumber: '8883017002')
];

List<DummyPaymentOption> dummySendMethods=[
  DummyPaymentOption(
      key: 'mpesa',
      icon: Strings.iconImage('mpesa.png'),
      name: Strings.mpesa,
      cost: 13,
      hint: 'Mpesa charges apply'),
  DummyPaymentOption(
      key: 'tukupay_wallet',
      icon: Strings.iconImage('tuku.png'),
      name: Strings.tuku,
      cost: 4,
      hint: 'Free Transaction'),
  DummyPaymentOption(
    key: 'bank',
      icon: Strings.iconImage('bank.webp'),
      name: Strings.bank,
      cost: 14,
      hint: 'Bank Charges Apply')
];

List<DummyPaymentOption> dummyLipaMpesa=[
  DummyPaymentOption(
      key: 'mpesa',
      icon: Strings.iconImage('paybill.jpeg'),
      name: Strings.paybill,
      hint: 'Mpesa Charges Apply'),
  DummyPaymentOption(
      key: 'mpesa',
      icon: Strings.iconImage('buygoods.jpeg'),
      name: Strings.buyGoods,
      hint: 'Mpesa Charges Apply')
];
