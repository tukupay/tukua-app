/**
 * Native PEA registration — mirrors web Register (Individual/Student, Organisation, School).
 * Layout matches Login (curve + responsive). Nest REST only.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthButton } from '../components/auth/AuthButton';
import { AuthSelect } from '../components/auth/AuthSelect';
import { AuthTextField } from '../components/auth/AuthTextField';
import { CountyPicker } from '../components/auth/CountyPicker';
import { LogoPartners } from '../components/auth/LogoPartners';
import { PeaRegistrationCard } from '../components/auth/PeaRegistrationCard';
import { GreenPattern } from '../components/dashboard/DashboardBackground';
import { Images } from '../constants/images';
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
  listRegistrationOrgTypes,
  searchRegistrationSchools,
  type RegistrationSchoolHit,
} from '../lib/platformAuthApi';
import { Colors, TukuaWeb } from '../theme/yana';
import { RootStackParamList } from '../navigation/types';
import { signInWithNestIdentity } from '../lib/auth';
import { useAuth } from '../context/AuthContext';
import { useDeskAuth } from '../context/DeskAuthContext';
import { useDialog } from '../context/DialogContext';
import { captureUserLocation } from '../lib/location';
import { saveDeskCredentials } from '../lib/deskApi';
import { humanizeError } from '../lib/humanizeError';
import { log } from '../lib/logger';

const FORM_WIDTH = '92%';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;
type Step = 'type' | 'details' | 'schoolJoin' | 'payment';

type OrgType = { id: string; slug: string; label: string; description: string | null };

const ACCOUNT_TYPES = [
  {
    id: 'individual',
    label: 'Individual / Student',
    shortDesc: 'Opportunities, courses & optional school join',
    fullDesc:
      'Access opportunities, AI guidance, and courses. After signup you can join a school as a student (auto-linked) or skip and use Tukua as an individual.',
    features: [
      'AI career guidance & CV analysis',
      'Optional school link (students auto-approved)',
      'Courses, scholarships & events',
    ],
    icon: 'school-outline' as const,
  },
  {
    id: 'organization',
    label: 'Organisation Partner',
    shortDesc: 'Post opportunities & recruit',
    fullDesc: 'Business, NGO, SACCO, government — post opportunities and manage talent.',
    features: ['Post opportunities', 'Applicant pipeline', 'Platform approval required'],
    icon: 'business-outline' as const,
  },
  {
    id: 'school',
    label: 'School',
    shortDesc: 'College, university or K–12',
    fullDesc:
      'Register your institution. After platform approval, use Tukua Desk for school ERP.',
    features: ['School profile & admins', 'Tukua Desk ERP', 'Platform approval required'],
    icon: 'library-outline' as const,
  },
];

export function RegisterScreen({ navigation }: Props) {
  const { height, width } = useWindowDimensions();
  const layout = useMemo(() => {
    const compact = height < 700;
    const small = height < 640;
    return {
      compact,
      small,
      topCurveH: Math.min(height * (small ? 0.16 : compact ? 0.18 : 0.2), 160),
      spacer: small ? 6 : 10,
      formGap: small ? 10 : 12,
      bottomPad: Math.max(28, height * 0.04),
    };
  }, [height]);

  const { refreshProfile, adoptSession } = useAuth();
  const { connectDesk } = useDeskAuth();
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
  const [orgTypesLoading, setOrgTypesLoading] = useState(false);
  const [orgTypesError, setOrgTypesError] = useState<string | null>(null);
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

  const isOrg = accountType === 'organization';
  const isSchoolAccount = accountType === 'school';
  const needsOrgFields = isOrg || isSchoolAccount;
  const selectedType = ACCOUNT_TYPES.find((t) => t.id === accountType);
  const peaAmount = peaConfig.amount;
  const peaRole = isSchoolAccount ? 'school' : isOrg ? 'organization' : undefined;

  const loadOrgTypes = useCallback(async () => {
    setOrgTypesLoading(true);
    setOrgTypesError(null);
    try {
      const r = await listRegistrationOrgTypes();
      if (r.ok && r.data?.length) {
        setOrgTypes(r.data);
      } else {
        setOrgTypes([]);
        setOrgTypesError(r.message || 'Could not load organisation types. Pull to retry.');
      }
    } catch (e) {
      setOrgTypesError(humanizeError(e));
    } finally {
      setOrgTypesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrgTypes();
  }, [loadOrgTypes]);

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
    const base =
      fullName.trim().length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
      phone.trim().length >= 9 &&
      password.length >= 6 &&
      password === confirmPassword &&
      agreedToTerms;
    if (isOrg) return base && orgSubtype.length > 0 && orgName.trim().length >= 2;
    if (isSchoolAccount) return base && orgName.trim().length >= 2;
    return base;
  }, [
    fullName,
    email,
    phone,
    password,
    confirmPassword,
    agreedToTerms,
    isOrg,
    isSchoolAccount,
    orgSubtype,
    orgName,
  ]);

  const buildForm = (): RegistrationForm => ({
    fullName,
    email: email.trim(),
    password,
    phone,
    idNumber,
    county,
    accountType: isSchoolAccount ? 'organization' : accountType,
    isOrg: needsOrgFields,
    orgSubtype: isSchoolAccount ? 'school' : orgSubtype,
    orgName: needsOrgFields ? orgName : '',
    businessLocation: needsOrgFields ? businessLocation : '',
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
    if (isSchoolAccount && !orgName.trim()) return 'School / institution name is required';
    if (!agreedToTerms) return 'You must agree to the Terms & Conditions';
    return null;
  };

  const applySchoolJoinIfNeeded = async (accessToken?: string) => {
    const pending = pendingSchoolJoinRef.current;
    if (!pending || !accessToken) return;
    try {
      const r = await joinSchoolAfterRegister(accessToken, {
        organization_id: pending.organization_id,
        role: 'student',
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
      if (form.isOrg) {
        showDialog({
          title: 'Registration submitted',
          message: isSchoolAccount
            ? 'Your school account is pending platform approval. We will contact you within 48 hours.'
            : 'Your organisation account is pending approval. We will contact you within 48 hours.',
          variant: 'success',
          icon: 'business-outline',
          buttons: [{ text: 'OK', onPress: () => navigation.navigate('Login') }],
        });
      } else if (pendingSchoolJoinRef.current) {
        showDialog({
          title: 'Welcome to Tukua',
          message: 'Account ready — you are linked to your school as a student. Desk can remove the link if needed.',
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
    if (accountType === 'individual' && wantSchool && !selectedSchool) {
      setError('Select a school, or go back and choose Skip.');
      setStep('schoolJoin');
      return;
    }
    pendingSchoolJoinRef.current =
      accountType === 'individual' && wantSchool && selectedSchool
        ? {
            organization_id: selectedSchool.id,
            admission_number: admissionNumber.trim() || undefined,
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
      if (reg.accessToken && accountType === 'individual' && wantSchool && selectedSchool) {
        await joinSchoolAfterRegister(reg.accessToken, {
          organization_id: selectedSchool.id,
          role: 'student',
          admission_number: admissionNumber.trim() || null,
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
    if (accountType === 'individual') {
      setStep('schoolJoin');
      return;
    }
    setStep('payment');
  };

  const openTerms = () => Linking.openURL(`${TukuaWeb.base}/terms?type=${accountType}`);
  const openPrivacy = () => Linking.openURL(`${TukuaWeb.base}/privacy-policy`);

  const orgSelectOptions = useMemo(
    () =>
      orgTypes.map((o) => ({
        id: o.slug,
        label: o.label,
        description: o.description,
      })),
    [orgTypes],
  );

  return (
    <View style={styles.root}>
      <View style={[styles.topCurve, { height: layout.topCurveH }]} pointerEvents="none">
        <ImageBackground
          source={Images.curve1}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          imageStyle={styles.topCurveImage}
        />
        <MaskedView
          style={StyleSheet.absoluteFill}
          maskElement={
            <View style={styles.curveMaskRoot}>
              <Image source={Images.curve1} style={styles.curveMaskImage} resizeMode="cover" />
            </View>
          }>
          <View style={styles.curvePattern}>
            <GreenPattern darker />
          </View>
        </MaskedView>
      </View>

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
          <ScrollView
            ref={scrollRef}
            style={styles.scrollView}
            contentContainerStyle={{
              paddingHorizontal: Math.max(16, width * 0.04),
              paddingTop: 8,
              paddingBottom: layout.bottomPad + 24 + keyboardPad,
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
            bounces
            overScrollMode="always"
            nestedScrollEnabled
            removeClippedSubviews={false}
            scrollEventThrottle={16}>
            <View style={[styles.formCol, { width: FORM_WIDTH, maxWidth: width * 0.96, alignSelf: 'center' }]}>
              <LogoPartners compact={layout.compact} onGreen />
              <View style={{ height: layout.spacer }} />
              <Text style={[styles.screenTitle, layout.small && styles.screenTitleSmall]}>
                {step === 'type'
                  ? 'Join Tukua'
                  : step === 'schoolJoin'
                    ? 'Join a school?'
                    : step === 'payment'
                      ? 'Complete registration'
                      : 'Create your account'}
              </Text>
              <Text style={styles.screenSub}>
                {step === 'type'
                  ? "Kenya's Opportunity Platform — Open to All"
                  : step === 'schoolJoin'
                    ? 'Link as a student (auto-approved) or skip for an individual account'
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
                          style={[styles.typeCard, selected && styles.typeCardActive]}
                          onPress={() => setAccountType(t.id)}
                          activeOpacity={0.85}>
                          <View style={[styles.typeIconWrap, selected && styles.typeIconActive]}>
                            <Ionicons
                              name={t.icon}
                              size={22}
                              color={selected ? Colors.brandGreenDark : Colors.mutedForeground}
                            />
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
                  <View style={styles.btnRow}>
                    <AuthButton text="Continue" onPress={() => setStep('details')} />
                  </View>
                </>
              ) : null}

              {step === 'details' ? (
                <>
                  <TouchableOpacity onPress={() => setStep('type')} style={styles.backRow}>
                    <Text style={styles.backText}>← Change ({selectedType?.label})</Text>
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

                  {isOrg ? (
                    <>
                      <AuthSelect
                        value={orgSubtype || null}
                        onChange={setOrgSubtype}
                        options={orgSelectOptions}
                        placeholder="Organisation type *"
                        title="Organisation type"
                        icon="briefcase-outline"
                        loading={orgTypesLoading}
                        emptyText={
                          orgTypesError || 'No types loaded — check connection and reopen'
                        }
                        onOpen={() => {
                          if (!orgTypes.length) void loadOrgTypes();
                        }}
                      />
                      {orgTypesError ? (
                        <TouchableOpacity onPress={() => void loadOrgTypes()}>
                          <Text style={styles.retry}>{orgTypesError} · Tap to retry</Text>
                        </TouchableOpacity>
                      ) : null}
                      <View style={{ height: layout.formGap }} />
                      <AuthTextField
                        hint="Organisation name *"
                        suffixIcon="business-outline"
                        value={orgName}
                        onChangeText={setOrgName}
                      />
                      <View style={{ height: layout.formGap }} />
                      <CountyPicker
                        value={businessLocation}
                        onChange={setBusinessLocation}
                        placeholder="Business county"
                      />
                      <View style={{ height: layout.formGap }} />
                    </>
                  ) : null}

                  {isSchoolAccount ? (
                    <>
                      <AuthTextField
                        hint="School / institution name *"
                        suffixIcon="library-outline"
                        value={orgName}
                        onChangeText={setOrgName}
                      />
                      <View style={{ height: layout.formGap }} />
                      <CountyPicker
                        value={businessLocation}
                        onChange={setBusinessLocation}
                        placeholder="School county"
                      />
                      <View style={{ height: layout.formGap }} />
                    </>
                  ) : null}

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
                      size={22}
                      color={agreedToTerms ? Colors.brandGreenDark : Colors.mutedForeground}
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
                      .
                      {needsOrgFields ? (
                        <Text style={styles.orgWarn}>
                          {'\n'}School and organisation accounts need platform approval.
                        </Text>
                      ) : null}
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
                    <Text style={styles.backText}>← Back to details</Text>
                  </TouchableOpacity>

                  <Text style={styles.prompt}>
                    Do you want to join a school now? Students are linked automatically — the school
                    can remove you later on Desk if needed. Parents still need school approval
                    (use parent flow after signup).
                  </Text>

                  <View style={styles.choiceRow}>
                    <TouchableOpacity
                      style={[styles.choiceCard, wantSchool === true && styles.choiceCardOn]}
                      onPress={() => setWantSchool(true)}>
                      <Ionicons
                        name="search"
                        size={20}
                        color={wantSchool ? Colors.brandGreenDark : Colors.mutedForeground}
                      />
                      <Text style={styles.choiceTitle}>Find my school</Text>
                      <Text style={styles.choiceHint}>Search & join as student</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.choiceCard, wantSchool === false && styles.choiceCardOn]}
                      onPress={() => {
                        setWantSchool(false);
                        setSelectedSchool(null);
                      }}>
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color={wantSchool === false ? Colors.brandGreenDark : Colors.mutedForeground}
                      />
                      <Text style={styles.choiceTitle}>Skip for now</Text>
                      <Text style={styles.choiceHint}>Individual account only</Text>
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
                      {schoolHits.map((s) => {
                        const on = selectedSchool?.id === s.id;
                        return (
                          <TouchableOpacity
                            key={s.id}
                            style={[styles.schoolRow, on && styles.schoolRowOn]}
                            onPress={() => setSelectedSchool(s)}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.schoolName}>{s.name}</Text>
                              <Text style={styles.schoolMeta}>
                                {[s.code, s.county].filter(Boolean).join(' · ') || 'School'}
                              </Text>
                            </View>
                            {on ? (
                              <Ionicons name="checkmark-circle" size={22} color={Colors.brandGreen} />
                            ) : null}
                          </TouchableOpacity>
                        );
                      })}
                      {selectedSchool ? (
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
                    onPress={() =>
                      setStep(accountType === 'individual' ? 'schoolJoin' : 'details')
                    }
                    style={styles.backRow}>
                    <Text style={styles.backText}>← Back</Text>
                  </TouchableOpacity>

                  {accountType === 'individual' && selectedSchool && wantSchool ? (
                    <Text style={styles.linkedSchool}>
                      Joining: {selectedSchool.name}
                      {admissionNumber ? ` · Adm ${admissionNumber}` : ''}
                    </Text>
                  ) : accountType === 'individual' ? (
                    <Text style={styles.linkedSchool}>Individual account — no school linked</Text>
                  ) : null}

                  <PeaRegistrationCard
                    phone={phone}
                    peaStatus={peaStatus}
                    peaMessage={peaMessage}
                    peaAmount={peaAmount}
                    freeTokens={peaConfig.free_tokens}
                    message={peaConfig.message}
                    loaded={peaConfigLoaded}
                  />

                  {error ? (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  {loading ? (
                    <View style={styles.loadingBtn}>
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
                        style={styles.remindBtn}
                        onPress={() => void handleRemindMe()}
                        disabled={loading || peaStatus === 'pending' || peaStatus === 'sending'}>
                        <Text style={styles.remindBtnText}>
                          Remind me later — save without paying now
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              ) : null}

              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLinkText}>Already have an account? Sign in</Text>
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
  topCurve: { position: 'absolute', top: 0, left: 0, right: 0 },
  topCurveImage: { resizeMode: 'cover' },
  curveMaskRoot: { flex: 1, backgroundColor: 'transparent' },
  curveMaskImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  curvePattern: { flex: 1, opacity: 0.88 },
  safe: { flex: 1, width: '100%' },
  flex: { flex: 1 },
  scrollView: { flex: 1 },
  formCol: { width: '100%' },
  screenTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.brandGreenDark,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
  },
  screenTitleSmall: { fontSize: 15 },
  screenSub: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.mutedForeground,
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
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  typeCardActive: {
    borderColor: Colors.brandGreen,
    backgroundColor: 'rgba(10,61,46,0.06)',
  },
  typeIconWrap: { padding: 8, borderRadius: 10, backgroundColor: Colors.muted },
  typeIconActive: { backgroundColor: 'rgba(10,61,46,0.12)' },
  typeMeta: { flex: 1 },
  typeLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.foreground,
    fontFamily: 'Poppins_600SemiBold',
  },
  typeDesc: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2 },
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
    color: Colors.brandGreenDark,
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
    color: Colors.brandGreenDark,
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  prompt: {
    fontSize: 13,
    color: Colors.mutedForeground,
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
    color: Colors.brandGreenDark,
    marginBottom: 10,
    textAlign: 'center',
  },
});
