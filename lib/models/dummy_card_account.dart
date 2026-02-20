class CardAccount{
  String cardHolder;
  String cardNumber;
  String expiry;
  String type;
  int balance;

  CardAccount({
    required this.cardHolder,
    required this.cardNumber,
    required this.expiry,
    required this.type,
    required this.balance
});
}

List<CardAccount> dummyDebitCards=[
  CardAccount(
      cardHolder: 'Teddy Karanja Mbugua',
      cardNumber: '1234 4567 8901',
      expiry: '01/23',
      type: 'Personal',
      balance: 150000),
  CardAccount(
      cardHolder: 'Teddy Karanja Mbugua',
      cardNumber: '1234 4567 8901',
      expiry: '01/23',
      type: 'Personal',
      balance: 150000)
];