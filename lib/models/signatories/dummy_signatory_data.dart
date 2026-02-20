/// Dummy signatory data for demo/development
/// Models for pending requests, invitations, and history

class DummySignatoryRequest {
  final int id;
  final String walletName;
  final String type;
  final double? amount;
  final String requestedBy;
  final DateTime requestedAt;
  final String status;

  const DummySignatoryRequest({
    required this.id,
    required this.walletName,
    required this.type,
    this.amount,
    required this.requestedBy,
    required this.requestedAt,
    required this.status,
  });

  Map<String, dynamic> toMap() => {
    'id': id,
    'wallet_name': walletName,
    'type': type,
    'amount': amount,
    'requested_by': requestedBy,
    'requested_at': requestedAt,
    'status': status,
  };
}

class DummySignatoryInvitation {
  final int id;
  final String walletName;
  final String role;
  final String invitedBy;
  final DateTime invitedAt;

  const DummySignatoryInvitation({
    required this.id,
    required this.walletName,
    required this.role,
    required this.invitedBy,
    required this.invitedAt,
  });

  Map<String, dynamic> toMap() => {
    'id': id,
    'wallet_name': walletName,
    'role': role,
    'invited_by': invitedBy,
    'invited_at': invitedAt,
  };
}

class DummySignatoryHistory {
  final int id;
  final String walletName;
  final String type;
  final double? amount;
  final String? role;
  final String requestedBy;
  final DateTime processedAt;
  final String status;

  const DummySignatoryHistory({
    required this.id,
    required this.walletName,
    required this.type,
    this.amount,
    this.role,
    required this.requestedBy,
    required this.processedAt,
    required this.status,
  });

  Map<String, dynamic> toMap() => {
    'id': id,
    'wallet_name': walletName,
    'type': type,
    'amount': amount,
    'role': role,
    'requested_by': requestedBy,
    'processed_at': processedAt,
    'status': status,
  };
}

// ─── Dummy Data ───────────────────────────────────────────────────────

List<DummySignatoryRequest> dummyPendingRequests = [
  DummySignatoryRequest(
    id: 1,
    walletName: 'Business Wallet',
    type: 'withdrawal',
    amount: 50000.0,
    requestedBy: 'John Doe',
    requestedAt: DateTime.now().subtract(const Duration(hours: 2)),
    status: 'pending',
  ),
  DummySignatoryRequest(
    id: 2,
    walletName: 'Savings Account',
    type: 'transfer',
    amount: 25000.0,
    requestedBy: 'Jane Smith',
    requestedAt: DateTime.now().subtract(const Duration(days: 1)),
    status: 'pending',
  ),
];

List<DummySignatoryInvitation> dummyPendingInvitations = [
  DummySignatoryInvitation(
    id: 1,
    walletName: 'Family Savings',
    role: 'signatory',
    invitedBy: 'Moses Karani',
    invitedAt: DateTime.now().subtract(const Duration(hours: 5)),
  ),
];

List<DummySignatoryHistory> dummySignatoryHistory = [
  DummySignatoryHistory(
    id: 1,
    walletName: 'Business Wallet',
    type: 'withdrawal',
    amount: 10000.0,
    requestedBy: 'John Doe',
    processedAt: DateTime.now().subtract(const Duration(days: 3)),
    status: 'approved',
  ),
  DummySignatoryHistory(
    id: 2,
    walletName: 'Savings Account',
    type: 'invitation',
    role: 'viewer',
    requestedBy: 'Jane Smith',
    processedAt: DateTime.now().subtract(const Duration(days: 7)),
    status: 'rejected',
  ),
];

