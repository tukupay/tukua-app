class PledgeRequest {
  final String pledgerName;
  final String pledgerEmail;
  final String pledgerPhone;
  final double amount;
  final String? message;
  final bool? forAnonymous;

  PledgeRequest({
    required this.pledgerName,
    required this.pledgerEmail,
    required this.pledgerPhone,
    required this.amount,
    this.message,
    this.forAnonymous=false,
  });

  // Method to convert an instance of PledgeRequest to a JSON map
  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = {
      'amount': amount,
      'pledger_name': pledgerName,
      'pledger_email': pledgerEmail,
      'pledger_phone':  pledgerPhone,
      'message': message,
      'for_anonymous': forAnonymous,
    };
    return data;
  }
}
