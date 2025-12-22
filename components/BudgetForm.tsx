'use client';

import { useState } from 'react';
import { BudgetInput } from '@/lib/calculator';

interface BudgetFormProps {
  onSubmit: (input: BudgetInput) => void;
  isCalculating: boolean;
}

export default function BudgetForm({ onSubmit, isCalculating }: BudgetFormProps) {
  const [formData, setFormData] = useState<BudgetInput>({
    monthlyBudgetINR: 100000,
    apiAllocationPercent: 60,
    hostingAllocationPercent: 40,
    users: 50,
    concurrentSessions: 10,
    minutesPerMonth: 3500,
    useVoiceAgent: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = (field: keyof BudgetInput, value: number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const apiBudget = (formData.monthlyBudgetINR * formData.apiAllocationPercent) / 100;
  const hostingBudget = (formData.monthlyBudgetINR * formData.hostingAllocationPercent) / 100;
  const totalAllocation = formData.apiAllocationPercent + formData.hostingAllocationPercent;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
        Budget Configuration
      </h2>

      {/* Monthly Budget */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Monthly Budget (INR)
        </label>
        <input
          type="number"
          min="0"
          step="1000"
          value={formData.monthlyBudgetINR}
          onChange={(e) => updateField('monthlyBudgetINR', Number(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:bg-black dark:border-gray-700 dark:text-white"
          required
        />
      </div>

      {/* Budget Allocation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          API Allocation: {formData.apiAllocationPercent}% (₹{apiBudget.toLocaleString('en-IN')})
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={formData.apiAllocationPercent}
          onChange={(e) => {
            const apiPercent = Number(e.target.value);
            const hostingPercent = 100 - apiPercent;
            setFormData((prev) => ({
              ...prev,
              apiAllocationPercent: apiPercent,
              hostingAllocationPercent: hostingPercent,
            }));
          }}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-600"
          style={{
            background: `linear-gradient(to right, rgb(37, 99, 235) 0%, rgb(37, 99, 235) ${formData.apiAllocationPercent}%, rgb(229, 231, 235) ${formData.apiAllocationPercent}%, rgb(229, 231, 235) 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Hosting Allocation: {formData.hostingAllocationPercent}% (₹{hostingBudget.toLocaleString('en-IN')})
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={formData.hostingAllocationPercent}
          onChange={(e) => {
            const hostingPercent = Number(e.target.value);
            const apiPercent = 100 - hostingPercent;
            setFormData((prev) => ({
              ...prev,
              apiAllocationPercent: apiPercent,
              hostingAllocationPercent: hostingPercent,
            }));
          }}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-600"
          style={{
            background: `linear-gradient(to right, rgb(37, 99, 235) 0%, rgb(37, 99, 235) ${formData.hostingAllocationPercent}%, rgb(229, 231, 235) ${formData.hostingAllocationPercent}%, rgb(229, 231, 235) 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {totalAllocation !== 100 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Total allocation: {totalAllocation}% (should be 100%)
          </p>
        </div>
      )}

      {/* Users */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Number of Users
        </label>
        <input
          type="number"
          min="1"
          value={formData.users}
          onChange={(e) => updateField('users', Number(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:bg-black dark:border-gray-700 dark:text-white"
          required
        />
      </div>

      {/* Concurrent Sessions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Concurrent Sessions
        </label>
        <input
          type="number"
          min="1"
          value={formData.concurrentSessions}
          onChange={(e) => updateField('concurrentSessions', Number(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:bg-black dark:border-gray-700 dark:text-white"
          required
        />
      </div>

      {/* Minutes per Month */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Minutes per Month: {formData.minutesPerMonth.toLocaleString()}
        </label>
        <input
          type="range"
          min="0"
          max="10000"
          step="100"
          value={formData.minutesPerMonth}
          onChange={(e) => updateField('minutesPerMonth', Number(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-600"
          style={{
            background: `linear-gradient(to right, rgb(37, 99, 235) 0%, rgb(37, 99, 235) ${(formData.minutesPerMonth / 10000) * 100}%, rgb(229, 231, 235) ${(formData.minutesPerMonth / 10000) * 100}%, rgb(229, 231, 235) 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0</span>
          <span>10,000</span>
        </div>
        <input
          type="number"
          min="0"
          step="100"
          value={formData.minutesPerMonth}
          onChange={(e) => updateField('minutesPerMonth', Number(e.target.value))}
          className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:bg-black dark:border-gray-700 dark:text-white"
          required
        />
      </div>

      {/* Voice Minutes Breakdown (if using voice agent) */}
      {formData.useVoiceAgent && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Voice Agent Cost Preview (for {formData.minutesPerMonth.toLocaleString()} minutes)
          </h3>
          <div className="space-y-2 text-xs">
            {/* Gemini Live */}
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300">Gemini Live:</span>
              <div className="text-right">
                <div className="font-medium text-gray-900 dark:text-white">
                  ${((formData.minutesPerMonth * 300 / 1_000_000) * 17.05).toFixed(2)}
                </div>
                <div className="text-gray-500">
                  ₹{((formData.minutesPerMonth * 300 / 1_000_000) * 17.05 * 90).toFixed(0)}
                </div>
              </div>
            </div>
            {/* GPT Realtime */}
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300">GPT Realtime:</span>
              <div className="text-right">
                <div className="font-medium text-gray-900 dark:text-white">
                  ${((formData.minutesPerMonth * 300 / 1_000_000) * 116.00).toFixed(2)}
                </div>
                <div className="text-gray-500">
                  ₹{((formData.minutesPerMonth * 300 / 1_000_000) * 116.00 * 90).toFixed(0)}
                </div>
              </div>
            </div>
            {/* Hume Pro */}
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300">Hume Pro (min $70):</span>
              <div className="text-right">
                <div className="font-medium text-gray-900 dark:text-white">
                  ${Math.max(70, formData.minutesPerMonth * 0.06).toFixed(2)}
                </div>
                <div className="text-gray-500">
                  ₹{(Math.max(70, formData.minutesPerMonth * 0.06) * 90).toFixed(0)}
                </div>
              </div>
            </div>
            {/* Hume Scale */}
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300">Hume Scale (min $200):</span>
              <div className="text-right">
                <div className="font-medium text-gray-900 dark:text-white">
                  ${Math.max(200, formData.minutesPerMonth * 0.05).toFixed(2)}
                </div>
                <div className="text-gray-500">
                  ₹{(Math.max(200, formData.minutesPerMonth * 0.05) * 90).toFixed(0)}
                </div>
              </div>
            </div>
            {/* Hume Business */}
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300">Hume Business (min $500):</span>
              <div className="text-right">
                <div className="font-medium text-gray-900 dark:text-white">
                  ${Math.max(500, formData.minutesPerMonth * 0.04).toFixed(2)}
                </div>
                <div className="text-gray-500">
                  ₹{(Math.max(500, formData.minutesPerMonth * 0.04) * 90).toFixed(0)}
                </div>
              </div>
            </div>
            {/* Grok */}
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300">Grok (per min per concurrency):</span>
              <div className="text-right">
                <div className="font-medium text-gray-900 dark:text-white">
                  ${(formData.minutesPerMonth * 0.05 * formData.concurrentSessions).toFixed(2)}
                </div>
                <div className="text-gray-500">
                  ₹{(formData.minutesPerMonth * 0.05 * formData.concurrentSessions * 90).toFixed(0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Option */}
      <div>
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.useVoiceAgent}
            onChange={(e) => updateField('useVoiceAgent', e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Use Voice Agent (instead of inbuilt avatar voice)
          </span>
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-8">
          {formData.useVoiceAgent
            ? 'Will use Gemini Live or GPT Realtime for voice'
            : 'Will use avatar provider\'s inbuilt voice'}
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isCalculating || totalAllocation !== 100}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        {isCalculating ? 'Calculating...' : 'Calculate Combinations'}
      </button>
    </form>
  );
}

