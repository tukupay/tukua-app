import 'package:tuku/models/models.dart';

abstract class CheckoutsRepository{
  Future<List<CheckoutType>> getLinkTypes();

  Future<CheckoutResponse> createCheckoutLink(CheckoutRequest request);
}