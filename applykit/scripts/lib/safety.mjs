const RULES = [
  {
    kind: 'captcha',
    action: 'hand-control-to-user',
    pattern:
      /\b(captcha|recaptcha|hcaptcha|i['’]?m not a robot|prove you(?:['’]re| are) human|cloudflare (?:challenge|check)|bot (?:check|detection))\b/i,
    message: 'CAPTCHA detected. Hand control to the candidate. Never solve or bypass it.',
  },
  {
    kind: 'mfa',
    action: 'hand-control-to-user',
    pattern:
      /\b(mfa|2fa|two[-\s]?factor|authenticator(?: app)?|one[-\s]?time (?:code|password)|verification code|otp|sms code)\b/i,
    message: 'MFA or verification-code prompt detected. Hand control to the candidate. Never enter a code.',
  },
  {
    kind: 'login',
    action: 'hand-control-to-user',
    pattern: /\b(password|sign in with|log in with|sso|single sign[-\s]?on|okta|auth0)\b/i,
    message: 'Login or SSO prompt detected. Keep authentication in the candidate browser session.',
  },
  {
    kind: 'government-id',
    action: 'hand-control-to-user',
    pattern:
      /\b(ssn|social security|passport number|national id|driver['’]?s license number|government id)\b/i,
    message: 'Government identifier requested. Do not fill this field.',
  },
  {
    kind: 'legal-attestation',
    action: 'hand-control-to-user',
    pattern:
      /\b(i (?:certify|attest|declare|affirm)|under penalty|export control|legally binding|background check authorization|i agree that (?:all|the) information)\b/i,
    message: 'Legal attestation detected. The candidate must review and complete it.',
  },
  {
    kind: 'demographics',
    action: 'hand-control-to-user',
    pattern:
      /\b(gender|race|ethnicity|veteran status|disability|sexual orientation|hispanic or latino|voluntary self[-\s]?identification)\b/i,
    message: 'Demographic or voluntary self-identification question. Leave this to the candidate.',
  },
];

export function classifySafetyPause({ text = '', field = '' } = {}) {
  const haystack = `${field}\n${text}`;
  for (const rule of RULES) {
    if (rule.pattern.test(haystack)) {
      return {
        pause: true,
        kind: rule.kind,
        action: rule.action,
        message: rule.message,
      };
    }
  }
  return {
    pause: false,
    kind: null,
    action: 'continue',
  };
}

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function proposeAnswer({ question = '', facts = [], resumeText = '' } = {}) {
  const pause = classifySafetyPause({ text: question });
  if (pause.pause) {
    return {
      ...pause,
      status: 'needs-user-input',
      answer: undefined,
    };
  }

  const questionNorm = normalize(question);
  const matchedFact = facts.find((fact) => {
    const value = normalize(fact.value);
    return value && questionNorm.includes(value);
  });

  if (matchedFact) {
    return {
      pause: false,
      status: 'verified',
      kind: null,
      answer: `Verified from résumé (${matchedFact.source?.section ?? 'resume'}): ${matchedFact.value}`,
      source: matchedFact.source,
      factId: matchedFact.id,
    };
  }

  const quoted = question.match(/["“]([^"”]+)["”]/);
  if (quoted && resumeText.toLowerCase().includes(quoted[1].toLowerCase())) {
    return {
      pause: false,
      status: 'verified',
      kind: null,
      answer: `Verified from résumé text: ${quoted[1]}`,
      source: { section: 'resume', excerpt: quoted[1] },
    };
  }

  return {
    pause: true,
    kind: 'unverified-answer',
    action: 'ask-candidate',
    status: 'needs-user-input',
    answer: undefined,
    message: 'No verified résumé or profile fact answers this question. Ask the candidate; do not guess.',
  };
}

export function canSubmit({
  userConfirmation = false,
  platformAllowsAutomation,
  submissionMode = 'review-each',
  autoEligible = false,
} = {}) {
  if (userConfirmation !== true) {
    return {
      allowed: false,
      reason: 'explicit-confirmation-required',
      autoEligible,
      submissionMode,
    };
  }

  return {
    allowed: true,
    mode: 'prepare-and-review',
    reason: null,
    autoEligible,
    submissionMode,
    note:
      platformAllowsAutomation === false
        ? 'Platform prohibits automation. Submit only after the candidate confirms this specific application.'
        : 'Candidate confirmed this submission. Continue pausing for MFA, CAPTCHA, and attestations.',
  };
}
