import pool from '../db.js';
import {
  createJournalEntry,
  getAccountByCode,
  getLedger,
  getTrialBalance,
  getIncomeStatement,
  getBalanceSheet,
  getKasBalance,
} from '../services/accountingService.js';
import {
  autoPostOperationalExpense,
  autoPostCapitalInjection,
  autoPostPrive,
  autoPostAssetAcquisition,
  getAssetBookValues,
  EXPENSE_CATEGORIES,
} from '../services/accountingAutoPost.js';
import { businessToday } from '../utils/businessDate.js';

export const getAccounts = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM chart_of_accounts WHERE is_active = true ORDER BY code'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getJournals = async (req, res) => {
  try {
    const { startDate, endDate, entryType } = req.query;
    let query = `
      SELECT je.id, to_char(je.entry_date, 'YYYY-MM-DD') AS entry_date,
             je.reference, je.description, je.entry_type, je.source_type, je.source_id,
             je.created_at, u.username AS created_by_name
      FROM journal_entries je
      LEFT JOIN users u ON u.id = je.created_by
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (startDate) {
      query += ` AND je.entry_date >= $${idx++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND je.entry_date <= $${idx++}`;
      params.push(endDate);
    }
    if (entryType) {
      query += ` AND je.entry_type = $${idx++}`;
      params.push(entryType);
    }

    query += ' ORDER BY je.entry_date DESC, je.id DESC LIMIT 200';

    const entries = await pool.query(query, params);

    const withLines = await Promise.all(
      entries.rows.map(async (entry) => {
        const lines = await pool.query(
          `
          SELECT jl.*, a.code AS account_code, a.name AS account_name
          FROM journal_lines jl
          JOIN chart_of_accounts a ON a.id = jl.account_id
          WHERE jl.journal_entry_id = $1
          ORDER BY jl.debit DESC, jl.id ASC
          `,
          [entry.id]
        );
        return { ...entry, lines: lines.rows };
      })
    );

    res.json(withLines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const postJournal = async (req, res) => {
  const client = await pool.connect();
  try {
    const { entryDate, reference, description, entryType = 'general', lines } = req.body;

    if (!entryDate || !lines?.length) {
      return res.status(400).json({ error: 'Tanggal dan baris jurnal wajib diisi' });
    }

    await client.query('BEGIN');

    const resolvedLines = [];
    for (const line of lines) {
      let accountId = line.accountId;
      if (!accountId && line.accountCode) {
        const acc = await getAccountByCode(client, line.accountCode);
        accountId = acc.id;
      }
      if (!accountId) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Setiap baris harus punya akun' });
      }
      resolvedLines.push({
        accountId,
        debit: Number(line.debit) || 0,
        credit: Number(line.credit) || 0,
        description: line.description,
      });
    }

    const entry = await createJournalEntry(client, {
      entryDate,
      reference: reference || `J-${Date.now()}`,
      description,
      entryType,
      createdBy: req.user.id,
      lines: resolvedLines,
    });

    await client.query('COMMIT');
    res.status(201).json(entry);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const getLedgerReport = async (req, res) => {
  try {
    const { accountId, startDate, endDate } = req.query;
    if (!accountId) return res.status(400).json({ error: 'accountId wajib' });
    const data = await getLedger({ accountId: Number(accountId), startDate, endDate });
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getTrialBalanceReport = async (req, res) => {
  try {
    const data = await getTrialBalance(req.query.asOfDate || null);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getIncomeStatementReport = async (req, res) => {
  try {
    const startDate = req.query.startDate || `${new Date().getFullYear()}-01-01`;
    const endDate = req.query.endDate || businessToday();
    const data = await getIncomeStatement(startDate, endDate);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBalanceSheetReport = async (req, res) => {
  try {
    const asOfDate = req.query.asOfDate || businessToday();
    const data = await getBalanceSheet(asOfDate);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getFinanceSummary = async (req, res) => {
  try {
    const today = businessToday();
    const yearStart = `${today.slice(0, 4)}-01-01`;
    const [kas, income, trialBalance] = await Promise.all([
      getKasBalance(today),
      getIncomeStatement(yearStart, today),
      getTrialBalance(today),
    ]);

    res.json({
      kasBalance: kas,
      netIncomeYtd: income.netIncome,
      totalRevenueYtd: income.totalRevenue,
      totalExpenseYtd: income.totalExpense,
      trialBalanceOk: trialBalance.totalDebit === trialBalance.totalCredit,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getFixedAssets = async (req, res) => {
  const client = await pool.connect();
  try {
    const assets = await getAssetBookValues(client);
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const createFixedAsset = async (req, res) => {
  const client = await pool.connect();
  try {
    const { acquiredDate, name, quantity, acquisitionCost, usefulLifeYears, notes, paidFrom = 'cash' } = req.body;
    const annualDepreciation = Math.round(acquisitionCost / usefulLifeYears);

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO fixed_assets (acquired_date, name, quantity, acquisition_cost, useful_life_years, annual_depreciation, notes, paid_from)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [acquiredDate, name, quantity || 1, acquisitionCost, usefulLifeYears, annualDepreciation, notes, paidFrom]
    );

    const asset = result.rows[0];
    await autoPostAssetAcquisition(client, asset);

    await client.query('COMMIT');
    res.status(201).json(asset);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const postOperationalExpense = async (req, res) => {
  const client = await pool.connect();
  try {
    const { category, amount, entryDate, description } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Nominal wajib diisi' });

    await client.query('BEGIN');
    const entry = await autoPostOperationalExpense(client, {
      category: category || 'other',
      amount: Number(amount),
      entryDate: entryDate || businessToday(),
      description,
      createdBy: req.user.id,
    });
    await client.query('COMMIT');
    res.status(201).json(entry);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const postCapitalInjection = async (req, res) => {
  const client = await pool.connect();
  try {
    const { amount, entryDate, description } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Nominal wajib diisi' });

    await client.query('BEGIN');
    const entry = await autoPostCapitalInjection(client, {
      amount: Number(amount),
      entryDate: entryDate || businessToday(),
      description,
      createdBy: req.user.id,
    });
    await client.query('COMMIT');
    res.status(201).json(entry);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const postPrive = async (req, res) => {
  const client = await pool.connect();
  try {
    const { amount, entryDate, description } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Nominal wajib diisi' });

    await client.query('BEGIN');
    const entry = await autoPostPrive(client, {
      amount: Number(amount),
      entryDate: entryDate || businessToday(),
      description,
      createdBy: req.user.id,
    });
    await client.query('COMMIT');
    res.status(201).json(entry);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const getExpenseCategories = async (req, res) => {
  res.json(EXPENSE_CATEGORIES);
};

// Legacy — depresiasi sekarang otomatis bulanan
export const postDepreciationAdjustment = async (req, res) => {
  res.status(410).json({
    error: 'Depresiasi sudah otomatis setiap bulan. Tidak perlu posting manual.',
  });
};
