import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:intl/intl.dart';
import 'package:tuku/repository/repository.dart';
import 'package:tuku/services/services.dart';
import '../models/models.dart';

class TransactionsProvider extends ChangeNotifier {
  bool _loadingSummary = true;
  bool get loadingSummary => _loadingSummary;

  List<Transaction> _recentTransactions=[];
  List<Transaction> get recentTransactions=>_recentTransactions;


  TransactionSummary? _summary;
  TransactionSummary? get summary => _summary;

  bool _loadingTransactions = false;
  bool get loadingTransactions => _loadingTransactions;

  List<Transaction> _transactions = [];
  List<Transaction> get transactions => _transactions;

  Transaction? _selectedTransaction;
  Transaction? get selectedTransaction=>_selectedTransaction;


  // --- Pagination State ---
  int _currentPage = 1;
  bool _hasMorePages = true;
  bool _loadingMore = false;
  bool get loadingMore => _loadingMore;

  TransactionsRepository api = TransactionsService();

  DateFormat dateFormat=DateFormat('yyyy-MM-dd');
  // Use the shared DateFormatter util to compute date-only DateTime objects

  DateTime _dateOnly([int daysAgo = 0]) {
    final now = DateTime.now().subtract(Duration(days: daysAgo));
    // preserve only Y/M/D so that when passed to endpoints it will be formatted as yyyy-MM-dd
    return DateTime(now.year, now.month, now.day);
  }

  /// Start (90 days ago) as a date-only DateTime (e.g. 2025-09-01 00:00:00)
  DateTime get start => _dateOnly(90);

  /// End (today) as a date-only DateTime (e.g. 2025-11-30 00:00:00)
  DateTime get end => _dateOnly();

  Future<void> getSummary() async {
    _loadingSummary = true;
    notifyListeners();
    final resp = await api.getMySummary();
    if(resp.error!=null){
      Fluttertoast.showToast(msg: resp.error!);
    }else{
      _summary=resp.summary;
      _recentTransactions=resp.summary?.recentTransactions??[];
    }
    _loadingSummary = false;
    notifyListeners();
  }

  Future<void> getMyTransactions({bool isRefresh = false}) async {
    if (isRefresh) {
      _currentPage = 1;
      _transactions = [];
      _hasMorePages = true;
      _loadingTransactions = true;
    } else {
      if (_loadingMore || !_hasMorePages) return;
      _loadingMore = true;
    }
    notifyListeners();

    final offset = (_currentPage - 1) * 15;
    /// compute today and [today-90 days] and pass date-only DateTimes to API
    final resp = await api.getMyTransactions(offset, start, end);

    if (resp.error != null) {
      Fluttertoast.showToast(msg: resp.error!);
    } else {
      _transactions.addAll(resp.transactions ?? []);
      _hasMorePages = resp.hasMore ?? false;
      if (resp.transactions?.isNotEmpty ?? false) {
        _currentPage++;
      }
    }

    if (isRefresh) {
      _loadingTransactions = false;
    } else {
      _loadingMore = false;
    }
    notifyListeners();
  }

  void selectTransaction(Transaction transaction){
    _selectedTransaction=transaction;
    notifyListeners();
  }
}
