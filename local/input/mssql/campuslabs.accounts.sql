SELECT SA.externalId,
       SA.firstName,
       SA.lastName,
       SA.email
  FROM oracle.employees.student_affairs SA
       INNER JOIN oracle.employees.ferpa_certified FERPA
          ON FERPA.AuthUsername = SA.externalId