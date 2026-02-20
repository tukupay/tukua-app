import 'package:tuku/constants/constants.dart';

class Loan{
  String icon;
  String type;
  String name;
  String paymentUsed;
  String transactionId;
  int time;
  int amount;
  bool completed;

  Loan({
    required this.icon,
    required this.type,
    required this.name,
    required this.paymentUsed,
    required this.transactionId,
    required this.time,
    required this.amount,
    required this.completed
});
}

List<String> loanTypes=[
  'Emergency Loan',
  'Short Term',
  'Long Term'
];

List<Loan> loanHistory=[
  Loan(
      icon: Strings.iconImage('school.png'),
      type: 'Quick Loan',
      name: 'School Loan',
      paymentUsed: 'Tuku Wallet',
      transactionId: '698094554317',
      time: 1729161339000,
      amount: 4050,
      completed: false),
  Loan(
      icon: Strings.iconImage('quickloan.png'),
      type: 'Quick Loan',
      name: 'Quick Loan',
      paymentUsed: 'Mpesa',
      transactionId: '564925374920',
      time: 1729161339000,
      amount: 7050,
      completed: true),
  Loan(
      icon: Strings.iconImage('coop.png'),
      type: 'Quick Loan',
      name: 'Bank Loan',
      paymentUsed: 'Tuku Wallet',
      transactionId: '685746354219',
      time: 1729161339000,
      amount: 3050,
      completed: true),
  Loan(
      icon: Strings.iconImage('quickloan.png'),
      type: 'Quick Loan',
      name: 'Quick Loan',
      paymentUsed: 'Mpesa',
      transactionId: '564925374920',
      time: 1729161339000,
      amount: 7050,
      completed: true),
  Loan(
      icon: Strings.iconImage('coop.png'),
      type: 'Quick Loan',
      name: 'Bank Loan',
      paymentUsed: 'Tuku Wallet',
      transactionId: '685746354219',
      time: 1729161339000,
      amount: 3050,
      completed: true),
  Loan(
      icon: Strings.iconImage('quickloan.png'),
      type: 'Quick Loan',
      name: 'Quick Loan',
      paymentUsed: 'Mpesa',
      transactionId: '564925374920',
      time: 1729161339000,
      amount: 11000,
      completed: true),
  Loan(
      icon: Strings.iconImage('coop.png'),
      type: 'Quick Loan',
      name: 'Bank Loan',
      paymentUsed: 'Tuku Wallet',
      transactionId: '685746354219',
      time: 1729161339000,
      amount: 8000,
      completed: true),
];