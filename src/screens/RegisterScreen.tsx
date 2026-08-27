/**
 * Native PEA registration — Student / Parent / Teacher / school staff.
 * Schools and organisations register on Tukua web. Nest REST only.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  findNodeHandle,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
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
  checkTukuaAccount,
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
import { kenyaMobileError } from '../lib/phoneUtils';
import { hideSystemStatusBar } from '../components/ImmersiveSystemBars';
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
      'Join as a student. Optionally link your school now. No extra steps after login. You can skip and fill later.',
    features: ['School link optional', 'Courses & AI guidance', 'Opportunities & events'],
    icon: 'school-outline',
  },
  {
    id: 'parent',
    label: 'Parent',
    shortDesc: 'Follow fees, grades & attendance',
    fullDesc:
      'Register as a parent. Optionally pick a school now — after login you select your student. You can skip and fill later.',
    features: ['Link student after login', 'Fees, grades & attendance', 'Messages from school'],
    icon: 'people-outline',
  },
  {
    id: 'teacher',
    label: 'Teacher',
    shortDesc: 'Teach, mark & manage your classes',
    fullDesc:
      'Register as a teacher. Optionally pick a school now — after login you add workload (at least one subject). You can skip and fill later.',
    features: ['Add workload after login', 'Classes, marks & attendance', 'Desk after school link'],
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
  const [studentSchools, setStudentSchools] = useState<RegistrationSchoolHit[]>([]);
  const [studentAdmissions, setStudentAdmissions] = useState<Record<string, string>>({});
  const pendingSchoolJoinRef = useRef<{
    joins: Array<{ organization_id: string; admission_number?: string }>;
  } | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const deferredOkRef = useRef(false);
  const accessTokenRef = useRef<string | null>(null);
  const keyboardTopRef = useRef(0);
  const scrollYRef = useRef(0);
  const focusedTargetRef = useRef<unknown>(null);
  const [keyboardPad, setKeyboardPad] = useState(0);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) => {
      keyboardTopRef.current = e.endCoordinates?.screenY || 0;
      setKeyboardPad(e.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener(hideEvt, () => {
      keyboardTopRef.current = 0;
      setKeyboardPad(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      hideSystemStatusBar();
    }, []),
  );

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

  const schoolsToJoin: RegistrationSchoolHit[] =
    accountType === 'student'
      ? studentSchools
      : wantSchool && selectedSchool
        ? [selectedSchool]
        : [];

  useEffect(() => {
    const parentPicked = accountType !== 'student' && !!selectedSchool;
    if (step !== 'schoolJoin' || !wantSchool || parentPicked) {
      if (schoolQuery.trim().length < 2 && !selectedSchool) setSchoolHits([]);
      return;
    }
    if (schoolQuery.trim().length < 2) {
      setSchoolHits([]);
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
  }, [step, wantSchool, schoolQuery, selectedSchool, accountType]);

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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return 'Enter a valid email address';
    }
    const phoneErr = kenyaMobileError(phone);
    if (phoneErr) return phoneErr;
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    if (!agreedToTerms) return 'Tick the box to agree to the Terms and Privacy Policy.';
    return null;
  };

  const scrollFieldIntoView = (target: unknown) => {
    const run = () => {
      const inputNode = findNodeHandle(target as number);
      if (!inputNode) return;
      UIManager.measureInWindow(inputNode, (_x, y, _w, h) => {
        const kbTop = keyboardTopRef.current;
        if (kbTop <= 0) return;
        const overflow = y + h + 28 - kbTop;
        if (overflow > 4) {
          scrollRef.current?.scrollTo({
            y: Math.max(0, scrollYRef.current + overflow),
            animated: true,
          });
        }
      });
    };
    setTimeout(run, Platform.OS === 'ios' ? 120 : 50);
    setTimeout(run, Platform.OS === 'ios' ? 380 : 280);
  };

  const onFieldFocus = (e: { target?: unknown }) => {
    focusedTargetRef.current = e?.target;
    scrollFieldIntoView(e?.target);
  };

  useEffect(() => {
    if (keyboardPad <= 0 || !focusedTargetRef.current) return;
    scrollFieldIntoView(focusedTargetRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyboardPad]);

  /** Tukua-wide email/phone — not school membership. Skip-school still checks this. */
  const assertTukuaAvailable = async (): Promise<boolean> => {
    setLoading(true);
    try {
      const r = await checkTukuaAccount(email.trim(), phone);
      // 404 = older Nest without register-check — continue; register itself enforces uniqueness.
      if (r.status === 404 || r.status === 0) return true;
      if (r.ok && r.data?.exists && !r.data?.unpaid) {
        setError('This email or phone is already registered on Tukua. Sign in.');
        return false;
      }
      return true;
    } catch {
      return true;
    } finally {
      setLoading(false);
    }
  };

  const pendingJoinFromUi = () => {
    if (!schoolsToJoin.length) return null;
    return {
      joins: schoolsToJoin.map((h) => ({
        organization_id: h.id,
        admission_number:
          accountType === 'student' ? studentAdmissions[h.id]?.trim() || undefined : undefined,
      })),
    };
  };

  const applySchoolJoinIfNeeded = async (accessToken?: string) => {
    const pending = pendingSchoolJoinRef.current;
    if (!pending?.joins.length || !accessToken) return;
    const role = accountType === 'parent' || accountType === 'teacher' ? accountType : 'student';
    for (const join of pending.joins) {
      try {
        const r = await joinSchoolAfterRegister(accessToken, {
          organization_id: join.organization_id,
          role,
          admission_number: join.admission_number || null,
        });
        if (r.ok) {
          log.info('Register', 'school join ok', join.organization_id);
        } else {
          log.warn('Register', 'school join failed', r.message);
        }
      } catch (e) {
        log.warn('Register', 'school join error', String(e));
      }
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
            joinRole === 'parent'
              ? 'Account ready — your parent school request was sent. The school must approve it.'
              : pendingSchoolJoinRef.current && pendingSchoolJoinRef.current.joins.length > 1
                ? 'Account ready — you are linked to your schools.'
                : 'Account ready — you are linked to your school.',
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
      const poll = await pollPeaPayment(peaCheckoutId, 40, 3000, accessTokenRef.current);
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
      setError(validationError);
      if (!agreedToTerms) setStep('details');
      return;
    }
    if (canJoinSchool) {
      if (accountType === 'student' && wantSchool && studentSchools.length === 0) {
        setError('Add a school from search, or skip.');
        setStep('schoolJoin');
        return;
      }
      if (accountType !== 'student' && wantSchool && !selectedSchool) {
        setError('Select a school, or go back and choose Skip.');
        setStep('schoolJoin');
        return;
      }
    }
    pendingSchoolJoinRef.current = pendingJoinFromUi();

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
      if (!deferredOkRef.current) {
        const { registerDeferredAccount } = await import('../lib/peaRegistrationFlow');
        const reg = await registerDeferredAccount(form);
        if (!reg.ok) {
          setLoading(false);
          setPeaStatus('idle');
          setError(humanizeError(reg.error || 'Could not save account'));
          return;
        }
        if (reg.accessToken) {
          accessTokenRef.current = reg.accessToken;
          await applySchoolJoinIfNeeded(reg.accessToken);
        }
        deferredOkRef.current = true;
      }
      if (!accessTokenRef.current) {
        setLoading(false);
        setPeaStatus('idle');
        setError('Could not start payment. Go back one step and tap Continue, then Complete again.');
        return;
      }

      setPeaStatus('sending');
      setPeaMessage('Sending payment prompt to your phone…');
      const stk = await initiatePeaPayment(form, peaAmount, accessTokenRef.current);
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

  const goNextFromDetails = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    if (!(await assertTukuaAvailable())) return;
    if (canJoinSchool) {
      setStep('schoolJoin');
      return;
    }
    formRef.current = buildForm();
    pendingSchoolJoinRef.current = null;
    setStep('payment');
  };

  const openTerms = () => Linking.openURL(`${TukuaWeb.base}/terms?type=${accountType}`);
  const openPrivacy = () => Linking.openURL(`${TukuaWeb.base}/privacy-policy`);
  const openWebRegister = () => Linking.openURL(`${TukuaWeb.base}${TukuaWeb.register}`);

  return (
    <View style={styles.root}>
      <ThemedPageSvg />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={undefined}>
          <ScrollView
            ref={scrollRef}
            style={styles.scrollView}
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: padH,
              paddingTop: s(20),
              paddingBottom: Math.max(layout.bottomPad, 24) + keyboardPad + (keyboardPad > 0 ? 24 : 0),
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            keyboardOpeningTime={0}
            automaticallyAdjustKeyboardInsets={false}
            showsVerticalScrollIndicator
            bounces
            overScrollMode="always"
            nestedScrollEnabled
            removeClippedSubviews={false}
            scrollEventThrottle={16}
            onScroll={(e) => {
              scrollYRef.current = e.nativeEvent.contentOffset.y;
            }}
            scrollEnabled>
            <View style={[styles.formCol, { width: layout.formWidth, alignSelf: 'center' }]}>
              <Text style={[styles.screenTitle, { fontSize: font(22) }]}>Register</Text>
              <Text style={[styles.screenSub, { fontSize: font(12) }]}>
                {step === 'type'
                  ? 'Choose how you will use Tukua'
                  : step === 'schoolJoin'
                    ? accountType === 'student'
                      ? 'Add school(s) now, or skip and join later. Students are linked automatically.'
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
                    onFocus={onFieldFocus}
                  />
                  <View style={{ height: layout.formGap }} />
                  <AuthTextField
                    hint="Phone number *"
                    keyboardType="phone-pad"
                    suffixIcon="call-outline"
                    value={phone}
                    onChangeText={setPhone}
                    onFocus={onFieldFocus}
                  />
                  <View style={{ height: layout.formGap }} />
                  <AuthTextField
                    hint="National ID (optional)"
                    suffixIcon="card-outline"
                    keyboardType="number-pad"
                    inputMode="numeric"
                    maxLength={8}
                    value={idNumber}
                    onChangeText={(t) => setIdNumber(t.replace(/\D/g, ''))}
                    onFocus={onFieldFocus}
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
                    onFocus={onFieldFocus}
                  />
                  <View style={{ height: layout.formGap }} />
                  <AuthTextField
                    hint="Password *"
                    isPassword
                    obscure={obscure}
                    onToggleObscure={() => setObscure((v) => !v)}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={onFieldFocus}
                  />
                  <View style={{ height: layout.formGap }} />
                  <AuthTextField
                    hint="Confirm password *"
                    isPassword
                    obscure={obscure}
                    onToggleObscure={() => setObscure((v) => !v)}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={onFieldFocus}
                  />
                  <View style={{ height: layout.formGap }} />

                  <TouchableOpacity
                    style={[styles.termsRow, /terms|privacy|agree/i.test(error) && styles.termsRowErr]}
                    onPress={() => {
                      setAgreedToTerms((v) => !v);
                      if (/terms|privacy|agree/i.test(error)) setError('');
                    }}>
                    <Ionicons
                      name={agreedToTerms ? 'checkbox' : 'square-outline'}
                      size={s(22)}
                      color={
                        agreedToTerms
                          ? Colors.brandGreenDark
                          : /terms|privacy|agree/i.test(error)
                            ? Colors.destructive
                            : Colors.mutedForeground
                      }
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
                      ? 'Add one or more schools now — JKUSA, JKUATES, JKUAT IP, and your class school. Skip if you will join later.'
                      : accountType === 'parent'
                        ? 'Pick a school now if you want. After login you will select your student. You can skip and fill later.'
                        : `Pick a school now if you want. After login teachers add workload. You can skip and fill later.`}
                  </Text>

                  {accountType === 'student' ? (
                    <>
                      {studentSchools.map((school) => (
                        <View
                          key={school.id}
                          style={[
                            styles.schoolPickBlock,
                            styles.schoolCardSelected,
                            { padding: s(12), borderRadius: s(14) },
                          ]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(12) }}>
                            {school.logo_url ? (
                              <Image
                                source={{ uri: school.logo_url }}
                                style={[styles.schoolLogo, { width: s(44), height: s(44), borderRadius: s(10) }]}
                              />
                            ) : (
                              <View style={[styles.schoolLogoFallback, { width: s(44), height: s(44), borderRadius: s(10) }]}>
                                <Ionicons name="business-outline" size={s(22)} color={Colors.brandGreenDark} />
                              </View>
                            )}
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.schoolName, { fontSize: font(14) }]}>{school.name}</Text>
                              <Text style={[styles.schoolMeta, { fontSize: font(11) }]}>
                                {[school.code, school.county].filter(Boolean).join(' · ') || 'School / organisation'}
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => {
                                setStudentSchools((prev) => prev.filter((p) => p.id !== school.id));
                                setStudentAdmissions((prev) => {
                                  const next = { ...prev };
                                  delete next[school.id];
                                  return next;
                                });
                              }}
                              hitSlop={12}
                              accessibilityLabel={`Remove ${school.name}`}>
                              <Ionicons name="close-circle" size={s(26)} color={Colors.mutedForeground} />
                            </TouchableOpacity>
                          </View>
                          <AuthTextField
                            hint="Admission number (optional)"
                            suffixIcon="card-outline"
                            value={studentAdmissions[school.id] ?? ''}
                            onChangeText={(t) =>
                              setStudentAdmissions((prev) => ({ ...prev, [school.id]: t }))
                            }
                            onFocus={onFieldFocus}
                          />
                        </View>
                      ))}

                      {wantSchool ? (
                        <>
                          <AuthTextField
                            hint="Search and tap to add — pick several"
                            suffixIcon="search-outline"
                            value={schoolQuery}
                            onChangeText={setSchoolQuery}
                            autoCorrect={false}
                            onFocus={onFieldFocus}
                          />
                          {schoolSearching ? (
                            <ActivityIndicator color={Colors.brandGreen} style={{ marginVertical: 12 }} />
                          ) : null}
                          {schoolHits
                            .filter((hit) => !studentSchools.some((s) => s.id === hit.id))
                            .map((hit) => (
                              <TouchableOpacity
                                key={hit.id}
                                style={[
                                  styles.schoolCard,
                                  styles.schoolHitCard,
                                  { padding: s(12), borderRadius: s(14) },
                                ]}
                                onPress={() => {
                                  setStudentSchools((prev) =>
                                    prev.some((p) => p.id === hit.id) ? prev : [...prev, hit],
                                  );
                                  setError('');
                                }}>
                                {hit.logo_url ? (
                                  <Image
                                    source={{ uri: hit.logo_url }}
                                    style={[styles.schoolLogo, { width: s(44), height: s(44), borderRadius: s(10) }]}
                                  />
                                ) : (
                                  <View
                                    style={[
                                      styles.schoolLogoFallback,
                                      { width: s(44), height: s(44), borderRadius: s(10) },
                                    ]}>
                                    <Ionicons name="business-outline" size={s(22)} color={Colors.mutedForeground} />
                                  </View>
                                )}
                                <View style={{ flex: 1 }}>
                                  <Text style={[styles.schoolName, { fontSize: font(14) }]}>{hit.name}</Text>
                                  <Text style={[styles.schoolMeta, { fontSize: font(11) }]}>
                                    {[hit.code, hit.county].filter(Boolean).join(' · ') || 'School / organisation'}
                                  </Text>
                                </View>
                                <Ionicons name="add-circle" size={s(24)} color={Colors.brandGreenDark} />
                              </TouchableOpacity>
                            ))}
                        </>
                      ) : (
                        <TouchableOpacity
                          style={[
                            styles.addSchoolBtn,
                            { padding: s(14), borderRadius: s(14), marginBottom: s(8) },
                          ]}
                          onPress={() => {
                            setWantSchool(true);
                            setError('');
                          }}>
                          <Ionicons name="add-circle-outline" size={s(22)} color={Colors.brandGreenDark} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.choiceTitle, { fontSize: font(14) }]}>
                              {studentSchools.length ? 'Add another school' : 'Add school'}
                            </Text>
                            <Text style={[styles.choiceHint, { fontSize: font(11) }]}>
                              Search once and tap several from the list
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}

                      {studentSchools.length === 0 ? (
                        <TouchableOpacity
                          onPress={() => {
                            setWantSchool(false);
                            setStudentSchools([]);
                            setStudentAdmissions({});
                            setSchoolQuery('');
                            setSchoolHits([]);
                            setError('');
                          }}
                          style={styles.skipRow}>
                          <Text style={[styles.skipText, { fontSize: font(13) }]}>Skip for now</Text>
                        </TouchableOpacity>
                      ) : null}
                    </>
                  ) : (
                    <>
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
                          <Text style={[styles.choiceTitle, { fontSize: font(14) }]}>Find my school/organisation</Text>
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
                          {selectedSchool ? (
                            <View
                              style={[
                                styles.schoolCard,
                                styles.schoolCardSelected,
                                { padding: s(12), borderRadius: s(14), marginBottom: s(20) },
                              ]}>
                              {selectedSchool.logo_url ? (
                                <Image
                                  source={{ uri: selectedSchool.logo_url }}
                                  style={[styles.schoolLogo, { width: s(44), height: s(44), borderRadius: s(10) }]}
                                />
                              ) : (
                                <View
                                  style={[
                                    styles.schoolLogoFallback,
                                    { width: s(44), height: s(44), borderRadius: s(10) },
                                  ]}>
                                  <Ionicons name="business-outline" size={s(22)} color={Colors.brandGreenDark} />
                                </View>
                              )}
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.schoolName, { fontSize: font(14) }]}>{selectedSchool.name}</Text>
                                <Text style={[styles.schoolMeta, { fontSize: font(11) }]}>
                                  {[selectedSchool.code, selectedSchool.county].filter(Boolean).join(' · ') ||
                                    'School / organisation'}
                                </Text>
                                <TouchableOpacity
                                  onPress={() => {
                                    setSelectedSchool(null);
                                    setSchoolHits([]);
                                    setSchoolQuery('');
                                  }}
                                  hitSlop={8}>
                                  <Text style={[styles.schoolChange, { fontSize: font(12) }]}>Change</Text>
                                </TouchableOpacity>
                              </View>
                              <TouchableOpacity
                                onPress={() => {
                                  setSelectedSchool(null);
                                  setSchoolHits([]);
                                  setSchoolQuery('');
                                }}
                                hitSlop={12}
                                accessibilityLabel="Clear selected school">
                                <Ionicons name="close-circle" size={s(26)} color={Colors.mutedForeground} />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <>
                              <AuthTextField
                                hint="Search name, code, or short form…"
                                suffixIcon="search-outline"
                                value={schoolQuery}
                                onChangeText={setSchoolQuery}
                                autoCorrect={false}
                                onFocus={onFieldFocus}
                              />
                              {schoolSearching ? (
                                <ActivityIndicator color={Colors.brandGreen} style={{ marginVertical: 12 }} />
                              ) : null}
                              {schoolHits.map((hit) => (
                                <TouchableOpacity
                                  key={hit.id}
                                  style={[
                                  styles.schoolCard,
                                  styles.schoolHitCard,
                                  { padding: s(12), borderRadius: s(14) },
                                ]}
                                  onPress={() => {
                                    setSelectedSchool(hit);
                                    setSchoolHits([]);
                                    setSchoolQuery('');
                                    setError('');
                                  }}>
                                  {hit.logo_url ? (
                                    <Image
                                      source={{ uri: hit.logo_url }}
                                      style={[styles.schoolLogo, { width: s(44), height: s(44), borderRadius: s(10) }]}
                                    />
                                  ) : (
                                    <View
                                      style={[
                                        styles.schoolLogoFallback,
                                        { width: s(44), height: s(44), borderRadius: s(10) },
                                      ]}>
                                      <Ionicons name="business-outline" size={s(22)} color={Colors.mutedForeground} />
                                    </View>
                                  )}
                                  <View style={{ flex: 1 }}>
                                    <Text style={[styles.schoolName, { fontSize: font(14) }]}>{hit.name}</Text>
                                    <Text style={[styles.schoolMeta, { fontSize: font(11) }]}>
                                      {[hit.code, hit.county].filter(Boolean).join(' · ') || 'School / organisation'}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              ))}
                            </>
                          )}
                        </>
                      ) : null}
                    </>
                  )}

                  {error ? (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  <View style={styles.btnRow}>
                    <AuthButton
                      text="Continue"
                      onPress={async () => {
                        if (accountType === 'student') {
                          if (studentSchools.length === 0 && wantSchool !== false) {
                            setError('Add a school, or skip for now');
                            return;
                          }
                        } else {
                          if (wantSchool === null) {
                            setError('Choose Find my school/organisation or Skip for now');
                            return;
                          }
                          if (wantSchool && !selectedSchool) {
                            setError('Select a school from the search results, or skip');
                            return;
                          }
                        }
                        const validationError = validateForm();
                        if (validationError) {
                          setError(validationError);
                          if (!agreedToTerms) setStep('details');
                          return;
                        }
                        setError('');
                        if (!(await assertTukuaAvailable())) {
                          setStep('details');
                          return;
                        }
                        pendingSchoolJoinRef.current = pendingJoinFromUi();
                        formRef.current = buildForm();
                        setStep('payment');
                      }}
                      enabled={
                        !loading &&
                        (accountType === 'student'
                          ? studentSchools.length > 0 || wantSchool === false
                          : wantSchool !== null)
                      }
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

                  {canJoinSchool && schoolsToJoin.length > 0 ? (
                    <Text style={[styles.linkedSchool, { fontSize: font(13) }]}>
                      Joining:{' '}
                      {schoolsToJoin
                        .map((s) => {
                          const adm = studentAdmissions[s.id]?.trim();
                          return adm ? `${s.name} (${adm})` : s.name;
                        })
                        .join(', ')}
                    </Text>
                  ) : canJoinSchool && wantSchool === false && schoolsToJoin.length === 0 ? (
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
                            peaConfigLoaded &&
                            peaStatus !== 'pending' &&
                            peaStatus !== 'sending' &&
                            peaStatus !== 'completed'
                          }
                        />
                      </View>
                      <Text style={[styles.linkedSchool, { fontSize: font(11), marginTop: 8 }]}>
                        Pay with M-Pesa to finish. If you leave now, you can sign up again later.
                      </Text>
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
  termsRowErr: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.35)',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  termsText: { flex: 1, fontSize: 11, color: Colors.foreground, lineHeight: 16 },
  termsLink: { color: Colors.brandGreenDark, fontWeight: '700' },
  peaWhy: {
    color: Colors.mutedForeground,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 8,
  },
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
  addSchoolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: Colors.brandGreen,
    backgroundColor: 'rgba(10,61,46,0.06)',
    marginTop: 8,
  },
  skipRow: { alignItems: 'center', paddingVertical: 10, marginBottom: 4 },
  skipText: {
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.mutedForeground,
    textDecorationLine: 'underline',
  },
  schoolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    marginTop: 8,
  },
  schoolHitCard: {
    marginTop: 12,
    marginBottom: 6,
  },
  schoolPickBlock: {
    gap: 10,
    marginTop: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  schoolCardSelected: {
    borderColor: Colors.brandGreen,
    backgroundColor: 'rgba(10,61,46,0.06)',
  },
  schoolLogo: {
    backgroundColor: Colors.muted,
  },
  schoolLogoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,61,46,0.08)',
  },
  schoolChange: {
    marginTop: 4,
    color: Colors.brandGreenDark,
    fontFamily: 'Poppins_600SemiBold',
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
