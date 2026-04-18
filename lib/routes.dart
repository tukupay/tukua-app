class Routes{
  // AUTH
  static const entry='/';

  static const login='/login';

  static const register='/register';

  static const verifyPhone = '/verifyPhone';

  static const tukuIndividualKyc = '/tukuIndividualKyc';

  static const tukuBusinessKyc = '/tukuBusinessKyc';

  static const sasaIndividualKyc = '/sasaIndividualKyc';

  static const sasaBusinessKyc = '/sasaBusinessKyc';

  static const verifyEmail = '/verifyEmail';

  static const forgotPassword='/forgotPassword';

  static const passwordReset='/passwordReset';

  static const home='/home';

  // TRANSACTIONS
  static const allTransactions='/allTransactions';

  static const transactionDetails='/transactionDetails';

  // NOTIFICATIONS
  static const notifications='/notifications';

  static const notificationDetails='/notificationDetails';

  static const notificationSettings='/notificationSettings';

  // LOANS
  static const applyLoan='/applyLoan';

  static const loanHistory='/loanHistory';

  // KYC
  static const capture = '/capture';
  
  static const documentCamera='/documentCamera';

  static const capturedImg = '/capturedImg';


  // WALLETS
  static const walletTypeSelect='/walletTypeSelect';

  static const newWallet='/newWallet';

  static const walletTransactions='/walletTransactions';


  // BANKING
  static const newBank='/newBank';

  // PROFILE
  static const profile='/profile';

  static const contact='/editContact';

  static const accountsCards='/accountsCards';

  static const groupsMgt='/groupsMgt';

  static const newGroup='/newGroup';

  static const contactGroupMembers='/contactGroupMembers';

  static const deviceContacts='/deviceContacts';

  static const termsConditions='/termsConditions';

  static const bankAccountDetails='/bankAccountDetails';

  static const editBankAccount='/editBankAccount';

  static const myWalletDetails='/walletDetails';

  static const editWallet='/editWallet';

  static const signatories='/signatories';

  static const signatoryInfo='/signatoryInfo';


  // TOPUPS
  static const accountTopUp='/accountTopUp';

  // SENDS
  static const accountSend='/accountSend';

  // LIPA NA MPESA
  static const lipaNaMpesa='/lipaNaMpesa';

  // BULK PAY
  static const bulkLanding='/bulkLanding';
  static const selectContacts='/selectContacts';
  static const groups='/groups';
  static const bulkAmount='/bulkAmount';
  static const bulkPayValidation='/bulkPayValidation';
  static const bulkPayCompletion='/bulkPayCompletion';
  static const bulkPayHistory='/bulkPayHistory';
  static const bulkTransactionDetails='/bulkTransactionDetails';

  // FUNDRAISER
  static const fundraiserPromotions='/fundraiserPromotions';

  static const createFundraiser='/createFundraiser';

  static const fundraiserDetails='/fundraiserDetails';

  static const editFundraiser='/editFundraiser';

  static const fundraiserPledgers='/fundraiserPledgers';

  static const allFundraiserTransactions='/allFundraiserTransactions';

  static const publicFundraiserDetails='/publicFundraiserDetails';

  static const fulfillPledge='/fulfillPledge';
  static const myContribution='/myContribution';

  // STK POS
  static const stkPosLanding='/stkPosLanding';
  static const stkPosSetup='/stkPosSetup';
  static const stkPosSettings='/stkPosSettings';
  static const stkPos='/stkPos';
  static const allPosTransactions='/allPosTransactions';
  static const posTransactionDetails='/posTransactionDetails';

  // BULK SMS
  static const bulkSms='/bulkSms';
  static const summary='/summary';
  static const smsPreview='/smsPreview';
  static const smsSettings='/smsSettings';
  static const smsSenderIds='/smsSenderIds';
  static const smsHistory='/smsHistory';
  static const smsCreditsBreakdown='/smsCreditsBreakdown';
  static const buyCredits='/buyCredits';
  static const smsTopUp='/smsTopUp';
  static const bulkSmsGroupMembers='/smsGroupMembers';

  // BILLS
  static const billsLanding='/billsLanding';
  static const myBills='/myBills';
  static const addBill='/addBill';

  static const bankGPT='/bankGPT';

  // MERCHANT
  static const merchants='/merchants';

  static const church='/church';
  static const churchInfo='/churchInfo';
  static const myChurch='/myChurch';
  static const offeringTypes='/offeringTypes';
  static const churchProjects='/churchProjects';
  static const teachings='/teachings';
  static const videosQueue='/videosQueue';
  static const invite='/churchInvite';

  // SHARED
  static const transactionOtp='/transactionOtp';
  static const transactionPin='/transactionPin';
  static const pinReset='/pinReset';
}