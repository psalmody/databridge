SELECT RCRAPP1.RCRAPP1_PIDM AS PIDM_IND, --if they are in here, they filed FAFSA
       TO_CHAR (RCRAPP2.RCRAPP2_PELL_PGI) AS PELL_PGI, --> 5198, ineligible. < 5198, probably eligible
       TO_CHAR (RORSTAT.RORSTAT_UNMET_NEED) AS UNMET_NEED, --unmet financial need
       RCRAPP3.RCRAPP3_FATHER_HI_GRADE AS FATHER_HI_GRADE,
       RCRAPP3.RCRAPP3_MOTHER_HI_GRADE AS MOTHER_HI_GRADE -- 1 = middle/jr high, 2 = high school 3 = college or beyond, 4 = other/unknown
  FROM (FAIAMGR.RCRAPP2 RCRAPP2
        INNER JOIN FAIAMGR.RCRAPP1 RCRAPP1
           ON     (RCRAPP2.RCRAPP2_AIDY_CODE = RCRAPP1.RCRAPP1_AIDY_CODE)
              AND (RCRAPP2.RCRAPP2_PIDM = RCRAPP1.RCRAPP1_PIDM)
              AND (RCRAPP2.RCRAPP2_INFC_CODE = RCRAPP1.RCRAPP1_INFC_CODE)
              AND (RCRAPP2.RCRAPP2_SEQ_NO = RCRAPP1.RCRAPP1_SEQ_NO))
       INNER JOIN FAIAMGR.RORSTAT RORSTAT
          ON     (RORSTAT.RORSTAT_AIDY_CODE = RCRAPP1.RCRAPP1_AIDY_CODE)
             AND (RORSTAT.RORSTAT_PIDM = RCRAPP1.RCRAPP1_PIDM)
       INNER JOIN FAIAMGR.RCRAPP3 RCRAPP3
          ON     RCRAPP3.RCRAPP3_AIDY_CODE = RCRAPP1.RCRAPP1_AIDY_CODE
             AND RCRAPP3.RCRAPP3_PIDM = RORSTAT.RORSTAT_PIDM
             AND RCRAPP3.RCRAPP3_INFC_CODE = RCRAPP1.RCRAPP1_INFC_CODE
             AND RCRAPP3.RCRAPP3_SEQ_NO = RCRAPP1.RCRAPP1_SEQ_NO
 WHERE     RCRAPP1.RCRAPP1_AIDY_CODE =
              CASE
                 WHEN :current_term LIKE '%01'
                 THEN
                    (   TO_CHAR (SUBSTR ( :current_term, 3, 2)) - 1
                     || SUBSTR ( :current_term, 3, 2))
                 WHEN :current_term LIKE '%03'
                 THEN
                    (   SUBSTR ( :current_term, 3, 2)
                     || TO_CHAR (SUBSTR ( :current_term, 3, 2) + 1))
                 ELSE
                    NULL
              END
       AND RCRAPP1.RCRAPP1_CURR_REC_IND = 'Y'
       AND RCRAPP1.RCRAPP1_INFC_CODE = 'EDE' -- 5198 is the PELL EFC cutoff for 1516
