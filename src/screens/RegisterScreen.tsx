import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ModernBackground } from '../components/landing/ModernBackground';
import { GlassAuthCard } from '../components/landing/GlassAuthCard';
import { AuthTextField } from '../components/auth/AuthTextField';
import { CountyPicker } from '../components/auth/CountyPicker';
import { PeaRegistrationCard } from '../components/auth/PeaRegistrationCard';
import { DEFAULT_PEA_CONFIG, fetchPeaConfig, PeaConfig } from '../lib/peaConfig';
import {
  checkBlockedPhone,
  finalizePeaAccount,
  initiatePeaPayment,
  logRegistrationAttempt,
  pollPeaPayment,
  PeaStatus,
  RegistrationForm,
} from '../lib/peaRegistrationFlow';
import { cachePasswordForBiometrics } from '../lib/biometricStorage';
import { Colors } from '../theme/yana';
import { RootStackParamList } from '../navigation/types';
import { fetchProfile } from '../lib/auth';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { captureUserLocation } from '../lib/location';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;
type Step = 'type' | 'details';

type OrgType = { id: string; slug: string; label: string; description: string | null };

const ACCOUNT_TYPES = [
  {
    id: 'individual',
    label: 'Individual',
    shortDesc: 'Find opportunities, courses & career growth',
    fullDesc:
      'Access internships, jobs, funding, scholarships, courses, and events matched to your skills.',
    features: [
      'AI career guidance & CV analysis',
      'Personalised opportunity matching',
      'Apply to jobs, internships & scholarships',
      'Enroll in courses & register for events',
    ],
    terms:
      'You must provide accurate personal information and agree to responsible use of the platform.',
    icon: 'person-outline' as const,
  },
  {
    id: 'organization',
    label: 'Organisation Partner',
    shortDesc: 'Post opportunities, manage programs & recruit',
    fullDesc:
      "Create an organisational account to post opportunities, manage programs, and connect with Kenya's talent.",
    features: [
      'Post unlimited opportunities (subject to plan)',
      'Manage applicants & talent pipeline',
      'Branded organisation profile page',
      'Bulk outreach to matched youth',
    ],
    terms:
      'Organisation accounts require approval before activation (within 48 hours).',
    icon: 'business-outline' as const,
  },
];

export function RegisterScreen({ navigation }: Props) {
  const { refreshProfile } = useAuth();
  const { showDialog } = useDialog();
  const [step, setStep] = useState<Step>('type');
  const [accountType, setAccountType] = useState('individual');
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [county, setCounty] = useState('');
  const [orgSubtype, setOrgSubtype] = useState('');
  const [orgName, setOrgName] = useState('');
  const [businessLocation, setBusinessLocation] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [obscure, setObscure] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orgTypes, setOrgTypes] = useState<OrgType[]>([]);
  const [orgPickerOpen, setOrgPickerOpen] = useState(false);
  const [peaConfig, setPeaConfig] = useState<PeaConfig>(DEFAULT_PEA_CONFIG);
  const [peaConfigLoaded, setPeaConfigLoaded] = useState(false);
  const [peaStatus, setPeaStatus] = useState<PeaStatus>('idle');
  const [peaMessage, setPeaMessage] = useState('');
  const [peaCheckoutId, setPeaCheckoutId] = useState<string | null>(null);
  const attemptIdRef = useRef<string | null>(null);
  const formRef = useRef<RegistrationForm | null>(null);

  const isOrg = accountType === 'organization';
  const selectedType = ACCOUNT_TYPES.find((t) => t.id === accountType);
  const peaAmount = peaConfig.amount;

  useEffect(() => {
    fetchPeaConfig().then((cfg) => {
      setPeaConfig(cfg);
      setPeaConfigLoaded(true);
    });
  }, []);

  useEffect(() => {
    supabase
      .from('org_types')
      .select('id, slug, label, description')
      .eq('is_active', true)
      .order('display_order')
      .then(({ data }) => {
        if (data) setOrgTypes(data as OrgType[]);
      });
  }, []);

  const canRegister = useMemo(() => {
    const base =
      fullName.trim().length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
      phone.trim().length >= 9 &&
      password.length >= 6 &&
      password === confirmPassword &&
      agreedToTerms;
    if (!isOrg) return base;
    return base && orgSubtype.length > 0 && orgName.trim().length >= 2;
  }, [fullName, email, phone, password, confirmPassword, agreedToTerms, isOrg, orgSubtype, orgName]);

  const buildForm = (): RegistrationForm => ({
    fullName,
    email: email.trim(),
    password,
    phone,
    idNumber,
    county,
    accountType,
    isOrg,
    orgSubtype,
    orgName,
    businessLocation,
  });

  const validateForm = (): string | null => {
    if (!fullName.trim() || !email.trim() || !password || !phone.trim()) {
      return 'Please fill in all required fields';
    }
    if (phone.replace(/\D/g, '').length < 9) return 'Please enter a valid phone number';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    if (isOrg && (!orgSubtype || !orgName.trim())) {
      return 'Organization name and type are required';
    }
    if (!agreedToTerms) return 'You must agree to the Terms & Conditions';
    return null;
  };

  const finalizeAfterPayment = async (checkoutId: string | null) => {
    const form = formRef.current;
    if (!form) return;
    setPeaMessage('✓ Phone verified! Finishing setup…');
    setPeaStatus('completed');
    const result = await finalizePeaAccount(form, checkoutId, attemptIdRef.current);
    if (!result.ok || !result.userId) {
      setError(result.error ?? 'Could not create account');
      setPeaStatus('failed');
      setLoading(false);
      return;
    }
    await cachePasswordForBiometrics(form.password);
    await fetchProfile(result.userId);
    await refreshProfile();
    captureUserLocation().catch(() => {});
    if (form.isOrg) {
      showDialog({
        title: 'Registration submitted',
        message: 'Your organisation account is pending approval. We will contact you within 48 hours.',
        variant: 'success',
        icon: 'business-outline',
        buttons: [{ text: 'OK', onPress: () => navigation.navigate('Login') }],
      });
    } else {
      log.info('Register', 'PEA success — session active');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!peaCheckoutId || peaStatus !== 'pending') return;
    let cancelled = false;
    void (async () => {
      const poll = await pollPeaPayment(peaCheckoutId);
      if (cancelled) return;
      if (poll.status === 'completed') {
        await logRegistrationAttempt(buildForm(), { status: 'paid' }, attemptIdRef.current);
        await finalizeAfterPayment(peaCheckoutId);
        return;
      }
      if (poll.status === 'failed') {
        setPeaStatus('failed');
        setPeaMessage(poll.message ?? 'Payment failed or cancelled. Try again.');
        await logRegistrationAttempt(
          buildForm(),
          { status: 'failed', failure_reason: poll.message ?? 'Payment failed' },
          attemptIdRef.current,
        );
        setLoading(false);
        return;
      }
      setPeaStatus('failed');
      setPeaMessage(poll.message ?? 'Payment timed out. Try again.');
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [peaCheckoutId, peaStatus]);

  const beginRegistrationPayment = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    const form = buildForm();
    formRef.current = form;
    setLoading(true);
    setError('');

    const blocked = await checkBlockedPhone(form.phone);
    if (blocked) {
      setLoading(false);
      setError('This phone number is not allowed to register. Contact support if this is a mistake.');
      attemptIdRef.current = await logRegistrationAttempt(form, {
        status: 'blocked',
        failure_reason: blocked,
      });
      return;
    }

    attemptIdRef.current = await logRegistrationAttempt(form, { status: 'initiated' });

    try {
      setPeaStatus('sending');
      setPeaMessage('Sending payment prompt to your phone…');
      const stk = await initiatePeaPayment(form, peaAmount);
      if (!stk.ok) {
        if (stk.code === 'account_exists' || stk.code === 'phone_already_activated') {
          setPeaStatus('idle');
          setError(stk.error ?? 'This account or phone is already registered.');
          await logRegistrationAttempt(form, { status: 'duplicate_blocked', failure_reason: stk.code }, attemptIdRef.current);
        } else {
          setPeaStatus('failed');
          setPeaMessage(stk.error ?? 'Payment failed');
          setError(stk.error ?? 'Payment failed');
          await logRegistrationAttempt(form, { status: 'failed', failure_reason: stk.error }, attemptIdRef.current);
        }
        setLoading(false);
        return;
      }

      setPeaCheckoutId(stk.checkoutId ?? null);
      setPeaStatus('pending');
      setPeaMessage(
        stk.alreadyPaid
          ? 'Payment already received — finishing your account…'
          : stk.reused
            ? 'STK push already on your phone — enter your M-Pesa PIN.'
            : `Check your phone and enter your M-Pesa PIN to confirm KES ${peaAmount}. Your account will be created once payment is confirmed.`,
      );
      await logRegistrationAttempt(
        form,
        {
          status: stk.reused ? 'pea_reused' : 'stk_sent',
          checkout_request_id: stk.checkoutId,
        },
        attemptIdRef.current,
      );

      if (stk.alreadyPaid && stk.checkoutId) {
        await logRegistrationAttempt(form, { status: 'paid' }, attemptIdRef.current);
        await finalizeAfterPayment(stk.checkoutId);
        return;
      }
    } catch (err: any) {
      setPeaStatus('failed');
      setError(err.message ?? 'Registration failed');
      setLoading(false);
    }
  };

  const handleRemindMe = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError('');
    const form = buildForm();
    const parts = form.fullName.trim().split(' ');
    const role = form.isOrg ? form.orgSubtype : 'individual';
    try {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName.trim(),
            first_name: parts[0] ?? '',
            last_name: parts.slice(1).join(' ') ?? '',
            role,
            account_type: form.accountType,
            phone: form.phone,
            phone_number: form.phone,
            county: form.county || null,
          },
        },
      });
      if (signUpErr) throw signUpErr;
      const userId = data.user?.id;
      if (!userId) throw new Error('Account could not be created');

      await (supabase as any).from('profiles').update({
        role,
        full_name: form.fullName.trim(),
        phone: form.phone,
        phone_number: form.phone,
        account_type: form.accountType,
        county: form.county || null,
        approval_status: form.isOrg ? 'pending' : 'approved',
        activation_status: 'pending_payment',
        registration_payment_status: 'unpaid',
      }).eq('id', userId);

      supabase.functions.invoke('send-registration-welcome', { body: { user_id: userId, mode: 'deferred' } }).catch(() => {});

      showDialog({
        title: 'Account saved',
        message: 'We created your account. Sign in anytime to complete the one-time registration fee and activate.',
        variant: 'info',
        icon: 'mail-outline',
        buttons: [{ text: 'Sign in', onPress: () => navigation.navigate('Login') }],
      });
    } catch (err: any) {
      setError(err.message ?? 'Could not save account');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    await beginRegistrationPayment();
  };

  const openTerms = () => Linking.openURL(`https://tukua.ai/terms?type=${accountType}`);
  const openPrivacy = () => Linking.openURL('https://tukua.ai/privacy-policy');

  return (
    <View style={styles.root}>
      <ModernBackground />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <GlassAuthCard
              title={step === 'type' ? 'Join Tukua' : 'Create your account'}
              subtitle={
                step === 'type'
                  ? "Kenya's Opportunity Platform — Open to All"
                  : `Registering as ${selectedType?.label ?? accountType}`
              }>
              {step === 'type' ? (
                <>
                  <Text style={styles.sectionLabel}>I am registering as:</Text>
                  {ACCOUNT_TYPES.map((t) => {
                    const selected = accountType === t.id;
                    const expanded = expandedType === t.id;
                    return (
                      <View key={t.id} style={styles.typeBlock}>
                        <TouchableOpacity
                          style={[styles.typeCard, selected && styles.typeCardActive]}
                          onPress={() => setAccountType(t.id)}>
                          <View style={[styles.typeIconWrap, selected && styles.typeIconActive]}>
                            <Ionicons name={t.icon} size={22} color={selected ? Colors.primary : Colors.mutedForeground} />
                          </View>
                          <View style={styles.typeMeta}>
                            <Text style={styles.typeLabel}>{t.label}</Text>
                            <Text style={styles.typeDesc}>{t.shortDesc}</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => setExpandedType(expanded ? null : t.id)}
                            hitSlop={8}>
                            <Ionicons
                              name={expanded ? 'chevron-up' : 'information-circle-outline'}
                              size={20}
                              color={Colors.mutedForeground}
                            />
                          </TouchableOpacity>
                          {selected ? <View style={styles.selectedDot} /> : null}
                        </TouchableOpacity>
                        {expanded ? (
                          <View style={styles.expandBox}>
                            <Text style={styles.expandText}>{t.fullDesc}</Text>
                            <Text style={styles.expandTerms}>Terms: {t.terms}</Text>
                            {t.features.map((f) => (
                              <Text key={f} style={styles.featureLine}>
                                ✓ {f}
                              </Text>
                            ))}
                          </View>
                        ) : null}
                      </View>
                    );
                  })}

                  {selectedType ? (
                    <View style={styles.featuresPanel}>
                      <Text style={styles.featuresTitle}>What you get</Text>
                      {selectedType.features.map((f) => (
                        <Text key={f} style={styles.featureLine}>
                          ✓ {f}
                        </Text>
                      ))}
                    </View>
                  ) : null}

                  <View style={styles.ecitizen}>
                    <Ionicons name="card-outline" size={18} color={Colors.mutedForeground} />
                    <Text style={styles.ecitizenText}>Sign up with eCitizen</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Coming Soon</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep('details')}>
                    <Text style={styles.primaryBtnText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity onPress={() => setStep('type')} style={styles.backRow}>
                    <Text style={styles.backText}>← Change ({selectedType?.label})</Text>
                  </TouchableOpacity>

                  <Text style={styles.fieldLabel}>Full Name *</Text>
                  <AuthTextField hint="Your full name" prefixIcon="person-outline" value={fullName} onChangeText={setFullName} />
                  <View style={styles.gap} />

                  <Text style={styles.fieldLabel}>Phone Number *</Text>
                  <AuthTextField hint="0712345678" keyboardType="phone-pad" prefixIcon="call-outline" value={phone} onChangeText={setPhone} />
                  <View style={styles.gap} />

                  <Text style={styles.fieldLabel}>National ID (optional)</Text>
                  <AuthTextField hint="National ID number" prefixIcon="card-outline" value={idNumber} onChangeText={setIdNumber} />
                  <View style={styles.gap} />

                  <Text style={styles.fieldLabel}>County (optional)</Text>
                  <CountyPicker value={county} onChange={setCounty} />
                  <View style={styles.gap} />

                  {isOrg ? (
                    <>
                      <Text style={styles.fieldLabel}>Organization Type *</Text>
                      <TouchableOpacity style={styles.pickerTrigger} onPress={() => setOrgPickerOpen(true)}>
                        <Text style={orgSubtype ? styles.pickerValue : styles.pickerPlaceholder}>
                          {orgTypes.find((o) => o.slug === orgSubtype)?.label ?? 'Select type'}
                        </Text>
                        <Ionicons name="chevron-down" size={18} color={Colors.mutedForeground} />
                      </TouchableOpacity>
                      {orgSubtype ? (
                        <Text style={styles.hint}>
                          {orgTypes.find((o) => o.slug === orgSubtype)?.description}
                        </Text>
                      ) : null}
                      <View style={styles.gap} />

                      <Text style={styles.fieldLabel}>Organization Name *</Text>
                      <AuthTextField hint="Organization name" prefixIcon="business-outline" value={orgName} onChangeText={setOrgName} />
                      <View style={styles.gap} />

                      <Text style={styles.fieldLabel}>Business Location</Text>
                      <CountyPicker value={businessLocation} onChange={setBusinessLocation} placeholder="Business county" />
                      <View style={styles.gap} />
                    </>
                  ) : null}

                  <Text style={styles.fieldLabel}>Email Address *</Text>
                  <AuthTextField hint="you@example.com" keyboardType="email-address" autoCapitalize="none" prefixIcon="mail-outline" value={email} onChangeText={setEmail} />
                  <View style={styles.gap} />

                  <Text style={styles.fieldLabel}>Password *</Text>
                  <AuthTextField hint="At least 6 characters" isPassword obscure={obscure} onToggleObscure={() => setObscure((v) => !v)} value={password} onChangeText={setPassword} />
                  <View style={styles.gap} />

                  <Text style={styles.fieldLabel}>Confirm Password *</Text>
                  <AuthTextField hint="Confirm password" isPassword obscure={obscure} onToggleObscure={() => setObscure((v) => !v)} value={confirmPassword} onChangeText={setConfirmPassword} />
                  <View style={styles.gap} />

                  <PeaRegistrationCard
                    phone={phone}
                    peaStatus={peaStatus}
                    peaMessage={peaMessage}
                    peaAmount={peaAmount}
                    loaded={peaConfigLoaded}
                  />

                  <TouchableOpacity style={styles.termsRow} onPress={() => setAgreedToTerms((v) => !v)}>
                    <Ionicons
                      name={agreedToTerms ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={agreedToTerms ? Colors.primary : Colors.mutedForeground}
                    />
                    <Text style={styles.termsText}>
                      I agree to the{' '}
                      <Text style={styles.termsLink} onPress={openTerms}>
                        Terms
                      </Text>{' '}
                      and{' '}
                      <Text style={styles.termsLink} onPress={openPrivacy}>
                        Privacy Policy
                      </Text>
                      , and consent to Tukua sharing my profile with partner organisations.
                      {isOrg ? (
                        <Text style={styles.orgWarn}>
                          {'\n'}Organisation accounts require approval before access is granted.
                        </Text>
                      ) : null}
                    </Text>
                  </TouchableOpacity>

                  {error ? (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  {loading ? (
                    <ActivityIndicator color={Colors.primary} style={{ marginTop: 12 }} />
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[styles.primaryBtn, (!canRegister || !peaConfigLoaded || peaStatus === 'pending' || peaStatus === 'sending') && styles.btnDisabled]}
                        onPress={handleRegister}
                        disabled={!canRegister || !peaConfigLoaded || peaStatus === 'pending' || peaStatus === 'sending' || peaStatus === 'completed'}>
                        <Text style={styles.primaryBtnText}>
                          {peaStatus === 'sending'
                            ? 'Sending M-Pesa prompt…'
                            : peaStatus === 'pending'
                              ? 'Waiting for your PIN…'
                              : `Complete registration — KES ${peaAmount}`}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.remindBtn, (loading || peaStatus === 'pending' || peaStatus === 'sending') && styles.btnDisabled]}
                        onPress={handleRemindMe}
                        disabled={loading || peaStatus === 'pending' || peaStatus === 'sending'}>
                        <Text style={styles.remindBtnText}>Remind me later — save without paying now</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              )}
            </GlassAuthCard>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Already have an account? Sign in</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal visible={orgPickerOpen} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setOrgPickerOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Organization type</Text>
            <ScrollView>
              {orgTypes.map((o) => (
                <TouchableOpacity
                  key={o.slug}
                  style={styles.modalRow}
                  onPress={() => {
                    setOrgSubtype(o.slug);
                    setOrgPickerOpen(false);
                  }}>
                  <Text style={styles.modalRowText}>{o.label}</Text>
                  {orgSubtype === o.slug ? (
                    <Ionicons name="checkmark" size={18} color={Colors.primary} />
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { alignItems: 'center', padding: 20, paddingBottom: 40 },
  gap: { height: 12 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: Colors.foreground, marginBottom: 8 },
  typeBlock: { marginBottom: 8 },
  typeCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  typeCardActive: { borderColor: Colors.primary, backgroundColor: 'rgba(31,139,76,0.06)' },
  typeIconWrap: { padding: 8, borderRadius: 8, backgroundColor: Colors.muted },
  typeIconActive: { backgroundColor: 'rgba(31,139,76,0.12)' },
  typeMeta: { flex: 1 },
  typeLabel: { fontSize: 15, fontWeight: '700', color: Colors.foreground },
  typeDesc: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2 },
  selectedDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  expandBox: {
    marginTop: 4,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  expandText: { fontSize: 12, color: Colors.mutedForeground, marginBottom: 6 },
  expandTerms: { fontSize: 11, color: Colors.foreground, marginBottom: 6 },
  featureLine: { fontSize: 12, color: Colors.foreground, marginTop: 4 },
  featuresPanel: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(31,139,76,0.25)',
    backgroundColor: 'rgba(31,139,76,0.05)',
    marginBottom: 12,
  },
  featuresTitle: { fontSize: 13, fontWeight: '700', color: Colors.foreground, marginBottom: 6 },
  ecitizen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  ecitizenText: { flex: 1, fontSize: 13, color: Colors.mutedForeground },
  badge: { backgroundColor: 'rgba(31,139,76,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 10, color: Colors.primary, fontWeight: '700' },
  backRow: { marginBottom: 12 },
  backText: { color: Colors.primary, fontWeight: '600', fontSize: 13 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.foreground, marginBottom: 6 },
  pickerTrigger: {
    height: 45,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
  },
  pickerValue: { fontSize: 14, color: Colors.foreground },
  pickerPlaceholder: { fontSize: 14, color: Colors.mutedForeground },
  hint: { fontSize: 11, color: Colors.mutedForeground, marginTop: 4 },
  termsRow: { flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'flex-start' },
  termsText: { flex: 1, fontSize: 11, color: Colors.foreground, lineHeight: 16 },
  termsLink: { color: Colors.primary, fontWeight: '700' },
  orgWarn: { color: Colors.destructive, fontWeight: '600' },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  errorText: { color: Colors.destructive, textAlign: 'center', fontSize: 13 },
  primaryBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  remindBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  remindBtnText: { fontSize: 12, fontWeight: '600', color: Colors.mutedForeground, textAlign: 'center', paddingHorizontal: 8 },
  loginLink: { marginTop: 20, color: Colors.primary, fontWeight: '700', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
    padding: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  modalRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalRowText: { fontSize: 14, color: Colors.foreground },
});
