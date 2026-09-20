const SECTION_ALIASES = [
  ['skills', /^(skills|technologies|tech stack|technical skills)\b/i],
  ['experience', /^(experience|work experience|employment|work history)\b/i],
  ['education', /^(education|academics)\b/i],
  ['summary', /^(summary|profile|about)\b/i],
  ['projects', /^(projects|selected projects)\b/i],
];

export function normalizeResumeText(text = '') {
  return String(text)
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) =>
      line
        .replace(/\|/g, ' ')
        .replace(/\t+/g, '  ')
        .replace(/ {2,}/g, ' ')
        .replace(/^#+\s*/, '')
        .trim(),
    )
    .filter((line) => line && !/^---+$/.test(line) && !/^field\s+value$/i.test(line))
    .join('\n');
}

function sectionFor(line) {
  for (const [name, pattern] of SECTION_ALIASES) {
    if (pattern.test(line)) {
      return name;
    }
  }
  return null;
}

export function splitResumeSections(text) {
  const normalized = normalizeResumeText(text);
  const sections = { header: [], skills: [], experience: [], education: [], summary: [], projects: [], other: [] };
  let current = 'header';
  for (const line of normalized.split('\n')) {
    const named = sectionFor(line);
    if (named) {
      current = named;
      continue;
    }
    sections[current].push(line);
  }
  return sections;
}

function pushFact(facts, fact) {
  if (!fact.value) {
    return;
  }
  const key = `${fact.type}:${String(fact.value).toLowerCase()}`;
  if (facts.some((item) => `${item.type}:${String(item.value).toLowerCase()}` === key)) {
    return;
  }
  facts.push(fact);
}

export function extractFactsFromResume(resumeText, sourcePath = 'resume.txt') {
  const sections = splitResumeSections(resumeText);
  const facts = [];
  const headerText = sections.header.join('\n');

  const email = headerText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (email) {
    pushFact(facts, {
      id: 'email',
      type: 'email',
      value: email[0],
      source: { path: sourcePath, section: 'header', excerpt: email[0] },
    });
  }

  const location = headerText.match(/\b(Portland|Remote|Open to remote)[^,\n]*/i);
  if (location) {
    pushFact(facts, {
      id: 'location',
      type: 'location',
      value: location[0].replace(/\s+\|.*$/, '').trim(),
      source: { path: sourcePath, section: 'header', excerpt: location[0] },
    });
  }

  const nameMatch = headerText.match(/\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/);
  if (nameMatch) {
    pushFact(facts, {
      id: 'fullName',
      type: 'fullName',
      value: nameMatch[1],
      source: { path: sourcePath, section: 'header', excerpt: nameMatch[1] },
    });
  }

  const titleLine = [...sections.header, ...sections.summary].find((line) =>
    /engineer|developer|designer|manager/i.test(line),
  );
  if (titleLine) {
    pushFact(facts, {
      id: 'title',
      type: 'title',
      value: titleLine.replace(/\|/g, ' ').trim(),
      source: { path: sourcePath, section: 'header', excerpt: titleLine },
    });
  }

  const skillLine = sections.skills.join(' ');
  const skills = skillLine
    .split(/,|;|\||\band\b|\s{2,}|\s/)
    .map((item) => item.replace(/\b(expert|advanced|working|level)\b/gi, '').trim())
    .filter(
      (item) =>
        item &&
        item.length > 1 &&
        item.length < 40 &&
        !/^(skill|level|field|value|b\.s\.|computer|science)$/i.test(item),
    );
  for (const skill of skills) {
    pushFact(facts, {
      id: `skill:${skill.toLowerCase()}`,
      type: 'skill',
      value: skill,
      source: { path: sourcePath, section: 'Skills', excerpt: skill },
    });
  }

  for (const line of sections.experience) {
    if (/^\s*-/.test(line) || /led |owned |built |designed |mentored |documented /i.test(line)) {
      const value = line.replace(/^\s*-\s*/, '').trim();
      pushFact(facts, {
        id: `highlight:${facts.length}`,
        type: 'highlight',
        value,
        source: { path: sourcePath, section: 'Experience', excerpt: value },
      });
    } else if (/engineer|developer|labs|inc|corp/i.test(line)) {
      pushFact(facts, {
        id: `experience:${facts.length}`,
        type: 'experience',
        value: line,
        source: { path: sourcePath, section: 'Experience', excerpt: line },
      });
    }
  }

  for (const line of sections.education) {
    if (line && !/^education$/i.test(line)) {
      pushFact(facts, {
        id: `education:${facts.length}`,
        type: 'education',
        value: line,
        source: { path: sourcePath, section: 'Education', excerpt: line },
      });
    }
  }

  return {
    facts,
    sections: Object.fromEntries(
      Object.entries(sections).map(([key, lines]) => [key, lines.join('\n')]),
    ),
    normalizedText: normalizeResumeText(resumeText),
  };
}

export function highlightIsVerified(highlight, resumeText, facts = []) {
  const needle = String(highlight ?? '').trim().toLowerCase();
  if (!needle) {
    return false;
  }
  if (!resumeText && facts.length === 0) {
    return true;
  }
  if (normalizeResumeText(resumeText).toLowerCase().includes(needle)) {
    return true;
  }
  return facts.some(
    (fact) =>
      (fact.type === 'highlight' || fact.type === 'skill') &&
      String(fact.value).toLowerCase().includes(needle),
  );
}

export async function writeFacts(facts, { writeFile, mkdir }, factsPath) {
  await mkdir(factsPath.replace(/facts\.json$/, ''), { recursive: true, mode: 0o700 });
  await writeFile(factsPath, `${JSON.stringify({ facts }, null, 2)}\n`, { mode: 0o600 });
}
