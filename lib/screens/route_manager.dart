import 'package:flutter/material.dart';
import '../routes.dart';
import '../screens/screens.dart';

class RouteManager {
  static Route<dynamic> generateRoute(RouteSettings settings) {
    final routes = <String, WidgetBuilder>{
      // ### AUTH ###
      Routes.entry: (_) => const EntryPointScreen(),
      Routes.login: (_) => const Login(),
      Routes.register: (_) => const Register(),
      Routes.verifyPhone: (_) => const VerifyPhone(),
      Routes.verifyEmail: (_) => const VerifyEmail(),
      Routes.forgotPassword: (_) => const ForgotPassword(),
      Routes.passwordReset: (_) => const PasswordReset(),

      // ### HOME ###
      Routes.home: (_) => const MainBody(),
      Routes.allTransactions: (_) => const AllTransactions(),
      Routes.transactionDetails: (_) => const TransactionDetails(),

      // ## NOTIFICATIONS ##
      Routes.notifications: (_) => const Notifications(),
      Routes.notificationDetails: (_) => const NotificationDetails(),
      Routes.notificationSettings: (_) => const NotificationSettings(),

      // ## LOANS ##
      Routes.applyLoan: (_) => const ApplyLoan(),
      Routes.loanHistory: (_) => const LoanHistory(),

      // ## CHURCH ##
      Routes.church: (_) => const ChurchLanding(),
      Routes.churchInfo: (_) => const ChurchInfo(),
      Routes.myChurch: (_)=> const MyChurch(),
      Routes.offeringTypes: (_)=> const OfferingTypes(),
      Routes.churchProjects: (_)=> const ChurchProjects(),
      Routes.teachings: (_)=> const ChurchTeachings(),
      Routes.videosQueue: (_)=>const VideosQueue(),
      Routes.invite: (_)=> const ChurchInvite(),


      // ## KYC ##
      Routes.tukuIndividualKyc: (_) => const TukuIndividualKyc(),
      Routes.tukuBusinessKyc: (_) => const TukuBusinessKyc(),
      Routes.sasaIndividualKyc: (_) => const SasaIndividualKyc(),
      Routes.sasaBusinessKyc: (_) => const SasaBusinessKyc(),
      Routes.capture: (_) => const Camera(),
      Routes.documentCamera: (_) => const DocumentCamera(),
      Routes.capturedImg: (_) => const CapturedImg(),

      // ## WALLETS ##
      Routes.walletTypeSelect: (_) => const WalletTypeSelect(),
      Routes.newWallet: (_) => const NewWallet(),
      Routes.walletTransactions: (_) => const WalletTransactions(),

      // ## BANKING ##
      Routes.newBank: (_) => const NewBank(),

      // ## PROFILE ##
      Routes.profile: (_) => const ProfileLanding(),
      Routes.contact: (_) => const ContactScreen(),
      Routes.accountsCards: (_) => const AccountsCards(),
      Routes.groupsMgt: (_) => const GroupsMgt(),
      Routes.newGroup: (_) => const NewGroup(),
      Routes.contactGroupMembers: (_) => const ContactGroupMembers(),
      Routes.deviceContacts: (_)=>const DeviceContacts(),
      Routes.termsConditions: (_) => const TermsConditions(),
      Routes.bankAccountDetails: (_) => const BankAccountDetails(),
      Routes.editBankAccount:(_) => const EditBankAccount(),
      Routes.myWalletDetails: (_) => const MyWalletDetails(),
      Routes.editWallet: (_) => const EditWallet(),
      Routes.signatories: (_) => const SignatoriesLanding(),
      Routes.signatoryInfo: (_) => const SignatoryInfo(),

      // ## TOP UPS ##
      Routes.accountTopUp: (_) => const AccountTopUp(),

      // ## SENDS ##
      Routes.accountSend: (_) => const AccountSend(),

      // ## BULK PAY ##
      Routes.bulkLanding: (_) => const BulkPayLanding(),
      Routes.selectContacts: (_) => const SelectContacts(),
      Routes.bulkSmsGroupMembers: (_) => const BulkGroupMembers(),
      Routes.bulkAmount: (_) => const BulkPayAmount(),
      Routes.bulkPayValidation: (_)=>const BulkPayValidation(),
      Routes.bulkPayCompletion: (_)=>const BulkPayCompletion(),
      Routes.bulkPayHistory: (_)=>const BulkPayHistory(),
      Routes.bulkTransactionDetails: (_)=>const BulkTransactionDetails(),

      Routes.lipaNaMpesa: (_) => const LipaNaMpesa(),

      // ## FUNDRAISER ##
      Routes.fundraiserPromotions: (_) => const Fundraiser(),
      Routes.createFundraiser: (_) => const CreateFundraiser(),
      Routes.fundraiserDetails: (_) => const FundraiserDetails(),
      Routes.editFundraiser: (_) => const EditFundraiser(),
      Routes.fundraiserPledgers: (_) => const FundraiserPledgers(),
      Routes.allFundraiserTransactions: (_) => const AllFundraiserTransactions(),
      Routes.publicFundraiserDetails: (_) => const PublicFundraiserDetails(),
      Routes.fulfillPledge: (_) => const FulfillPledge(),
      Routes.myContribution: (_) => const MyContribution(),

      // ## STK POS ##
      Routes.stkPosLanding: (_)=> const PosLanding(),
      Routes.stkPosSetup: (_)=>const PosSetup(),
      Routes.stkPosSettings: (_)=>const PosSettings(),
      Routes.stkPos: (_) => const StkPos(),
      Routes.allPosTransactions: (_) => const AllPosTransactions(),
      Routes.posTransactionDetails: (_) => const PosTransactionDetails(),


      // ## BULK SMS ##
      Routes.bulkSms: (_) => const BulkSmsLanding(),
      Routes.summary: (_) => const SmsSummary(),
      Routes.smsPreview: (_) => const SmsPreview(),
      Routes.smsSettings: (_) => const SmsSettings(),
      Routes.smsSenderIds: (_) => const SmsSenderIds(),
      Routes.smsCreditsBreakdown: (_) => const SmsCreditsBreakdown(),
      Routes.buyCredits: (_)=>const BuyCredits(),
      Routes.smsTopUp: (_) => const SmsTopup(),
      Routes.smsHistory: (_) => const SmsHistory(),

      // ## BILLS ##
      Routes.billsLanding: (_)=>const BillsLanding(),
      Routes.myBills: (_) => const MyBills(),
      Routes.addBill: (_) => const AddBill(),

      Routes.bankGPT: (_) => const BankGpt(),
      // Routes.merchants: (_) => const MerchantsLanding(),
      Routes.merchants: (_) => const MerchantsStore(),


      // ## SHARED ##
      Routes.transactionOtp: (_) => const TransactionOtp(),
      Routes.transactionPin: (_) => const TransactionPin(),
      Routes.pinReset: (_) => const PinReset(),
    };

    final builder = routes[settings.name];
    if (builder != null) {
      return MaterialPageRoute(
        builder: builder,
        settings: settings, // ✅ keeps routeName + arguments
      );
    }

    // fallback
    return MaterialPageRoute(
      builder: (_) => const Login(),
      settings: const RouteSettings(name: Routes.login),
    );
  }
}
