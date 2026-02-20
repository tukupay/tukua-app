import 'package:tuku/models/models.dart';

abstract class PaymentsRepository{
  Future<TransactionTypeResponse> transactionTypes();

  Future<PaymentMethodResponse> paymentMethods();

  Future<PaymentResponse> directPayment(PaymentRequest request);

  Future<ValidationResponse> validatePayment(PaymentRequest request);

  Future<BulkPayResponse> bulkTransfer(BulkPayRequest request);

}