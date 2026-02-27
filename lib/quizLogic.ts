import questionsData from '@/data/milestoneQuestions.json';
import type {
  QuizQuestion,
  QuizAnswer,
  QuizResult,
  CategoryScore,
  QuizCategory,
  DevelopmentStatus,
} from '@/types';

// ─── Question Filtering ───────────────────────────────────────────────────────

/**
 * Returns all questions applicable to a baby's age in months.
 * Filters using the snake_case age_min / age_max fields (schema v2).
 */
export function getQuestionsForAge(ageMonths: number): QuizQuestion[] {
  return (questionsData.questions as QuizQuestion[]).filter(
    (q) => ageMonths >= q.age_min && ageMonths <= q.age_max
  );
}

// ─── Score Calculation ────────────────────────────────────────────────────────

/**
 * Calculates the full quiz result from an array of user answers.
 *
 * Returns:
 *   totalScore       — weighted sum of earned scores
 *   maxScore         — maximum possible weighted score
 *   percentage       — overall percentage (0–100)
 *   status           — 'On Track' | 'Slight Delay' | 'Needs Attention'
 *   categoryBreakdown — { categoryLabel: percentage } for each category
 *
 * Plus rich UI fields: tier, tierLabel, tierDescription,
 *   categoryScores, highlights, recommendations.
 */
export function calculateQuizResult(answers: QuizAnswer[]): QuizResult {
  if (answers.length === 0) {
    return buildEmptyResult();
  }

  // ── Group by category ────────────────────────────────────────────────────
  const categoryMap = new Map<
    QuizCategory,
    { label: string; raw: number; max: number }
  >();

  for (const answer of answers) {
    const existing = categoryMap.get(answer.category) ?? {
      label: getCategoryLabel(answer.category),
      raw: 0,
      max: 0,
    };
    // Weighted score: earned = option.score × weight, max = 3 × weight
    existing.raw += answer.score * answer.weight;
    existing.max += 3 * answer.weight;
    categoryMap.set(answer.category, existing);
  }

  // ── Per-category scores ──────────────────────────────────────────────────
  const categoryScores: CategoryScore[] = Array.from(categoryMap.entries()).map(
    ([category, data]) => ({
      category,
      categoryLabel: data.label,
      rawScore: parseFloat(data.raw.toFixed(2)),
      maxScore: parseFloat(data.max.toFixed(2)),
      percentage: data.max > 0 ? Math.round((data.raw / data.max) * 100) : 0,
    })
  );

  // ── Totals ───────────────────────────────────────────────────────────────
  const totalRaw = categoryScores.reduce((sum, c) => sum + c.rawScore, 0);
  const totalMax = categoryScores.reduce((sum, c) => sum + c.maxScore, 0);
  const percentage = totalMax > 0 ? Math.round((totalRaw / totalMax) * 100) : 0;

  // ── Tier & status ────────────────────────────────────────────────────────
  const tier = determineTier(percentage);

  // ── Category breakdown map ───────────────────────────────────────────────
  const categoryBreakdown: Record<string, number> = {};
  for (const cs of categoryScores) {
    categoryBreakdown[cs.categoryLabel] = cs.percentage;
  }

  return {
    // Core spec fields
    totalScore: parseFloat(totalRaw.toFixed(2)),
    maxScore: parseFloat(totalMax.toFixed(2)),
    percentage,
    status: tier.status,
    categoryBreakdown,

    // Rich UI fields
    tier: tier.key,
    tierLabel: tier.label,
    tierDescription: tier.description,
    categoryScores,
    highlights: generateHighlights(categoryScores),
    recommendations: generateRecommendations(categoryScores, tier.key),
  };
}

// ─── Tier / Status Logic ──────────────────────────────────────────────────────

type TierKey = QuizResult['tier'];

interface Tier {
  key: TierKey;
  status: DevelopmentStatus;
  label: string;
  description: string;
}

/**
 * Three-tier development status:
 *   >= 70% → On Track
 *   >= 45% → Slight Delay
 *    < 45% → Needs Attention
 */
function determineTier(percentage: number): Tier {
  if (percentage >= 70) {
    return {
      key: 'on-track',
      status: 'On Track',
      label: 'On Track',
      description:
        "Your baby is meeting developmental milestones well. Keep up the wonderful play, conversation, and daily interactions — every moment you spend talking, singing, and playing with your baby makes a real difference.",
    };
  }
  if (percentage >= 45) {
    return {
      key: 'slight-delay',
      status: 'Slight Delay',
      label: 'Slight Delay',
      description:
        "Some milestones are still emerging, which is very common at this age. Focused play activities and daily stimulation can help. If you have any concerns, your child's paediatrician is the best person to speak to for reassurance and guidance.",
    };
  }
  return {
    key: 'needs-attention',
    status: 'Needs Attention',
    label: 'Needs Attention',
    description:
      "Based on your answers, we recommend speaking with your paediatrician soon. Early support from a specialist can make a significant positive difference — you are doing the right thing by checking. Many children with early intervention catch up fully.",
  };
}

// ─── Highlights & Recommendations ────────────────────────────────────────────

function generateHighlights(categoryScores: CategoryScore[]): string[] {
  const strong = categoryScores
    .filter((c) => c.percentage >= 70)
    .sort((a, b) => b.percentage - a.percentage);

  if (strong.length === 0) {
    return ['Every interaction with your baby builds their development — keep it up.'];
  }

  return strong
    .slice(0, 3)
    .map((c) => `Strong ${c.categoryLabel} development (${c.percentage}% achieved)`);
}

function generateRecommendations(
  categoryScores: CategoryScore[],
  tier: TierKey
): string[] {
  const tips: Record<QuizCategory, string> = {
    gross_motor:
      'Give your baby daily floor time and tummy time on a firm mat. Oil massage before bath strengthens muscles and body awareness. Let them roll, crawl, and cruise freely on safe surfaces.',
    fine_motor:
      'Offer safe household objects of different textures — bowls to bang, soft food pieces to pick up, and rattles to grasp. Offering finger foods at meal times is excellent for developing the pincer grip.',
    language:
      'Talk to your baby constantly in your home language — whatever feels most natural to you. Sing nursery rhymes and narrate daily activities out loud. Bilingual and multilingual homes are completely normal; count words across all languages.',
    cognitive:
      'Play peek-a-boo and hide toys under a cloth to build object permanence. Simple cause-and-effect toys (press a button, hear a sound) stimulate thinking. Reading picture books together every day is one of the best things you can do.',
    social_emotional:
      'Respond warmly and consistently to every cry and cue — this builds secure attachment. Include your baby in family gatherings with grandparents and cousins. Consistent daily routines (meals, bath, sleep) help them feel safe and regulate emotions.',
  };

  const developing = categoryScores
    .filter((c) => c.percentage < 60)
    .sort((a, b) => a.percentage - b.percentage);

  const recs: string[] = developing.slice(0, 3).map((c) => tips[c.category]);

  if (tier === 'on-track' && recs.length === 0) {
    recs.push(
      'Keep encouraging active play outdoors — parks, open grounds, or even the terrace are great for gross motor development.',
      'Introduce simple shape-sorters and stacking rings to keep challenging their thinking.',
      'Play dates with cousins or neighbourhood children support social and language development beautifully.'
    );
  }

  if (recs.length < 2) {
    recs.push(
      'Read picture books together every day — even 10 minutes builds vocabulary and bonding.',
      'Daily outdoor time — even a short walk — stimulates curiosity and all areas of development.'
    );
  }

  return recs.slice(0, 3);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCategoryLabel(category: QuizCategory): string {
  const labels: Record<QuizCategory, string> = {
    gross_motor: 'Gross Motor',
    fine_motor: 'Fine Motor',
    language: 'Language',
    cognitive: 'Cognitive',
    social_emotional: 'Social & Emotional',
  };
  return labels[category] ?? category;
}

function buildEmptyResult(): QuizResult {
  return {
    totalScore: 0,
    maxScore: 0,
    percentage: 0,
    status: 'On Track',
    categoryBreakdown: {},
    tier: 'on-track',
    tierLabel: 'On Track',
    tierDescription: 'No answers recorded.',
    categoryScores: [],
    highlights: [],
    recommendations: [],
  };
}
