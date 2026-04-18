class CustomerInitRequest {

  String firstName;
  String? middleName;
  String lastName;
  // String mobileNumber;
  String? countryCode;
  String? documentType;
  String documentNumber;
  String email;

  CustomerInitRequest({
    required this.firstName,
    this.middleName,
    required this.lastName,
    // required this.mobileNumber,
    this.countryCode,
    this.documentType,
    required this.documentNumber,
    required this.email,
  });

  Map toJson() {
    return {
      'first_name': firstName,
      if(middleName!=null) 'middle_name': middleName,
      'last_name': lastName,
      // 'mobile_number': mobileNumber,
      'country_code': '254',
      'document_type': '1',
      'document_number': documentNumber,
      'email': email,
    };
  }
}