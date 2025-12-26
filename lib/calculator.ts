import {
  AVATAR_PLANS,
  VOICE_AGENTS,
  HOSTING_OPTIONS,
  AvatarPlan,
  VoiceAgent,
  HostingOption,
  convertUSDToINR,
  convertINRToUSD,
  MISC_EXPENSES_MONTHLY_INR,
} from './pricing';

export interface BudgetInput {
  monthlyBudgetINR: number;
  apiAllocationPercent: number; // Percentage for APIs (avatar + voice)
  hostingAllocationPercent: number; // Percentage for hosting
  users: number;
  concurrentSessions: number;
  minutesPerMonth: number;
  useVoiceAgent: boolean; // true = avatar + voice agent, false = avatar with inbuilt voice
}

export interface Combination {
  id: string;
  avatarPlan: AvatarPlan;
  avatarAccounts: number;
  voiceAgent?: VoiceAgent;
  voiceAccounts: number;
  hostingOption: HostingOption;
  totalCostINR: number;
  breakdown: {
    avatarCostINR: number;
    avatarCostUSD: number;
    avatarBaseCostUSD: number;
    avatarAdditionalMinutes: number;
    avatarAdditionalCostUSD: number;
    voiceCostINR: number;
    voiceCostUSD: number;
    voiceBaseCostUSD?: number;
    voicePerMinuteCostUSD?: number;
    voiceTotalTokens?: number;
    hostingCostINR: number;
    hostingBaseCostINR: number;
    hostingUsersCostINR: number;
    hostingCallsCostINR: number;
    miscExpensesINR: number;
    totalCostINR: number;
    totalCostUSD: number;
  };
  fitsBudget: boolean;
  score: number; // Higher is better
  warnings: string[];
}

export function calculateCombinations(input: BudgetInput): Combination[] {
  const combinations: Combination[] = [];
  const apiBudgetINR = (input.monthlyBudgetINR * input.apiAllocationPercent) / 100;
  const hostingBudgetINR = (input.monthlyBudgetINR * input.hostingAllocationPercent) / 100;

  const avatarPlanCombos = buildAvatarPlanCombos();
  const voiceAgentCombos = buildVoiceAgentCombos();

  for (const avatarCombo of avatarPlanCombos) {
    for (const hostingOption of HOSTING_OPTIONS) {
      if (input.useVoiceAgent) {
        for (const voiceCombo of voiceAgentCombos) {
          const combination = calculateCombination(
            avatarCombo.plan,
            avatarCombo.accounts,
            voiceCombo.agent,
            voiceCombo.accounts,
            hostingOption,
            input,
            apiBudgetINR,
            hostingBudgetINR
          );
          combinations.push(combination);
        }
      } else {
        const combination = calculateCombination(
          avatarCombo.plan,
          avatarCombo.accounts,
          undefined,
          1,
          hostingOption,
          input,
          apiBudgetINR,
          hostingBudgetINR
        );
        combinations.push(combination);
      }
    }
  }

  // Filter out invalid combinations and rank
  return combinations
    .filter((c) => isValidCombination(c, input))
    .sort((a, b) => b.score - a.score);
}

function calculateCombination(
  avatarPlan: AvatarPlan,
  avatarAccounts: number,
  voiceAgent: VoiceAgent | undefined,
  voiceAccounts: number,
  hostingOption: HostingOption,
  input: BudgetInput,
  apiBudgetINR: number,
  hostingBudgetINR: number
): Combination {
  const isAvatarCombo = avatarPlan.tier === 'Combo' || avatarPlan.id.includes('+');
  const avatarFactor = isAvatarCombo ? 1 : avatarAccounts;

  // Calculate avatar cost
  const avatarBaseCostUSD = avatarPlan.monthlyPrice * avatarFactor;
  const includedMinutes = avatarPlan.minutes * avatarFactor;
  const additionalMinutes = Math.max(0, input.minutesPerMonth - includedMinutes);
  const avatarAdditionalCostUSD = additionalMinutes * avatarPlan.additionalPerMin;
  const totalAvatarCostUSD = avatarBaseCostUSD + avatarAdditionalCostUSD;
  const avatarCostINR = convertUSDToINR(totalAvatarCostUSD);

  // Calculate voice cost (if using voice agent)
  let voiceCostINR = 0;
  let voiceCostUSD = 0;
  let voiceBaseCostUSD: number | undefined = undefined;
  let voicePerMinuteCostUSD: number | undefined = undefined;
  let voiceTotalTokens: number | undefined = undefined;
  const isVoiceCombo = voiceAgent ? voiceAgent.id.includes('+') || voiceAgent.name?.includes('combo') : false;
  const voiceFactor = isVoiceCombo ? 1 : voiceAccounts;
  
  if (voiceAgent) {
    if (voiceAgent.pricingModel === 'tokens') {
      // Token-based pricing
      voiceTotalTokens = input.minutesPerMonth * (voiceAgent.tokensPerMinute || 1000); // Default to 1000 if not specified
      const tokensInMillions = voiceTotalTokens / 1_000_000;
      voiceCostUSD = tokensInMillions * (voiceAgent.pricePer1MTokens || 0);
      voiceCostINR = convertUSDToINR(voiceCostUSD);
    } else if (voiceAgent.pricingModel === 'per-minute') {
      // Per-minute pricing (Hume) - allow up to 2 accounts
      const minimumCostPerAccountUSD = voiceAgent.monthlyMinimumCost || voiceAgent.monthlyBaseCost || 0;
      if (isVoiceCombo) {
        const variableCostUSD = (voiceAgent.pricePerMinute || 0) * input.minutesPerMonth;
        voicePerMinuteCostUSD = variableCostUSD;
        voiceBaseCostUSD = minimumCostPerAccountUSD; // already aggregated for combo
        voiceCostUSD = Math.max(minimumCostPerAccountUSD, variableCostUSD);
      } else {
        const perAccountMinutes = input.minutesPerMonth / voiceFactor;
        const variableCostPerAccountUSD = (voiceAgent.pricePerMinute || 0) * perAccountMinutes;
        const perAccountCostUSD = Math.max(minimumCostPerAccountUSD, variableCostPerAccountUSD);
        voicePerMinuteCostUSD = (voiceAgent.pricePerMinute || 0) * input.minutesPerMonth;
        voiceBaseCostUSD = minimumCostPerAccountUSD * voiceFactor;
        voiceCostUSD = perAccountCostUSD * voiceFactor;
      }
      voiceCostINR = convertUSDToINR(voiceCostUSD);
    } else if (voiceAgent.pricingModel === 'per-minute-per-concurrency') {
      // Per-minute per concurrency pricing (Grok)
      // Cost = price per minute × minutes × concurrent sessions
      voicePerMinuteCostUSD = (voiceAgent.pricePerMinute || 0) * input.minutesPerMonth * input.concurrentSessions;
      voiceCostUSD = voicePerMinuteCostUSD;
      voiceCostINR = convertUSDToINR(voiceCostUSD);
    }
  }

  // Calculate hosting cost breakdown
  const hostingBaseCostINR = hostingOption.baseMonthlyCostINR;
  const hostingUsersCostINR = input.users * hostingOption.costPerUserPerMonthINR;
  const calls = input.minutesPerMonth / 10; // Assuming ~10 min per call
  const hostingCallsCostINR = calls * hostingOption.costPerCallINR;
  const hostingCostINR = hostingBaseCostINR + hostingUsersCostINR + hostingCallsCostINR;

  // Total cost (including miscellaneous expenses)
  const totalCostINR = avatarCostINR + voiceCostINR + hostingCostINR + MISC_EXPENSES_MONTHLY_INR;
  const totalCostUSD = convertINRToUSD(totalCostINR);

  // Check if fits budget
  // Must fit within total monthly budget AND individual allocations
  const apiCostINR = avatarCostINR + voiceCostINR;
  const fitsBudget = totalCostINR <= input.monthlyBudgetINR && 
                     apiCostINR <= apiBudgetINR && 
                     hostingCostINR <= hostingBudgetINR;

  // Generate warnings
  const warnings: string[] = [];
  const avatarConcurrencyLimit =
    avatarPlan.concurrency !== undefined
      ? avatarPlan.concurrency * (isAvatarCombo ? 1 : avatarAccounts)
      : undefined;
  if (avatarConcurrencyLimit !== undefined && input.concurrentSessions > avatarConcurrencyLimit) {
    warnings.push(
      `Concurrent sessions (${input.concurrentSessions}) exceed avatar plan limit with ${avatarAccounts} account(s) (${avatarConcurrencyLimit})`
    );
  }
  if (voiceAgent && voiceAgent.concurrency) {
    const voiceConcurrencyLimit = voiceAgent.concurrency * (isVoiceCombo ? 1 : voiceAccounts);
    if (input.concurrentSessions > voiceConcurrencyLimit) {
      warnings.push(
        `Concurrent sessions (${input.concurrentSessions}) exceed voice agent limit with ${voiceAccounts} account(s) (${voiceConcurrencyLimit})`
      );
    }
  }
  if (avatarPlan.maxLength && input.minutesPerMonth / input.users > avatarPlan.maxLength) {
    warnings.push(
      `Average session length may exceed plan limit (${avatarPlan.maxLength} min)`
    );
  }
  if (apiCostINR > apiBudgetINR) {
    warnings.push(`API cost (₹${apiCostINR.toFixed(2)}) exceeds allocated budget (₹${apiBudgetINR.toFixed(2)})`);
  }
  if (hostingCostINR > hostingBudgetINR) {
    warnings.push(
      `Hosting cost (₹${hostingCostINR.toFixed(2)}) exceeds allocated budget (₹${hostingBudgetINR.toFixed(2)})`
    );
  }

  // Calculate score (higher is better)
  // Factors: fits budget, cost efficiency, feature match
  let score = 0;
  if (fitsBudget) score += 1000;
  score -= totalCostINR / 100; // Lower cost = higher score
  if (avatarConcurrencyLimit === undefined || input.concurrentSessions <= avatarConcurrencyLimit) {
    score += 100;
  }
  if (voiceAgent && voiceAgent.concurrency && input.concurrentSessions <= voiceAgent.concurrency * (isVoiceCombo ? 1 : voiceAccounts)) {
    score += 100;
  }
  if (voiceAgent || avatarPlan.hasInbuiltVoice) score += 50;
  // Slight penalty for managing multiple accounts to avoid over-favoring splits
  if (avatarAccounts > 1) score -= 25 * (avatarAccounts - 1);
  if (voiceAccounts > 1) score -= 25 * (voiceAccounts - 1);

  const id = `${avatarPlan.id}x${avatarAccounts}-${voiceAgent?.id || 'inbuilt'}x${voiceAccounts}-${hostingOption.id}`;

  return {
    id,
    avatarPlan,
    avatarAccounts,
    voiceAgent,
    voiceAccounts,
    hostingOption,
    totalCostINR,
    breakdown: {
      avatarCostINR,
      avatarCostUSD: totalAvatarCostUSD,
      avatarBaseCostUSD,
      avatarAdditionalMinutes: additionalMinutes,
      avatarAdditionalCostUSD,
      voiceCostINR,
      voiceCostUSD,
      voiceBaseCostUSD,
      voicePerMinuteCostUSD,
      voiceTotalTokens,
      hostingCostINR,
      hostingBaseCostINR,
      hostingUsersCostINR,
      hostingCallsCostINR,
      miscExpensesINR: MISC_EXPENSES_MONTHLY_INR,
      totalCostINR,
      totalCostUSD,
    },
    fitsBudget,
    score,
    warnings,
  };
}

function isValidCombination(combination: Combination, input: BudgetInput): boolean {
  const isAvatarCombo = combination.avatarPlan.tier === 'Combo' || combination.avatarPlan.id.includes('+');
  const isVoiceCombo = combination.voiceAgent ? combination.voiceAgent.id.includes('+') || combination.voiceAgent.name?.includes('combo') : false;

  // Check avatar concurrency (skip if undefined, as it means custom/unlimited)
  if (combination.avatarPlan.concurrency !== undefined) {
    const capacity = combination.avatarPlan.concurrency * (isAvatarCombo ? 1 : combination.avatarAccounts);
    if (input.concurrentSessions > capacity) {
      return false; // Can't handle required concurrency
    }
  }

  // Check voice agent concurrency (if using voice agent with concurrency limit)
  if (combination.voiceAgent && combination.voiceAgent.concurrency) {
    const capacity = combination.voiceAgent.concurrency * (isVoiceCombo ? 1 : combination.voiceAccounts);
    if (input.concurrentSessions > capacity) {
      return false; // Voice agent can't handle required concurrency
    }
  }

  // Check if plan has inbuilt voice when not using voice agent
  if (!input.useVoiceAgent && !combination.avatarPlan.hasInbuiltVoice) {
    return false;
  }

  return true;
}

function buildAvatarPlanCombos(): { plan: AvatarPlan; accounts: number }[] {
  const combos: { plan: AvatarPlan; accounts: number }[] = [];
  const eligible = AVATAR_PLANS.filter((p) => p.monthlyPrice > 0);

  // Single account combos
  for (const plan of eligible) {
    combos.push({ plan, accounts: 1 });
  }

  // Two-account combos (same provider, allow same or different plans)
  for (let i = 0; i < eligible.length; i++) {
    for (let j = i; j < eligible.length; j++) {
      const a = eligible[i];
      const b = eligible[j];
      if (a.provider !== b.provider) continue;
      const aggregated = aggregateAvatarPlans([a, b]);
      combos.push({ plan: aggregated, accounts: 2 });
    }
  }

  return combos;
}

function aggregateAvatarPlans(plans: AvatarPlan[]): AvatarPlan {
  const provider = plans[0].provider;
  const id = plans.map((p) => p.id).join('+');
  const name = `${provider.toUpperCase()} combo: ${plans.map((p) => p.name).join(' + ')}`;
  const monthlyPrice = plans.reduce((sum, p) => sum + p.monthlyPrice, 0);
  const minutes = plans.reduce((sum, p) => sum + p.minutes, 0);
  const additionalPerMin = Math.min(...plans.map((p) => p.additionalPerMin));

  // Concurrency: if any is unlimited (undefined), keep undefined; else sum
  const hasUnlimited = plans.some((p) => p.concurrency === undefined);
  const concurrency = hasUnlimited
    ? undefined
    : plans.reduce((sum, p) => sum + (p.concurrency || 0), 0);

  const maxLength = plans.some((p) => p.maxLength === undefined)
    ? undefined
    : Math.max(...plans.map((p) => p.maxLength || 0));

  const hasInbuiltVoice = plans.every((p) => p.hasInbuiltVoice);

  return {
    id,
    name,
    provider,
    tier: 'Combo',
    monthlyPrice,
    minutes,
    maxLength,
    concurrency,
    additionalPerMin,
    hasInbuiltVoice,
  };
}

function buildVoiceAgentCombos(): { agent: VoiceAgent; accounts: number }[] {
  const combos: { agent: VoiceAgent; accounts: number }[] = [];
  for (const agent of VOICE_AGENTS) {
    combos.push({ agent, accounts: 1 });
    if (agent.id.startsWith('hume-')) {
      // Allow two Hume accounts; they can be same or mixed Hume plans
      for (const other of VOICE_AGENTS.filter((v) => v.id.startsWith('hume-'))) {
        const aggregated = aggregateHumeAgents([agent, other]);
        combos.push({ agent: aggregated, accounts: 2 });
      }
    }
  }
  return combos;
}

function aggregateHumeAgents(agents: VoiceAgent[]): VoiceAgent {
  // All Hume plans are per-minute
  const id = agents.map((a) => a.id).join('+');
  const name = `Hume combo: ${agents.map((a) => a.name).join(' + ')}`;

  // Pricing: per-minute uses the minimum rate; minimum base cost sums
  const pricePerMinute = Math.min(...agents.map((a) => a.pricePerMinute || 0));
  const monthlyMinimumCost = agents
    .map((a) => a.monthlyMinimumCost || a.monthlyBaseCost || 0)
    .reduce((sum, v) => sum + v, 0);

  // Concurrency: if any unlimited, undefined else sum
  const hasUnlimited = agents.some((a) => a.concurrency === undefined);
  const concurrency = hasUnlimited
    ? undefined
    : agents.reduce((sum, a) => sum + (a.concurrency || 0), 0);

  return {
    id,
    name,
    pricingModel: 'per-minute',
    pricePerMinute,
    monthlyBaseCost: monthlyMinimumCost,
    monthlyMinimumCost,
    concurrency,
  };
}

