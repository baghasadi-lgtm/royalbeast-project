import pool from '../db.js';
import { runMonthlyDepreciation } from '../services/accountingAutoPost.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export const startDepreciationScheduler = () => {
  const run = async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await runMonthlyDepreciation(client);
      await client.query('COMMIT');
      if (result.postedCount > 0) {
        console.log(`📉 Depresiasi otomatis: ${result.postedCount} jurnal, total Rp ${result.totalAmount}`);
      }
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Depreciation scheduler error:', error.message);
    } finally {
      client.release();
    }
  };

  run();
  setInterval(run, DAY_MS);
};
