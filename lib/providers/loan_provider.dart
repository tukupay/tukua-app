import 'package:flutter/foundation.dart';

class LoanProvider extends ChangeNotifier{
  String? _selectedOption;
  String? get selectedOption=>_selectedOption;

  String _activeStep=loanSteps[0];
  String get activeStep=>_activeStep;

  String? _loanType;
  String? get loanType=>_loanType;

  String? _reminderType;
  String? get reminderType=>_reminderType;

  String? _salaryMargin;
  String? get salaryMargin=>_salaryMargin;

  void selectOption(String option){
    _selectedOption=option;
    notifyListeners();
  }

  void resetOption(){
    _selectedOption=null;
    notifyListeners();
  }

  void goToStep(String step){
    _activeStep=step;
    notifyListeners();
  }

  void resetSteps(){
    _activeStep=loanSteps[0];
    notifyListeners();
  }

  void setLoanType(String type){
    _loanType=type;
    notifyListeners();
  }

  void setReminderType(String type){
    _reminderType=type;
    notifyListeners();
  }

  void setSalaryMargin(String margin){
    _salaryMargin=margin;
    notifyListeners();
  }

}
List<String> loanSteps=['Loan Details','Work Details','Guarantor Details'];
List<String> loadTypes=['Emergency Loan','Short Term','Long Term'];
List<String> salaryBrackets=['Less Than KSH 5000', '5,001 - 10,000 KSH', '10,001 - 20,000 KSH',
'20,001 - 30,000 KSH', '30,0001 - 40,000 KSH', 'More than KSH 40,000'];