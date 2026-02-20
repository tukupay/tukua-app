import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/repository/repository.dart';
import 'package:tuku/routes.dart';
import '../services/services.dart';
import '../widgets/widget.dart';


class PaymentsProvider extends ChangeNotifier{
  bool _loadingMethods=false;
  bool get loadingMethods=>_loadingMethods;

  List<PaymentMethod> _paymentMethods=[];
  List<PaymentMethod> get paymentMethods=>_paymentMethods;

  List<TransactionType> _transactionTypes=[];
  List<TransactionType> get transactionTypes=>_transactionTypes;

  TransactionType? _selectedType;
  TransactionType? get selectedType=>_selectedType;

  PaymentMethod? _selectedMethod;
  PaymentMethod? get selectedMethod=>_selectedMethod;

  FullWallet? _selectedSourceWallet;
  FullWallet? get selectedSourceWallet=>_selectedSourceWallet;

  FullWallet? _selectedDestinationWallet;
  FullWallet? get selectedDestinationWallet=>_selectedDestinationWallet;

  FullBank? _selectedSourceBank;
  FullBank? get selectedSourceBank=>_selectedSourceBank;

  String? _destinationBankName;
  String? get destinationBankName=>_destinationBankName;

  // Pending request kept inside provider so pages don't need to pass requests around.
  PaymentRequest? _pendingRequest;
  PaymentRequest? get pendingRequest => _pendingRequest;

  bool _validatingPayment=false;
  bool get validatingPayment=>_validatingPayment;

  ValidationResponse? _validationResponse;
  ValidationResponse? get validationResponse=>_validationResponse;

  bool _processingPayment=false;
  bool get processingPayment=>_processingPayment;

  PaymentResponse? _paymentResponse;
  PaymentResponse? get paymentResponse=>_paymentResponse;

  PaymentsRepository api=PaymentsService();

  void setPendingRequest(PaymentRequest request){
    _pendingRequest = request;
    debugPrint(_pendingRequest?.toJson().toString());
    notifyListeners();
  }

  void setPin(String pin){
    _pendingRequest!.pin = pin;
    notifyListeners();
  }

  void resetPin(){
    _pendingRequest!.pin = null;
    notifyListeners();
  }

  void setOtp(String otp){
    _pendingRequest!.otpCode=otp;
    notifyListeners();
  }

  void resetOtp(){
    _pendingRequest!.otpCode=null;
    notifyListeners();
  }


  void clearPending(){
    if(_pendingRequest!=null){
      // clear sensitive pin if present
      _pendingRequest!.pin = null;
      _pendingRequest!.otpCode = null;
      _pendingRequest!.paymentHash = null;
    }
    _pendingRequest = null;
    notifyListeners();
  }


  Future<void> getTransactionTypes()async{
    if(_transactionTypes.isEmpty){
      final resp=await api.transactionTypes();
      if(resp.error!=null){
        Fluttertoast.showToast(msg: resp.error!);
      }else{
        _transactionTypes.addAll(resp.transactionTypes!);
        debugPrint(_transactionTypes.toString());
      }
    }
    notifyListeners();
  }

  Future<void> getPaymentMethods()async{
    _loadingMethods=true;
    notifyListeners();
    if(_paymentMethods.isEmpty){
      final resp=await api.paymentMethods();
      if(resp.error!=null){
        Fluttertoast.showToast(msg: resp.error!);
      }else{
        _paymentMethods.addAll(resp.paymentMethods!);
      }
    }
    _loadingMethods=false;
    notifyListeners();
  }

  void selectType(TransactionType type){
    _selectedType=type;
    notifyListeners();
  }

  void selectMethod(PaymentMethod method){
    _selectedMethod=method;
    notifyListeners();
  }

  void selectSourceWallet(FullWallet wallet){
    _selectedSourceWallet=wallet;
    notifyListeners();
  }

  void resetSourceWallet(){
    _selectedSourceWallet=null;
    notifyListeners();
  }

  void resetDestinationWallet(){
    _selectedDestinationWallet=null;
    notifyListeners();
  }

  void selectDestinationWallet(FullWallet wallet){
    _selectedDestinationWallet=wallet;
    notifyListeners();
  }

  // Auto-select primary wallet from wallet list
  void autoSelectPrimaryWallet(List<FullWallet> wallets, {bool isSource = true, bool isDestination = true}) {
    if (wallets.isEmpty) return;

    // Find primary wallet
    final primaryWallet = wallets.firstWhere(
      (wallet) => wallet.isPrimary == true,
      orElse: () => wallets.first, // fallback to first wallet if no primary
    );

    // Select as source if requested and not already selected
    if (isSource && _selectedSourceWallet == null) {
      _selectedSourceWallet = primaryWallet;
    }

    // Select as destination if requested and not already selected
    if (isDestination && _selectedDestinationWallet == null) {
      _selectedDestinationWallet = primaryWallet;
    }

    notifyListeners();
  }

  // Get primary wallet from list or return first wallet
  FullWallet? getPrimaryWallet(List<FullWallet> wallets) {
    if (wallets.isEmpty) return null;

    final primaryWallet = wallets.firstWhere(
      (wallet) => wallet.isPrimary == true,
      orElse: () => wallets.first,
    );

    return primaryWallet;
  }

  void selectSourceBank(FullBank bank){
    _selectedSourceBank=bank;
    notifyListeners();
  }

  void selectDestinationBankName(String name){
    _destinationBankName=name;
    notifyListeners();
  }

  Future<void> validatePayment(PaymentRequest request,BuildContext context)async{
    _validatingPayment=true;
    notifyListeners();
    _validationResponse=await api.validatePayment(request);
    _validatingPayment=false;
    notifyListeners();
  }

  Future<void> directPayment(PaymentRequest request,BuildContext context)async{
    _processingPayment=true;
    notifyListeners();
    _paymentResponse=await api.directPayment(request);
    if(_paymentResponse?.error!=null && request.transactionData.transactionType!=Strings.posPayment){
      Fluttertoast.showToast(msg: _paymentResponse!.error!);
    }else{
      if(_paymentResponse?.paymentMethod==Strings.tuku && _paymentResponse?.transactionType==Strings.walletTopUp){
        // update tuku wallet after topping up
        // Provider.of<WalletProvider>(context,listen: false)
        //     .updateWalletBalance(_selectedDestinationWallet!.id! , _paymentResponse!.destinationWalletBalance!);
        if(_paymentResponse?.sourceWalletBalance!=null){
          // update wallet after transacting
          // Provider.of<WalletProvider>(context,listen: false)
          //     .updateWalletBalance(_selectedSourceWallet!.id!, _paymentResponse!.sourceWalletBalance!);
        }
      }else if(_paymentResponse?.paymentMethod==Strings.tuku && _paymentResponse?.transactionType!=Strings.walletTopUp){
        // update wallet after transacting
        // Provider.of<WalletProvider>(context,listen: false)
        //     .updateWalletBalance(_selectedSourceWallet!.id!, _paymentResponse!.sourceWalletBalance!);
      } else if(_paymentResponse?.transactionType==Strings.walletTopUp){
        // update tuku wallet after topping up
        // Provider.of<WalletProvider>(context,listen: false)
        //     .updateWalletBalance(_selectedDestinationWallet!.id! , _paymentResponse!.destinationWalletBalance!);
      } else if(_paymentResponse?.transactionType==Strings.posPayment){
        // update tuku wallet after transaction
        // Provider.of<WalletProvider>(context,listen: false)
        //     .updateWalletBalance(_selectedDestinationWallet!.id! , _paymentResponse!.destinationWalletBalance!);
      }
      await Provider.of<TransactionsProvider>(context,listen: false).getSummary();
      await Provider.of<TransactionsProvider>(context,listen: false).getMyTransactions(isRefresh: true);
    }
    _processingPayment=false;
    notifyListeners();
  }

  Future<void> processTransaction(BuildContext context,bool requiresSetup)async{
    if(requiresSetup!=true){
      // 1. show "validating..." dialog
      showAdaptiveDialog(
          context: context,
          barrierDismissible: false,
          builder: (context)=>AiAnalysisAlert(
              icon: HugeIcons.strokeRoundedLockPassword,
              action: 'Validating...'));
      // 2. call API to validate
      await validatePayment(_pendingRequest!, context);
      Navigator.pop(context); //  close "validating" dialog

      // 3. check response
      if(_validationResponse?.valid==true){
        // 3a. if valid, show confirm dialog
        showGeneralDialog(
            context: context,
            pageBuilder: (context,anim1,anim2){
              return const SizedBox();
            },
            transitionDuration: const Duration(milliseconds: 700),
            transitionBuilder: (context,anim1,anim2,child){
              return InfoAlert(
                  anim1: anim1,
                  isValidating: true,
                  transaction: _validationResponse,
                  tapped: ()async{
                    if(_validationResponse?.otpSent==true && _validationResponse?.stkPushValidation==null){
                      // prompt for OTP and attach before directPayment
                      _pendingRequest!.paymentHash=_validationResponse!.paymentHash;
                      Navigator.pushNamed(context, Routes.transactionOtp);
                    }else if(_validationResponse?.stkPushValidation==null && _validationResponse?.sourceValidation?.sourceType!=Strings.mpesa){
                      // prompt for PIN and attach before directPayment
                      Navigator.pushNamed(context, Routes.transactionPin);
                    }else{
                      // process directly for pos
                      showAdaptiveDialog(
                          context: context,
                          barrierDismissible: false,
                          builder: (context)=>AiAnalysisAlert(
                              icon: HugeIcons.strokeRoundedLockPassword,
                              action: 'Processing...'));
                      await directPayment(_pendingRequest!, context);
                      Navigator.pop(context); // close processing dialog
                      if(_paymentResponse?.error==null){
                        // show completed transaction dialog
                        showGeneralDialog(
                            context: context,
                            pageBuilder: (context,anim1,anim2){
                              return const SizedBox();
                            },
                            transitionDuration: const Duration(milliseconds: 700),
                            transitionBuilder: (context,anim1,anim2,child){
                              return InfoAlert(
                                  anim1: anim1,
                                  isSuccess: true,
                                  payment: _paymentResponse);
                            }
                        );
                      }else{
                        Navigator.pop(context);
                      }
                    }
                  });
            }
        );
      }else{
        // show transaction error
        await showGeneralDialog(
            context: context,
            barrierDismissible: false,
            pageBuilder: (context,anim1,anim2)=>const SizedBox(),
            transitionDuration: const Duration(milliseconds: 400),
            transitionBuilder: (context,anim1,anim2,child){
              return SlideTransition(
                position: Tween(
                  begin: const Offset(1, 0),
                  end: const Offset(0, 0),
                ).animate(anim1),
                child: StatefulBuilder(
                    builder: (context,stateSetter){
                      return SuccessAlert(
                          icon: Icons.warning_sharp,
                          title: "Transaction Error",
                          content: _validationResponse!.warnings?.first??_validationResponse!.errors?.first??"An error occurred while processing this transaction.",
                          buttonText:"Okay",
                          tapped: (){
                            Navigator.pop(context);
                          },
                          anim1: anim1);
                    }),);
            });
      }
    }else{
      showModalBottomSheet(
          scrollControlDisabledMaxHeightRatio: 1/1,
          context: context,
          builder: (context){
            return DecoratedSheet(
                hasCounter: false,
                title: "Setup Your Pin",
                body: CreatePinPrompt(),
                height: 450);
          });
    }
  }



  void reset(){
    _selectedSourceWallet=null;
    _selectedDestinationWallet=null;
    notifyListeners();
  }

  void clearLists(){
    _paymentMethods.clear();
    _transactionTypes.clear();
    _selectedType=null;
    _selectedMethod=null;
    _selectedSourceWallet=null;
    _selectedDestinationWallet=null;
    notifyListeners();
  }

}