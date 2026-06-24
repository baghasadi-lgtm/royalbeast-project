-- Komisi staf = 50% dari harga jual
UPDATE kapster_service_prices
SET komisi = ROUND(harga_jual * 0.5)
WHERE harga_jual > 0;
