SELECT DISTINCT
       GOBTPAC.GOBTPAC_EXTERNAL_USER AS "ExternalID",
       AA.EMP_NAME_LAST AS "FirstName",
       AA.NAME_FIRST AS "LastName",
       (GOBTPAC.GOBTPAC_EXTERNAL_USER || '@uaa.alaska.edu') AS "Email"
  FROM DSDMGR.DSD_ACTIVE_ASSIGNMENTS AA
       LEFT JOIN SATURN.SPRIDEN SPRIDEN
          ON AA.EMPLOYEE_ID = SPRIDEN.SPRIDEN_ID
       LEFT JOIN GOBTPAC ON SPRIDEN.SPRIDEN_PIDM = GOBTPAC.GOBTPAC_PIDM
 WHERE AA.CHK_TKL IN ('T726',
                      'T728',
                      'T730',
                      'T731',
                      'T732',
                      'T733',
                      'T735',
                      'T736',
                      'T740',
                      'T741',
                      'T742',
                      'T744',
                      'T745',
                      'T746',
                      'T747',
                      'T748',
                      'T749',
                      'T750',
                      'T752',
                      'T784')
ORDER BY GOBTPAC.GOBTPAC_EXTERNAL_USER