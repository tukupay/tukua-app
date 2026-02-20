class Wallet{
  int userId;
  int appId;
  String? currency;
  String? msgReference;
  String? walletType;
  String? purpose;
  int id;
  int balance;
  bool isActive;
  String accountId;
  String accountNumber;
  String customerNumber;
  String createdAt;
  String updatedAt;
  int createdBy;

  Wallet({
    required this.userId,
    required this.appId,
    this.currency,
    this.msgReference,
    this.walletType,
    this.purpose,
    required this.id,
    required this.balance,
    required this.isActive,
    required this.accountId,
    required this.accountNumber,
    required this.customerNumber,
    required this.createdAt,
    required this.updatedAt,
    required this.createdBy
});

  factory Wallet.fromJson(Map<String,dynamic> json)=>
      Wallet(
        userId: json['user_id'],
        appId: json['app_id'],
        currency: json['currency'],
        msgReference: json['message_reference'],
        walletType: json['wallet_type'],
        purpose: json['purpose_tag'],
        id: json['id'],
        balance: json['balance'],
        isActive: json['is_active'],
        accountId: json['account_id'],
        accountNumber: json['account_number'],
        customerNumber: json['customer_number'],
        createdAt: json['created_at'],
        updatedAt: json['updated_at'],
        createdBy: json['created_by']
      );
}

final wallet1 = Wallet(
  userId: 101,
  appId: 1,
  currency: 'KES',
  msgReference: 'REF123456',
  walletType: 'personal',
  purpose: 'savings',
  id: 1,
  balance: 10000,
  isActive: true,
  accountId: 'ACCT001',
  accountNumber: '000111222',
  customerNumber: 'CUST001',
  createdAt: '2025-01-01T10:00:00Z',
  updatedAt: '2025-06-01T12:00:00Z',
  createdBy: 999,
);

final wallet2 = Wallet(
  userId: 102,
  appId: 2,
  currency: 'KES',
  msgReference: 'REF654321',
  walletType: 'business',
  purpose: 'payment',
  id: 2,
  balance: 25000,
  isActive: false,
  accountId: 'ACCT002',
  accountNumber: '000222333',
  customerNumber: 'CUST002',
  createdAt: '2025-02-10T09:30:00Z',
  updatedAt: '2025-06-15T08:45:00Z',
  createdBy: 998,
);

final wallet3 = Wallet(
  userId: 103,
  appId: 3,
  currency: 'KES',
  msgReference: 'REF789012',
  walletType: 'personal',
  purpose: 'investment',
  id: 3,
  balance: 7500,
  isActive: true,
  accountId: 'ACCT003',
  accountNumber: '000333444',
  customerNumber: 'CUST003',
  createdAt: '2025-03-05T14:00:00Z',
  updatedAt: '2025-07-01T11:00:00Z',
  createdBy: 997,
);

final wallet4 = Wallet(
  userId: 104,
  appId: 4,
  currency: 'KES',
  msgReference: 'REF345678',
  walletType: 'corporate',
  purpose: 'operations',
  id: 4,
  balance: 40000,
  isActive: true,
  accountId: 'ACCT004',
  accountNumber: '000444555',
  customerNumber: 'CUST004',
  createdAt: '2025-04-20T13:15:00Z',
  updatedAt: '2025-07-02T16:30:00Z',
  createdBy: 996,
);
