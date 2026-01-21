package com.newbie.newbiecore.repository;

import com.newbie.newbiecore.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByEntityTypeOrderByTimestampDesc(String entityType);

    List<AuditLog> findByUsernameOrderByTimestampDesc(String username);

    List<AuditLog> findByEntityKeyOrderByTimestampDesc(String entityKey);

    @Query("SELECT a FROM AuditLog a WHERE a.timestamp BETWEEN :startDate AND :endDate ORDER BY a.timestamp DESC")
    List<AuditLog> findByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT a FROM AuditLog a WHERE a.entityType = 'ConfigurationProperty' ORDER BY a.timestamp DESC")
    Page<AuditLog> findConfigurationChanges(Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.entityType = 'ConfigurationProperty' AND a.entityKey = :key ORDER BY a.timestamp DESC")
    List<AuditLog> findConfigurationChangesByKey(@Param("key") String key);
}