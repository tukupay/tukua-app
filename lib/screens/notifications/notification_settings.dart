import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

class NotificationSettings extends StatefulWidget {
  const NotificationSettings({super.key});

  @override
  State<NotificationSettings> createState() => _NotificationSettingsState();
}

class _NotificationSettingsState extends State<NotificationSettings> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<NotificationProvider>(context, listen: false).getPreferences();
    });
  }

  String _formatSettingName(String key) {
    return key
        .split('_')
        .map((word) => word[0].toUpperCase() + word.substring(1))
        .join(' ');
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<NotificationProvider>(
      builder: (context, provider, child) {
        final preferences = provider.preferences;

        return Scaffold(
          appBar: AppBar(
            leading: IconButton(
                onPressed: () {
                  Navigator.pop(context);
                },
                icon: Icon(Icons.arrow_back, color: HexColor('#404040'))),
            title: Text('Notification Settings', style: Blacks.mediumSemiRoboto),
            centerTitle: true,
          ),
          body: provider.loadingPreferences
              ? const Center(child: CircularProgressIndicator())
              : preferences == null
                  ? const Center(child: Text("No settings found."))
                  : SingleChildScrollView(
                      padding: Paddings.smallAllSides,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Delivery Channels Section
                          _buildSectionHeader(
                            'Delivery Channels',
                            'Choose how you want to receive notifications.',
                          ),
                          SettingItem(
                            setting: 'In-App Notifications',
                            value: preferences.inAppEnabled ?? false,
                            onChanged: (val) => provider.updatePreferenceValue('in_app_enabled', val,context),
                          ),
                          SettingItem(
                            setting: 'Push Notifications',
                            value: preferences.pushEnabled ?? false,
                            onChanged: (val) => provider.updatePreferenceValue('push_enabled', val,context),
                          ),
                          SettingItem(
                            setting: 'SMS',
                            value: preferences.smsEnabled ?? false,
                            onChanged: (val) => provider.updatePreferenceValue('sms_enabled', val,context),
                          ),
                          SettingItem(
                            setting: 'Email',
                            value: preferences.emailEnabled ?? false,
                            onChanged: (val) => provider.updatePreferenceValue('email_enabled', val,context),
                          ),
                          Spaces.mediumTopSpace,

                          // Digests Section
                          _buildSectionHeader(
                            'Digests',
                            'Receive daily or weekly summaries of activity.',
                          ),
                          SettingItem(
                            setting: 'Daily Digest',
                            value: preferences.dailyDigestEnabled ?? false,
                            onChanged: (val) => provider.updatePreferenceValue('daily_digest_enabled', val,context),
                          ),
                          SettingItem(
                            setting: 'Weekly Digest',
                            value: preferences.weeklyDigestEnabled ?? false,
                            onChanged: (val) => provider.updatePreferenceValue('weekly_digest_enabled', val,context),
                          ),
                          Spaces.mediumTopSpace,

                          // By Priority Section
                          _buildSectionHeader(
                            'By Priority',
                            'Enable or disable notifications based on their importance.',
                          ),
                          SettingItem(
                            setting: 'High Priority Alerts',
                            value: preferences.highPriorityEnabled ?? false,
                            onChanged: (val) => provider.updatePreferenceValue('high_priority_enabled', val,context),
                          ),
                          SettingItem(
                            setting: 'Medium Priority Alerts',
                            value: preferences.mediumPriorityEnabled ?? false,
                            onChanged: (val) => provider.updatePreferenceValue('medium_priority_enabled', val,context),
                          ),
                          SettingItem(
                            setting: 'Low Priority Alerts',
                            value: preferences.lowPriorityEnabled ?? false,
                            onChanged: (val) => provider.updatePreferenceValue('low_priority_enabled', val,context),
                          ),
                          Spaces.mediumTopSpace,
                        ],
                      ),
                    ),
        );
      },
    );
  }

  Widget _buildSectionHeader(String title, String subtitle) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Blacks.regularSemiCairo),
        Spaces.smallTopSpace,
        Text(subtitle, style: Grays.regularLightSemiPoppins),
        Spaces.smallTopSpace,
      ],
    );
  }
}
