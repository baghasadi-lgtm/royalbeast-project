import express from 'express';
import {
  getAccounts,
  getJournals,
  postJournal,
  getLedgerReport,
  getTrialBalanceReport,
  getIncomeStatementReport,
  getBalanceSheetReport,
  getFinanceSummary,
  getFixedAssets,
  createFixedAsset,
  postOperationalExpense,
  postCapitalInjection,
  postPrive,
  getExpenseCategories,
} from '../controllers/accountingController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate, requireRole('owner'));

router.get('/summary', getFinanceSummary);
router.get('/accounts', getAccounts);
router.get('/journals', getJournals);
router.post('/journals', postJournal);
router.get('/ledger', getLedgerReport);
router.get('/trial-balance', getTrialBalanceReport);
router.get('/income-statement', getIncomeStatementReport);
router.get('/balance-sheet', getBalanceSheetReport);
router.get('/fixed-assets', getFixedAssets);
router.post('/fixed-assets', createFixedAsset);
router.get('/expense-categories', getExpenseCategories);
router.post('/expenses', postOperationalExpense);
router.post('/capital', postCapitalInjection);
router.post('/prive', postPrive);

export default router;
