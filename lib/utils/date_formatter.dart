class DateRange {
  final DateTime start;
  final DateTime end;

  const DateRange({required this.start, required this.end});

  /// formatted as yyyy-MM-dd
  String get startFormatted => DateFormatter.formatYMD(start);
  String get endFormatted => DateFormatter.formatYMD(end);
}

class DateFormatter {
  // pad helper
  static String _two(int n) => n.toString().padLeft(2, '0');

  /// Formats a DateTime as `yyyy-MM-dd` (e.g. 2025-10-25)
  static String formatYMD(DateTime dt) {
    return '${dt.year}-${_two(dt.month)}-${_two(dt.day)}';
  }

  /// Returns today's date formatted as `yyyy-MM-dd`.
  static String todayFormatted() => formatYMD(DateTime.now());

  /// Returns a date [days] ago formatted as `yyyy-MM-dd`.
  static String daysAgoFormatted(int days) => formatYMD(DateTime.now().subtract(Duration(days: days)));

  /// Returns a [DateRange] for today and [daysAgo] days ago.
  /// - start = today - daysAgo
  /// - end = today
  static DateRange todayAndDaysAgoRange({int daysAgo = 90}) {
    final now = DateTime.now();
    final start = now.subtract(Duration(days: daysAgo));
    return DateRange(start: start, end: now);
  }

  /// Convenience: returns a map with string-formatted start/end as `yyyy-MM-dd`.
  static Map<String, String> todayAndDaysAgoFormatted({int daysAgo = 90}) {
    final range = todayAndDaysAgoRange(daysAgo: daysAgo);
    return {
      'start': formatYMD(range.start),
      'end': formatYMD(range.end),
    };
  }

  /// Parse a string in `yyyy-MM-dd` into DateTime. Returns null if parsing fails.
  static DateTime? parseYMD(String input) {
    try {
      final parts = input.split('-');
      if (parts.length != 3) return null;
      final y = int.parse(parts[0]);
      final m = int.parse(parts[1]);
      final d = int.parse(parts[2]);
      return DateTime(y, m, d);
    } catch (_) {
      return null;
    }
  }
}

