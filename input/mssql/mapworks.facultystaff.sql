/* pulls active faculty and FERPA-certified staff */
SELECT * FROM rptp.mapworks.active_faculty
UNION
SELECT * FROM rptp.employees.ferpa_certified