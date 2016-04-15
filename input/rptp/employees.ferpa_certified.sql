SELECT AA.EMPLOYEE_ID AS "ExternalId_IND",
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
       INNER JOIN PPRCERT
          ON     SPRIDEN.SPRIDEN_PIDM = PPRCERT.PPRCERT_PIDM
             AND PPRCERT.PPRCERT_CERT_CODE = 'ZFRP'
       LEFT JOIN GOBTPAC ON SPRIDEN.SPRIDEN_PIDM = GOBTPAC.GOBTPAC_PIDM
 WHERE     AA.JOB_TKL BETWEEN 'T500' AND 'T799'
       AND SYSDATE <= PPRCERT.PPRCERT_EXPIRE_DATE
