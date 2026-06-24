import {
  createJournalEntry,
  getAccountByCode,
  ACCOUNT_CODES,
} from './accountingService.js';
import { calcStaffCommission } from '../utils/commission.js';

export const MEAL_ALLOWANCE = 25000;

import { businessToday, toBusinessDate } from '../utils/businessDate.js';

export const EXPENSE_CATEGORIES = {
  wifi: { code: '5-3', label: 'Internet / Wifi' },
  supplies: { code: '5-4', label: 'Perlengkapan operasional' },
  electricity: { code: '5-5', label: 'Listrik' },
  dues: { code: '5-6', label: 'Iuran' },
  other: { code: '5-4', label: 'Beban operasional lainnya' },
};

const journalExists = async (client, { sourceType, sourceId, reference }) => {
  if (reference) {
    const byRef = await client.query('SELECT id FROM journal_entries WHERE reference = $1', [reference]);
    if (byRef.rowCount > 0) return true;
  }
  if (sourceType && sourceId != null) {
    const bySource = await client.query(
      'SELECT id FROM journal_entries WHERE source_type = $1 AND source_id = $2',
      [sourceType, sourceId]
    );
    if (bySource.rowCount > 0) return true;
  }
  return false;
};

const todayDate = (order) => {
  const d = order.paid_at || order.created_at || new Date();
  return toBusinessDate(d);
};

export const calcOrderCommission = async (client, order) => {
  const items = (Array.isArray(order.cart_items) ? order.cart_items : []).filter((i) => i.type === 'service');
  let total = 0;

  for (const item of items) {
    const qty = item.qty || 1;
    const price = item.price || 0;
    total += calcStaffCommission(price) * qty;
  }

  return total;
};

export const autoPostOrderCompletion = async (client, order) => {
  const entryDate = todayDate(order);
  const kapsterId = order.kapster_id;

  const commission = await calcOrderCommission(client, order);
  if (commission > 0) {
    const ref = `KOM-${order.id}`;
    if (!(await journalExists(client, { reference: ref }))) {
      const bebanGaji = await getAccountByCode(client, ACCOUNT_CODES.BEBAN_GAJI);
      const kas = await getAccountByCode(client, ACCOUNT_CODES.KAS);
      await createJournalEntry(client, {
        entryDate,
        reference: ref,
        description: `Bagi hasil pegawai — Order #${order.id}`,
        entryType: 'auto',
        sourceType: 'order_commission',
        sourceId: order.id,
        lines: [
          { accountId: bebanGaji.id, debit: commission, credit: 0, description: 'Beban gaji & bagi hasil' },
          { accountId: kas.id, debit: 0, credit: commission, description: 'Kas' },
        ],
      });
    }
  }

  if (kapsterId && MEAL_ALLOWANCE > 0) {
    const mealRef = `MEAL-${kapsterId}-${entryDate}`;
    if (!(await journalExists(client, { reference: mealRef }))) {
      const doneEarlier = await client.query(
        `SELECT COUNT(*)::int AS count FROM orders
         WHERE kapster_id = $1 AND status = 'done' AND id != $2
           AND (created_at AT TIME ZONE 'Asia/Jakarta')::date = $3::date`,
        [kapsterId, order.id, entryDate]
      );

      if (doneEarlier.rows[0].count === 0) {
        const bebanMakan = await getAccountByCode(client, ACCOUNT_CODES.BEBAN_MAKAN);
        const kas = await getAccountByCode(client, ACCOUNT_CODES.KAS);
        await createJournalEntry(client, {
          entryDate,
          reference: mealRef,
          description: `Uang makan pegawai — ${entryDate}`,
          entryType: 'auto',
          sourceType: 'daily_meal',
          sourceId: kapsterId,
          lines: [
            { accountId: bebanMakan.id, debit: MEAL_ALLOWANCE, credit: 0, description: 'Makan siang pegawai' },
            { accountId: kas.id, debit: 0, credit: MEAL_ALLOWANCE, description: 'Kas' },
          ],
        });
      }
    }
  }
};

export const autoPostOperationalExpense = async (client, { category, amount, entryDate, description, createdBy }) => {
  const cat = EXPENSE_CATEGORIES[category] || EXPENSE_CATEGORIES.other;
  const beban = await getAccountByCode(client, cat.code);
  const kas = await getAccountByCode(client, ACCOUNT_CODES.KAS);

  return createJournalEntry(client, {
    entryDate,
    reference: `OPEX-${Date.now()}`,
    description: description || cat.label,
    entryType: 'general',
    createdBy,
    lines: [
      { accountId: beban.id, debit: amount, credit: 0, description: cat.label },
      { accountId: kas.id, debit: 0, credit: amount, description: 'Kas' },
    ],
  });
};

export const autoPostCapitalInjection = async (client, { amount, entryDate, description, createdBy }) => {
  const kas = await getAccountByCode(client, ACCOUNT_CODES.KAS);
  const modal = await getAccountByCode(client, ACCOUNT_CODES.MODAL);

  return createJournalEntry(client, {
    entryDate,
    reference: `MODAL-${Date.now()}`,
    description: description || 'Penambahan modal owner',
    entryType: 'general',
    createdBy,
    lines: [
      { accountId: kas.id, debit: amount, credit: 0, description: 'Kas' },
      { accountId: modal.id, debit: 0, credit: amount, description: 'Modal owner' },
    ],
  });
};

export const autoPostPrive = async (client, { amount, entryDate, description, createdBy }) => {
  const prive = await getAccountByCode(client, ACCOUNT_CODES.PRIVE);
  const kas = await getAccountByCode(client, ACCOUNT_CODES.KAS);

  return createJournalEntry(client, {
    entryDate,
    reference: `PRIVE-${Date.now()}`,
    description: description || 'Pengambilan pribadi owner',
    entryType: 'general',
    createdBy,
    lines: [
      { accountId: prive.id, debit: amount, credit: 0, description: 'Prive owner' },
      { accountId: kas.id, debit: 0, credit: amount, description: 'Kas' },
    ],
  });
};

export const autoPostAssetAcquisition = async (client, asset) => {
  const totalCost = asset.acquisition_cost * (asset.quantity || 1);
  const ref = `AST-${asset.id}`;

  if (await journalExists(client, { reference: ref })) return null;

  const peralatan = await getAccountByCode(client, ACCOUNT_CODES.PERALATAN);
  const creditAccount = asset.paid_from === 'capital'
    ? await getAccountByCode(client, ACCOUNT_CODES.MODAL)
    : await getAccountByCode(client, ACCOUNT_CODES.KAS);

  return createJournalEntry(client, {
    entryDate: asset.acquired_date,
    reference: ref,
    description: `Perolehan aset: ${asset.name}`,
    entryType: 'auto',
    sourceType: 'asset_acquisition',
    sourceId: asset.id,
    lines: [
      { accountId: peralatan.id, debit: totalCost, credit: 0, description: asset.name },
      { accountId: creditAccount.id, debit: 0, credit: totalCost, description: asset.paid_from === 'capital' ? 'Modal' : 'Kas' },
    ],
  });
};

const monthKey = (date) => date.toISOString().slice(0, 7);

const addMonths = (dateStr, months) => {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d;
};

export const runMonthlyDepreciation = async (client) => {
  const assets = await client.query(`SELECT * FROM fixed_assets WHERE status = 'active'`);
  const bebanDep = await getAccountByCode(client, ACCOUNT_CODES.BEBAN_DEP);
  const akumDep = await getAccountByCode(client, ACCOUNT_CODES.AKUM_DEP);
  const now = new Date();
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  let postedCount = 0;
  let totalAmount = 0;

  for (const asset of assets.rows) {
    const monthlyAmount = Math.round(asset.annual_depreciation / 12);
    if (monthlyAmount <= 0) continue;

    let cursor = asset.depreciation_posted_through
      ? addMonths(asset.depreciation_posted_through, 1)
      : new Date(asset.acquired_date);

    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), 1);

    while (cursor <= currentMonthEnd) {
      const entryDate = toBusinessDate(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0));
      const ref = `DEP-${asset.id}-${monthKey(cursor)}`;

      const monthsElapsed = Math.floor(
          (cursor.getFullYear() - new Date(asset.acquired_date).getFullYear()) * 12
            + (cursor.getMonth() - new Date(asset.acquired_date).getMonth())
        ) + 1;
        const maxMonths = asset.useful_life_years * 12;

        if (monthsElapsed <= maxMonths) {
          if (!(await journalExists(client, { reference: ref }))) {
            await createJournalEntry(client, {
              entryDate,
              reference: ref,
              description: `Depresiasi ${asset.name} — ${monthKey(cursor)}`,
              entryType: 'adjusting',
              sourceType: 'asset_depreciation',
              sourceId: asset.id,
              lines: [
                { accountId: bebanDep.id, debit: monthlyAmount, credit: 0, description: 'Beban depresiasi' },
                { accountId: akumDep.id, debit: 0, credit: monthlyAmount, description: 'Akumulasi depresiasi' },
              ],
            });
            postedCount += 1;
            totalAmount += monthlyAmount;
          }
        }

      await client.query(
        'UPDATE fixed_assets SET depreciation_posted_through = $1 WHERE id = $2',
        [entryDate, asset.id]
      );

      cursor = addMonths(cursor, 1);
    }
  }

  return { postedCount, totalAmount };
};

export const getAssetBookValues = async (client) => {
  const assets = await client.query('SELECT * FROM fixed_assets ORDER BY acquired_date DESC');

  return Promise.all(
    assets.rows.map(async (asset) => {
      const depResult = await client.query(
        `SELECT COALESCE(SUM(jl.credit), 0)::int AS accumulated
         FROM journal_lines jl
         JOIN journal_entries je ON je.id = jl.journal_entry_id
         JOIN chart_of_accounts a ON a.id = jl.account_id
         WHERE je.source_type = 'asset_depreciation' AND je.source_id = $1 AND a.code = '1-2'`,
        [asset.id]
      );

      const totalCost = asset.acquisition_cost * (asset.quantity || 1);
      const accumulated = depResult.rows[0]?.accumulated || 0;
      const monthlyDep = Math.round(asset.annual_depreciation / 12);

      return {
        ...asset,
        total_cost: totalCost,
        accumulated_depreciation: accumulated,
        book_value: Math.max(0, totalCost - accumulated),
        monthly_depreciation: monthlyDep,
      };
    })
  );
};
