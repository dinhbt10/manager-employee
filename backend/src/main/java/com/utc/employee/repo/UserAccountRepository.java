package com.utc.employee.repo;

import com.utc.employee.domain.UserAccount;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    Optional<UserAccount> findByUsername(String username);

    @EntityGraph(attributePaths = {"department", "features"})
    @Override
    List<UserAccount> findAll();

    @EntityGraph(attributePaths = {"department", "features"})
    List<UserAccount> findByDepartment_Id(Long departmentId);
}
