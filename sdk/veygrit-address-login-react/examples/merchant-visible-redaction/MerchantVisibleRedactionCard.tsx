import React from 'react';

import {
  createMerchantVisibleRedactionDisplayModel,
  type VeyIdMerchantVisibleRedactionAffordance,
  type VeyIdMerchantVisibleRedactionRefs,
} from '../../src/index';

export type MerchantVisibleRedactionCardProps = {
  affordance: VeyIdMerchantVisibleRedactionAffordance;
  refs: VeyIdMerchantVisibleRedactionRefs;
  title?: string;
};

export function MerchantVisibleRedactionCard({
  affordance,
  refs,
  title = 'Merchant-visible redaction',
}: MerchantVisibleRedactionCardProps) {
  const display = createMerchantVisibleRedactionDisplayModel(affordance, refs);

  return (
    <section data-veygrit-merchant-visible-redaction="card">
      <header>
        <p>{title}</p>
        <strong>{display.boundaryGateId}</strong>
        <span>{display.requiredNextAction}</span>
      </header>
      <dl>
        {display.rows.map(row => (
          <div key={row.field} data-veygrit-redaction-row={row.field}>
            <dt>{row.label}</dt>
            <dd>{row.ref ?? 'pending_wallet_consent'}</dd>
          </div>
        ))}
      </dl>
      <footer>
        <span>{display.visibleRefCount} visible refs</span>
        <span>{display.blockedClassCount} blocked classes</span>
        <span>{display.nonClaimCount} non-claims</span>
        <span>consent-bound</span>
      </footer>
    </section>
  );
}
