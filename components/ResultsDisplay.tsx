'use client';

import { useState } from 'react';
import { Combination } from '@/lib/calculator';
import { convertUSDToINR } from '@/lib/pricing';
import { CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface ResultsDisplayProps {
  results: Combination[];
  isCalculating: boolean;
}

export default function ResultsDisplay({ results, isCalculating }: ResultsDisplayProps) {
  if (isCalculating) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Calculating combinations...</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          Enter your budget and click "Calculate Combinations" to see results
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Best Combinations
      </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {results.length} {results.length === 1 ? 'combination' : 'combinations'} found
        </p>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {results.map((combination, index) => (
            <CombinationCard key={combination.id} combination={combination} rank={index + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CombinationCard({ combination, rank }: { combination: Combination; rank: number }) {
  const [showDetails, setShowDetails] = useState(false);
  const badgeColor = combination.fitsBudget
    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';

  const formatINR = (amount: number) => `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const formatUSD = (amount: number) => `$${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

  return (
    <div className="border-2 border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-gradient-to-br from-white to-gray-50 dark:from-black dark:to-gray-900 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">#{rank}</span>
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${badgeColor} shadow-sm`}>
            {combination.fitsBudget ? (
              <span className="flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                Fits Budget
              </span>
            ) : (
              <span className="flex items-center">
                <XCircle className="w-3 h-3 mr-1" />
                Over Budget
              </span>
            )}
          </span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatINR(combination.totalCostINR)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {formatUSD(combination.breakdown.totalCostUSD)}
          </div>
          <div className="text-xs text-gray-500">per month</div>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Avatar:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {combination.avatarPlan.name}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Voice:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {combination.voiceAgent
              ? `${combination.voiceAgent.name}${combination.voiceAgent.concurrency ? ` (${combination.voiceAgent.concurrency} conc.)` : ''}`
              : 'Inbuilt (Avatar)'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Hosting:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {combination.hostingOption.name}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          <span>View Detailed Cost Breakdown</span>
          {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {showDetails && (
          <div className="mt-4 space-y-4 text-xs">
            {/* Avatar Cost Breakdown */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black rounded-xl p-4 border border-gray-200 dark:border-gray-800">
              <div className="font-semibold text-gray-900 dark:text-white mb-2">Avatar Cost Breakdown</div>
              <div className="space-y-1 text-gray-700 dark:text-gray-300">
                <div className="flex justify-between">
                  <span>Base Plan Cost:</span>
                  <div className="text-right">
                    <div>{formatUSD(combination.breakdown.avatarBaseCostUSD)}</div>
                    <div className="text-gray-500">{formatINR(convertUSDToINR(combination.breakdown.avatarBaseCostUSD))}</div>
                  </div>
                </div>
                {combination.breakdown.avatarAdditionalMinutes > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span>Included Minutes:</span>
                      <span>{combination.avatarPlan.minutes.toLocaleString()}</span>
                    </div>
          <div className="flex justify-between">
                      <span>Additional Minutes:</span>
                      <span>{combination.breakdown.avatarAdditionalMinutes.toLocaleString()}</span>
          </div>
            <div className="flex justify-between">
                      <span>Additional Cost ({formatUSD(combination.avatarPlan.additionalPerMin)}/min):</span>
                      <div className="text-right">
                        <div>{formatUSD(combination.breakdown.avatarAdditionalCostUSD)}</div>
                        <div className="text-gray-500">{formatINR(convertUSDToINR(combination.breakdown.avatarAdditionalCostUSD))}</div>
                      </div>
                    </div>
                  </>
                )}
                <div className="flex justify-between pt-1 border-t border-gray-300 dark:border-gray-700 font-semibold">
                  <span>Total Avatar Cost:</span>
                  <div className="text-right">
                    <div>{formatUSD(combination.breakdown.avatarCostUSD)}</div>
                    <div className="text-gray-500">{formatINR(combination.breakdown.avatarCostINR)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Voice Cost Breakdown */}
            {combination.breakdown.voiceCostINR > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-900">
                <div className="font-semibold text-gray-900 dark:text-white mb-2">Voice Agent Cost Breakdown</div>
                <div className="space-y-1 text-gray-700 dark:text-gray-300">
                  {combination.voiceAgent?.pricingModel === 'tokens' && combination.breakdown.voiceTotalTokens && (
                    <>
                      <div className="flex justify-between">
                        <span>Tokens per Minute:</span>
                        <span>
                          {combination.voiceAgent.tokensPerMinuteMin && combination.voiceAgent.tokensPerMinuteMax
                            ? `${combination.voiceAgent.tokensPerMinuteMin.toLocaleString()}-${combination.voiceAgent.tokensPerMinuteMax.toLocaleString()} (avg: ${combination.voiceAgent.tokensPerMinute?.toLocaleString()})`
                            : `${combination.voiceAgent.tokensPerMinute?.toLocaleString() || 'N/A'}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Tokens:</span>
                        <span>{combination.breakdown.voiceTotalTokens.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tokens (Millions):</span>
                        <span>{(combination.breakdown.voiceTotalTokens / 1_000_000).toFixed(2)}M</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Price per 1M Tokens:</span>
                        <span>{formatUSD(combination.voiceAgent.pricePer1MTokens || 0)}</span>
                      </div>
                    </>
                  )}
                  {combination.voiceAgent?.pricingModel === 'per-minute' && (
                    <>
                      {combination.breakdown.voiceBaseCostUSD !== undefined && combination.breakdown.voiceBaseCostUSD > 0 && (
                        <div className="flex justify-between">
                          <span>Minimum Monthly Cost:</span>
                          <div className="text-right">
                            <div>{formatUSD(combination.breakdown.voiceBaseCostUSD)}</div>
                            <div className="text-gray-500">{formatINR(convertUSDToINR(combination.breakdown.voiceBaseCostUSD))}</div>
                          </div>
                        </div>
                      )}
                      {combination.breakdown.voicePerMinuteCostUSD !== undefined && (
                        <div className="flex justify-between">
                          <span>Per-Minute Cost ({formatUSD(combination.voiceAgent?.pricePerMinute || 0)}/min):</span>
                          <div className="text-right">
                            <div>{formatUSD(combination.breakdown.voicePerMinuteCostUSD)}</div>
                            <div className="text-gray-500">{formatINR(convertUSDToINR(combination.breakdown.voicePerMinuteCostUSD))}</div>
                          </div>
                        </div>
                      )}
                      {combination.breakdown.voiceBaseCostUSD !== undefined && combination.breakdown.voiceBaseCostUSD > 0 && (
                        <div className="text-xs text-gray-500 italic mt-1">
                          * Cost is the higher of minimum or per-minute cost
                        </div>
                      )}
                    </>
                  )}
                  {combination.voiceAgent?.pricingModel === 'per-minute-per-concurrency' && (
                    <>
                      <div className="flex justify-between">
                        <span>Price per Minute per Concurrency:</span>
                        <span>{formatUSD(combination.voiceAgent?.pricePerMinute || 0)}</span>
                      </div>
                      {combination.breakdown.voicePerMinuteCostUSD !== undefined && (
                        <div className="flex justify-between">
                          <span>Total Cost (price × minutes × concurrency):</span>
                          <div className="text-right">
                            <div>{formatUSD(combination.breakdown.voicePerMinuteCostUSD)}</div>
                            <div className="text-gray-500">{formatINR(convertUSDToINR(combination.breakdown.voicePerMinuteCostUSD))}</div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex justify-between pt-1 border-t border-gray-300 dark:border-gray-700 font-semibold">
                    <span>Total Voice Cost:</span>
                    <div className="text-right">
                      <div>{formatUSD(combination.breakdown.voiceCostUSD)}</div>
                      <div className="text-gray-500">{formatINR(combination.breakdown.voiceCostINR)}</div>
                    </div>
                  </div>
                </div>
            </div>
          )}

            {/* Hosting Cost Breakdown */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-4 border border-purple-200 dark:border-purple-900">
              <div className="font-semibold text-gray-900 dark:text-white mb-2">Hosting Cost Breakdown</div>
              <div className="space-y-1 text-gray-700 dark:text-gray-300">
                <div className="flex justify-between">
                  <span>Base Monthly Cost:</span>
                  <span>{formatINR(combination.breakdown.hostingBaseCostINR)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Users Cost ({combination.hostingOption.costPerUserPerMonthINR}/user):</span>
                  <span>{formatINR(combination.breakdown.hostingUsersCostINR)}</span>
                </div>
          <div className="flex justify-between">
                  <span>Calls Cost ({combination.hostingOption.costPerCallINR}/call):</span>
                  <span>{formatINR(combination.breakdown.hostingCallsCostINR)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-300 dark:border-gray-700 font-semibold">
                  <span>Total Hosting Cost:</span>
                  <span>{formatINR(combination.breakdown.hostingCostINR)}</span>
          </div>
        </div>
            </div>

            {/* Misc Expenses */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-xl p-4 border border-yellow-200 dark:border-yellow-900">
              <div className="font-semibold text-gray-900 dark:text-white mb-2">Miscellaneous Expenses</div>
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Fixed Monthly Cost:</span>
                <span>{formatINR(combination.breakdown.miscExpensesINR)}</span>
              </div>
            </div>

            {/* Total Summary */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 border-2 border-blue-500 dark:border-blue-400 shadow-lg">
              <div className="font-bold text-white mb-3 text-lg">Total Monthly Cost</div>
              <div className="flex justify-between text-xl mb-2">
                <span className="text-blue-100">INR:</span>
                <span className="font-extrabold text-white">{formatINR(combination.breakdown.totalCostINR)}</span>
              </div>
              <div className="flex justify-between text-xl">
                <span className="text-blue-100">USD:</span>
                <span className="font-extrabold text-white">{formatUSD(combination.breakdown.totalCostUSD)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {combination.warnings.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1">
              {combination.warnings.map((warning, idx) => (
                <div key={idx}>• {warning}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        Score: {combination.score.toFixed(0)} (higher is better)
      </div>
    </div>
  );
}

