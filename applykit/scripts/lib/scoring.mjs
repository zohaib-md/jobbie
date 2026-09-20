const SENIORITY_RANK = {
  intern: 0,
  junior: 1,
  mid: 2,
  senior: 3,
  staff: 4,
  principal: 5,
  lead: 4,
  manager: 3,
};

function normalizeSeniority(value = '') {
  return String(value).trim().toLowerCase();
}

function seniorityDistance(target, posting) {
  const targetRank = SENIORITY_RANK[normalizeSeniority(target)] ?? 2;
  const postingRank = SENIORITY_RANK[normalizeSeniority(posting)] ?? 2;
  return Math.abs(targetRank - postingRank);
}

function mustHaveCoverage(requirements = []) {
  if (!requirements.length) {
    return { coverage: null, met: 0, partial: 0, missing: 0, unclear: 0 };
  }
  const counts = { met: 0, partial: 0, missing: 0, unclear: 0 };
  for (const req of requirements) {
    counts[req.status] = (counts[req.status] ?? 0) + 1;
  }
  const evidenced = counts.met + counts.partial * 0.5;
  return {
    coverage: evidenced / requirements.length,
    ...counts,
  };
}

export function scorePosting(input, profile) {
  const reasons = [];
  let gate = 'review';

  if (input.postingStatus === 'closed') {
    return gateResult('exclude', 0, ['Posting is closed'], false);
  }
  if (input.postingStatus === 'unclear') {
    return gateResult('ask', 0, ['Posting status is unclear'], false);
  }
  if (input.eligibility === 'ineligible') {
    return gateResult('exclude', 0, ['Explicit ineligibility'], false);
  }
  if (input.eligibility === 'unclear') {
    return gateResult('ask', 0, ['Eligibility is unclear'], false);
  }

  if (profile.excludedCompanies?.includes(input.company)) {
    return gateResult('exclude', 0, ['Company is excluded'], false);
  }

  const distance = seniorityDistance(profile.targetSeniority, input.seniority);
  if (distance >= 2) {
    gate = 'skip';
    reasons.push('Seniority mismatch');
  } else if (distance === 1) {
    reasons.push('Adjacent seniority');
  }

  const coverage = mustHaveCoverage(input.mustHaveRequirements);
  if (coverage.coverage !== null && coverage.coverage < 0.5) {
    gate = gate === 'review' ? 'skip' : gate;
    reasons.push('Low must-have coverage');
  }

  let score = 50;
  if (distance === 0) score += 20;
  if (distance === 1) score += 10;
  if (coverage.coverage !== null) score += Math.round(coverage.coverage * 30);
  if (input.workMode && profile.workModes?.includes(input.workMode)) score += 5;
  if (input.compensationBelowFloor) {
    gate = 'skip';
    reasons.push('Compensation below configured floor');
    score -= 20;
  }

  score = Math.max(0, Math.min(100, score));

  if (score < 70 && gate === 'review') {
    gate = 'skip';
    reasons.push('Score below manual review floor');
  }

  const autoEligible =
    gate === 'review' &&
    score >= 80 &&
    distance === 0 &&
    (coverage.coverage ?? 1) >= 0.7;

  return {
    gate,
    score,
    reasons,
    autoEligible,
    mustHaveCoverage: coverage,
  };
}

function gateResult(gate, score, reasons, autoEligible) {
  return { gate, score, reasons, autoEligible, mustHaveCoverage: null };
}
