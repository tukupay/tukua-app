import '../models.dart';

class TransactionMetadata {
  final String? paymentMethod;
  final SourceDetails? sourceDetails;
  final DestinationDetails? destinationDetails;
  final PaymentResult? paymentResult;
  final Map<String, dynamic>? userMetadata;
  final SimulationResponse? simulationResponse;
  final DateTime? completedAt;
  final bool? directPayment;
  final bool? stkPush;
  final String? transactionRef;
  final DateTime? updatedAt;
  final bool? simulation;

  TransactionMetadata(
      {this.paymentMethod,
        this.sourceDetails,
        this.destinationDetails,
        this.paymentResult,
        this.userMetadata,
        this.simulationResponse,
        this.completedAt,
        this.directPayment,
        this.stkPush,
        this.transactionRef,
        this.updatedAt,
        this.simulation});

  factory TransactionMetadata.fromJson(Map<String, dynamic> json) {
    return TransactionMetadata(
      paymentMethod: json['payment_method'],
      sourceDetails: json['source_details'] != null
          ? SourceDetails.fromJson(json['source_details'])
          : null,
      destinationDetails: json['destination_details'] != null
          ? DestinationDetails.fromJson(json['destination_details'])
          : null,
      paymentResult: json['payment_result'] != null
          ? PaymentResult.fromJson(json['payment_result'])
          : null,
      userMetadata: json['user_metadata'] as Map<String, dynamic>?,
      simulationResponse: json['simulation_response'] != null
          ? SimulationResponse.fromJson(json['simulation_response'])
          : null,
      completedAt: json['completed_at'] != null
          ? DateTime.parse(json['completed_at'])
          : null,
      directPayment: json['direct_payment'],
      stkPush: json['stk_push'],
      transactionRef: json['transaction_ref'],
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
      simulation: json['simulation'],
    );
  }
}


class SimulationResponse {
  final String? status;
  final String? reference;
  final DateTime? authorizationTime;
  final String? customerPhone;
  final String? businessName;

  SimulationResponse({
    this.status,
    this.reference,
    this.authorizationTime,
    this.customerPhone,
    this.businessName,
  });

  factory SimulationResponse.fromJson(Map<String, dynamic> json) {
    return SimulationResponse(
      status: json['status'],
      reference: json['reference'],
      authorizationTime: json['authorization_time'] != null
          ? DateTime.parse(json['authorization_time'])
          : null,
      customerPhone: json['customer_phone'],
      businessName: json['business_name'],
    );
  }
}

