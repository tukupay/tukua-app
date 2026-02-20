import 'package:intl/intl.dart';

class Strings{
  // EMAIL REGEX
  static RegExp emailRegEx =
  RegExp(r"^[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+-/=?^_`{|}~]+@[a-zA-Z0-9]+\.[a-zA-Z]+");

  // ACC TYPES
  static const individualAcc='individual';
  static const businessAcc='business';

  // KYC DOC TYPES
  static const frontId='national_id_front';
  static const backId='national_id_back';
  static const selfie='selfie';

  static const imageType='image';
  static const imageExt='jpeg';

  static const pdfType='application';
  static const pdfExt='pdf';

  static const businessCert='business_certificate';
  static const kraPinCert='kra_pin_certificate';

  // USER STATUSES
  static const userActive='active';
  static const userPending='pending';
  static const userSuspended='suspended';
  static const userDeleted='deleted';

  // KYC STATUSES
  static const kycVerified='verified';
  static const kycPending='pending';
  static const kycRejected='rejected';

  static const finishKycHint='Complete your KYC to proceed.';
  static const kycReviewHint='Your KYC is still under review.';

  // ROOT WEB VIEW
  static const bankGptTitle='Bank GPT';
  // BankGPT production URL with /chat route
  static const bankGpt='https://bankgpt.app/chat';
  // BankGPT staging URL for development

  static const termsLink='https://tuku.money/terms-and-conditions';
  static const privacyLink='https://tuku.money/privacy-policy';

  // PATHS TO IMAGE ASSETS
  static imageAsset(String image) => 'assets/images/$image';

  static iconImage(String image)=>'assets/images/icons/$image';

  static sampleImageAsset(String image)=>'assets/images/samples/$image';

  static sampleGroupImage(String image)=>'assets/images/samples/groups/$image';

  // TOP UP METHODS
  static const mpesa='mpesa';
  static const tuku='tukupay_wallet';
  static const card='card';
  static const bank='bank';
  static const link='link';
  // static const stkMethod='stk_push';

  // for bulk transfer dest. type
  static const wallet='wallet';

  static const smsCreditsPurchase='SMS_CREDITS';
  static const walletTopUp='WALLET_TOPUP';
  static const servicePayment='SERVICE_PAYMENT';
  static const productPurchase='PRODUCT_PURCHASE';
  static const subscriptionPayment='SUBSCRIPTION';
  static const userTransfer='USER_TRANSFER';
  static const bankTransfer='BANK_TRANSFER';
  static const bulkTransfer='BULK_TRANSFER';
  static const posPayment='STK_POS';


  static const paybill='Paybill';
  static const buyGoods='Buy Goods';
  static const bills='Bills';

  // BILL STATUSES
  static const overdueStatus='OVERDUE';
  static const upcomingStatus='UPCOMING';
  static const paidStatus='PAID';

  // BANK SETTLEMENT TYPES
  static const manualSettlement='manual';
  static const autoSettlement='automatic';

  // PIN STATUSES
  static const pinNotSet='not_set';
  static const pinSet='set';
  static const pinLocked='locked';

  // LOCAL SENDER ID
  static const localSenderId='My Number';
}

List<String> signatoryRoles=["Viewer","Signatory","Admin"];

List<String> paymentDurations=['Monthly', '2 Months', '6 Months'];
List<String> reminderTypes=['Regular', 'Persistent', 'None'];

List<String> languages=[
  'English',
  'Kiswahili'
];

String formatThousands({required double amount, bool? noDecimal}){
  NumberFormat formatter = NumberFormat.decimalPatternDigits(
    locale: 'en_us',
    decimalDigits: noDecimal==true?0: 2,
  );
  String formatted=formatter.format(amount);
  return formatted;
}

String formatDate(DateTime time, {bool? shorter}){
  return
    shorter==true?
        DateFormat.yMMMMd().format(time):
    DateFormat.yMMMEd().format(time);
}

String formatTime(DateTime time){
  return DateFormat.jm().format(time);
}

String createInitials(String name) {
  if (name.isEmpty) {
    return "";
  }

  // Split the name by spaces. This will handle multiple words.
  List<String> words = name.trim().split(RegExp(r'\s+'));

  // If there's only one word, take the first one or two characters.
  if (words.length == 1) {
    if (words[0].length >= 2) {
      return words[0].substring(0, 2).toUpperCase();
    } else {
      return words[0].toUpperCase();
    }
  }

  // If there are multiple words, take the first letter of the first two words.
  // You can adjust this logic if you prefer different rules (e.g., first and last word).
  String initials = "";
  if (words.isNotEmpty && words[0].isNotEmpty) {
    initials += words[0][0];
  }
  if (words.length > 1 && words[1].isNotEmpty) {
    initials += words[1][0];
  }

  return initials.toUpperCase();
}

String hideMiddleCharacters(String text, {int charactersToHide = 4, String replacementChar = '*'}) {
  if (text.isEmpty) {
    return "";
  }

  int textLength = text.length;

  // If the text is too short to hide the specified number of characters in the middle
  // in a meaningful way (e.g., less than charactersToHide + 2 for surrounding chars),
  // decide on a strategy. Here, we'll hide fewer or none if it doesn't make sense.

  // Edge case: If text is very short, maybe don't hide anything or hide all but first/last
  if (textLength <= charactersToHide) {
    // Strategy 1: Hide all characters if it's short
    // return replacementChar * textLength;

    // Strategy 2: Return as is or hide fewer if too short to make sense.
    // For this example, if it's 4 chars or less, and we want to hide 4,
    // it doesn't leave much. Let's return as is or a modified short version.
    if (textLength <= 2) return text; // e.g., "12" -> "12"
    if (textLength == 3 && charactersToHide >=3) return "${text[0]}$replacementChar${text[textLength-1]}"; // "123" -> "1*3"
    if (textLength == 4 && charactersToHide >=4) return "${text[0]}${replacementChar*2}${text[textLength-1]}"; // "1234" -> "1**4"

    // If charactersToHide is less than textLength but still makes hiding odd
    // (e.g. text="12345", hide=4 -> "1****5" (middle 3 + one side) - this isn't "middle")
    // The logic below will handle this by centering the hide.
  }

  // Calculate the starting index for the middle part to hide
  // Ensure we have at least one character visible on each side if possible
  int startIndexToHide = (textLength - charactersToHide) ~/ 2;


  // Adjust if startIndexToHide makes no sense (e.g., negative, or leaves no prefix)
  if (startIndexToHide < 0) {
    startIndexToHide = 0; // Start hiding from the beginning if string is too short
  }

  int endIndexToHide = startIndexToHide + charactersToHide;

  // Ensure endIndexToHide does not exceed string length
  if (endIndexToHide > textLength) {
    endIndexToHide = textLength;
    if (textLength - charactersToHide < 0) { // If original charactersToHide was > textLength
      startIndexToHide = 0;
    } else {
      // This keeps the original prefix length if possible
      startIndexToHide = textLength - charactersToHide > 0 ? textLength - charactersToHide : 0;
    }
    if (startIndexToHide < 0) startIndexToHide = 0; // safeguard
  }


  String prefix = text.substring(0, startIndexToHide);
  String suffix = text.substring(endIndexToHide);
  String hiddenPart = replacementChar * (endIndexToHide - startIndexToHide);

  if (textLength > 0 && textLength <= charactersToHide + 1 && textLength > charactersToHide) {

    if (textLength > 2 && charactersToHide >= textLength -1) {
      prefix = text[0];
      suffix = text[textLength -1];
      hiddenPart = replacementChar * (textLength - 2);
      if (textLength - 2 < 0 ) hiddenPart = ""; // for textLength < 2
      return '$prefix$hiddenPart$suffix';
    }
  }


  return '$prefix$hiddenPart$suffix';
}

String? convertToLocalKenyanFormat(String? internationalPhoneNumber) {
  if (internationalPhoneNumber == null || internationalPhoneNumber.isEmpty) {
    return null; // Or return an empty string, or handle as an error
  }

  const String kenyanPrefix = "+254";
  const String localPrefix = "0";

  if (internationalPhoneNumber.startsWith(kenyanPrefix)) {
    // Ensure there are characters after the prefix to form a valid number part
    if (internationalPhoneNumber.length > kenyanPrefix.length) {
      return localPrefix + internationalPhoneNumber.substring(kenyanPrefix.length);
    } else {
      // The string is just "+254" or too short after prefix, invalid
      return internationalPhoneNumber; // Or return null/error
    }
  } else {
    // Does not start with +254, return as is or handle as an error/invalid format
    // For this example, we return it as is, assuming it might already be local or a different format.
    return internationalPhoneNumber;
  }
}