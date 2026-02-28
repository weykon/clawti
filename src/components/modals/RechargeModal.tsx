'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Gift, Check, Users, Sparkles, CreditCard, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useUIStore } from '../../store/useUIStore';
import { useTranslation } from '../../i18n/useTranslation';
import { api } from '../../api/client';
import { useEscapeClose } from '../../hooks/useEscapeClose';

export function RechargeModal() {
  const t = useTranslation();
  const {
    isRechargeOpen, setRechargeOpen, rechargeTab, setRechargeTab,
    isPaymentOpen, setPaymentOpen, selectedPlan, setSelectedPlan,
    energy, setEnergy, rechargeNotice, showRechargeNotice,
  } = useUIStore();
  useEscapeClose(isRechargeOpen, () => setRechargeOpen(false));

  if (!isRechargeOpen && !isPaymentOpen) return null;

  return (
    <>
      {/* Recharge Modal */}
      <AnimatePresence>
        {isRechargeOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-end justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={() => setRechargeOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-white rounded-t-[40px] p-8 space-y-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  {(['subscribe', 'recharge', 'earn'] as const).map((tab) => (
                    <button key={tab} onClick={() => setRechargeTab(tab)} className={cn(
                      "text-xs font-bold uppercase tracking-widest transition-all pb-1 border-b-2",
                      rechargeTab === tab ? "text-ramos-accent border-ramos-accent" : "text-ramos-muted border-transparent"
                    )}>
                      {tab === 'subscribe' ? t.subscribe : tab === 'recharge' ? t.recharge : t.earn}
                    </button>
                  ))}
                </div>
                <button onClick={() => setRechargeOpen(false)} className="p-2 rounded-full hover:bg-ramos-gray"><X className="w-6 h-6" /></button>
              </div>

              {rechargeNotice && (
                <div className="p-3 bg-ramos-accent/10 border border-ramos-accent/30 rounded-2xl text-ramos-accent text-xs text-center animate-in fade-in font-medium">
                  {rechargeNotice}
                </div>
              )}

              <div className="space-y-4 min-h-[300px]">
                {rechargeTab === 'subscribe' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {[
                      { price: '$9.9', label: 'Basic Soul', features: '1000 Energy/mo' },
                      { price: '$39.9', label: 'Explorer', features: '5000 Energy/mo' },
                      { price: '$99.9', label: 'God Mode', features: 'Unlimited Energy' }
                    ].map((plan) => (
                      <button
                        key={plan.price}
                        onClick={() => { setSelectedPlan(plan); setPaymentOpen(true); }}
                        className="w-full p-6 bg-ramos-gray border border-ramos-border rounded-[32px] flex items-center justify-between hover:bg-ramos-border transition-all group"
                      >
                        <div className="text-left">
                          <h4 className="text-lg font-bold">{plan.label}</h4>
                          <p className="text-xs text-ramos-muted">{plan.features}</p>
                        </div>
                        <div className="text-ramos-accent font-bold text-xl">{plan.price}</div>
                      </button>
                    ))}
                  </div>
                )}

                {rechargeTab === 'recharge' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { energy: '100', price: '$1.99' },
                        { energy: '500', price: '$7.99' },
                        { energy: '1000', price: '$14.99' },
                        { energy: '2500', price: '$29.99' }
                      ].map((pack) => (
                        <button
                          key={pack.energy}
                          onClick={() => { setSelectedPlan(pack); setPaymentOpen(true); }}
                          className="p-6 bg-ramos-gray border border-ramos-border rounded-[32px] flex flex-col items-center gap-2 hover:bg-ramos-border transition-all"
                        >
                          <Zap className="w-8 h-8 text-ramos-accent" />
                          <span className="font-bold">{pack.energy} Energy</span>
                          <span className="text-xs text-ramos-muted">{pack.price}</span>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => { setSelectedPlan({ label: 'Lucky Gift Box', price: '$4.99' }); setPaymentOpen(true); }}
                      className="w-full p-6 bg-ramos-accent/5 border border-ramos-accent/20 rounded-[32px] flex items-center gap-5 hover:bg-ramos-accent/10 transition-all group"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-ramos-accent flex items-center justify-center text-white shadow-lg">
                        <Gift className="w-7 h-7" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-lg font-bold">{t.luckyGiftBox}</h4>
                        <p className="text-xs text-ramos-muted">{t.randomEnergy}</p>
                      </div>
                      <span className="ml-auto text-ramos-accent font-bold">$4.99</span>
                    </button>
                  </div>
                )}

                {rechargeTab === 'earn' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {[
                      { icon: <Check className="w-6 h-6" />, label: 'Daily Check-in', reward: '+50 Energy', action: async () => {
                        try {
                          const res = await api.user.dailyCheckin();
                          setEnergy(res.energy ?? res.newBalance ?? res.new_balance ?? energy + 50);
                          showRechargeNotice(`+${res.energyGained ?? res.energy_gained ?? 50} Energy!`);
                        } catch (err) {
                          showRechargeNotice(err instanceof Error ? err.message : 'Check-in failed');
                        }
                      }},
                      { icon: <Users className="w-6 h-6" />, label: 'Share with Friends', reward: '+50 Energy', action: () => {} },
                      { icon: <Sparkles className="w-6 h-6" />, label: 'Watch Ad', reward: '+5 Energy', action: () => {} }
                    ].map((task) => (
                      <button key={task.label} onClick={task.action} className="w-full p-6 bg-ramos-gray border border-ramos-border rounded-[32px] flex items-center gap-5 hover:bg-ramos-border transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-ramos-accent shadow-sm">
                          {task.icon}
                        </div>
                        <div className="text-left">
                          <h4 className="text-lg font-bold">{task.label}</h4>
                          <p className="text-xs text-ramos-muted">{t.completeToEarn}</p>
                        </div>
                        <span className="ml-auto text-ramos-accent font-bold">{task.reward}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {isPaymentOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={() => setPaymentOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-[40px] p-8 space-y-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <h3 className="text-2xl text-display mb-2">{t.checkout}</h3>
                <p className="text-ramos-muted text-sm">You are purchasing {selectedPlan?.label || `${selectedPlan?.energy ?? '?'} Energy`}</p>
                <div className="mt-4 text-3xl font-bold text-ramos-accent">{selectedPlan?.price}</div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] text-ramos-muted uppercase tracking-widest font-bold">{t.selectPayment}</p>
                <button
                  onClick={async () => {
                    try {
                      // Determine the priceKey from selectedPlan
                      let priceKey = '';
                      if (selectedPlan?.label === 'Basic Soul') priceKey = 'basic';
                      else if (selectedPlan?.label === 'Explorer') priceKey = 'explorer';
                      else if (selectedPlan?.label === 'God Mode') priceKey = 'godmode';
                      else if (selectedPlan?.energy === '100') priceKey = 'energy_100';
                      else if (selectedPlan?.energy === '500') priceKey = 'energy_500';
                      else if (selectedPlan?.energy === '1000') priceKey = 'energy_1000';
                      else if (selectedPlan?.energy === '2500') priceKey = 'energy_2500';
                      else if (selectedPlan?.label === 'Lucky Gift Box') priceKey = 'lucky_box';

                      if (!priceKey) {
                        showRechargeNotice('Unknown plan');
                        return;
                      }

                      const res = await fetch('/api/stripe/checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ priceKey }),
                      });
                      const data = await res.json();
                      if (data.url) {
                        window.location.href = data.url;
                      } else {
                        showRechargeNotice(data.error || 'Checkout failed');
                      }
                    } catch {
                      showRechargeNotice('Payment service unavailable');
                    }
                  }}
                  className="w-full p-6 bg-ramos-gray border border-ramos-border rounded-[32px] flex items-center gap-4 hover:bg-ramos-border transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#635BFF] flex items-center justify-center text-white shadow-lg">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold">{t.stripe}</h4>
                    <p className="text-[10px] text-ramos-muted">{t.creditDebitCard}</p>
                  </div>
                  <ChevronRight className="ml-auto w-5 h-5 text-ramos-muted" />
                </button>

                <button
                  onClick={() => { showRechargeNotice(t.web3Payment); setPaymentOpen(false); setRechargeOpen(false); }}
                  className="w-full p-6 bg-ramos-gray border border-ramos-border rounded-[32px] flex items-center gap-4 hover:bg-ramos-border transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-ramos-accent flex items-center justify-center text-white shadow-lg">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold">{t.web3Wallet}</h4>
                    <p className="text-[10px] text-ramos-muted">{t.ethSolUsdc}</p>
                  </div>
                  <ChevronRight className="ml-auto w-5 h-5 text-ramos-muted" />
                </button>
              </div>

              <button
                onClick={() => setPaymentOpen(false)}
                className="w-full py-4 text-sm font-bold text-ramos-muted hover:text-black transition-colors"
              >
                {t.cancel}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
