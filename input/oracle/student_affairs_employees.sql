SELECT DISTINCT GOBTPAC.GOBTPAC_EXTERNAL_USER AS "externalId",
                aa.NAME_FIRST "firstName",
                aa.EMP_NAME_LAST "lastName",
                GOBTPAC.GOBTPAC_EXTERNAL_USER || '@uaa.alaska.edu' AS "email"
  FROM DSDMGR.DSD_ACTIVE_ASSIGNMENTS aa
       /* join spriden for id to pidm conversions */
       LEFT JOIN SATURN.SPRIDEN sp
          ON     aa.EMPLOYEE_ID = sp.SPRIDEN_ID
             AND sp.SPRIDEN_CHANGE_IND IS NULL
             AND sp.SPRIDEN_ID LIKE '3%'
       LEFT JOIN GENERAL.GOBTPAC GOBTPAC
          ON sp.SPRIDEN_PIDM = GOBTPAC.GOBTPAC_PIDM
 /* list of tkls to pull */
 WHERE aa.JOB_TKL IN ('T726',
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
