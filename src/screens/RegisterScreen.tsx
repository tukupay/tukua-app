/**
 * Native PEA registration — Student / Parent / Teacher / school staff.
 * Schools and organisations register on Tukua web. Nest REST only.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthButton } from '../components/auth/AuthButton';
import { AuthTextField } from '../components/auth/AuthTextField';
import { CountyPicker } from '../components/auth/CountyPicker';
import { ThemedPageSvg } from '../components/auth/ThemedPageSvg';
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
import {
  joinSchoolAfterRegister,
  searchRegistrationSchools,
  type RegistrationSchoolHit,
} from '../lib/platformAuthApi';
import { Colors, TukuaWeb } from '../theme/yana';
import { useAuthScale } from '../components/auth/useAuthScale';
import { RootStackParamList } from '../navigation/types';
import { signInWithNestIdentity } from '../lib/auth';
import { useAuth } from '../context/AuthContext';
import { useDeskAuth } from '../context/DeskAuthContext';
import { useDialog } from '../context/DialogContext';
import { captureUserLocation } from '../lib/location';
import { saveDeskCredentials } from '../lib/deskApi';
import { humanizeError } from '../lib/humanizeError';
import { log } from '../lib/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;
type Step = 'type' | 'details' | 'schoolJoin' | 'payment';

type PersonaId = 'student' | 'parent' | 'teacher' | 'school_admin';

const ACCOUNT_TYPES: Array<{
  id: PersonaId;
  label: string;
  shortDesc: string;
  fullDesc: string;
  features: string[];
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    id: 'student',
    label: 'Student',
    shortDesc: 'Learner — courses, school link & opportunities',
    fullDesc:
      'Join as a student. Optionally link your school (auto-approved). Pay the student registration fee set by Tukua.',
    features: ['School link (students auto-approved)', 'Courses & AI guidance', 'Opportunities & events'],
    icon: 'school-outline',
  },
  {
    id: 'parent',
    label: 'Parent',
    shortDesc: 'Follow fees, grades & attendance',
    fullDesc:
      'Register as a parent. You can request to join a school; the school approves the link. Parent PEA applies.',
    features: ['Join a school as parent (pending approval)', 'Fees, grades & attendance', 'Messages from school'],
    icon: 'people-outline',
  },
  {
    id: 'teacher',
    label: 'Teacher',
    shortDesc: 'Teach, mark & manage your classes',
    fullDesc:
      'Register as a teacher. Request to join your school; admin approval is required. Teacher PEA applies.',
    features: ['Join a school as teacher (pending approval)', 'Classes, marks & attendance', 'Desk after school approval'],
    icon: 'easel-outline',
  },
  {
    id: 'school_admin',
    label: 'School staff / admin',
    shortDesc: 'Work at a school — not registering the school itself',
    fullDesc:
      'For principals, bursars and school staff as people. To register the school or an organisation, use Tukua on the web and download Desk.',
    features: ['School-staff PEA', 'Use Desk after your school is on Tukua', 'Not a school or organisation signup'],
    icon: 'briefcase-outline',
  },
];

export function RegisterScreen({ navigation }: Props) {
  const layout = useAuthScale(0.92);
  const { s, font, padH } = layout;

  const { refreshProfile, adoptSession } = useAuth();
  const { connectDesk } = useDeskAuth();
  const { showDialog } = useDialog();

  const [step, setStep] = useState<Step>('type');
  const [accountType, setAccountType] = useState<PersonaId>('student');
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [county, setCounty] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [obscure, setObscure] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [peaConfig, setPeaConfig] = useState<PeaConfig>(DEFAULT_PEA_CONFIG);
  const [peaConfigLoaded, setPeaConfigLoaded] = useState(false);
  const [peaStatus, setPeaStatus] = useState<PeaStatus>('idle');
  const [peaMessage, setPeaMessage] = useState('');
  const [peaCheckoutId, setPeaCheckoutId] = useState<string | null>(null);
  const attemptIdRef = useRef<string | null>(null);
  const formRef = useRef<RegistrationForm | null>(null);

  /** Individual → optional school join (students auto-approved on Nest). */
  const [wantSchool, setWantSchool] = useState<boolean | null>(null);
  const [schoolQuery, setSchoolQuery] = useState('');
  const [schoolHits, setSchoolHits] = useState<RegistrationSchoolHit[]>([]);
  const [schoolSearching, setSchoolSearching] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<RegistrationSchoolHit | null>(null);
  const [admissionNumber, setAdmissionNumber] = useState('');
  const pendingSchoolJoinRef = useRef<{
    organization_id: string;
    admission_number?: string;
  } | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [keyboardPad, setKeyboardPad] = useState(0);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) => {
      setKeyboardPad(e.endCoordinates?.height || 280);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    });
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardPad(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const selectedType = ACCOUNT_TYPES.find((t) => t.id === accountType);
  const peaAmount = peaConfig.amount;
  const peaRole = accountType;
  const canJoinSchool =
    accountType === 'student' || accountType === 'parent' || accountType === 'teacher';

  useEffect(() => {
    setPeaConfigLoaded(false);
    fetchPeaConfig(peaRole).then((cfg) => {
      setPeaConfig(cfg);
      setPeaConfigLoaded(true);
    });
  }, [peaRole]);

  useEffect(() => {
    if (step !== 'schoolJoin' || !wantSchool || schoolQuery.trim().length < 2) {
      if (schoolQuery.trim().length < 2) setSchoolHits([]);
      return;
    }
    let cancelled = false;
    setSchoolSearching(true);
    const t = setTimeout(() => {
      void searchRegistrationSchools(schoolQuery).then((r) => {
        if (cancelled) return;
        setSchoolHits(r.data || []);
        setSchoolSearching(false);
        if (!r.ok && r.message) setError(humanizeError(r.message));
      });
    }, 320);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [step, wantSchool, schoolQuery]);

  const canRegister = useMemo(() => {
    return (
      fullName.trim().length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
      phone.trim().length >= 9 &&
      password.length >= 6 &&
      password === confirmPassword &&
      agreedToTerms
    );
  }, [fullName, email, phone, password, confirmPassword, agreedToTerms]);

  const buildForm = (): RegistrationForm => ({
    fullName,
    email: email.trim(),
    password,
    phone,
    idNumber,
    county,
    accountType,
    role: accountType,
    isOrg: false,
    orgSubtype: '',
    orgName: '',
    businessLocation: '',
  });

  const validateForm = (): string | null => {
    if (!fullName.trim() || !email.trim() || !password || !phone.trim()) {
      return 'Please fill in all required fields';
    }
    if (phone.replace(/\D/g, '').length < 9) return 'Please enter a valid phone number';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    if (!agreedToTerms) return 'You must agree to the Terms & Conditions';
    return null;
  };

  const applySchoolJoinIfNeeded = async (accessToken?: string) => {
    const pending = pendingSchoolJoinRef.current;
    if (!pending || !accessToken) return;
    try {
      const r = await joinSchoolAfterRegister(accessToken, {
        organization_id: pending.organization_id,
        role: accountType === 'parent' || accountType === 'teacher' ? accountType : 'student',
        admission_number: pending.admission_number || null,
      });
      if (r.ok) {
        log.info('Register', 'school join ok', pending.organization_id);
      } else {
        log.warn('Register', 'school join failed', r.message);
      }
    } catch (e) {
      log.warn('Register', 'school join error', String(e));
    }
  };

  const finalizeAfterPayment = async (checkoutId: string | null) => {
    const form = formRef.current;
    if (!form) return;
    setPeaMessage('✓ Phone verified! Finishing setup…');
    setPeaStatus('completed');
    const result = await finalizePeaAccount(form, checkoutId, attemptIdRef.current);
    if (!result.ok || !result.userId) {
      setError(humanizeError(result.error ?? 'Could not create account'));
      setPeaStatus('failed');
      setLoading(false);
      return;
    }
    try {
      await saveDeskCredentials(form.email.trim(), form.password);
      const nest = await signInWithNestIdentity(form.email.trim(), form.password);
      if (nest.session) {
        await adoptSession(nest.session as any);
        await applySchoolJoinIfNeeded(nest.session.access_token);
      }
      try {
        await connectDesk(form.email.trim(), form.password);
      } catch {
        /* Desk LAN optional */
      }
      await refreshProfile();
      captureUserLocation().catch(() => {});
      if (pendingSchoolJoinRef.current) {
        const joinRole = accountType === 'parent' ? 'parent' : accountType === 'teacher' ? 'teacher' : 'student';
        showDialog({
          title: 'Welcome to Tukua',
          message:
            joinRole === 'student'
              ? 'Account ready — you are linked to your school as a student. Desk can remove the link if needed.'
              : `Account ready — your ${joinRole} school request was sent. The school must approve it.`,
          variant: 'success',
          icon: 'checkmark-circle-outline',
        });
      } else {
        log.info('Register', 'PEA success — Nest session active');
      }
    } catch (e: any) {
      setError(humanizeError(e?.message || 'Account created — please sign in.'));
      showDialog({
        title: 'Account created',
        message: 'Sign in with your email and password to continue.',
        variant: 'info',
        icon: 'checkmark-circle-outline',
        buttons: [{ text: 'Sign in', onPress: () => navigation.navigate('Login') }],
      });
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
        setPeaMessage(humanizeError(poll.message ?? 'Payment failed or cancelled. Try again.'));
        setLoading(false);
        return;
      }
      setPeaStatus('failed');
      setPeaMessage(humanizeError(poll.message ?? 'Payment timed out. Try again.'));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peaCheckoutId, peaStatus]);

  const beginRegistrationPayment = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(humanizeError(validationError));
      return;
    }
    if (canJoinSchool && wantSchool && !selectedSchool) {
      setError('Select a school, or go back and choose Skip.');
      setStep('schoolJoin');
      return;
    }
    pendingSchoolJoinRef.current =
      canJoinSchool && wantSchool && selectedSchool
        ? {
            organization_id: selectedSchool.id,
            admission_number: accountType === 'student' ? admissionNumber.trim() || undefined : undefined,
          }
        : null;

    const form = buildForm();
    formRef.current = form;
    setLoading(true);
    setError('');

    const blocked = await checkBlockedPhone(form.phone);
    if (blocked) {
      setLoading(false);
      setError(
        humanizeError(
          'This phone number is not allowed to register. Contact support if this is a mistake.',
        ),
      );
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
          setError(humanizeError(stk.error ?? 'This account or phone is already registered.'));
        } else {
          setPeaStatus('failed');
          setPeaMessage(humanizeError(stk.error ?? 'Payment failed'));
          setError(humanizeError(stk.error ?? 'Payment failed'));
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
            : `Check your phone and enter your M-Pesa PIN to confirm KES ${peaAmount}.`,
      );

      if (stk.alreadyPaid && stk.checkoutId) {
        await finalizeAfterPayment(stk.checkoutId);
        return;
      }
    } catch (err: any) {
      setPeaStatus('failed');
      setError(humanizeError(err.message ?? 'Registration failed'));
      setLoading(false);
    }
  };

  const handleRemindMe = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(humanizeError(validationError));
      return;
    }
    setLoading(true);
    setError('');
    const form = buildForm();
    try {
      const { registerDeferredAccount } = await import('../lib/peaRegistrationFlow');
      const reg = await registerDeferredAccount(form);
      if (!reg.ok) throw new Error(reg.error || 'Account could not be created');
      if (reg.accessToken && canJoinSchool && wantSchool && selectedSchool) {
        await joinSchoolAfterRegister(reg.accessToken, {
          organization_id: selectedSchool.id,
          role: accountType === 'parent' || accountType === 'teacher' ? accountType : 'student',
          admission_number: accountType === 'student' ? admissionNumber.trim() || null : null,
        });
      }
      showDialog({
        title: 'Account saved',
        message:
          'We created your account. Sign in anytime to complete the one-time registration fee and activate.',
        variant: 'info',
        icon: 'mail-outline',
        buttons: [{ text: 'Sign in', onPress: () => navigation.navigate('Login') }],
      });
    } catch (err: any) {
      setError(humanizeError(err.message ?? 'Could not save account'));
    } finally {
      setLoading(false);
    }
  };

  const goNextFromDetails = () => {
    const validationError = validateForm();
    if (validationError) {
      setError(humanizeError(validationError));
      return;
    }
    setError('');
    if (canJoinSchool) {
      setStep('schoolJoin');
      return;
    }
    setStep('payment');
  };

  const openTerms = () => Linking.openURL(`${TukuaWeb.base}/terms?type=${accountType}`);
  const openPrivacy = () => Linking.openURL(`${TukuaWeb.base}/privacy-policy`);
  const openWebRegister = () => Linking.openURL(`${TukuaWeb.base}${TukuaWeb.register}`);

  return (
    <View style={styles.root}>
      <ThemedPageSvg />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
          <ScrollView
            ref={scrollRef}
            style={styles.scrollView}
            contentContainerStyle={{
              paddingHorizontal: padH,
              paddingTop: s(20),
              paddingBottom: Math.max(layout.bottomPad, 28) + 24 + keyboardPad,
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
            bounces
            overScrollMode="always"
            nestedScrollEnabled
            removeClippedSubviews={false}
            scrollEventThrottle={16}>
            <View style={[styles.formCol, { width: layout.formWidth, alignSelf: 'center' }]}>
              <Text style={[styles.screenTitle, { fontSize: font(22) }]}>Register</Text>
              <Text style={[styles.screenSub, { fontSize: font(12) }]}>
                {step === 'type'
                  ? 'Choose how you will use Tukua'
                  : step === 'schoolJoin'
                    ? accountType === 'student'
                      ? 'Students are linked automatically. Skip if you are not joining a school yet.'
                      : `Request to join as ${selectedType?.label ?? accountType} — the school must approve.`
                    : step === 'payment'
                      ? 'Pay to complete registration'
                      : `Registering as ${selectedType?.label ?? accountType}`}
              </Text>
              <View style={{ height: layout.formGap }} />

              {step === 'type' ? (
                <>
                  {ACCOUNT_TYPES.map((t) => {
                    const selected = accountType === t.id;
                    const expanded = expandedType === t.id;
                    return (
                      <View key={t.id} style={styles.typeBlock}>
                        <TouchableOpacity
                        style={[
                          styles.typeCard,
                          selected && styles.typeCardActive,
                          { gap: s(10), padding: s(14), borderRadius: s(14) },
                        ]}
                          onPress={() => setAccountType(t.id)}
                          activeOpacity={0.85}>
                          <View style={[styles.typeIconWrap, selected && styles.typeIconActive]}>
                            <Ionicons
                              name={t.icon}
                              size={s(22)}
                              color={selected ? Colors.white : Colors.mutedForeground}
                            />
                          </View>
                          <View style={styles.typeMeta}>
                            <Text style={[styles.typeLabel, selected && styles.typeLabelOn, { fontSize: font(15) }]}>
                              {t.label}
                            </Text>
                            <Text style={[styles.typeDesc, selected && styles.typeDescOn, { fontSize: font(12) }]}>
                              {t.shortDesc}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => setExpandedType(expanded ? null : t.id)}
                            hitSlop={8}>
                            <Ionicons
                              name={expanded ? 'chevron-up' : selected ? 'checkmark-circle' : 'information-circle-outline'}
                              size={s(22)}
                              color={selected ? Colors.white : Colors.mutedForeground}
                            />
                          </TouchableOpacity>
                        </TouchableOpacity>
                        {expanded ? (
                          <View style={styles.expandBox}>
                            <Text style={styles.expandText}>{t.fullDesc}</Text>
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
                  <View style={styles.webHint}>
                    <Text style={[styles.webHintText, { fontSize: font(11), lineHeight: font(16) }]}>
                      Schools and organisations register on Tukua web, then download Tukua Desk. This app is for
                      students, parents, teachers and school staff.
                    </Text>
                    <TouchableOpacity onPress={openWebRegister} hitSlop={8}>
                      <Text style={[styles.webHintLink, { fontSize: font(12) }]}>Open Tukua web →</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.btnRow}>
                    <AuthButton text="Continue" onPress={() => setStep('details')} />
                  </View>
                </>
              ) : null}

              {step === 'details' ? (
                <>
                  <TouchableOpacity onPress={() => setStep('type')} style={styles.backRow}>
                    <Text style={[styles.backText, { fontSize: font(13) }]}>← Change ({selectedType?.label})</Text>
                  </TouchableOpacity>
                  <AuthTextField
                    hint="Full name *"
                    suffixIcon="person-outline"
                    autoCapitalize="words"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                  <View style={{ height: layout.formGap }} />
                  <AuthTextField
                    hint="Phone number *"
                    keyboardType="phone-pad"
                    suffixIcon="call-outline"
                    value={phone}
                    onChangeText={setPhone}
                  />
                  <View style={{ height: layout.formGap }} />
                  <AuthTextField
                    hint="National ID (optional)"
                    suffixIcon="card-outline"
                    value={idNumber}
                    onChangeText={setIdNumber}
                  />
                  <View style={{ height: layout.formGap }} />
                  <CountyPicker value={county} onChange={setCounty} />
                  <View style={{ height: layout.formGap }} />

                  <AuthTextField
                    hint="Email address *"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    suffixIcon="mail-outline"
                    value={email}
                    onChangeText={setEmail}
                  />
                  <View style={{ height: layout.formGap }} />
                  <AuthTextField
                    hint="Password *"
                    isPassword
                    obscure={obscure}
                    onToggleObscure={() => setObscure((v) => !v)}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <View style={{ height: layout.formGap }} />
                  <AuthTextField
                    hint="Confirm password *"
                    isPassword
                    obscure={obscure}
                    onToggleObscure={() => setObscure((v) => !v)}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <View style={{ height: layout.formGap }} />

                  <TouchableOpacity
                    style={styles.termsRow}
                    onPress={() => setAgreedToTerms((v) => !v)}>
                    <Ionicons
                      name={agreedToTerms ? 'checkbox' : 'square-outline'}
                      size={s(22)}
                      color={agreedToTerms ? Colors.brandGreenDark : Colors.mutedForeground}
                    />
                    <Text style={[styles.termsText, { fontSize: font(11), lineHeight: font(16) }]}>
                      I agree to the{' '}
                      <Text style={styles.termsLink} onPress={openTerms}>
                        Terms
                      </Text>{' '}
                      and{' '}
                      <Text style={styles.termsLink} onPress={openPrivacy}>
                        Privacy Policy
                      </Text>
                      .
                    </Text>
                  </TouchableOpacity>

                  {error ? (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  <View style={styles.btnRow}>
                    <AuthButton text="Continue" onPress={goNextFromDetails} enabled={!loading} />
                  </View>
                </>
              ) : null}

              {step === 'schoolJoin' ? (
                <>
                  <TouchableOpacity onPress={() => setStep('details')} style={styles.backRow}>
                    <Text style={[styles.backText, { fontSize: font(13) }]}>← Back to details</Text>
                  </TouchableOpacity>

                  <Text style={[styles.prompt, { fontSize: font(13), lineHeight: font(19) }]}>
                    {accountType === 'student'
                      ? 'Join your school now? Students are linked automatically — the school can remove you later on Desk.'
                      : `Join your school as ${selectedType?.label ?? 'staff'}? The school must approve before school features unlock.`}
                  </Text>
                  <View style={[styles.choiceRow, { gap: s(10) }]}>
                    <TouchableOpacity
                      style={[
                        styles.choiceCard,
                        wantSchool === true && styles.choiceCardOn,
                        { padding: s(14), borderRadius: s(14) },
                      ]}
                      onPress={() => setWantSchool(true)}>
                      <Ionicons
                        name="search"
                        size={s(20)}
                        color={wantSchool ? Colors.brandGreenDark : Colors.mutedForeground}
                      />
                      <Text style={[styles.choiceTitle, { fontSize: font(14) }]}>Find my school</Text>
                      <Text style={[styles.choiceHint, { fontSize: font(11) }]}>
                        Search & join as {selectedType?.label ?? 'member'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.choiceCard,
                        wantSchool === false && styles.choiceCardOn,
                        { padding: s(14), borderRadius: s(14) },
                      ]}
                      onPress={() => {
                        setWantSchool(false);
                        setSelectedSchool(null);
                      }}>
                      <Ionicons
                        name="person-outline"
                        size={s(20)}
                        color={wantSchool === false ? Colors.brandGreenDark : Colors.mutedForeground}
                      />
                      <Text style={[styles.choiceTitle, { fontSize: font(14) }]}>Skip for now</Text>
                      <Text style={[styles.choiceHint, { fontSize: font(11) }]}>Continue without a school</Text>
                    </TouchableOpacity>
                  </View>

                  {wantSchool ? (
                    <>
                      <AuthTextField
                        hint="Search school name…"
                        suffixIcon="search-outline"
                        value={schoolQuery}
                        onChangeText={setSchoolQuery}
                        autoCorrect={false}
                      />
                      {schoolSearching ? (
                        <ActivityIndicator color={Colors.brandGreen} style={{ marginVertical: 12 }} />
                      ) : null}
                      {schoolHits.map((hit) => {
                        const on = selectedSchool?.id === hit.id;
                        return (
                          <TouchableOpacity
                            key={hit.id}
                            style={[styles.schoolRow, on && styles.schoolRowOn, { padding: s(12), borderRadius: s(12) }]}
                            onPress={() => setSelectedSchool(hit)}>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.schoolName, { fontSize: font(14) }]}>{hit.name}</Text>
                              <Text style={[styles.schoolMeta, { fontSize: font(11) }]}>
                                {[hit.code, hit.county].filter(Boolean).join(' · ') || 'School'}
                              </Text>
                            </View>
                            {on ? (
                              <Ionicons name="checkmark-circle" size={s(22)} color={Colors.brandGreen} />
                            ) : null}
                          </TouchableOpacity>
                        );
                      })}
                      {selectedSchool && accountType === 'student' ? (
                        <>
                          <View style={{ height: layout.formGap }} />
                          <AuthTextField
                            hint="Admission number (optional)"
                            suffixIcon="card-outline"
                            value={admissionNumber}
                            onChangeText={setAdmissionNumber}
                          />
                        </>
                      ) : null}
                    </>
                  ) : null}

                  {error ? (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  <View style={styles.btnRow}>
                    <AuthButton
                      text="Continue to payment"
                      onPress={() => {
                        if (wantSchool === null) {
                          setError('Choose Find my school or Skip for now');
                          return;
                        }
                        if (wantSchool && !selectedSchool) {
                          setError('Select a school from the search results, or skip');
                          return;
                        }
                        setError('');
                        setStep('payment');
                      }}
                      enabled={wantSchool !== null}
                    />
                  </View>
                </>
              ) : null}

              {step === 'payment' ? (
                <>
                  <TouchableOpacity
                    onPress={() => setStep(canJoinSchool ? 'schoolJoin' : 'details')}
                    style={styles.backRow}>
                    <Text style={[styles.backText, { fontSize: font(13) }]}>← Back</Text>
                  </TouchableOpacity>

                  {canJoinSchool && selectedSchool && wantSchool ? (
                    <Text style={[styles.linkedSchool, { fontSize: font(13) }]}>
                      Joining: {selectedSchool.name}
                      {admissionNumber ? ` · Adm ${admissionNumber}` : ''}
                    </Text>
                  ) : canJoinSchool && wantSchool === false ? (
                    <Text style={[styles.linkedSchool, { fontSize: font(13) }]}>
                      {selectedType?.label} account — no school linked yet
                    </Text>
                  ) : null}

                  <PeaRegistrationCard
                    phone={phone}
                    peaStatus={peaStatus}
                    peaMessage={peaMessage}
                    peaAmount={peaAmount}
                    freeTokens={peaConfig.free_tokens}
                    message={peaConfig.message}
                    loaded={peaConfigLoaded}
                    roleLabel={selectedType?.label}
                  />

                  {error ? (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  {loading ? (
                    <View style={[styles.loadingBtn, { height: s(48), borderRadius: s(12) }]}>
                      <ActivityIndicator color={Colors.white} />
                    </View>
                  ) : (
                    <>
                      <View style={styles.btnRow}>
                        <AuthButton
                          text={
                            peaStatus === 'sending'
                              ? 'Sending M-Pesa…'
                              : peaStatus === 'pending'
                                ? 'Waiting for PIN…'
                                : `Complete — KES ${peaAmount}`
                          }
                          onPress={() => void beginRegistrationPayment()}
                          enabled={
                            canRegister &&
                            peaConfigLoaded &&
                            peaStatus !== 'pending' &&
                            peaStatus !== 'sending' &&
                            peaStatus !== 'completed'
                          }
                        />
                      </View>
                      <TouchableOpacity
                        style={[styles.remindBtn, { height: s(44), borderRadius: s(12) }]}
                        onPress={() => void handleRemindMe()}
                        disabled={loading || peaStatus === 'pending' || peaStatus === 'sending'}>
                        <Text style={[styles.remindBtnText, { fontSize: font(12) }]}>
                          Remind me later — save without paying now
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              ) : null}

              <TouchableOpacity
                style={[styles.loginLink, { marginTop: s(20) }]}
                onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.loginLinkText, { fontSize: font(14) }]}>Already have an account? Sign in</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  safe: { flex: 1, width: '100%', zIndex: 2 },
  flex: { flex: 1 },
  scrollView: { flex: 1 },
  formCol: { width: '100%' },
  screenTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
  },
  screenTitleSmall: { fontSize: 15 },
  screenSub: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  typeBlock: { marginBottom: 8 },
  typeCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  onPhotoText: {
    color: Colors.white,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  typeCardActive: {
    backgroundColor: Colors.orangeAccent,
    borderColor: '#ffffff',
    borderWidth: 2,
  },
  typeIconWrap: { padding: 8, borderRadius: 10, backgroundColor: Colors.muted },
  typeIconActive: { backgroundColor: 'rgba(255,255,255,0.22)' },
  typeMeta: { flex: 1 },
  typeLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.foreground,
    fontFamily: 'Poppins_600SemiBold',
  },
  typeLabelOn: { color: Colors.white },
  typeDesc: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2 },
  typeDescOn: { color: 'rgba(255,255,255,0.92)' },
  typeFee: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brandGreenDark,
    fontFamily: 'Poppins_700Bold',
  },
  typeFeeOn: { color: Colors.white },
  webHint: {
    marginTop: 4,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    gap: 6,
  },
  webHintText: {
    color: Colors.mutedForeground,
    fontFamily: 'Poppins_400Regular',
  },
  webHintLink: {
    color: Colors.brandGreenDark,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '700',
  },
  expandBox: {
    marginTop: 4,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  expandText: { fontSize: 12, color: Colors.mutedForeground, marginBottom: 6 },
  featureLine: { fontSize: 12, color: Colors.foreground, marginTop: 4 },
  backRow: { marginBottom: 12 },
  backText: {
    fontWeight: '600',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  termsRow: { flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'flex-start' },
  termsText: { flex: 1, fontSize: 11, color: Colors.foreground, lineHeight: 16 },
  termsLink: { color: Colors.brandGreenDark, fontWeight: '700' },
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
  retry: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.brandGreenDark,
    fontFamily: 'Poppins_600SemiBold',
  },
  btnRow: { width: '100%', flexDirection: 'row', marginTop: 8 },
  loadingBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  remindBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    backgroundColor: Colors.white,
  },
  remindBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mutedForeground,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  loginLink: { marginTop: 20, paddingVertical: 8, alignItems: 'center' },
  loginLinkText: {
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  prompt: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
    fontFamily: 'Poppins_400Regular',
  },
  choiceRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  choiceCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    gap: 4,
  },
  choiceCardOn: {
    borderColor: Colors.brandGreen,
    backgroundColor: 'rgba(10,61,46,0.06)',
  },
  choiceTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.brandGreenDark,
  },
  choiceHint: { fontSize: 11, color: Colors.mutedForeground },
  schoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    marginTop: 8,
  },
  schoolRowOn: {
    borderColor: Colors.brandGreen,
    backgroundColor: 'rgba(10,61,46,0.06)',
  },
  schoolName: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.foreground,
  },
  schoolMeta: { fontSize: 11, color: Colors.mutedForeground, marginTop: 2 },
  linkedSchool: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 10,
    textAlign: 'center',
  },
});
