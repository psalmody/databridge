SELECT DISTINCT AA.EMPLOYEE_ID AS "ExternalId",
       GOBTPAC.GOBTPAC_EXTERNAL_USER AS "AuthUsername",
       AA.NAME_FIRST AS "Firstname",
       AA.EMP_NAME_LAST AS "Lastname",
       AA.JOB_TITLE AS "Title",
       1 AS "IsActive",
       GOBTPAC.GOBTPAC_EXTERNAL_USER || '@uaa.alaska.edu' AS "PrimaryEmail"
  FROM DSDMGR.DSD_ACTIVE_ASSIGNMENTS AA
       LEFT JOIN SPRIDEN
          ON     SPRIDEN.SPRIDEN_ID = AA.EMPLOYEE_ID
             AND SPRIDEN.SPRIDEN_CHANGE_IND IS NULL
       LEFT JOIN GOBTPAC ON SPRIDEN.SPRIDEN_PIDM = GOBTPAC.GOBTPAC_PIDM
 WHERE     1 = 1
       AND AA.JOB_TKL BETWEEN 'T600' AND 'T799'
       AND AA.JOB_ECLS IN ('A9',
                           'AR',
                           'F9',
                           'FT',
                           'FW')