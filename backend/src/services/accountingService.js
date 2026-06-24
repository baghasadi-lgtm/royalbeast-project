import pool from '../db.js';
import { businessToday, toBusinessDate } from '../utils/businessDate.js';

const ACCOUNT_CODES = {
  KAS: '1-1',
  AKUM_DEP: '1-2',
  PERALATAN: '1-3',
  MODAL: '3-1',
  PRIVE: '3-2',
  PENDAPATAN_JASA: '4-1',
  PENDAPATAN_PRODUK: '4-2',
  BEBAN_GAJI: '5-1',
  BEBAN_MAKAN: '5-2',
  BEBAN_DEP: '5-7',
};

export const getAccountByCode = async (client, code) => {
  const db = client || pool;
  const result = await db.query('SELECT * FROM chart_of_accounts WHERE code = $1 AND is_active = true', [code]);
  if (result.rowCount === 0) throw new Error(`Akun ${code} tidak ditemukan`);
  return result.rows[0];
};

const validateLines = (lines) => {
  if (!lines?.length || lines.length < 2) {
    throw new Error('Jurnal minimal 2 baris (debit & kredit)');
  }
  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  if (totalDebit !== totalCredit) {
    throw new Error(`Jurnal tidak seimbang: Debit ${totalDebit} ≠ Kredit ${totalCredit}`);
  }
  if (totalDebit === 0) throw new Error('Nominal jurnal tidak boleh nol');
};

export const createJournalEntry = async (client, {
  entryDate,
  reference,
  description,
  entryType = 'general',
  sourceType = null,
  sourceId = null,
  createdBy = null,
  lines,
}) => {
  validateLines(lines);

  const entryResult = await client.query(
    `INSERT INTO journal_entries (entry_date, reference, description, entry_type, source_type, source_id, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [entryDate, reference, description, entryType, sourceType, sourceId, createdBy]
  );

  const entry = entryResult.rows[0];

  for (const line of lines) {
    await client.query(
      `INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, line_description)
       VALUES ($1, $2, $3, $4, $5)`,
      [entry.id, line.accountId, line.debit || 0, line.credit || 0, line.description || null]
    );
  }

  return entry;
};

const splitOrderRevenue = (order) => {
  const items = Array.isArray(order.cart_items) ? order.cart_items : [];
  const serviceTotal = items
    .filter((i) => i.type === 'service')
    .reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
  const productTotal = items
    .filter((i) => i.type === 'product')
    .reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);

  if (serviceTotal + productTotal > 0) {
    return { serviceTotal, productTotal };
  }

  return { serviceTotal: order.total_price, productTotal: 0 };
};

export const autoPostOrderRevenue = async (client, order, paymentMethod) => {
  const existing = await client.query(
    `SELECT id FROM journal_entries WHERE source_type = 'order_payment' AND source_id = $1`,
    [order.id]
  );
  if (existing.rowCount > 0) return null;

  const kas = await getAccountByCode(client, ACCOUNT_CODES.KAS);
  const pendapatanJasa = await getAccountByCode(client, ACCOUNT_CODES.PENDAPATAN_JASA);
  const pendapatanProduk = await getAccountByCode(client, ACCOUNT_CODES.PENDAPATAN_PRODUK);

  const { serviceTotal, productTotal } = splitOrderRevenue(order);
  const lines = [{ accountId: kas.id, debit: order.total_price, credit: 0, description: `Kas - Order #${order.id}` }];

  if (serviceTotal > 0) {
    lines.push({
      accountId: pendapatanJasa.id,
      debit: 0,
      credit: serviceTotal,
      description: `Pendapatan jasa - Order #${order.id}`,
    });
  }
  if (productTotal > 0) {
    lines.push({
      accountId: pendapatanProduk.id,
      debit: 0,
      credit: productTotal,
      description: `Pendapatan produk - Order #${order.id}`,
    });
  }

  const entryDate = order.paid_at ? toBusinessDate(order.paid_at) : businessToday();

  return createJournalEntry(client, {
    entryDate,
    reference: `J-ORD-${order.id}`,
    description: `Penerimaan ${paymentMethod.toUpperCase()} Order #${order.id}`,
    entryType: 'auto',
    sourceType: 'order_payment',
    sourceId: order.id,
    lines,
  });
};

export const getAccountBalance = async (accountId, asOfDate = null) => {
  let query = `
    SELECT
      a.code, a.name, a.account_type, a.normal_balance,
      COALESCE(SUM(jl.debit), 0)::int AS total_debit,
      COALESCE(SUM(jl.credit), 0)::int AS total_credit
    FROM chart_of_accounts a
    LEFT JOIN journal_lines jl ON jl.account_id = a.id
    LEFT JOIN journal_entries je ON je.id = jl.journal_entry_id
    WHERE a.id = $1
  `;
  const params = [accountId];

  if (asOfDate) {
    query += ' AND je.entry_date <= $2';
    params.push(asOfDate);
  }

  query += ' GROUP BY a.id';

  const result = await pool.query(query, params);
  if (result.rowCount === 0) return null;

  const row = result.rows[0];
  const net = row.total_debit - row.total_credit;
  const balance = row.normal_balance === 'debit' ? net : -net;
  return { ...row, balance };
};

export const getKasBalance = async (asOfDate = null) => {
  const kas = await pool.query(`SELECT id FROM chart_of_accounts WHERE code = $1`, [ACCOUNT_CODES.KAS]);
  if (kas.rowCount === 0) return 0;
  const bal = await getAccountBalance(kas.rows[0].id, asOfDate);
  return bal?.balance || 0;
};

export const getLedger = async ({ accountId, startDate, endDate }) => {
  const accountResult = await pool.query('SELECT * FROM chart_of_accounts WHERE id = $1', [accountId]);
  if (accountResult.rowCount === 0) throw new Error('Akun tidak ditemukan');
  const account = accountResult.rows[0];

  const linesResult = await pool.query(
    `
    SELECT jl.debit, jl.credit, jl.line_description,
           je.id AS entry_id, to_char(je.entry_date, 'YYYY-MM-DD') AS entry_date,
           je.reference, je.description AS entry_description
    FROM journal_lines jl
    JOIN journal_entries je ON je.id = jl.journal_entry_id
    WHERE jl.account_id = $1
      AND ($2::date IS NULL OR je.entry_date >= $2)
      AND ($3::date IS NULL OR je.entry_date <= $3)
    ORDER BY je.entry_date ASC, je.id ASC, jl.id ASC
    `,
    [accountId, startDate || null, endDate || null]
  );

  let running = 0;
  const lines = linesResult.rows.map((row, idx) => {
    const delta = row.debit - row.credit;
    running += account.normal_balance === 'debit' ? delta : -delta;
    return {
      no: idx + 1,
      entryDate: row.entry_date,
      description: row.line_description || row.entry_description,
      reference: row.reference,
      debit: row.debit,
      credit: row.credit,
      balance: running,
    };
  });

  return { account, lines, closingBalance: running };
};

export const getTrialBalance = async (asOfDate = null) => {
  const result = await pool.query(
    `
    SELECT
      a.id, a.code, a.name, a.account_type, a.normal_balance,
      COALESCE(SUM(jl.debit), 0)::int AS total_debit,
      COALESCE(SUM(jl.credit), 0)::int AS total_credit
    FROM chart_of_accounts a
    LEFT JOIN journal_lines jl ON jl.account_id = a.id
    LEFT JOIN journal_entries je ON je.id = jl.journal_entry_id
      AND ($1::date IS NULL OR je.entry_date <= $1)
    WHERE a.is_active = true
    GROUP BY a.id
    HAVING COALESCE(SUM(jl.debit), 0) > 0 OR COALESCE(SUM(jl.credit), 0) > 0
    ORDER BY a.code
    `,
    [asOfDate]
  );

  const rows = result.rows.map((row) => {
    const net = row.total_debit - row.total_credit;
    const balance = row.normal_balance === 'debit' ? net : -net;
    return {
      ...row,
      debitBalance: balance > 0 && row.normal_balance === 'debit' ? balance : balance < 0 && row.normal_balance === 'credit' ? Math.abs(balance) : 0,
      creditBalance: balance > 0 && row.normal_balance === 'credit' ? balance : balance < 0 && row.normal_balance === 'debit' ? Math.abs(balance) : 0,
    };
  });

  // Recalculate TB columns properly per accounting convention
  const formatted = result.rows.map((row) => {
    const net = row.total_debit - row.total_credit;
    let debitBalance = 0;
    let creditBalance = 0;

    if (row.normal_balance === 'debit') {
      if (net >= 0) debitBalance = net;
      else creditBalance = Math.abs(net);
    } else {
      if (net <= 0) creditBalance = Math.abs(net);
      else debitBalance = net;
    }

    return { ...row, debitBalance, creditBalance };
  });

  const totalDebit = formatted.reduce((s, r) => s + r.debitBalance, 0);
  const totalCredit = formatted.reduce((s, r) => s + r.creditBalance, 0);

  return { asOfDate, rows: formatted, totalDebit, totalCredit };
};

export const getIncomeStatement = async (startDate, endDate) => {
  const result = await pool.query(
    `
    SELECT a.code, a.name, a.account_type,
      COALESCE(SUM(jl.credit - jl.debit), 0)::int AS amount
    FROM chart_of_accounts a
    JOIN journal_lines jl ON jl.account_id = a.id
    JOIN journal_entries je ON je.id = jl.journal_entry_id
    WHERE a.account_type IN ('revenue', 'expense')
      AND je.entry_date >= $1 AND je.entry_date <= $2
    GROUP BY a.id
    ORDER BY a.code
    `,
    [startDate, endDate]
  );

  const revenues = result.rows.filter((r) => r.account_type === 'revenue').map((r) => ({ ...r, amount: r.amount }));
  const expenses = result.rows.filter((r) => r.account_type === 'expense').map((r) => ({ ...r, amount: Math.abs(r.amount) }));

  const totalRevenue = revenues.reduce((s, r) => s + r.amount, 0);
  const totalExpense = expenses.reduce((s, r) => s + r.amount, 0);
  const netIncome = totalRevenue - totalExpense;

  return { startDate, endDate, revenues, expenses, totalRevenue, totalExpense, netIncome };
};

export const getBalanceSheet = async (asOfDate) => {
  const tb = await getTrialBalance(asOfDate);

  const assets = [];
  const liabilities = [];
  const equity = [];

  for (const row of tb.rows) {
    const bal = row.debitBalance - row.creditBalance;
    const item = { code: row.code, name: row.name, amount: Math.abs(bal) };

    if (row.account_type === 'asset') assets.push({ ...item, amount: row.debitBalance - row.creditBalance });
    else if (row.account_type === 'contra_asset') assets.push({ ...item, amount: -(row.creditBalance - row.debitBalance) });
    else if (row.account_type === 'liability') liabilities.push(item);
    else if (row.account_type === 'equity') {
      const eqAmount = row.normal_balance === 'credit'
        ? row.creditBalance - row.debitBalance
        : row.debitBalance - row.creditBalance;
      equity.push({ ...item, amount: row.code === '3-2' ? -(row.debitBalance) : row.creditBalance - row.debitBalance });
    }
  }

  // Fix equity display for prive and modal
  const equityFixed = tb.rows
    .filter((r) => r.account_type === 'equity')
    .map((r) => {
      if (r.code === '3-2') {
        return { code: r.code, name: r.name, amount: -r.debitBalance };
      }
      return { code: r.code, name: r.name, amount: r.creditBalance - r.debitBalance };
    });

  const totalAssets = assets.reduce((s, a) => s + a.amount, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.amount, 0);
  const totalEquity = equityFixed.reduce((s, e) => s + e.amount, 0);

  // Include net income in equity if not closed
  const yearStart = `${asOfDate.slice(0, 4)}-01-01`;
  const pl = await getIncomeStatement(yearStart, asOfDate);

  return {
    asOfDate,
    assets,
    liabilities,
    equity: equityFixed,
    netIncome: pl.netIncome,
    totalAssets,
    totalLiabilities,
    totalEquity: totalEquity + pl.netIncome,
    totalLiabilitiesAndEquity: totalLiabilities + totalEquity + pl.netIncome,
  };
};

export { ACCOUNT_CODES };
