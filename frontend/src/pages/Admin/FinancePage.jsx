import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import { formatPrice, formatDateId, businessToday } from '../../utils/format';
import { Loading } from '../../components/Loading';

const TABS = [
  { id: 'ringkasan', label: 'Ringkasan' },
  { id: 'catat', label: 'Catat Manual' },
  { id: 'aset', label: 'Peralatan Toko' },
  { id: 'jurnal', label: 'Jurnal Umum' },
  { id: 'buku-besar', label: 'Buku Besar' },
  { id: 'neraca-saldo', label: 'Neraca Saldo' },
  { id: 'laporan', label: 'Laporan Keuangan' },
];

const today = businessToday;
const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const currentYear = () => String(new Date().getFullYear());

const resolvePeriodDates = (mode, month, year) => {
  if (mode === 'month') {
    const [y, m] = month.split('-').map(Number);
    const startDate = `${month}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;
    return { startDate, endDate, asOfDate: endDate };
  }

  const y = Number(year);
  const now = new Date();
  const startDate = `${y}-01-01`;
  const endDate = y === now.getFullYear() ? today() : `${y}-12-31`;
  return { startDate, endDate, asOfDate: endDate };
};

const formatPeriodHint = (startDate, endDate) => {
  const fmt = (d) =>
    new Date(`${d}T12:00:00`).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  return `${fmt(startDate)} – ${fmt(endDate)}`;
};

const YEAR_OPTIONS = (() => {
  const end = new Date().getFullYear();
  const years = [];
  for (let y = end; y >= end - 5; y -= 1) years.push(y);
  return years;
})();

export const FinancePage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('ringkasan');
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [journals, setJournals] = useState([]);
  const [ledger, setLedger] = useState(null);
  const [trialBalance, setTrialBalance] = useState(null);
  const [incomeStatement, setIncomeStatement] = useState(null);
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [fixedAssets, setFixedAssets] = useState([]);

  const [periodMode, setPeriodMode] = useState('month');
  const [periodMonth, setPeriodMonth] = useState(currentMonth);
  const [periodYear, setPeriodYear] = useState(currentYear);
  const [ledgerAccountId, setLedgerAccountId] = useState('');

  const [expenseCategories, setExpenseCategories] = useState({});

  const [expenseForm, setExpenseForm] = useState({
    entryDate: today(),
    category: 'supplies',
    amount: '',
    description: '',
  });

  const [capitalForm, setCapitalForm] = useState({
    entryDate: today(),
    amount: '',
    description: '',
  });

  const [priveForm, setPriveForm] = useState({
    entryDate: today(),
    amount: '',
    description: '',
  });

  const [assetForm, setAssetForm] = useState({
    acquiredDate: today(),
    name: '',
    quantity: 1,
    acquisitionCost: '',
    usefulLifeYears: '5',
    paidFrom: 'cash',
    notes: '',
  });

  const loadBase = useCallback(async () => {
    const [acc, sum, assets, cats] = await Promise.all([
      api.getAccounts(),
      api.getFinanceSummary(),
      api.getFixedAssets(),
      api.getExpenseCategories(),
    ]);
    setAccounts(acc);
    setSummary(sum);
    setFixedAssets(assets);
    setExpenseCategories(cats);
    if (!ledgerAccountId && acc.length) {
      setLedgerAccountId(String(acc.find((a) => a.code === '1-1')?.id || acc[0].id));
    }
  }, [ledgerAccountId]);

  const loadTab = useCallback(async () => {
    setLoading(true);
    const { startDate, endDate, asOfDate } = resolvePeriodDates(periodMode, periodMonth, periodYear);
    try {
      await loadBase();
      if (tab === 'jurnal') {
        setJournals(await api.getJournals({ startDate, endDate }));
      }
      if (tab === 'buku-besar' && ledgerAccountId) {
        setLedger(await api.getLedger({
          accountId: ledgerAccountId,
          startDate,
          endDate,
        }));
      }
      if (tab === 'neraca-saldo') {
        setTrialBalance(await api.getTrialBalance({ asOfDate }));
      }
      if (tab === 'laporan') {
        const [pl, bs] = await Promise.all([
          api.getIncomeStatement({ startDate, endDate }),
          api.getBalanceSheet({ asOfDate }),
        ]);
        setIncomeStatement(pl);
        setBalanceSheet(bs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tab, periodMode, periodMonth, periodYear, ledgerAccountId, loadBase]);

  useEffect(() => { loadTab(); }, [loadTab]);

  const handleExpense = async (e) => {
    e.preventDefault();
    try {
      await api.postOperationalExpense({
        ...expenseForm,
        amount: parseInt(expenseForm.amount),
      });
      alert('Pengeluaran tercatat');
      setExpenseForm({ entryDate: today(), category: 'supplies', amount: '', description: '' });
      loadTab();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCapital = async (e) => {
    e.preventDefault();
    try {
      await api.postCapitalInjection({
        ...capitalForm,
        amount: parseInt(capitalForm.amount),
      });
      alert('Modal tercatat');
      setCapitalForm({ entryDate: today(), amount: '', description: '' });
      loadTab();
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePrive = async (e) => {
    e.preventDefault();
    try {
      await api.postPrive({
        ...priveForm,
        amount: parseInt(priveForm.amount),
      });
      alert('Prive tercatat');
      setPriveForm({ entryDate: today(), amount: '', description: '' });
      loadTab();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      await api.createFixedAsset({
        ...assetForm,
        acquisitionCost: parseInt(assetForm.acquisitionCost),
        usefulLifeYears: parseInt(assetForm.usefulLifeYears),
        quantity: parseInt(assetForm.quantity) || 1,
      });
      setAssetForm({
        acquiredDate: today(),
        name: '',
        quantity: 1,
        acquisitionCost: '',
        usefulLifeYears: '5',
        paidFrom: 'cash',
        notes: '',
      });
      alert('Peralatan tercatat. Jurnal & depresiasi otomatis diurus sistem.');
      loadTab();
    } catch (err) {
      alert(err.message);
    }
  };

  const assetMonthlyPreview = () => {
    const cost = parseInt(assetForm.acquisitionCost) || 0;
    const years = parseInt(assetForm.usefulLifeYears) || 1;
    return Math.round(cost / years / 12);
  };

  if (loading && !summary) return <Loading />;

  const periodDates = resolvePeriodDates(periodMode, periodMonth, periodYear);

  return (
    <div className="page-container max-w-5xl space-y-4 sm:space-y-6">
      <div>
        <button onClick={() => navigate('/admin')} className="btn-ghost text-xs mb-2 -ml-2">
          ← Admin
        </button>
        <h2 className="section-title text-xl sm:text-2xl">Keuangan & Akuntansi</h2>
        <p className="text-xs text-muted mt-1">Double-entry · selaras format Excel Royal Beast</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-3 py-2 rounded-full text-xs font-medium transition-colors ${
              tab === t.id ? 'bg-ink text-white' : 'bg-white border border-line text-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(tab === 'jurnal' || tab === 'buku-besar' || tab === 'laporan' || tab === 'neraca-saldo') && (
        <div className="filter-card">
          <div className="filter-bar filter-bar--inline">
            <div className="filter-field">
              <label className="label-text">Tampilkan per</label>
              <select
                value={periodMode}
                onChange={(e) => setPeriodMode(e.target.value)}
                className="input-field py-2.5"
              >
                <option value="month">Bulan</option>
                <option value="year">Tahun</option>
              </select>
            </div>
            {periodMode === 'month' ? (
              <div className="filter-field">
                <label className="label-text">Bulan</label>
                <div className="date-input-wrap">
                  <input
                    type="month"
                    value={periodMonth}
                    onChange={(e) => setPeriodMonth(e.target.value)}
                    className="input-field py-2.5"
                  />
                </div>
              </div>
            ) : (
              <div className="filter-field">
                <label className="label-text">Tahun</label>
                <select
                  value={periodYear}
                  onChange={(e) => setPeriodYear(e.target.value)}
                  className="input-field py-2.5"
                >
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {tab === 'buku-besar' && (
              <div className="filter-field sm:col-span-2 lg:col-span-1">
                <label className="label-text">Akun</label>
                <select
                  value={ledgerAccountId}
                  onChange={(e) => setLedgerAccountId(e.target.value)}
                  className="input-field py-2.5"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {a.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="filter-field sm:col-span-2 lg:col-span-1">
              <button onClick={loadTab} className="btn-secondary py-2.5 w-full text-xs sm:text-sm">
                Terapkan
              </button>
            </div>
          </div>
          <p className="text-[11px] text-muted mt-3">
            Rentang: {formatPeriodHint(periodDates.startDate, periodDates.endDate)}
          </p>
        </div>
      )}

      {tab === 'ringkasan' && summary && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: 'Saldo Kas (1-1)', value: formatPrice(summary.kasBalance) },
              { label: 'Pendapatan YTD', value: formatPrice(summary.totalRevenueYtd) },
              { label: 'Beban YTD', value: formatPrice(summary.totalExpenseYtd) },
              { label: 'Laba Bersih YTD', value: formatPrice(summary.netIncomeYtd) },
              { label: 'Neraca Saldo', value: summary.trialBalanceOk ? '✓ Seimbang' : '⚠ Tidak seimbang' },
            ].map(({ label, value }) => (
              <div key={label} className="card p-4">
                <p className="text-xs text-muted">{label}</p>
                <p className="text-lg font-light text-ink mt-1">{value}</p>
              </div>
            ))}
          </div>
          <div className="card p-4 text-sm text-muted space-y-2">
            <p className="font-medium text-ink text-xs mb-1">Yang otomatis (tanpa input manual)</p>
            <p>✓ Pembayaran customer → Kas & Pendapatan</p>
            <p>✓ Order selesai → Bagi hasil pegawai + uang makan (1×/hari)</p>
            <p>✓ Beli peralatan → jurnal perolehan aset</p>
            <p>✓ Depresiasi peralatan → setiap bulan otomatis</p>
            <p className="font-medium text-ink text-xs pt-2 mb-1">Yang perlu kamu catat manual</p>
            <p>→ Pengeluaran operasional (wifi, listrik, dll.)</p>
            <p>→ Tambah modal / ambil uang pribadi (prive)</p>
          </div>
        </div>
      )}

      {tab === 'jurnal' && (
        <div className="space-y-3">
          {journals.length === 0 ? (
            <div className="card p-6 text-center text-muted text-sm">Belum ada jurnal</div>
          ) : (
            journals.map((entry) => (
              <div key={entry.id} className="card p-4 space-y-2">
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between text-xs text-muted">
                  <span className="break-words">
                    {formatDateId(entry.entry_date)} · {entry.reference} · {entry.entry_type}
                  </span>
                  <span className="shrink-0">{entry.created_by_name || 'sistem'}</span>
                </div>
                <p className="text-sm font-medium text-ink">{entry.description}</p>
                <div className="table-scroll -mx-4 px-4 sm:mx-0 sm:px-0">
                  <div className="min-w-[20rem] divide-y divide-line text-xs">
                    {entry.lines.map((line) => (
                      <div key={line.id} className="py-2 flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                        <span className="text-muted break-words">
                          {line.account_code} {line.account_name}
                        </span>
                        <div className="flex gap-4 tabular-nums shrink-0">
                          <span className="w-24 text-right">{line.debit > 0 ? formatPrice(line.debit) : ''}</span>
                          <span className="w-24 text-right">{line.credit > 0 ? formatPrice(line.credit) : ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'catat' && (
        <div className="space-y-4">
          <form onSubmit={handleExpense} className="card p-5 space-y-3">
            <h3 className="font-medium text-sm text-ink">Catat Pengeluaran Operasional</h3>
            <p className="text-xs text-muted">Wifi, listrik, belanja salon, iuran, dll.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="filter-field">
                <label className="label-text">Tanggal</label>
                <div className="date-input-wrap">
                  <input type="date" value={expenseForm.entryDate} onChange={(e) => setExpenseForm({ ...expenseForm, entryDate: e.target.value })} className="input-field" required />
                </div>
              </div>
              <div className="filter-field">
                <label className="label-text">Jenis</label>
                <select value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} className="input-field">
                  {Object.entries(expenseCategories).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <input type="number" placeholder="Nominal (Rp)" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} className="input-field" required />
            <input placeholder="Keterangan (opsional)" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} className="input-field" />
            <button type="submit" className="btn-primary w-full">Simpan Pengeluaran</button>
          </form>

          <form onSubmit={handleCapital} className="card p-5 space-y-3">
            <h3 className="font-medium text-sm text-ink">Tambah Modal ke Kas</h3>
            <p className="text-xs text-muted">Ketika owner menambah uang ke operasional toko</p>
            <div className="date-input-wrap">
              <input type="date" value={capitalForm.entryDate} onChange={(e) => setCapitalForm({ ...capitalForm, entryDate: e.target.value })} className="input-field" required />
            </div>
            <input type="number" placeholder="Nominal (Rp)" value={capitalForm.amount} onChange={(e) => setCapitalForm({ ...capitalForm, amount: e.target.value })} className="input-field" required />
            <input placeholder="Keterangan" value={capitalForm.description} onChange={(e) => setCapitalForm({ ...capitalForm, description: e.target.value })} className="input-field" />
            <button type="submit" className="btn-secondary w-full">Catat Modal</button>
          </form>

          <form onSubmit={handlePrive} className="card p-5 space-y-3 border-amber-200 bg-amber-50/50">
            <h3 className="font-medium text-sm text-ink">Ambil Uang Pribadi (Prive)</h3>
            <p className="text-xs text-muted">Owner mengambil uang dari kas toko untuk keperluan pribadi</p>
            <div className="date-input-wrap">
              <input type="date" value={priveForm.entryDate} onChange={(e) => setPriveForm({ ...priveForm, entryDate: e.target.value })} className="input-field" required />
            </div>
            <input type="number" placeholder="Nominal (Rp)" value={priveForm.amount} onChange={(e) => setPriveForm({ ...priveForm, amount: e.target.value })} className="input-field" required />
            <input placeholder="Keterangan" value={priveForm.description} onChange={(e) => setPriveForm({ ...priveForm, description: e.target.value })} className="input-field" />
            <button type="submit" className="btn-secondary w-full">Catat Prive</button>
          </form>
        </div>
      )}

      {tab === 'buku-besar' && ledger && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-line">
            <p className="font-medium text-sm break-words">{ledger.account.code} — {ledger.account.name}</p>
            <p className="text-xs text-muted">Saldo akhir: {formatPrice(ledger.closingBalance)}</p>
          </div>
          <p className="px-4 py-2 text-[10px] text-muted border-b border-line sm:hidden">
            Geser tabel ke kiri/kanan →
          </p>
          <div className="table-scroll">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted border-b border-line">
                  <th className="text-left p-3 whitespace-nowrap">No</th>
                  <th className="text-left p-3 whitespace-nowrap">Tanggal</th>
                  <th className="text-left p-3 whitespace-nowrap">Keterangan</th>
                  <th className="text-left p-3 whitespace-nowrap">Ref</th>
                  <th className="text-right p-3 whitespace-nowrap">Debit</th>
                  <th className="text-right p-3 whitespace-nowrap">Kredit</th>
                  <th className="text-right p-3 whitespace-nowrap">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {ledger.lines.map((row) => (
                  <tr key={row.no} className="border-b border-line/50">
                    <td className="p-3 whitespace-nowrap">{row.no}</td>
                    <td className="p-3 whitespace-nowrap">{formatDateId(row.entryDate)}</td>
                    <td className="p-3 min-w-[8rem]">{row.description}</td>
                    <td className="p-3 text-muted whitespace-nowrap">{row.reference}</td>
                    <td className="p-3 text-right tabular-nums whitespace-nowrap">{row.debit ? formatPrice(row.debit) : ''}</td>
                    <td className="p-3 text-right tabular-nums whitespace-nowrap">{row.credit ? formatPrice(row.credit) : ''}</td>
                    <td className="p-3 text-right tabular-nums font-medium whitespace-nowrap">{formatPrice(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'neraca-saldo' && trialBalance && (
        <div className="card overflow-hidden">
          <p className="px-4 py-2 text-[10px] text-muted border-b border-line sm:hidden">
            Geser tabel ke kiri/kanan →
          </p>
          <div className="table-scroll">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted border-b border-line">
                  <th className="text-left p-3 whitespace-nowrap">Kode</th>
                  <th className="text-left p-3 whitespace-nowrap">Nama Akun</th>
                  <th className="text-right p-3 whitespace-nowrap">Debit</th>
                  <th className="text-right p-3 whitespace-nowrap">Kredit</th>
                </tr>
              </thead>
              <tbody>
                {trialBalance.rows.map((row) => (
                  <tr key={row.code} className="border-b border-line/50">
                    <td className="p-3 whitespace-nowrap">{row.code}</td>
                    <td className="p-3 min-w-[10rem]">{row.name}</td>
                    <td className="p-3 text-right tabular-nums whitespace-nowrap">{row.debitBalance ? formatPrice(row.debitBalance) : ''}</td>
                    <td className="p-3 text-right tabular-nums whitespace-nowrap">{row.creditBalance ? formatPrice(row.creditBalance) : ''}</td>
                  </tr>
                ))}
                <tr className="font-medium bg-surface/50">
                  <td className="p-3" colSpan={2}>TOTAL</td>
                  <td className="p-3 text-right whitespace-nowrap">{formatPrice(trialBalance.totalDebit)}</td>
                  <td className="p-3 text-right whitespace-nowrap">{formatPrice(trialBalance.totalCredit)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'laporan' && incomeStatement && balanceSheet && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-4 sm:p-5 space-y-3">
            <h3 className="font-medium text-sm">Laporan Laba Rugi</h3>
            <p className="text-xs text-muted break-words">{incomeStatement.startDate} – {incomeStatement.endDate}</p>
            <div className="space-y-1 text-sm">
              <p className="label-text">Pendapatan</p>
              {incomeStatement.revenues.map((r) => (
                <div key={r.code} className="flex justify-between gap-3">
                  <span className="text-muted break-words min-w-0">{r.name}</span>
                  <span className="shrink-0 tabular-nums">{formatPrice(r.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between gap-3 font-medium border-t border-line pt-2">
                <span>Total Pendapatan</span>
                <span className="shrink-0 tabular-nums">{formatPrice(incomeStatement.totalRevenue)}</span>
              </div>
              <p className="label-text pt-2">Beban</p>
              {incomeStatement.expenses.map((r) => (
                <div key={r.code} className="flex justify-between gap-3">
                  <span className="text-muted break-words min-w-0">{r.name}</span>
                  <span className="shrink-0 tabular-nums">{formatPrice(r.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between gap-3 font-medium border-t border-line pt-2">
                <span>Total Beban</span>
                <span className="shrink-0 tabular-nums">{formatPrice(incomeStatement.totalExpense)}</span>
              </div>
              <div className="flex justify-between gap-3 font-medium text-emerald-700 border-t border-line pt-2">
                <span>Laba Bersih</span>
                <span className="shrink-0 tabular-nums">{formatPrice(incomeStatement.netIncome)}</span>
              </div>
            </div>
          </div>

          <div className="card p-4 sm:p-5 space-y-3">
            <h3 className="font-medium text-sm">Neraca</h3>
            <p className="text-xs text-muted">Per {balanceSheet.asOfDate}</p>
            <div className="space-y-1 text-sm">
              <p className="label-text">Aset</p>
              {balanceSheet.assets.map((a) => (
                <div key={a.code} className="flex justify-between gap-3">
                  <span className="text-muted break-words min-w-0">{a.name}</span>
                  <span className="shrink-0 tabular-nums">{formatPrice(a.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between gap-3 font-medium">
                <span>Total Aset</span>
                <span className="shrink-0 tabular-nums">{formatPrice(balanceSheet.totalAssets)}</span>
              </div>
              <p className="label-text pt-2">Ekuitas</p>
              {balanceSheet.equity.map((e) => (
                <div key={e.code} className="flex justify-between gap-3">
                  <span className="text-muted break-words min-w-0">{e.name}</span>
                  <span className="shrink-0 tabular-nums">{formatPrice(e.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between gap-3">
                <span className="text-muted break-words min-w-0">Laba Bersih (belum ditutup)</span>
                <span className="shrink-0 tabular-nums">{formatPrice(balanceSheet.netIncome)}</span>
              </div>
              <div className="flex justify-between gap-3 font-medium border-t border-line pt-2">
                <span>Total Ekuitas + Laba</span>
                <span className="shrink-0 tabular-nums">{formatPrice(balanceSheet.totalEquity)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'aset' && (
        <div className="space-y-4">
          <div className="card p-4 bg-surface/50 text-xs text-muted space-y-1">
            <p className="font-medium text-ink text-sm">Apa itu depresiasi?</p>
            <p>Peralatan (kursi, clipper, dll.) turun nilainya seiring waktu. Sistem otomatis mencatat penurunan ini setiap bulan sebagai beban, supaya laporan keuangan akurat.</p>
            <p className="text-emerald-700">Kamu tidak perlu klik apa pun — depresiasi jalan sendiri tiap bulan.</p>
          </div>

          <form onSubmit={handleCreateAsset} className="card p-5 space-y-3">
            <h3 className="font-medium text-sm">Beli Peralatan Baru</h3>
            <input placeholder="Nama barang (mis. Kursi barber, Clipper)" value={assetForm.name} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} className="input-field" required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="filter-field">
                <label className="label-text">Tanggal beli</label>
                <div className="date-input-wrap">
                  <input type="date" value={assetForm.acquiredDate} onChange={(e) => setAssetForm({ ...assetForm, acquiredDate: e.target.value })} className="input-field" required />
                </div>
              </div>
              <div className="filter-field">
                <label className="label-text">Harga beli (Rp)</label>
                <input type="number" value={assetForm.acquisitionCost} onChange={(e) => setAssetForm({ ...assetForm, acquisitionCost: e.target.value })} className="input-field" required />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="filter-field">
                <label className="label-text">Dipakai berapa tahun?</label>
                <input type="number" min="1" value={assetForm.usefulLifeYears} onChange={(e) => setAssetForm({ ...assetForm, usefulLifeYears: e.target.value })} className="input-field" required />
                <p className="text-[10px] text-muted mt-1">Contoh: clipper 2–3 th, kursi 5–8 th</p>
              </div>
              <div className="filter-field">
                <label className="label-text">Dibayar dari</label>
                <select value={assetForm.paidFrom} onChange={(e) => setAssetForm({ ...assetForm, paidFrom: e.target.value })} className="input-field">
                  <option value="cash">Kas toko</option>
                  <option value="capital">Modal owner</option>
                </select>
              </div>
            </div>
            {assetForm.acquisitionCost && assetForm.usefulLifeYears && (
              <p className="text-xs text-muted bg-surface rounded-lg p-3">
                Estimasi penurunan nilai: <strong className="text-ink">{formatPrice(assetMonthlyPreview())}/bulan</strong>
                {' '}({formatPrice(Math.round((parseInt(assetForm.acquisitionCost) || 0) / (parseInt(assetForm.usefulLifeYears) || 1)))}/tahun)
              </p>
            )}
            <button type="submit" className="btn-primary w-full">Simpan Peralatan</button>
          </form>

          <div className="space-y-2">
            <p className="label-text">Daftar Peralatan</p>
            {fixedAssets.length === 0 ? (
              <div className="card p-6 text-center text-muted text-sm">Belum ada peralatan tercatat</div>
            ) : fixedAssets.map((a) => (
              <div key={a.id} className="card p-4 space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start">
                  <div className="min-w-0">
                    <p className="font-medium text-sm break-words">{a.name}</p>
                    <p className="text-xs text-muted">Dibeli {a.acquired_date} · dipakai {a.useful_life_years} tahun</p>
                  </div>
                  <span className="text-sm tabular-nums font-medium shrink-0">{formatPrice(a.total_cost)}</span>
                </div>
                <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-2 text-[10px] text-center">
                  <div className="bg-surface rounded-lg p-2">
                    <p className="text-muted">Harga beli</p>
                    <p className="font-medium text-ink">{formatPrice(a.total_cost)}</p>
                  </div>
                  <div className="bg-surface rounded-lg p-2">
                    <p className="text-muted">Sudah turun</p>
                    <p className="font-medium text-amber-700">{formatPrice(a.accumulated_depreciation)}</p>
                  </div>
                  <div className="bg-surface rounded-lg p-2">
                    <p className="text-muted">Nilai sekarang</p>
                    <p className="font-medium text-emerald-700">{formatPrice(a.book_value)}</p>
                  </div>
                </div>
                <p className="text-[10px] text-muted text-center">Otomatis turun {formatPrice(a.monthly_depreciation)}/bulan</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
