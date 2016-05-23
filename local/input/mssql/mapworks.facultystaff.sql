/* pulls active faculty and FERPA-certified staff */
SELECT * FROM oracle.mapworks.active_faculty
UNION
SELECT * FROM oracle.employees.ferpa_certified